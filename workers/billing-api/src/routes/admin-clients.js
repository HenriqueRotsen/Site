import { json, readJson } from '../lib/http.js';
import { uuid, nowIso } from '../lib/crypto.js';
import { validateCnpj, cnpjHash, normalizeCnpj, cnpjLast4, formatCnpj } from '../lib/cnpj.js';
import { uniqueClientSlug } from '../lib/slug.js';
import { requireAdmin } from '../lib/session.js';
import { audit } from '../lib/audit.js';
import { parsePagination, paginationMeta } from '../lib/pagination.js';

function formatCep(zip) {
  const digits = String(zip || '').replace(/\D/g, '');
  if (digits.length !== 8) return zip || null;
  return `${digits.slice(0, 5)}-${digits.slice(5)}`;
}

function clientDto(row) {
  return {
    id: row.id,
    slug: row.slug,
    legalName: row.legal_name,
    cnpjMasked: `**.***.***/****-${row.cnpj_last4}`,
    cnpjFormatted: row.cnpj_formatted || null,
    billingEmail: row.billing_email,
    contactName: row.contact_name,
    contactPhone: row.contact_phone,
    addressStreet: row.address_street,
    addressNumber: row.address_number,
    addressComplement: row.address_complement,
    addressNeighborhood: row.address_neighborhood,
    addressCity: row.address_city,
    addressState: row.address_state,
    addressZip: formatCep(row.address_zip),
    notes: row.notes,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function addressFields(body) {
  return {
    street: body.addressStreet?.trim() || null,
    number: body.addressNumber?.trim() || null,
    complement: body.addressComplement?.trim() || null,
    neighborhood: body.addressNeighborhood?.trim() || null,
    city: body.addressCity?.trim() || null,
    state: body.addressState?.trim()?.toUpperCase() || null,
    zip: body.addressZip?.replace(/\D/g, '') || null,
  };
}

async function getClientById(db, clientId) {
  return db.prepare('SELECT * FROM clients WHERE id = ?').bind(clientId).first();
}

async function getClientBySlug(db, slug) {
  return db.prepare('SELECT * FROM clients WHERE slug = ?').bind(slug).first();
}

async function updateClientRecord(db, row, body, env) {
  const cnpj = body.cnpj ? normalizeCnpj(body.cnpj) : null;
  if (cnpj && !validateCnpj(cnpj)) {
    return { error: 'CNPJ inválido.' };
  }

  let cnpjHashVal = row.cnpj_hash;
  let last4 = row.cnpj_last4;
  let cnpjFormatted = row.cnpj_formatted;

  if (cnpj) {
    cnpjHashVal = await cnpjHash(env.CNPJ_HMAC_SECRET, cnpj);
    const dup = await db
      .prepare('SELECT id FROM clients WHERE cnpj_hash = ? AND id != ?')
      .bind(cnpjHashVal, row.id)
      .first();
    if (dup) return { error: 'CNPJ já cadastrado.' };
    last4 = cnpjLast4(cnpj);
    cnpjFormatted = formatCnpj(cnpj);
  }

  const addr = addressFields(body);
  await db
    .prepare(
      `UPDATE clients SET legal_name = ?, cnpj_hash = ?, cnpj_last4 = ?, cnpj_formatted = ?, billing_email = ?,
       contact_name = ?, contact_phone = ?,
       address_street = ?, address_number = ?, address_complement = ?,
       address_neighborhood = ?, address_city = ?, address_state = ?, address_zip = ?,
       notes = ?, status = ?, updated_at = ? WHERE id = ?`
    )
    .bind(
      body.legalName?.trim() || row.legal_name,
      cnpjHashVal,
      last4,
      cnpjFormatted,
      (body.billingEmail || row.billing_email).trim().toLowerCase(),
      body.contactName?.trim() ?? row.contact_name,
      body.contactPhone?.trim() ?? row.contact_phone,
      body.addressStreet !== undefined ? addr.street : row.address_street,
      body.addressNumber !== undefined ? addr.number : row.address_number,
      body.addressComplement !== undefined ? addr.complement : row.address_complement,
      body.addressNeighborhood !== undefined ? addr.neighborhood : row.address_neighborhood,
      body.addressCity !== undefined ? addr.city : row.address_city,
      body.addressState !== undefined ? addr.state : row.address_state,
      body.addressZip !== undefined ? addr.zip : row.address_zip,
      body.notes?.trim() ?? row.notes,
      body.status || row.status,
      nowIso(),
      row.id
    )
    .run();

  return { row: await getClientById(db, row.id) };
}

async function deactivateClient(db, row, body, env) {
  const cnpj = normalizeCnpj(body?.cnpj);
  if (!validateCnpj(cnpj)) {
    return { error: 'CNPJ inválido.' };
  }

  const hash = await cnpjHash(env.CNPJ_HMAC_SECRET, cnpj);
  if (hash !== row.cnpj_hash) {
    return { error: 'CNPJ não confere.' };
  }

  if (!row.cnpj_formatted) {
    await db
      .prepare('UPDATE clients SET cnpj_formatted = ?, updated_at = ? WHERE id = ?')
      .bind(formatCnpj(cnpj), nowIso(), row.id)
      .run();
  }

  const invoices = await db
    .prepare(
      `SELECT COUNT(*) as c FROM invoices WHERE client_id = ? AND status NOT IN ('cancelada', 'paga')`
    )
    .bind(row.id)
    .first();

  if (invoices.c > 0) {
    return { error: 'Cliente possui faturas em aberto.' };
  }

  await db
    .prepare(`UPDATE clients SET status = 'inactive', updated_at = ? WHERE id = ?`)
    .bind(nowIso(), row.id)
    .run();

  return { ok: true };
}

export async function handleAdminClients(request, env, origin, path) {
  const session = await requireAdmin(env.DB, request);
  if (!session) return json({ error: 'Não autenticado.' }, 401, origin);
  const ip = request.headers.get('CF-Connecting-IP') || '';

  if (path === '/admin/clients/options' && request.method === 'GET') {
    const { results } = await env.DB.prepare(
      `SELECT id, legal_name, cnpj_last4, cnpj_formatted, billing_email, address_city, status
       FROM clients WHERE status = 'active' ORDER BY legal_name ASC`
    ).all();
    return json(
      {
        clients: results.map((row) => ({
          id: row.id,
          legalName: row.legal_name,
          cnpjMasked: `**.***.***/****-${row.cnpj_last4}`,
          cnpjFormatted: row.cnpj_formatted || null,
          billingEmail: row.billing_email,
          addressCity: row.address_city,
          status: row.status,
        })),
      },
      200,
      origin
    );
  }

  if (path === '/admin/clients' && request.method === 'GET') {
    const url = new URL(request.url);
    const { page, limit, offset } = parsePagination(url);

    const countRow = await env.DB.prepare('SELECT COUNT(*) as total FROM clients').first();
    const { results } = await env.DB.prepare(
      `SELECT * FROM clients ORDER BY legal_name ASC LIMIT ? OFFSET ?`
    )
      .bind(limit, offset)
      .all();

    return json(
      {
        clients: results.map(clientDto),
        pagination: paginationMeta(page, limit, countRow.total),
      },
      200,
      origin
    );
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
    const addr = addressFields(body);
    const slug = await uniqueClientSlug(env.DB, body.legalName, cnpj);

    await env.DB.prepare(
      `INSERT INTO clients (
        id, slug, legal_name, cnpj_hash, cnpj_last4, cnpj_formatted, billing_email, contact_name, contact_phone,
        address_street, address_number, address_complement, address_neighborhood,
        address_city, address_state, address_zip, notes, status, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'active', ?, ?)`
    )
      .bind(
        id,
        slug,
        String(body.legalName).trim(),
        hash,
        cnpjLast4(cnpj),
        formatCnpj(cnpj),
        String(body.billingEmail).trim().toLowerCase(),
        body.contactName?.trim() || null,
        body.contactPhone?.trim() || null,
        addr.street,
        addr.number,
        addr.complement,
        addr.neighborhood,
        addr.city,
        addr.state,
        addr.zip,
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

    const row = await getClientById(env.DB, id);
    return json({ client: clientDto(row) }, 201, origin);
  }

  const slugMatch = path.match(/^\/admin\/clients\/slug\/([^/]+)$/);
  if (slugMatch) {
    const slug = slugMatch[1];
    const row = await getClientBySlug(env.DB, slug);
    if (!row) return json({ error: 'Cliente não encontrado.' }, 404, origin);

    if (request.method === 'GET') {
      return json({ client: clientDto(row) }, 200, origin);
    }

    if (request.method === 'PUT') {
      const body = await readJson(request);
      const result = await updateClientRecord(env.DB, row, body, env);
      if (result.error) return json({ error: result.error }, 400, origin);

      await audit(env.DB, {
        actorRole: 'admin',
        actorId: session.admin_id,
        action: 'client_updated',
        resourceType: 'client',
        resourceId: row.id,
        ip,
      });

      return json({ client: clientDto(result.row) }, 200, origin);
    }

    if (request.method === 'DELETE') {
      const body = await readJson(request);
      const result = await deactivateClient(env.DB, row, body, env);
      if (result.error) {
        const status = result.error.includes('aberto') ? 409 : 400;
        return json({ error: result.error }, status, origin);
      }

      await audit(env.DB, {
        actorRole: 'admin',
        actorId: session.admin_id,
        action: 'client_deactivated',
        resourceType: 'client',
        resourceId: row.id,
        ip,
      });

      return json({ ok: true }, 200, origin);
    }
  }

  const match = path.match(/^\/admin\/clients\/([^/]+)$/);
  if (match) {
    const clientId = match[1];

    if (request.method === 'GET') {
      const row = await getClientById(env.DB, clientId);
      if (!row) return json({ error: 'Cliente não encontrado.' }, 404, origin);
      return json({ client: clientDto(row) }, 200, origin);
    }

    if (request.method === 'PUT') {
      const body = await readJson(request);
      const row = await getClientById(env.DB, clientId);
      if (!row) return json({ error: 'Cliente não encontrado.' }, 404, origin);

      const result = await updateClientRecord(env.DB, row, body, env);
      if (result.error) return json({ error: result.error }, 400, origin);

      await audit(env.DB, {
        actorRole: 'admin',
        actorId: session.admin_id,
        action: 'client_updated',
        resourceType: 'client',
        resourceId: clientId,
        ip,
      });

      return json({ client: clientDto(result.row) }, 200, origin);
    }

    if (request.method === 'DELETE') {
      const body = await readJson(request);
      const row = await getClientById(env.DB, clientId);
      if (!row) return json({ error: 'Cliente não encontrado.' }, 404, origin);

      const result = await deactivateClient(env.DB, row, body, env);
      if (result.error) {
        const status = result.error.includes('aberto') ? 409 : 400;
        return json({ error: result.error }, status, origin);
      }

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
