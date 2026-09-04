import { json, corsHeaders } from '../lib/http.js';
import { uuid, nowIso } from '../lib/crypto.js';
import { requireAdmin } from '../lib/session.js';
import { audit } from '../lib/audit.js';
import { parsePagination, paginationMeta } from '../lib/pagination.js';
import { formatCnpj, normalizeCnpj } from '../lib/cnpj.js';
import { nfsePdfFilename } from '../lib/nfse-files.js';

function parseMoneyToCents(value) {
  if (value == null || value === '') return 0;
  if (typeof value === 'number' && Number.isFinite(value)) {
    return Number.isInteger(value) ? value : Math.round(value * 100);
  }
  const raw = String(value).trim();
  if (!raw) return 0;
  if (/^\d+$/.test(raw)) return parseInt(raw, 10);
  const normalized = raw
    .replace(/[R$\s]/gi, '')
    .replace(/\./g, '')
    .replace(',', '.');
  const amount = parseFloat(normalized);
  return Number.isFinite(amount) ? Math.round(amount * 100) : 0;
}

function parseDateBR(value) {
  const raw = String(value || '').trim();
  if (!raw) return null;
  if (/^\d{4}-\d{2}-\d{2}/.test(raw)) return raw.slice(0, 10);
  const match = raw.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (!match) return null;
  return `${match[3]}-${match[2]}-${match[1]}`;
}

function nfseDto(row) {
  return {
    id: row.id,
    clientId: row.client_id,
    clientName: row.client_name || null,
    invoiceId: row.invoice_id || null,
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
    originalFilename: row.original_filename,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

async function sha256Bytes(data) {
  const hash = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hash), (b) => b.toString(16).padStart(2, '0')).join('');
}

function pdfResponse(bytes, filename, origin) {
  return new Response(bytes, {
    status: 200,
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${filename}"`,
      ...corsHeaders(origin),
    },
  });
}

export async function handleAdminNfse(request, env, origin, path) {
  if (!path.startsWith('/admin/nfse')) return null;

  const session = await requireAdmin(env.DB, request);
  if (!session) return json({ error: 'Não autenticado.' }, 401, origin);
  const ip = request.headers.get('CF-Connecting-IP') || '';

  if (path === '/admin/nfse' && request.method === 'GET') {
    const url = new URL(request.url);
    const clientId = url.searchParams.get('clientId');
    const { page, limit, offset } = parsePagination(url);

    let countQuery = 'SELECT COUNT(*) as total FROM nfse_documents n WHERE 1=1';
    let query = `SELECT n.*, c.legal_name as client_name
                 FROM nfse_documents n
                 JOIN clients c ON c.id = n.client_id
                 WHERE 1=1`;
    const binds = [];

    if (clientId) {
      countQuery += ' AND n.client_id = ?';
      query += ' AND n.client_id = ?';
      binds.push(clientId);
    }

    query += ' ORDER BY n.competence_date DESC, n.number DESC LIMIT ? OFFSET ?';

    const countRow = await env.DB.prepare(countQuery)
      .bind(...binds)
      .first();
    const { results } = await env.DB.prepare(query)
      .bind(...binds, limit, offset)
      .all();

    return json(
      {
        documents: results.map(nfseDto),
        pagination: paginationMeta(page, limit, countRow?.total || 0),
      },
      200,
      origin
    );
  }

  if (path === '/admin/nfse' && request.method === 'POST') {
    const form = await request.formData();
    const file = form.get('pdf');
    const clientId = String(form.get('clientId') || '').trim();
    const invoiceId = String(form.get('invoiceId') || '').trim() || null;
    const accessKey = String(form.get('accessKey') || '').replace(/\D/g, '');
    const number = String(form.get('number') || '').trim();
    const competenceDate = parseDateBR(form.get('competenceDate'));
    const issuedAt = String(form.get('issuedAt') || '').trim() || null;
    const dpsNumber = String(form.get('dpsNumber') || '').trim() || null;
    const dpsSeries = String(form.get('dpsSeries') || '').trim() || null;
    const takerName = String(form.get('takerName') || '').trim() || null;
    const takerCnpjRaw = String(form.get('takerCnpj') || '').trim();
    const serviceCode = String(form.get('serviceCode') || '').trim() || null;
    const serviceDescription = String(form.get('serviceDescription') || '').trim() || null;
    const amountCents = parseMoneyToCents(form.get('amountCents') ?? form.get('amount'));
    const municipality = String(form.get('municipality') || '').trim() || null;

    if (!(file instanceof File) || file.size === 0) {
      return json({ error: 'PDF da NFS-e é obrigatório.' }, 400, origin);
    }
    if (file.type && !file.type.includes('pdf')) {
      return json({ error: 'Envie um arquivo PDF.' }, 400, origin);
    }
    if (!clientId || !accessKey || !number || !competenceDate) {
      return json(
        { error: 'Cliente, chave de acesso, número e competência são obrigatórios.' },
        400,
        origin
      );
    }
    if (accessKey.length < 40) {
      return json({ error: 'Chave de acesso inválida.' }, 400, origin);
    }

    const client = await env.DB.prepare('SELECT id, legal_name FROM clients WHERE id = ?')
      .bind(clientId)
      .first();
    if (!client) return json({ error: 'Cliente não encontrado.' }, 404, origin);

    if (invoiceId) {
      const invoice = await env.DB.prepare(
        'SELECT id FROM invoices WHERE id = ? AND client_id = ?'
      )
        .bind(invoiceId, clientId)
        .first();
      if (!invoice) return json({ error: 'Fatura não encontrada para este cliente.' }, 400, origin);
    }

    const existing = await env.DB.prepare('SELECT id FROM nfse_documents WHERE access_key = ?')
      .bind(accessKey)
      .first();
    if (existing) {
      return json({ error: 'Já existe uma NFS-e com esta chave de acesso.' }, 409, origin);
    }

    const pdfBytes = new Uint8Array(await file.arrayBuffer());
    const checksum = await sha256Bytes(pdfBytes);
    const id = uuid();
    const filename = nfsePdfFilename({ number, competenceDate });
    const pdfKey = `nfse/${clientId}/${accessKey}.pdf`;
    const now = nowIso();
    const takerCnpjFormatted = takerCnpjRaw
      ? formatCnpj(normalizeCnpj(takerCnpjRaw))
      : null;

    await env.PDFS.put(pdfKey, pdfBytes, {
      httpMetadata: { contentType: 'application/pdf' },
      customMetadata: { checksum, nfseId: id, accessKey },
    });

    await env.DB.prepare(
      `INSERT INTO nfse_documents (
         id, client_id, invoice_id, access_key, number, competence_date, issued_at,
         dps_number, dps_series, taker_name, taker_cnpj_formatted, service_code,
         service_description, amount_cents, municipality, pdf_key, pdf_checksum,
         original_filename, created_at, updated_at
       ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
      .bind(
        id,
        clientId,
        invoiceId,
        accessKey,
        number,
        competenceDate,
        issuedAt,
        dpsNumber,
        dpsSeries,
        takerName,
        takerCnpjFormatted,
        serviceCode,
        serviceDescription,
        amountCents,
        municipality,
        pdfKey,
        checksum,
        file.name || filename,
        now,
        now
      )
      .run();

    await audit(env.DB, {
      actorRole: 'admin',
      actorId: session.admin_id,
      action: 'nfse_uploaded',
      resourceType: 'nfse',
      resourceId: id,
      ip,
      metadata: { accessKey, number, clientId },
    });

    const row = await env.DB.prepare(
      `SELECT n.*, c.legal_name as client_name
       FROM nfse_documents n JOIN clients c ON c.id = n.client_id
       WHERE n.id = ?`
    )
      .bind(id)
      .first();

    return json({ document: nfseDto(row) }, 201, origin);
  }

  const pdfMatch = path.match(/^\/admin\/nfse\/([^/]+)\/pdf$/);
  if (pdfMatch && request.method === 'GET') {
    const id = pdfMatch[1];
    const row = await env.DB.prepare('SELECT * FROM nfse_documents WHERE id = ?').bind(id).first();
    if (!row?.pdf_key) return json({ error: 'PDF não disponível.' }, 404, origin);
    const obj = await env.PDFS.get(row.pdf_key);
    if (!obj) return json({ error: 'PDF não encontrado.' }, 404, origin);
    const bytes = await obj.arrayBuffer();
    return pdfResponse(
      bytes,
      nfsePdfFilename({ number: row.number, competenceDate: row.competence_date }),
      origin
    );
  }

  const match = path.match(/^\/admin\/nfse\/([^/]+)$/);
  if (match) {
    const id = match[1];

    if (request.method === 'GET') {
      const row = await env.DB.prepare(
        `SELECT n.*, c.legal_name as client_name
         FROM nfse_documents n JOIN clients c ON c.id = n.client_id
         WHERE n.id = ?`
      )
        .bind(id)
        .first();
      if (!row) return json({ error: 'NFS-e não encontrada.' }, 404, origin);
      return json({ document: nfseDto(row) }, 200, origin);
    }

    if (request.method === 'DELETE') {
      const row = await env.DB.prepare('SELECT * FROM nfse_documents WHERE id = ?').bind(id).first();
      if (!row) return json({ error: 'NFS-e não encontrada.' }, 404, origin);
      if (row.pdf_key) {
        await env.PDFS.delete(row.pdf_key);
      }
      await env.DB.prepare('DELETE FROM nfse_documents WHERE id = ?').bind(id).run();
      await audit(env.DB, {
        actorRole: 'admin',
        actorId: session.admin_id,
        action: 'nfse_deleted',
        resourceType: 'nfse',
        resourceId: id,
        ip,
        metadata: { accessKey: row.access_key, number: row.number },
      });
      return json({ ok: true }, 200, origin);
    }
  }

  return null;
}
