import { json, readJson } from '../lib/http.js';
import { uuid, nowIso } from '../lib/crypto.js';
import { requireAdmin } from '../lib/session.js';
import { audit } from '../lib/audit.js';
import { generateInvoicePdf, sha256Bytes } from '../lib/pdf.js';
import { sendEmail, invoiceEmailHtml, formatBRL, formatDateBR } from '../lib/email.js';

function bytesToBase64(bytes) {
  const arr = new Uint8Array(bytes);
  let binary = '';
  const chunk = 0x8000;
  for (let i = 0; i < arr.length; i += chunk) {
    binary += String.fromCharCode(...arr.subarray(i, i + chunk));
  }
  return btoa(binary);
}

async function nextInvoiceNumber(db) {
  const year = new Date().getFullYear();
  const row = await db.prepare('SELECT last_number FROM invoice_sequences WHERE year = ?').bind(year).first();
  let next = 1;
  if (row) {
    next = row.last_number + 1;
    await db.prepare('UPDATE invoice_sequences SET last_number = ? WHERE year = ?').bind(next, year).run();
  } else {
    await db.prepare('INSERT INTO invoice_sequences (year, last_number) VALUES (?, ?)').bind(year, next).run();
  }
  return `INV-${year}-${String(next).padStart(4, '0')}`;
}

function invoiceDto(row, items = []) {
  return {
    id: row.id,
    number: row.number,
    clientId: row.client_id,
    clientName: row.client_name,
    status: row.status,
    issueDate: row.issue_date,
    dueDate: row.due_date,
    subtotalCents: row.subtotal_cents,
    totalCents: row.total_cents,
    paymentLink: row.payment_link,
    notes: row.notes,
    hasPdf: !!row.pdf_key,
    sentAt: row.sent_at,
    paidAt: row.paid_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    items: items.map((i) => ({
      id: i.id,
      description: i.description,
      quantity: i.quantity,
      unitPriceCents: i.unit_price_cents,
      lineTotalCents: Math.round(i.quantity * i.unit_price_cents),
    })),
  };
}

async function loadInvoice(db, id) {
  const row = await db
    .prepare(
      `SELECT i.*, c.legal_name as client_name, c.cnpj_last4, c.billing_email
       FROM invoices i JOIN clients c ON c.id = i.client_id WHERE i.id = ?`
    )
    .bind(id)
    .first();
  if (!row) return null;
  const { results: items } = await db
    .prepare('SELECT * FROM invoice_items WHERE invoice_id = ? ORDER BY sort_order')
    .bind(id)
    .all();
  return { row, items };
}

function calcTotals(items) {
  const subtotal = items.reduce((sum, i) => sum + Math.round(i.quantity * i.unit_price_cents), 0);
  return { subtotal, total: subtotal };
}

export async function handleAdminInvoices(request, env, origin, path) {
  const session = await requireAdmin(env.DB, request);
  if (!session) return json({ error: 'Não autenticado.' }, 401, origin);
  const ip = request.headers.get('CF-Connecting-IP') || '';

  if (path === '/admin/invoices' && request.method === 'GET') {
    const url = new URL(request.url);
    const clientId = url.searchParams.get('clientId');
    const status = url.searchParams.get('status');
    let query = `SELECT i.*, c.legal_name as client_name FROM invoices i JOIN clients c ON c.id = i.client_id WHERE 1=1`;
    const binds = [];
    if (clientId) {
      query += ' AND i.client_id = ?';
      binds.push(clientId);
    }
    if (status) {
      query += ' AND i.status = ?';
      binds.push(status);
    }
    query += ' ORDER BY i.created_at DESC';
    const stmt = env.DB.prepare(query);
    const { results } = binds.length ? await stmt.bind(...binds).all() : await stmt.all();
    return json({ invoices: results.map((r) => invoiceDto(r)) }, 200, origin);
  }

  if (path === '/admin/invoices' && request.method === 'POST') {
    const body = await readJson(request);
    if (!body?.clientId || !body?.dueDate || !Array.isArray(body.items) || body.items.length === 0) {
      return json({ error: 'Cliente, vencimento e itens são obrigatórios.' }, 400, origin);
    }

    const client = await env.DB.prepare('SELECT * FROM clients WHERE id = ? AND status = ?')
      .bind(body.clientId, 'active')
      .first();
    if (!client) return json({ error: 'Cliente não encontrado.' }, 404, origin);

    const items = body.items.map((item, idx) => ({
      description: String(item.description || '').trim(),
      quantity: parseFloat(item.quantity) || 1,
      unit_price_cents: Math.round(parseFloat(item.unitPriceCents ?? item.unit_price_cents) || 0),
      sort_order: idx,
    }));

    if (items.some((i) => !i.description || i.unit_price_cents < 0)) {
      return json({ error: 'Itens inválidos.' }, 400, origin);
    }

    const { subtotal, total } = calcTotals(items);
    const id = uuid();
    const number = await nextInvoiceNumber(env.DB);
    const issueDate = body.issueDate || nowIso().slice(0, 10);
    const now = nowIso();

    await env.DB.prepare(
      `INSERT INTO invoices (id, number, client_id, status, issue_date, due_date, subtotal_cents, total_cents, payment_link, notes, created_at, updated_at)
       VALUES (?, ?, ?, 'rascunho', ?, ?, ?, ?, ?, ?, ?, ?)`
    )
      .bind(
        id,
        number,
        body.clientId,
        issueDate,
        body.dueDate,
        subtotal,
        total,
        body.paymentLink?.trim() || null,
        body.notes?.trim() || null,
        now,
        now
      )
      .run();

    for (const item of items) {
      await env.DB.prepare(
        `INSERT INTO invoice_items (id, invoice_id, description, quantity, unit_price_cents, sort_order)
         VALUES (?, ?, ?, ?, ?, ?)`
      )
        .bind(uuid(), id, item.description, item.quantity, item.unit_price_cents, item.sort_order)
        .run();
    }

    await audit(env.DB, {
      actorRole: 'admin',
      actorId: session.admin_id,
      action: 'invoice_created',
      resourceType: 'invoice',
      resourceId: id,
      ip,
    });

    const loaded = await loadInvoice(env.DB, id);
    return json({ invoice: invoiceDto(loaded.row, loaded.items) }, 201, origin);
  }

  const emitMatch = path.match(/^\/admin\/invoices\/([^/]+)\/emit$/);
  if (emitMatch && request.method === 'POST') {
    const invoiceId = emitMatch[1];
    const loaded = await loadInvoice(env.DB, invoiceId);
    if (!loaded) return json({ error: 'Fatura não encontrada.' }, 404, origin);
    const { row, items } = loaded;

    if (row.status === 'cancelada') {
      return json({ error: 'Fatura cancelada.' }, 400, origin);
    }

    const pdfBytes = await generateInvoicePdf({
      issuerName: 'Henrique Rotsen',
      issuerEmail: 'contato@henriquerotsen.com.br',
      clientName: row.client_name,
      clientCnpjMasked: `**.***.***/****-${row.cnpj_last4}`,
      invoiceNumber: row.number,
      issueDate: row.issue_date,
      dueDate: row.due_date,
      items,
      totalCents: row.total_cents,
      paymentLink: row.payment_link,
      notes: row.notes,
    });

    const checksum = await sha256Bytes(pdfBytes);
    const pdfKey = `invoices/${row.client_id}/${row.number}.pdf`;
    await env.PDFS.put(pdfKey, pdfBytes, {
      httpMetadata: { contentType: 'application/pdf' },
      customMetadata: { checksum, invoiceId: row.id },
    });

    const now = nowIso();
    await env.DB.prepare(
      `UPDATE invoices SET status = 'enviada', pdf_key = ?, pdf_checksum = ?, sent_at = ?, updated_at = ? WHERE id = ?`
    )
      .bind(pdfKey, checksum, now, now, invoiceId)
      .run();

    if (env.RESEND_API_KEY) {
      const portalUrl = `${env.SITE_URL}/#/area-restrita/cliente`;
      const html = invoiceEmailHtml({
        clientName: row.client_name,
        invoiceNumber: row.number,
        dueDate: formatDateBR(row.due_date),
        totalFormatted: formatBRL(row.total_cents),
        portalUrl,
        paymentLink: row.payment_link,
      });

      const pdfBase64 = bytesToBase64(pdfBytes);
      await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${env.RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: env.FROM_EMAIL,
          to: row.billing_email,
          subject: `Fatura ${row.number} — Henrique Rotsen`,
          html,
          attachments: [
            {
              filename: `${row.number}.pdf`,
              content: pdfBase64,
            },
          ],
        }),
      });
    }

    await audit(env.DB, {
      actorRole: 'admin',
      actorId: session.admin_id,
      action: 'invoice_emitted',
      resourceType: 'invoice',
      resourceId: invoiceId,
      ip,
    });

    const updated = await loadInvoice(env.DB, invoiceId);
    return json({ invoice: invoiceDto(updated.row, updated.items) }, 200, origin);
  }

  const statusMatch = path.match(/^\/admin\/invoices\/([^/]+)\/status$/);
  if (statusMatch && request.method === 'PATCH') {
    const invoiceId = statusMatch[1];
    const body = await readJson(request);
    const allowed = ['rascunho', 'enviada', 'paga', 'atrasada', 'cancelada'];
    if (!allowed.includes(body?.status)) {
      return json({ error: 'Status inválido.' }, 400, origin);
    }

    const row = await env.DB.prepare('SELECT * FROM invoices WHERE id = ?').bind(invoiceId).first();
    if (!row) return json({ error: 'Fatura não encontrada.' }, 404, origin);

    const paidAt = body.status === 'paga' ? nowIso() : row.paid_at;
    await env.DB.prepare(`UPDATE invoices SET status = ?, paid_at = ?, updated_at = ? WHERE id = ?`)
      .bind(body.status, paidAt, nowIso(), invoiceId)
      .run();

    await audit(env.DB, {
      actorRole: 'admin',
      actorId: session.admin_id,
      action: 'invoice_status_changed',
      resourceType: 'invoice',
      resourceId: invoiceId,
      ip,
      metadata: { status: body.status },
    });

    const loaded = await loadInvoice(env.DB, invoiceId);
    return json({ invoice: invoiceDto(loaded.row, loaded.items) }, 200, origin);
  }

  const pdfMatch = path.match(/^\/admin\/invoices\/([^/]+)\/pdf$/);
  if (pdfMatch && request.method === 'GET') {
    const invoiceId = pdfMatch[1];
    const row = await env.DB.prepare('SELECT pdf_key FROM invoices WHERE id = ?').bind(invoiceId).first();
    if (!row?.pdf_key) return json({ error: 'PDF não disponível.' }, 404, origin);
    const obj = await env.PDFS.get(row.pdf_key);
    if (!obj) return json({ error: 'PDF não encontrado.' }, 404, origin);
    const bytes = await obj.arrayBuffer();
    return new Response(bytes, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="fatura.pdf"`,
        ...((await import('../lib/http.js')).corsHeaders(origin)),
      },
    });
  }

  const match = path.match(/^\/admin\/invoices\/([^/]+)$/);
  if (match) {
    const invoiceId = match[1];
    if (request.method === 'GET') {
      const loaded = await loadInvoice(env.DB, invoiceId);
      if (!loaded) return json({ error: 'Fatura não encontrada.' }, 404, origin);
      return json({ invoice: invoiceDto(loaded.row, loaded.items) }, 200, origin);
    }

    if (request.method === 'PUT') {
      const body = await readJson(request);
      const loaded = await loadInvoice(env.DB, invoiceId);
      if (!loaded) return json({ error: 'Fatura não encontrada.' }, 404, origin);
      if (!['rascunho'].includes(loaded.row.status)) {
        return json({ error: 'Somente rascunhos podem ser editados.' }, 400, origin);
      }

      if (Array.isArray(body.items) && body.items.length > 0) {
        await env.DB.prepare('DELETE FROM invoice_items WHERE invoice_id = ?').bind(invoiceId).run();
        const items = body.items.map((item, idx) => ({
          description: String(item.description || '').trim(),
          quantity: parseFloat(item.quantity) || 1,
          unit_price_cents: Math.round(parseFloat(item.unitPriceCents ?? item.unit_price_cents) || 0),
          sort_order: idx,
        }));
        for (const item of items) {
          await env.DB.prepare(
            `INSERT INTO invoice_items (id, invoice_id, description, quantity, unit_price_cents, sort_order) VALUES (?, ?, ?, ?, ?, ?)`
          )
            .bind(uuid(), invoiceId, item.description, item.quantity, item.unit_price_cents, item.sort_order)
            .run();
        }
        const { subtotal, total } = calcTotals(items);
        await env.DB.prepare(
          `UPDATE invoices SET subtotal_cents = ?, total_cents = ?, due_date = ?, payment_link = ?, notes = ?, updated_at = ? WHERE id = ?`
        )
          .bind(
            subtotal,
            total,
            body.dueDate || loaded.row.due_date,
            body.paymentLink?.trim() ?? loaded.row.payment_link,
            body.notes?.trim() ?? loaded.row.notes,
            nowIso(),
            invoiceId
          )
          .run();
      }

      const updated = await loadInvoice(env.DB, invoiceId);
      return json({ invoice: invoiceDto(updated.row, updated.items) }, 200, origin);
    }
  }

  return null;
}
