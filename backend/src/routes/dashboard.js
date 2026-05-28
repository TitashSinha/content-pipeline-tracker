import { Router } from 'express'
import prisma from '../lib/prisma.js'
import asyncHandler from '../lib/asyncHandler.js'
import { authenticate, requireAdmin } from '../middleware/auth.js'

const router = Router()
router.use(authenticate)
router.use(requireAdmin)

// GET /api/dashboard — admin only
// Returns four stats: active articles, overdue, completions this month, active per writer
router.get(
  '/',
  asyncHandler(async (req, res) => {
    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

    const [totalActive, overdue, completionsThisMonth, activeByWriter] = await Promise.all([
      // Not completed
      prisma.article.count({
        where: { status: { not: 'COMPLETED' } },
      }),

      // Past deadline and still not completed
      prisma.article.count({
        where: {
          status: { not: 'COMPLETED' },
          deadline: { lt: now },
        },
      }),

      // Completed within the current calendar month — use the ActivityLog so
      // edits to metadata don't reset the count the way updatedAt would
      prisma.article.count({
        where: {
          status: 'COMPLETED',
          activityLogs: {
            some: { newStatus: 'COMPLETED', createdAt: { gte: startOfMonth } },
          },
        },
      }),

      // Active article count grouped by assigned writer
      prisma.article.groupBy({
        by: ['assignedWriterId'],
        where: { status: { not: 'COMPLETED' } },
        _count: { id: true },
      }),
    ])

    // Hydrate writer IDs with names
    const writerIds = activeByWriter.map((r) => r.assignedWriterId)
    const writers = await prisma.user.findMany({
      where: { id: { in: writerIds } },
      select: { id: true, name: true },
    })
    const writerMap = Object.fromEntries(writers.map((w) => [w.id, w.name]))

    res.json({
      totalActive,
      overdue,
      completionsThisMonth,
      byWriter: activeByWriter.map((r) => ({
        writerId: r.assignedWriterId,
        writerName: writerMap[r.assignedWriterId] ?? 'Unknown',
        activeArticles: r._count.id,
      })),
    })
  })
)

export default router
