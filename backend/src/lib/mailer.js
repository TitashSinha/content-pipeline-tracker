import { Resend } from 'resend'

const FROM = process.env.RESEND_FROM || 'Content Pipeline <onboarding@resend.dev>'

export async function sendDeadlineReminder({ writerName, writerEmail, articleTitle, deadline }) {
  if (!process.env.RESEND_API_KEY) {
    console.log(`[mailer] RESEND_API_KEY not set — skipping email to ${writerEmail}`)
    return
  }

  const resend = new Resend(process.env.RESEND_API_KEY)
  const deadlineStr = new Intl.DateTimeFormat('en-GB', {
    day: 'numeric', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  }).format(new Date(deadline))

  await resend.emails.send({
    from: FROM,
    to:   writerEmail,
    subject: `Deadline reminder: "${articleTitle}" is due soon`,
    html: `
      <p>Hi ${writerName},</p>
      <p>This is a reminder that your article <strong>"${articleTitle}"</strong> is due on <strong>${deadlineStr}</strong>.</p>
      <p>Please make sure it's submitted before the deadline.</p>
      <p style="color:#6b7280;font-size:0.85em;">— Content Pipeline Tracker</p>
    `,
  })
}
