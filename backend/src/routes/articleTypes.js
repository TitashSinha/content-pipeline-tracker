import { Router } from 'express'
import prisma from '../lib/prisma.js'
import asyncHandler from '../lib/asyncHandler.js'
import { authenticate, requireAdmin } from '../middleware/auth.js'

const router = Router()
router.use(authenticate)

// GET /api/article-types — all authenticated users (needed for the create-article form)
router.get(
  '/',
  asyncHandler(async (req, res) => {
    const types = await prisma.articleType.findMany({ orderBy: { name: 'asc' } })
    res.json(types)
  })
)

// POST /api/article-types — admin only
router.post(
  '/',
  requireAdmin,
  asyncHandler(async (req, res) => {
    const { name } = req.body

    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'name is required' })
    }

    try {
      const type = await prisma.articleType.create({ data: { name: name.trim() } })
      res.status(201).json(type)
    } catch (err) {
      // P2002 = unique constraint violation (name already exists)
      if (err.code === 'P2002') {
        return res.status(409).json({ error: `Article type "${name}" already exists` })
      }
      throw err
    }
  })
)

export default router
