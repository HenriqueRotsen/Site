import { nowIso } from './lib/crypto.js';
import { sendEmail, reminderEmailHtml, formatBRL, formatDateBR } from './lib/email.js';
import { audit } from './lib/audit.js';

export async function handleCron(env) {
  const today = nowIso().slice(0, 10);

  // Mark overdue invoices
  await env.DB.prepare(
    `UPDATE invoices SET status = 'atrasada', updated_at = ?
     WHERE status = 'enviada' AND due_date < ?`
  )
    .bind(nowIso(), today)
    .run();

  if (!env.RESEND_API_KEY) return;

  const { results: overdue } = await env.DB.prepare(
    `SELECT i.id, i.number, i.due_date, i.total_cents, i.payment_link, i.reminder_sent_at,
            c.legal_name, c.billing_email
     FROM invoices i JOIN clients c ON c.id = i.client_id
     WHERE i.status = 'atrasada' AND (i.reminder_sent_at IS NULL OR i.reminder_sent_at < date('now', '-7 days'))`
  ).all();

  const portalUrl = `${env.SITE_URL}/#/area-restrita/cliente`;

  for (const inv of overdue) {
    try {
      await sendEmail(env.RESEND_API_KEY, {
        from: env.FROM_EMAIL,
        to: inv.billing_email,
        subject: `Lembrete: fatura ${inv.number} em aberto`,
        html: reminderEmailHtml({
          clientName: inv.legal_name,
          invoiceNumber: inv.number,
          dueDate: formatDateBR(inv.due_date),
          totalFormatted: formatBRL(inv.total_cents),
          portalUrl,
          paymentLink: inv.payment_link,
        }),
      });

      await env.DB.prepare(`UPDATE invoices SET reminder_sent_at = ? WHERE id = ?`)
        .bind(nowIso(), inv.id)
        .run();

      await audit(env.DB, {
        action: 'reminder_sent',
        resourceType: 'invoice',
        resourceId: inv.id,
        metadata: { number: inv.number },
      });
    } catch (err) {
      console.error('reminder failed', inv.id, err.message);
    }
  }
}
