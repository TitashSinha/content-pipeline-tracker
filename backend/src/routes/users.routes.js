import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { getDB, persist, nextId } from '../db.js';
import { authRequired, adminOnly } from '../auth.js';

const ASSIGNABLE_ROLES = ['WRITER', 'TEAM_LEADER'];

const router = Router();
const publicUser = (u) => ({ id: u.id, name: u.name, email: u.email, role: u.role, createdAt: u.createdAt, avatarUrl: u.avatarUrl ?? null });
const writerOption = (u) => ({ id: u.id, name: u.name, email: u.email, role: u.role, specialties: u.specialties ?? null });

const sanitizeLinks = (v) => (Array.isArray(v) ? v : []).map((s) => String(s).trim()).filter(Boolean);
const cleanText = (v) => String(v ?? '').trim() || null;

function applyWriterFields(w, b) {
  if ('specialties' in b) w.specialties = cleanText(b.specialties);
  if ('bio' in b) w.bio = cleanText(b.bio);
  if ('portfolioLinks' in b) w.portfolioLinks = sanitizeLinks(b.portfolioLinks);
  if ('joinedDate' in b) w.joinedDate = b.joinedDate || null;
  if ('notes' in b) w.notes = cleanText(b.notes);
}

function writerProfile(db, w) {
  const articles = db.articles.filter((a) => a.assignedWriterId === w.id);
  return {
    id: w.id, name: w.name, email: w.email, role: w.role,
    avatarUrl: w.avatarUrl ?? null,
    joinedDate: w.joinedDate ?? w.createdAt ?? null,
    specialties: w.specialties ?? null,
    bio: w.bio ?? null,
    portfolioLinks: w.portfolioLinks ?? [],
    notes: w.notes ?? null,
    activeArticles: articles.filter((a) => a.status !== 'COMPLETED').length,
    totalArticles: articles.length,
    isTeamLeader: w.role === 'TEAM_LEADER',
  };
}

router.get('/', authRequired, (req, res) => {
  res.json(getDB().users.map(publicUser));
});

router.get('/writers', authRequired, (req, res) => {
  res.json(getDB().users.filter((u) => ASSIGNABLE_ROLES.includes(u.role)).map(writerOption));
});

router.get('/writers/:id', authRequired, adminOnly, (req, res) => {
  const db = getDB();
  const w = db.users.find((u) => u.id === Number(req.params.id) && ASSIGNABLE_ROLES.includes(u.role));
  if (!w) return res.status(404).json({ error: 'Writer not found' });
  res.json(writerProfile(db, w));
});

// --- writer management (admin) ------------------------------------------
router.post('/writers', authRequired, adminOnly, (req, res) => {
  const db = getDB();
  const name = String(req.body?.name || '').trim();
  const email = String(req.body?.email || '').trim().toLowerCase();
  const password = String(req.body?.password || '');
  if (!name || !email || !password) return res.status(400).json({ error: 'Name, email and password are required' });
  if (password.length < 6) return res.status(400).json({ error: 'Password must be at least 6 characters' });
  const taken = [...db.users, ...db.archivedUsers].some((u) => u.email.toLowerCase() === email);
  if (taken) return res.status(409).json({ error: 'That email is already in use' });

  const requestedRole = req.body?.isTeamLeader ? 'TEAM_LEADER' : 'WRITER';
  const writer = {
    id: nextId('users'),
    name, email,
    password: bcrypt.hashSync(password, 10),
    role: requestedRole,
    createdAt: new Date().toISOString(),
    avatarUrl: null,
    joinedDate: req.body?.joinedDate || new Date().toISOString(),
    specialties: null, bio: null, portfolioLinks: [], notes: null,
  };
  applyWriterFields(writer, req.body || {});
  db.users.push(writer);
  persist();
  res.status(201).json(writerProfile(db, writer));
});

// Rename a writer, reset their password, or change their TL status.
router.put('/writers/:id', authRequired, adminOnly, (req, res) => {
  const db = getDB();
  const writer = db.users.find((u) => u.id === Number(req.params.id) && ASSIGNABLE_ROLES.includes(u.role));
  if (!writer) return res.status(404).json({ error: 'Writer not found' });
  const { name, password, isTeamLeader } = req.body || {};
  if (name != null) {
    const n = String(name).trim();
    if (!n) return res.status(400).json({ error: 'Name cannot be empty' });
    writer.name = n;
  }
  if (password) {
    if (String(password).length < 6) return res.status(400).json({ error: 'Password must be at least 6 characters' });
    writer.password = bcrypt.hashSync(String(password), 10);
  }
  if (isTeamLeader != null) {
    writer.role = isTeamLeader ? 'TEAM_LEADER' : 'WRITER';
  }
  applyWriterFields(writer, req.body || {});
  persist();
  res.json(writerProfile(db, writer));
});

// Remove a writer → move to the bin. Their articles keep pointing at this id,
// so they read as "Unknown Writer" until reassigned. The dashboard is untouched.
router.delete('/writers/:id', authRequired, adminOnly, (req, res) => {
  const db = getDB();
  const idx = db.users.findIndex((u) => u.id === Number(req.params.id) && ASSIGNABLE_ROLES.includes(u.role));
  if (idx === -1) return res.status(404).json({ error: 'Writer not found' });
  const [writer] = db.users.splice(idx, 1);
  writer.archivedAt = new Date().toISOString();
  db.archivedUsers.push(writer);
  persist();
  res.json({ ok: true });
});

router.get('/archived', authRequired, adminOnly, (req, res) => {
  res.json(getDB().archivedUsers.map((u) => ({ id: u.id, name: u.name, email: u.email, archivedAt: u.archivedAt })));
});

router.post('/archived/:id/restore', authRequired, adminOnly, (req, res) => {
  const db = getDB();
  const idx = db.archivedUsers.findIndex((u) => u.id === Number(req.params.id));
  if (idx === -1) return res.status(404).json({ error: 'Not found in bin' });
  const email = db.archivedUsers[idx].email.toLowerCase();
  if (db.users.some((u) => u.email.toLowerCase() === email)) {
    return res.status(409).json({ error: 'An active account now uses that email' });
  }
  const [writer] = db.archivedUsers.splice(idx, 1);
  delete writer.archivedAt;
  db.users.push(writer);
  persist();
  res.json(writerOption(writer));
});

router.delete('/archived/:id', authRequired, adminOnly, (req, res) => {
  const db = getDB();
  const idx = db.archivedUsers.findIndex((u) => u.id === Number(req.params.id));
  if (idx === -1) return res.status(404).json({ error: 'Not found in bin' });
  db.archivedUsers.splice(idx, 1);
  persist();
  res.json({ ok: true });
});

// --- avatar (any authenticated user) ------------------------------------
router.put('/me/avatar', authRequired, (req, res) => {
  const db = getDB();
  const user = db.users.find((u) => u.id === req.user.id);
  if (!user) return res.status(404).json({ error: 'User not found' });
  const { avatarUrl } = req.body || {};
  if (avatarUrl != null) {
    if (typeof avatarUrl !== 'string' || !avatarUrl.startsWith('data:image/')) {
      return res.status(400).json({ error: 'Invalid image' });
    }
    if (avatarUrl.length > 400_000) return res.status(413).json({ error: 'Image is too large — try a smaller one' });
  }
  user.avatarUrl = avatarUrl || null;
  persist();
  res.json({ user: publicUser(user) });
});

export default router;
