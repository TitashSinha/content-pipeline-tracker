import jwt from 'jsonwebtoken';

const SECRET = process.env.JWT_SECRET || 'dev-secret-change-me-in-production';

export function signToken(user) {
  return jwt.sign(
    { id: user.id, role: user.role, name: user.name },
    SECRET,
    { expiresIn: '7d' },
  );
}

/** Reject the request unless it carries a valid Bearer token. */
export function authRequired(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'Not authenticated' });
  try {
    req.user = jwt.verify(token, SECRET);
    next();
  } catch {
    res.status(401).json({ error: 'Session expired — please sign in again' });
  }
}

/** Must run after authRequired. Reject non-admins. */
export function adminOnly(req, res, next) {
  if (req.user?.role !== 'ADMIN') {
    return res.status(403).json({ error: 'Admins only' });
  }
  next();
}

/** Must run after authRequired. Allow ADMIN or TEAM_LEADER. */
export function teamLeaderOrAdminOnly(req, res, next) {
  if (req.user?.role !== 'ADMIN' && req.user?.role !== 'TEAM_LEADER') {
    return res.status(403).json({ error: 'Admins and Team Leaders only' });
  }
  next();
}
