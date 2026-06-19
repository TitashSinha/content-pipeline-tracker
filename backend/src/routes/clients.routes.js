import { Router } from 'express';
import { getDB, persist, nextId } from '../db.js';
import { authRequired, adminOnly } from '../auth.js';

const router = Router();

const typeName = (db, id) => db.articleTypes.find((t) => t.id === id)?.name ?? null;
const publicClient = (db, c) => ({ ...c, contentTypeName: typeName(db, c.contentTypeId) });

const sanitizeLinks = (v) => (Array.isArray(v) ? v : []).map((s) => String(s).trim()).filter(Boolean);
const cleanText = (v) => String(v ?? '').trim() || null;

function applyOptionalFields(c, b) {
  if ('industry' in b) c.industry = cleanText(b.industry);
  if ('competitors' in b) c.competitors = cleanText(b.competitors);
  if ('website' in b) c.website = cleanText(b.website);
  if ('sampleLinks' in b) c.sampleLinks = sanitizeLinks(b.sampleLinks);
  if ('onboardingDate' in b) c.onboardingDate = b.onboardingDate || null;
  if ('pilotDate' in b) c.pilotDate = b.pilotDate || null;
  if ('pilotNotes' in b) c.pilotNotes = cleanText(b.pilotNotes);
  if ('notes' in b) c.notes = cleanText(b.notes);
}

// A client is unique on (name + content type) — same name with a different
// content type is allowed (e.g. "Acme Corp · Blog" vs "Acme Corp · LinkedIn").
const isDuplicate = (db, name, contentTypeId, exceptId) =>
  db.clients.some(
    (c) =>
      c.id !== exceptId &&
      c.name.toLowerCase() === name.toLowerCase() &&
      c.contentTypeId === contentTypeId,
  );

router.get('/', authRequired, (req, res) => {
  const db = getDB();
  res.json(db.clients.map((c) => publicClient(db, c)));
});

router.get('/:id', authRequired, (req, res) => {
  const db = getDB();
  const c = db.clients.find((x) => x.id === Number(req.params.id));
  if (!c) return res.status(404).json({ error: 'Client not found' });
  res.json(publicClient(db, c));
});

router.post('/', authRequired, adminOnly, (req, res) => {
  const db = getDB();
  const b = req.body || {};
  const name = String(b.name || '').trim();
  const contentTypeId = b.contentTypeId ? Number(b.contentTypeId) : null;
  if (!name || !contentTypeId) {
    return res.status(400).json({ error: 'Client name and content type are required' });
  }
  if (!db.articleTypes.some((t) => t.id === contentTypeId)) {
    return res.status(400).json({ error: 'Invalid content type' });
  }
  if (isDuplicate(db, name, contentTypeId, null)) {
    return res.status(409).json({ error: 'That client already exists for this content type' });
  }
  const client = {
    id: nextId('clients'),
    name,
    contentTypeId,
    industry: null, competitors: null, website: null, sampleLinks: [],
    onboardingDate: null, pilotDate: null, pilotNotes: null, notes: null,
  };
  applyOptionalFields(client, b);
  db.clients.push(client);
  persist();
  res.status(201).json(publicClient(db, client));
});

router.put('/:id', authRequired, adminOnly, (req, res) => {
  const db = getDB();
  const c = db.clients.find((x) => x.id === Number(req.params.id));
  if (!c) return res.status(404).json({ error: 'Client not found' });
  const b = req.body || {};

  if ('name' in b) {
    const n = String(b.name).trim();
    if (!n) return res.status(400).json({ error: 'Client name is required' });
    c.name = n;
  }
  if ('contentTypeId' in b) {
    const id = Number(b.contentTypeId);
    if (!db.articleTypes.some((t) => t.id === id)) {
      return res.status(400).json({ error: 'Invalid content type' });
    }
    c.contentTypeId = id;
  }
  if (isDuplicate(db, c.name, c.contentTypeId, c.id)) {
    return res.status(409).json({ error: 'That client already exists for this content type' });
  }
  applyOptionalFields(c, b);
  persist();
  res.json(publicClient(db, c));
});

router.delete('/:id', authRequired, adminOnly, (req, res) => {
  const db = getDB();
  const idx = db.clients.findIndex((c) => c.id === Number(req.params.id));
  if (idx === -1) return res.status(404).json({ error: 'Client not found' });
  db.clients.splice(idx, 1);
  // Any articles that pointed here keep their clientId and will read as
  // "Unknown client" (see articles enrichment) rather than breaking.
  persist();
  res.json({ ok: true });
});

export default router;
