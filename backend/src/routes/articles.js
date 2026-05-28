import { Router } from 'express'
import prisma from '../lib/prisma.js'
import asyncHandler from '../lib/asyncHandler.js'
import { authenticate, requireAdmin, requireWriter } from '../middleware/auth.js'

const router = Router()

// All article routes require a valid token
router.use(authenticate)

// Reusable include shape — keeps responses consistent across all endpoints
const articleInclude = {
  client: { select: { id: true, name: true } },
  articleType: { select: { id: true, name: true } },
  assignedWriter: { select: { id: true, name: true, email: true } },
  createdBy: { select: { id: true, name: true } },
}

const VALID_STATUSES = ['BRIEF_PENDING', 'WRITING', 'REVIEW', 'REVISION', 'COMPLETED']

// ─── GET /api/articles ────────────────────────────────────────────────────────
// Admin → all articles. Writer → only their assigned articles.
// Includes a computed `ttw` field (hours from first WRITING → first COMPLETED).
router.get(
  '/',
  asyncHandler(async (req, res) => {
    const where = req.user.role === 'WRITER' ? { assignedWriterId: req.user.id } : {}

    const articles = await prisma.article.findMany({
      where,
      include: {
        ...articleInclude,
        activityLogs: {
          where: { newStatus: { in: ['WRITING', 'COMPLETED'] } },
          orderBy: { createdAt: 'asc' },
          select: { newStatus: true, createdAt: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    const result = articles.map(({ activityLogs, ...article }) => {
      const writingLog   = activityLogs.find(l => l.newStatus === 'WRITING')
      const completedLog = activityLogs.find(l => l.newStatus === 'COMPLETED')
      const ttw = writingLog && completedLog
        ? Math.round((new Date(completedLog.createdAt) - new Date(writingLog.createdAt)) / 3_600_000)
        : null
      return { ...article, ttw }
    })

    res.json(result)
  })
)

// ─── GET /api/articles/:id ────────────────────────────────────────────────────
// Admin → any article. Writer → only if assigned to them.
// Response includes the full activity log for the article.
router.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const id = parseInt(req.params.id)

    const article = await prisma.article.findUnique({
      where: { id },
      include: {
        ...articleInclude,
        activityLogs: {
          include: { changedBy: { select: { id: true, name: true, role: true } } },
          orderBy: { createdAt: 'desc' },
        },
      },
    })

    if (!article) return res.status(404).json({ error: 'Article not found' })

    if (req.user.role === 'WRITER' && article.assignedWriterId !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' })
    }

    res.json(article)
  })
)

// ─── POST /api/articles ───────────────────────────────────────────────────────
// Admin only. Creates an article and logs the initial BRIEF_PENDING status.
router.post(
  '/',
  requireAdmin,
  asyncHandler(async (req, res) => {
    const { title, clientId, articleTypeId, assignedWriterId, deadline, briefNotes, wordCountTarget } = req.body

    if (!title || !clientId || !articleTypeId || !assignedWriterId) {
      return res.status(400).json({
        error: 'title, clientId, articleTypeId, and assignedWriterId are all required',
      })
    }

    const [article] = await prisma.$transaction([
      prisma.article.create({
        data: {
          title,
          clientId:         parseInt(clientId),
          articleTypeId:    parseInt(articleTypeId),
          assignedWriterId: parseInt(assignedWriterId),
          createdById:      req.user.id,
          deadline:         deadline ? new Date(deadline) : null,
          briefNotes:       briefNotes || null,
          wordCountTarget:  wordCountTarget ? parseInt(wordCountTarget) : null,
        },
        include: articleInclude,
      }),
    ])

    await prisma.activityLog.create({
      data: {
        articleId:   article.id,
        changedById: req.user.id,
        oldStatus:   null,
        newStatus:   'BRIEF_PENDING',
        note:        'Article created',
      },
    })

    res.status(201).json(article)
  })
)

// ─── PUT /api/articles/:id ────────────────────────────────────────────────────
// Admin only. Edits article metadata (not status — that's the writer's job).
router.put(
  '/:id',
  requireAdmin,
  asyncHandler(async (req, res) => {
    const id = parseInt(req.params.id)
    const { title, clientId, articleTypeId, assignedWriterId, deadline, briefNotes, wordCountTarget } = req.body

    const exists = await prisma.article.findUnique({ where: { id } })
    if (!exists) return res.status(404).json({ error: 'Article not found' })

    const article = await prisma.article.update({
      where: { id },
      data: {
        ...(title            !== undefined && { title }),
        ...(clientId         !== undefined && { clientId:         parseInt(clientId) }),
        ...(articleTypeId    !== undefined && { articleTypeId:    parseInt(articleTypeId) }),
        ...(assignedWriterId !== undefined && { assignedWriterId: parseInt(assignedWriterId) }),
        ...(deadline         !== undefined && { deadline:         deadline ? new Date(deadline) : null }),
        ...(briefNotes       !== undefined && { briefNotes:       briefNotes || null }),
        ...(wordCountTarget  !== undefined && { wordCountTarget:  wordCountTarget ? parseInt(wordCountTarget) : null }),
      },
      include: articleInclude,
    })

    res.json(article)
  })
)

// ─── DELETE /api/articles/:id ─────────────────────────────────────────────────
// Admin only. Deletes activity logs first to satisfy FK constraint, then the article.
router.delete(
  '/:id',
  requireAdmin,
  asyncHandler(async (req, res) => {
    const id = parseInt(req.params.id)

    const exists = await prisma.article.findUnique({ where: { id } })
    if (!exists) return res.status(404).json({ error: 'Article not found' })

    await prisma.$transaction([
      prisma.activityLog.deleteMany({ where: { articleId: id } }),
      prisma.article.delete({ where: { id } }),
    ])

    res.json({ message: 'Article deleted' })
  })
)

// ─── PATCH /api/articles/:id/status ──────────────────────────────────────────
// Writer: can only update their own assigned articles.
// Admin: can update any article (needed for inline status editing in the dashboard).
router.patch(
  '/:id/status',
  asyncHandler(async (req, res) => {
    const id = parseInt(req.params.id)
    const { status, note } = req.body

    if (!status || !VALID_STATUSES.includes(status)) {
      return res.status(400).json({
        error: `status must be one of: ${VALID_STATUSES.join(', ')}`,
      })
    }

    const article = await prisma.article.findUnique({ where: { id } })
    if (!article) return res.status(404).json({ error: 'Article not found' })

    if (req.user.role === 'WRITER' && article.assignedWriterId !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' })
    }

    const [updatedArticle] = await prisma.$transaction([
      prisma.article.update({
        where: { id },
        data: { status },
        include: articleInclude,
      }),
      prisma.activityLog.create({
        data: {
          articleId:   id,
          changedById: req.user.id,
          oldStatus:   article.status,
          newStatus:   status,
          note:        note ?? null,
        },
      }),
    ])

    res.json(updatedArticle)
  })
)

// ─── PATCH /api/articles/:id/doc ─────────────────────────────────────────────
// Writer only. Submits (or updates) the Google Doc link.
router.patch(
  '/:id/doc',
  requireWriter,
  asyncHandler(async (req, res) => {
    const id = parseInt(req.params.id)
    const { googleDocLink } = req.body

    if (!googleDocLink) {
      return res.status(400).json({ error: 'googleDocLink is required' })
    }

    if (!googleDocLink.startsWith('https://docs.google.com/')) {
      return res.status(400).json({ error: 'googleDocLink must be a Google Docs URL (https://docs.google.com/…)' })
    }

    const article = await prisma.article.findUnique({ where: { id } })
    if (!article) return res.status(404).json({ error: 'Article not found' })
    if (article.assignedWriterId !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' })
    }

    const updated = await prisma.article.update({
      where: { id },
      data: { googleDocLink },
      include: articleInclude,
    })

    res.json(updated)
  })
)

// ─── GET /api/articles/:id/activity ──────────────────────────────────────────
// Admin → any article. Writer → only if it's their article.
router.get(
  '/:id/activity',
  asyncHandler(async (req, res) => {
    const id = parseInt(req.params.id)

    const article = await prisma.article.findUnique({ where: { id } })
    if (!article) return res.status(404).json({ error: 'Article not found' })

    if (req.user.role === 'WRITER' && article.assignedWriterId !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' })
    }

    const logs = await prisma.activityLog.findMany({
      where: { articleId: id },
      include: { changedBy: { select: { id: true, name: true, role: true } } },
      orderBy: { createdAt: 'desc' },
    })

    res.json(logs)
  })
)

export default router
