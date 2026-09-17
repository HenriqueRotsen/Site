import { json, readJson } from '../lib/http.js';
import { uuid, nowIso } from '../lib/crypto.js';
import { requireAdmin } from '../lib/session.js';
import { audit } from '../lib/audit.js';
import { maxCulturalSeed, genericServicesSeed, BUILTIN_TEMPLATE_IDS } from '../lib/contract-templates-seed.js';
import { isSystemPartyVariable } from '../lib/contract-template.js';

function parseVariables(raw) {
  if (Array.isArray(raw)) return raw;
  try {
    const parsed = JSON.parse(raw || '[]');
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function templateDto(row) {
  return {
    id: row.id,
    name: row.name,
    description: row.description || '',
    bodyTemplate: row.body_template,
    variables: parseVariables(row.variables_json).filter((v) => !isSystemPartyVariable(v.key)),
    isActive: Boolean(row.is_active),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/**
 * Garante builtins: só cria se o id ainda não existir (não sobrescreve edições nem reativa exclusões).
 */
async function upsertBuiltin(db, id, payload, now) {
  const existing = await db.prepare('SELECT id FROM contract_templates WHERE id = ?').bind(id).first();
  if (existing) return;

  await db
    .prepare(
      `INSERT INTO contract_templates (id, name, description, body_template, variables_json, is_active, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, 1, ?, ?)`
    )
    .bind(
      id,
      payload.name,
      payload.description,
      payload.bodyTemplate,
      JSON.stringify(payload.variables),
      now,
      now
    )
    .run();
}

async function ensureBuiltinTemplates(db, env) {
  const now = nowIso();
  await upsertBuiltin(db, BUILTIN_TEMPLATE_IDS.maxCultural, maxCulturalSeed(env), now);
  await upsertBuiltin(db, BUILTIN_TEMPLATE_IDS.generic, genericServicesSeed(env), now);
}

function normalizePayload(body = {}) {
  const variables = Array.isArray(body.variables) ? body.variables : [];
  return {
    name: String(body.name || '').trim(),
    description: String(body.description || '').trim(),
    bodyTemplate: String(body.bodyTemplate || '').trim(),
    variables: variables
      .map((v) => ({
        key: String(v.key || '')
          .trim()
          .replace(/[^a-zA-Z0-9_]/g, ''),
        label: String(v.label || v.key || '').trim(),
        type: ['text', 'textarea', 'date', 'money', 'number', 'select'].includes(v.type)
          ? v.type
          : 'text',
        required: Boolean(v.required),
        defaultValue: v.defaultValue != null ? String(v.defaultValue) : '',
        options: Array.isArray(v.options) ? v.options.map(String) : undefined,
      }))
      .filter((v) => v.key && !isSystemPartyVariable(v.key)),
    isActive: body.isActive !== false,
  };
}

export async function handleAdminContractTemplates(request, env, origin, path) {
  if (!path.startsWith('/admin/contract-templates')) return null;

  const session = await requireAdmin(env.DB, request);
  if (!session) return json({ error: 'Não autenticado.' }, 401, origin);
  const ip = request.headers.get('CF-Connecting-IP') || '';

  await ensureBuiltinTemplates(env.DB, env);

  if (path === '/admin/contract-templates' && request.method === 'GET') {
    const url = new URL(request.url);
    // Por padrão lista só ativos; `active=0` traz inativos também.
    const includeInactive = url.searchParams.get('active') === '0';
    const { results } = await env.DB.prepare(
      includeInactive
        ? `SELECT * FROM contract_templates ORDER BY name ASC`
        : `SELECT * FROM contract_templates WHERE is_active = 1 ORDER BY name ASC`
    ).all();
    return json({ templates: results.map(templateDto) }, 200, origin);
  }

  if (path === '/admin/contract-templates' && request.method === 'POST') {
    const body = await readJson(request);
    const input = normalizePayload(body);
    if (!input.name) return json({ error: 'Nome do modelo é obrigatório.' }, 400, origin);
    if (!input.bodyTemplate) return json({ error: 'Texto do modelo é obrigatório.' }, 400, origin);

    const id = uuid();
    const now = nowIso();
    await env.DB.prepare(
      `INSERT INTO contract_templates (id, name, description, body_template, variables_json, is_active, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    )
      .bind(
        id,
        input.name,
        input.description,
        input.bodyTemplate,
        JSON.stringify(input.variables),
        1,
        now,
        now
      )
      .run();

    await audit(env.DB, {
      actorRole: 'admin',
      actorId: session.admin_id,
      action: 'contract_template_created',
      resourceType: 'contract_template',
      resourceId: id,
      ip,
      metadata: { name: input.name },
    });

    const row = await env.DB.prepare('SELECT * FROM contract_templates WHERE id = ?').bind(id).first();
    return json({ template: templateDto(row) }, 201, origin);
  }

  const match = path.match(/^\/admin\/contract-templates\/([^/]+)$/);
  if (match) {
    const id = match[1];
    const existing = await env.DB.prepare(
      'SELECT * FROM contract_templates WHERE id = ? AND is_active = 1'
    )
      .bind(id)
      .first();
    if (!existing) return json({ error: 'Modelo não encontrado.' }, 404, origin);

    if (request.method === 'GET') {
      return json({ template: templateDto(existing) }, 200, origin);
    }

    if (request.method === 'PUT') {
      const body = await readJson(request);
      const input = normalizePayload(body);
      if (!input.name) return json({ error: 'Nome do modelo é obrigatório.' }, 400, origin);
      if (!input.bodyTemplate) return json({ error: 'Texto do modelo é obrigatório.' }, 400, origin);

      const now = nowIso();
      await env.DB.prepare(
        `UPDATE contract_templates
         SET name = ?, description = ?, body_template = ?, variables_json = ?, is_active = ?, updated_at = ?
         WHERE id = ?`
      )
        .bind(
          input.name,
          input.description,
          input.bodyTemplate,
          JSON.stringify(input.variables),
          1,
          now,
          id
        )
        .run();

      await audit(env.DB, {
        actorRole: 'admin',
        actorId: session.admin_id,
        action: 'contract_template_updated',
        resourceType: 'contract_template',
        resourceId: id,
        ip,
        metadata: { name: input.name },
      });

      const row = await env.DB.prepare('SELECT * FROM contract_templates WHERE id = ?').bind(id).first();
      return json({ template: templateDto(row) }, 200, origin);
    }

    if (request.method === 'DELETE') {
      // Soft-delete: evita o seed recriar modelos built-in na próxima listagem.
      const now = nowIso();
      await env.DB.prepare(
        `UPDATE contract_templates SET is_active = 0, updated_at = ? WHERE id = ?`
      )
        .bind(now, id)
        .run();
      await env.DB.prepare('UPDATE contracts SET template_id = NULL WHERE template_id = ?').bind(id).run();
      await audit(env.DB, {
        actorRole: 'admin',
        actorId: session.admin_id,
        action: 'contract_template_deleted',
        resourceType: 'contract_template',
        resourceId: id,
        ip,
        metadata: { name: existing.name },
      });
      return json({ ok: true }, 200, origin);
    }
  }

  return json({ error: 'Not found' }, 404, origin);
}
