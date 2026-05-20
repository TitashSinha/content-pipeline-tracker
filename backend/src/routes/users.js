import { Router } from 'express'
import prisma from '../lib/prisma.js'
import asyncHandler from '../lib/asyncHandler.js'
import { authenticate, requireAdmin } from '../middleware/auth.js'

const router = Router()
router.use(authenticate)

// GET /api/users/writers — admin only
// Returns the list of writers for the "assign to" dropdown when creating an article
router.get(
  '/writers',
  requireAdmin,
  asyncHandler(async (req, res) => {
    const writers = await prisma.user.findMany({
      where: { role: 'WRITER' },
      select: { id: true, name: true, email: true },
      orderBy: { name: 'asc' },
    })
    res.json(writers)
  })
)

export default router
