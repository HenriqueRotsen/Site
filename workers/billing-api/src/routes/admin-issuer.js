import { json, readJson } from '../lib/http.js';
import { requireAdmin } from '../lib/session.js';
import { audit } from '../lib/audit.js';
import { getIssuerDto, upsertIssuerProfile } from '../lib/issuer.js';

export async function handleAdminIssuer(request, env, origin, path) {
  if (path !== '/admin/issuer') return null;

  const session = await requireAdmin(env.DB, request);
  if (!session) return json({ error: 'Não autenticado.' }, 401, origin);
  const ip = request.headers.get('CF-Connecting-IP') || '';

  if (request.method === 'GET') {
    const dto = await getIssuerDto(env, env.DB);
    return json(dto, 200, origin);
  }

  if (request.method === 'PUT') {
    const body = await readJson(request);
    if (!body?.legalName?.trim() && !body?.civilName?.trim() && !body?.cnpj?.trim()) {
      return json({ error: 'Informe ao menos razão social, nome civil ou CNPJ.' }, 400, origin);
    }
    const issuer = await upsertIssuerProfile(env.DB, body);
    await audit(env.DB, {
      actorRole: 'admin',
      actorId: session.admin_id,
      action: 'issuer_update',
      resourceType: 'issuer_profile',
      resourceId: '1',
      ip,
    });
    return json({ issuer, source: 'db', updatedAt: issuer.updatedAt }, 200, origin);
  }

  return json({ error: 'Método não permitido.' }, 405, origin);
}
