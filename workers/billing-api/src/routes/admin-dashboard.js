import { json } from '../lib/http.js';
import { requireAdmin } from '../lib/session.js';
import { parsePagination, paginationMeta } from '../lib/pagination.js';

export async function handleAdminDashboard(request, env, origin, path) {
  const session = await requireAdmin(env.DB, request);
  if (!session) return json({ error: 'Não autenticado.' }, 401, origin);

  if (path === '/admin/dashboard' && request.method === 'GET') {
    const url = new URL(request.url);
    const recent = parsePagination(url, 10);
    const overdue = parsePagination(url, 10);
    const recentPage = Math.max(1, parseInt(url.searchParams.get('recentPage') || String(recent.page), 10) || 1);
    const overduePage = Math.max(1, parseInt(url.searchParams.get('overduePage') || String(overdue.page), 10) || 1);
    const limit = recent.limit;
    const recentOffset = (recentPage - 1) * limit;
    const overdueOffset = (overduePage - 1) * limit;

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

    const recentCount = await env.DB.prepare(
      `SELECT COUNT(*) as total FROM invoices i`
    ).first();

    const overdueCount = await env.DB.prepare(
      `SELECT COUNT(*) as total
       FROM invoices i
       WHERE i.status IN ('enviada', 'atrasada') AND i.due_date < ?`
    )
      .bind(today)
      .first();

    const { results: recentRows } = await env.DB.prepare(
      `SELECT i.id, i.number, i.status, i.total_cents, i.due_date, c.legal_name as client_name
       FROM invoices i JOIN clients c ON c.id = i.client_id
       ORDER BY i.created_at DESC LIMIT ? OFFSET ?`
    )
      .bind(limit, recentOffset)
      .all();

    const { results: overdueRows } = await env.DB.prepare(
      `SELECT i.id, i.number, i.total_cents, i.due_date, c.legal_name as client_name, c.billing_email
       FROM invoices i JOIN clients c ON c.id = i.client_id
       WHERE i.status IN ('enviada', 'atrasada') AND i.due_date < ?
       ORDER BY i.due_date ASC LIMIT ? OFFSET ?`
    )
      .bind(today, limit, overdueOffset)
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
        recentInvoices: recentRows.map((r) => ({
          id: r.id,
          number: r.number,
          status: r.status,
          totalCents: r.total_cents,
          dueDate: r.due_date,
          clientName: r.client_name,
        })),
        recentPagination: paginationMeta(recentPage, limit, recentCount.total),
        overdueInvoices: overdueRows.map((r) => ({
          id: r.id,
          number: r.number,
          totalCents: r.total_cents,
          dueDate: r.due_date,
          clientName: r.client_name,
          billingEmail: r.billing_email,
        })),
        overduePagination: paginationMeta(overduePage, limit, overdueCount.total),
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
