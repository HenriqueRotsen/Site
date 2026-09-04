import { json } from '../lib/http.js';
import { requireClient } from '../lib/session.js';
import { audit } from '../lib/audit.js';
import { corsHeaders } from '../lib/http.js';
import { invoicePdfFilename } from '../lib/invoice-files.js';
import { nfsePdfFilename } from '../lib/nfse-files.js';

function nfseDto(row) {
  return {
    id: row.id,
    accessKey: row.access_key,
    number: row.number,
    competenceDate: row.competence_date,
    issuedAt: row.issued_at,
    dpsNumber: row.dps_number,
    dpsSeries: row.dps_series,
    takerName: row.taker_name,
    takerCnpjFormatted: row.taker_cnpj_formatted,
    serviceCode: row.service_code,
    serviceDescription: row.service_description,
    amountCents: row.amount_cents,
    municipality: row.municipality,
    hasPdf: !!row.pdf_key,
    createdAt: row.created_at,
  };
}

export async function handleClientPortal(request, env, origin, path) {
  const ip = request.headers.get('CF-Connecting-IP') || '';

  if (path === '/client/nfse' && request.method === 'GET') {
    const session = await requireClient(env.DB, request);
    if (!session) return json({ error: 'Não autenticado.' }, 401, origin);

    const { results } = await env.DB.prepare(
      `SELECT * FROM nfse_documents
       WHERE client_id = ?
       ORDER BY competence_date DESC, number DESC`
    )
      .bind(session.client_id)
      .all();

    return json({ documents: results.map(nfseDto) }, 200, origin);
  }

  const nfsePdfMatch = path.match(/^\/client\/nfse\/([^/]+)\/pdf$/);
  if (nfsePdfMatch && request.method === 'GET') {
    const session = await requireClient(env.DB, request);
    if (!session) return json({ error: 'Não autenticado.' }, 401, origin);

    const id = nfsePdfMatch[1];
    const row = await env.DB.prepare(
      'SELECT * FROM nfse_documents WHERE id = ? AND client_id = ?'
    )
      .bind(id, session.client_id)
      .first();

    if (!row?.pdf_key) return json({ error: 'PDF não disponível.' }, 404, origin);
    const obj = await env.PDFS.get(row.pdf_key);
    if (!obj) return json({ error: 'PDF não encontrado.' }, 404, origin);

    await audit(env.DB, {
      actorRole: 'client',
      actorId: session.client_id,
      action: 'nfse_pdf_download',
      resourceType: 'nfse',
      resourceId: id,
      ip,
    });

    const bytes = await obj.arrayBuffer();
    return new Response(bytes, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${nfsePdfFilename({
          number: row.number,
          competenceDate: row.competence_date,
        })}"`,
        ...corsHeaders(origin),
      },
    });
  }

  if (path === '/client/invoices' && request.method === 'GET') {
    const session = await requireClient(env.DB, request);
    if (!session) return json({ error: 'Não autenticado.' }, 401, origin);

    const { results } = await env.DB.prepare(
      `SELECT id, number, status, issue_date, due_date, total_cents, payment_link, sent_at, paid_at, pdf_key, notes
       FROM invoices WHERE client_id = ? AND status != 'rascunho'
       ORDER BY due_date DESC`
    )
      .bind(session.client_id)
      .all();

    return json(
      {
        invoices: results.map((r) => ({
          id: r.id,
          number: r.number,
          status: r.status,
          issueDate: r.issue_date,
          dueDate: r.due_date,
          totalCents: r.total_cents,
          paymentLink: r.payment_link,
          sentAt: r.sent_at,
          paidAt: r.paid_at,
          hasPdf: !!r.pdf_key,
          notes: r.notes,
        })),
      },
      200,
      origin
    );
  }

  const pdfMatch = path.match(/^\/client\/invoices\/([^/]+)\/pdf$/);
  if (pdfMatch && request.method === 'GET') {
    const session = await requireClient(env.DB, request);
    if (!session) return json({ error: 'Não autenticado.' }, 401, origin);

    const invoiceId = pdfMatch[1];
    const row = await env.DB.prepare(
      `SELECT pdf_key, number FROM invoices WHERE id = ? AND client_id = ? AND status IN ('enviada', 'paga', 'atrasada')`
    )
      .bind(invoiceId, session.client_id)
      .first();

    if (!row?.pdf_key) return json({ error: 'PDF não disponível.' }, 404, origin);

    const obj = await env.PDFS.get(row.pdf_key);
    if (!obj) return json({ error: 'PDF não encontrado.' }, 404, origin);

    await audit(env.DB, {
      actorRole: 'client',
      actorId: session.client_id,
      action: 'invoice_pdf_download',
      resourceType: 'invoice',
      resourceId: invoiceId,
      ip,
    });

    const bytes = await obj.arrayBuffer();
    return new Response(bytes, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${invoicePdfFilename(row.number)}"`,
        ...corsHeaders(origin),
      },
    });
  }

  const detailMatch = path.match(/^\/client\/invoices\/([^/]+)$/);
  if (detailMatch && request.method === 'GET') {
    const session = await requireClient(env.DB, request);
    if (!session) return json({ error: 'Não autenticado.' }, 401, origin);

    const invoiceId = detailMatch[1];
    const row = await env.DB.prepare(
      `SELECT * FROM invoices WHERE id = ? AND client_id = ? AND status != 'rascunho'`
    )
      .bind(invoiceId, session.client_id)
      .first();
    if (!row) return json({ error: 'Fatura não encontrada.' }, 404, origin);

    const { results: items } = await env.DB.prepare(
      'SELECT description, quantity, unit_price_cents FROM invoice_items WHERE invoice_id = ? ORDER BY sort_order'
    )
      .bind(invoiceId)
      .all();

    return json(
      {
        invoice: {
          id: row.id,
          number: row.number,
          status: row.status,
          issueDate: row.issue_date,
          dueDate: row.due_date,
          totalCents: row.total_cents,
          paymentLink: row.payment_link,
          notes: row.notes,
          hasPdf: !!row.pdf_key,
          items: items.map((i) => ({
            description: i.description,
            quantity: i.quantity,
            unitPriceCents: i.unit_price_cents,
            lineTotalCents: Math.round(i.quantity * i.unit_price_cents),
          })),
        },
      },
      200,
      origin
    );
  }

  return null;
}
