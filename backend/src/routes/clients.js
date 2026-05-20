import { Router } from 'express'
import prisma from '../lib/prisma.js'
import asyncHandler from '../lib/asyncHandler.js'
import { authenticate } from '../middleware/auth.js'

const router = Router()
router.use(authenticate)

// GET /api/clients — all authenticated users (needed for the create-article form)
router.get(
  '/',
  asyncHandler(async (req, res) => {
    const clients = await prisma.client.findMany({ orderBy: { name: 'asc' } })
    res.json(clients)
  })
)

export default router
