import jwt from 'jsonwebtoken'

// Verifies the Bearer token and attaches the decoded payload to req.user
export function authenticate(req, res, next) {
  const header = req.headers.authorization

  if (!header?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authentication required' })
  }

  const token = header.split(' ')[1]

  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET)
    next()
  } catch {
    res.status(401).json({ error: 'Invalid or expired token' })
  }
}

// Must be used after authenticate
export function requireAdmin(req, res, next) {
  if (req.user?.role !== 'ADMIN') {
    return res.status(403).json({ error: 'Admin access required' })
  }
  next()
}

export function requireWriter(req, res, next) {
  if (req.user?.role !== 'WRITER') {
    return res.status(403).json({ error: 'Writer access required' })
  }
  next()
}
