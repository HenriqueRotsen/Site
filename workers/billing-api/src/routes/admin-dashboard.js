import { json } from '../lib/http.js';
import { requireAdmin } from '../lib/session.js';

export async function handleAdminDashboard(request, env, origin, path) {
  const session = await requireAdmin(env.DB, request);
  if (!session) return json({ error: 'Não autenticado.' }, 401, origin);

  if (path === '/admin/dashboard' && request.method === 'GET') {
    const today = new Date().toISOString().slice(0, 10);
    const monthStart = `${today.slice(0, 7)}-01`;

    const totals = await env.DB.prepare(
      `SELECT
        COUNT(*) as total_invoices,
        SUM(CASE WHEN status = 'paga' THEN total_cents ELSE 0 END) as paid_cents,
        SUM(CASE WHEN status IN ('enviada', 'atrasada') THEN total_cents ELSE 0 END) as pending_cents,
        SUM(CASE WHEN status = 'atrasada' THEN 1 ELSE 0 END) as overdue_count,
        SUM(CASE WHEN status = 'paga' AND paid_at >= ? THEN total_cents ELSE 0 END) as paid_this_month_cents
       FROM invoices WHERE status != 'cancelada'`
    )
      .bind(monthStart)
      .first();

    const { results: recent } = await env.DB.prepare(
      `SELECT i.id, i.number, i.status, i.total_cents, i.due_date, c.legal_name as client_name
       FROM invoices i JOIN clients c ON c.id = i.client_id
       ORDER BY i.created_at DESC LIMIT 10`
    ).all();

    const { results: overdue } = await env.DB.prepare(
      `SELECT i.id, i.number, i.total_cents, i.due_date, c.legal_name as client_name, c.billing_email
       FROM invoices i JOIN clients c ON c.id = i.client_id
       WHERE i.status IN ('enviada', 'atrasada') AND i.due_date < ?
       ORDER BY i.due_date ASC LIMIT 20`
    )
      .bind(today)
      .all();

    const { results: byMonth } = await env.DB.prepare(
      `SELECT strftime('%Y-%m', paid_at) as month, SUM(total_cents) as total_cents
       FROM invoices WHERE status = 'paga' AND paid_at IS NOT NULL
       GROUP BY month ORDER BY month DESC LIMIT 12`
    ).all();

    const clientCount = await env.DB.prepare(
      `SELECT COUNT(*) as c FROM clients WHERE status = 'active'`
    ).first();

    return json(
      {
        summary: {
          activeClients: clientCount.c,
          totalInvoices: totals.total_invoices,
          paidCents: totals.paid_cents || 0,
          pendingCents: totals.pending_cents || 0,
          overdueCount: totals.overdue_count || 0,
          paidThisMonthCents: totals.paid_this_month_cents || 0,
        },
        recentInvoices: recent.map((r) => ({
          id: r.id,
          number: r.number,
          status: r.status,
          totalCents: r.total_cents,
          dueDate: r.due_date,
          clientName: r.client_name,
        })),
        overdueInvoices: overdue.map((r) => ({
          id: r.id,
          number: r.number,
          totalCents: r.total_cents,
          dueDate: r.due_date,
          clientName: r.client_name,
          billingEmail: r.billing_email,
        })),
        revenueByMonth: byMonth.map((r) => ({
          month: r.month,
          totalCents: r.total_cents,
        })),
      },
      200,
      origin
    );
  }

  return null;
}
