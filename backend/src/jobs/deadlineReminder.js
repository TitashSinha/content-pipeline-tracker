import cron from 'node-cron'
import prisma from '../lib/prisma.js'
import { sendDeadlineReminder } from '../lib/mailer.js'

// Runs once daily at 08:00. Finds articles due within the next 48 hours
// that are not yet completed and emails the assigned writer.
// reminderSentAt prevents sending more than one email per 24-hour window
// for the same article, even if the cron fires multiple times.
export function startDeadlineReminderJob() {
  cron.schedule('0 8 * * *', async () => {
    console.log('[deadline-reminder] Running check…')

    const now   = new Date()
    const in48h = new Date(now.getTime() + 48 * 60 * 60 * 1_000)
    const ago24 = new Date(now.getTime() - 24 * 60 * 60 * 1_000)

    try {
      const articles = await prisma.article.findMany({
        where: {
          status:   { not: 'COMPLETED' },
          deadline: { gte: now, lte: in48h },
          OR: [
            { reminderSentAt: null },
            { reminderSentAt: { lt: ago24 } },
          ],
        },
        include: {
          assignedWriter: { select: { name: true, email: true } },
        },
      })

      if (articles.length === 0) {
        console.log('[deadline-reminder] No upcoming deadlines.')
        return
      }

      for (const article of articles) {
        try {
          await sendDeadlineReminder({
            writerName:   article.assignedWriter.name,
            writerEmail:  article.assignedWriter.email,
            articleTitle: article.title,
            deadline:     article.deadline,
          })

          await prisma.article.update({
            where: { id: article.id },
            data:  { reminderSentAt: now },
          })

          console.log(`[deadline-reminder] Emailed ${article.assignedWriter.email} for "${article.title}"`)
        } catch (err) {
          console.error(`[deadline-reminder] Failed to email for article ${article.id}:`, err.message)
        }
      }
    } catch (err) {
      console.error('[deadline-reminder] DB query failed:', err.message)
    }
  })

  console.log('[deadline-reminder] Job scheduled — runs daily at 08:00')
}
