import { json, readJson } from '../lib/http.js';
import { uuid, nowIso } from '../lib/crypto.js';
import { validateCnpj, cnpjHash, normalizeCnpj, cnpjLast4 } from '../lib/cnpj.js';
import { requireAdmin } from '../lib/session.js';
import { audit } from '../lib/audit.js';

function clientDto(row) {
  return {
    id: row.id,
    legalName: row.legal_name,
    cnpjMasked: `**.***.***/****-${row.cnpj_last4}`,
    billingEmail: row.billing_email,
    contactName: row.contact_name,
    contactPhone: row.contact_phone,
    notes: row.notes,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function handleAdminClients(request, env, origin, path) {
  const session = await requireAdmin(env.DB, request);
  if (!session) return json({ error: 'Não autenticado.' }, 401, origin);
  const ip = request.headers.get('CF-Connecting-IP') || '';

  if (path === '/admin/clients' && request.method === 'GET') {
    const { results } = await env.DB.prepare(
      `SELECT * FROM clients ORDER BY legal_name ASC`
    ).all();
    return json({ clients: results.map(clientDto) }, 200, origin);
  }

  if (path === '/admin/clients' && request.method === 'POST') {
    const body = await readJson(request);
    const cnpj = normalizeCnpj(body?.cnpj);
    if (!body?.legalName || !body?.billingEmail || !validateCnpj(cnpj)) {
      return json({ error: 'Razão social, CNPJ válido e e-mail são obrigatórios.' }, 400, origin);
    }

    const hash = await cnpjHash(env.CNPJ_HMAC_SECRET, cnpj);
    const existing = await env.DB.prepare('SELECT id FROM clients WHERE cnpj_hash = ?').bind(hash).first();
    if (existing) return json({ error: 'CNPJ já cadastrado.' }, 409, origin);

    const id = uuid();
    const now = nowIso();
    await env.DB.prepare(
      `INSERT INTO clients (id, legal_name, cnpj_hash, cnpj_last4, billing_email, contact_name, contact_phone, notes, status, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'active', ?, ?)`
    )
      .bind(
        id,
        String(body.legalName).trim(),
        hash,
        cnpjLast4(cnpj),
        String(body.billingEmail).trim().toLowerCase(),
        body.contactName?.trim() || null,
        body.contactPhone?.trim() || null,
        body.notes?.trim() || null,
        now,
        now
      )
      .run();

    await audit(env.DB, {
      actorRole: 'admin',
      actorId: session.admin_id,
      action: 'client_created',
      resourceType: 'client',
      resourceId: id,
      ip,
    });

    const row = await env.DB.prepare('SELECT * FROM clients WHERE id = ?').bind(id).first();
    return json({ client: clientDto(row) }, 201, origin);
  }

  const match = path.match(/^\/admin\/clients\/([^/]+)$/);
  if (match) {
    const clientId = match[1];

    if (request.method === 'GET') {
      const row = await env.DB.prepare('SELECT * FROM clients WHERE id = ?').bind(clientId).first();
      if (!row) return json({ error: 'Cliente não encontrado.' }, 404, origin);
      return json({ client: clientDto(row) }, 200, origin);
    }

    if (request.method === 'PUT') {
      const body = await readJson(request);
      const row = await env.DB.prepare('SELECT * FROM clients WHERE id = ?').bind(clientId).first();
      if (!row) return json({ error: 'Cliente não encontrado.' }, 404, origin);

      const cnpj = body.cnpj ? normalizeCnpj(body.cnpj) : null;
      if (cnpj && !validateCnpj(cnpj)) {
        return json({ error: 'CNPJ inválido.' }, 400, origin);
      }

      let cnpjHashVal = row.cnpj_hash;
      let last4 = row.cnpj_last4;
      if (cnpj) {
        cnpjHashVal = await cnpjHash(env.CNPJ_HMAC_SECRET, cnpj);
        const dup = await env.DB.prepare('SELECT id FROM clients WHERE cnpj_hash = ? AND id != ?')
          .bind(cnpjHashVal, clientId)
          .first();
        if (dup) return json({ error: 'CNPJ já cadastrado.' }, 409, origin);
        last4 = cnpjLast4(cnpj);
      }

      await env.DB.prepare(
        `UPDATE clients SET legal_name = ?, cnpj_hash = ?, cnpj_last4 = ?, billing_email = ?,
         contact_name = ?, contact_phone = ?, notes = ?, status = ?, updated_at = ? WHERE id = ?`
      )
        .bind(
          body.legalName?.trim() || row.legal_name,
          cnpjHashVal,
          last4,
          (body.billingEmail || row.billing_email).trim().toLowerCase(),
          body.contactName?.trim() ?? row.contact_name,
          body.contactPhone?.trim() ?? row.contact_phone,
          body.notes?.trim() ?? row.notes,
          body.status || row.status,
          nowIso(),
          clientId
        )
        .run();

      await audit(env.DB, {
        actorRole: 'admin',
        actorId: session.admin_id,
        action: 'client_updated',
        resourceType: 'client',
        resourceId: clientId,
        ip,
      });

      const updated = await env.DB.prepare('SELECT * FROM clients WHERE id = ?').bind(clientId).first();
      return json({ client: clientDto(updated) }, 200, origin);
    }

    if (request.method === 'DELETE') {
      const invoices = await env.DB.prepare(
        `SELECT COUNT(*) as c FROM invoices WHERE client_id = ? AND status NOT IN ('cancelada', 'paga')`
      )
        .bind(clientId)
        .first();
      if (invoices.c > 0) {
        return json({ error: 'Cliente possui faturas em aberto.' }, 409, origin);
      }
      await env.DB.prepare(`UPDATE clients SET status = 'inactive', updated_at = ? WHERE id = ?`)
        .bind(nowIso(), clientId)
        .run();
      await audit(env.DB, {
        actorRole: 'admin',
        actorId: session.admin_id,
        action: 'client_deactivated',
        resourceType: 'client',
        resourceId: clientId,
        ip,
      });
      return json({ ok: true }, 200, origin);
    }
  }

  return null;
}
