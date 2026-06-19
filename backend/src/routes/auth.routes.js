import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { getDB, persist } from '../db.js';
import { signToken, authRequired } from '../auth.js';

const router = Router();
const publicUser = (u) => ({ id: u.id, name: u.name, email: u.email, role: u.role, createdAt: u.createdAt, avatarUrl: u.avatarUrl ?? null });

router.post('/login', (req, res) => {
  const { email, password } = req.body || {};
  const user = getDB().users.find(
    (u) => u.email.toLowerCase() === String(email || '').toLowerCase(),
  );
  if (!user || !bcrypt.compareSync(password || '', user.password)) {
    return res.status(401).json({ error: 'Invalid email or password' });
  }
  res.json({ token: signToken(user), user: publicUser(user) });
});

router.get('/me', authRequired, (req, res) => {
  const user = getDB().users.find((u) => u.id === req.user.id);
  if (!user) return res.status(404).json({ error: 'User not found' });
  res.json({ user: publicUser(user) });
});

router.post('/change-password', authRequired, (req, res) => {
  const { currentPassword, newPassword } = req.body || {};
  const user = getDB().users.find((u) => u.id === req.user.id);
  if (!user || !bcrypt.compareSync(currentPassword || '', user.password)) {
    return res.status(400).json({ error: 'Current password is incorrect' });
  }
  if (!newPassword || newPassword.length < 6) {
    return res.status(400).json({ error: 'New password must be at least 6 characters' });
  }
  user.password = bcrypt.hashSync(newPassword, 10);
  persist();
  res.json({ ok: true });
});

export default router;
