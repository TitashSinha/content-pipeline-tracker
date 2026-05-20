import { Router } from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import prisma from '../lib/prisma.js'
import asyncHandler from '../lib/asyncHandler.js'

const router = Router()

// POST /api/auth/login
// Body: { email, password }
// Returns: { token, user: { id, name, email, role } }
router.post(
  '/login',
  asyncHandler(async (req, res) => {
    const { email, password } = req.body

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' })
    }

    const user = await prisma.user.findUnique({ where: { email } })

    // Use the same error for "not found" and "wrong password" to avoid
    // leaking which emails exist in the system
    const valid = user && (await bcrypt.compare(password, user.password))
    if (!valid) {
      return res.status(401).json({ error: 'Invalid email or password' })
    }

    const token = jwt.sign(
      { id: user.id, name: user.name, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    )

    res.json({
      token,
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
    })
  })
)

export default router
