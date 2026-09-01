import { json, readJson } from '../lib/http.js';
import { hashPassword, verifyPassword, uuid, nowIso } from '../lib/crypto.js';
import {
  createSession,
  destroySession,
  getSession,
  sessionCookie,
  clearSessionCookie,
  requireAdmin,
} from '../lib/session.js';
import { audit } from '../lib/audit.js';

async function ensureAdminExists(env) {
  const count = await env.DB.prepare('SELECT COUNT(*) as c FROM admins').first();
  if (count.c > 0) return;

  const email = env.ADMIN_EMAIL;
  const password = env.ADMIN_PASSWORD;
  if (!email || !password) return;

  const passwordHash = await hashPassword(password);
  await env.DB.prepare('INSERT INTO admins (id, email, password_hash) VALUES (?, ?, ?)')
    .bind(uuid(), email.toLowerCase().trim(), passwordHash)
    .run();
}

export async function handleAdminAuth(request, env, origin, path) {
  const ip = request.headers.get('CF-Connecting-IP') || '';

  if (path === '/auth/admin/login' && request.method === 'POST') {
    await ensureAdminExists(env);
    const body = await readJson(request);
    if (!body?.email || !body?.password) {
      return json({ error: 'E-mail e senha são obrigatórios.' }, 400, origin);
    }

    const email = String(body.email).toLowerCase().trim();
    const admin = await env.DB.prepare('SELECT * FROM admins WHERE email = ?').bind(email).first();

    if (!admin) {
      await audit(env.DB, { action: 'admin_login_failed', ip, metadata: { email } });
      return json({ error: 'Credenciais inválidas.' }, 401, origin);
    }

    if (admin.locked_until && new Date(admin.locked_until) > new Date()) {
      return json({ error: 'Conta temporariamente bloqueada. Tente novamente mais tarde.' }, 423, origin);
    }

    const valid = await verifyPassword(body.password, admin.password_hash);
    if (!valid) {
      const attempts = admin.failed_attempts + 1;
      let lockedUntil = null;
      if (attempts >= 5) {
        lockedUntil = new Date(Date.now() + 30 * 60000).toISOString();
      }
      await env.DB.prepare(
        'UPDATE admins SET failed_attempts = ?, locked_until = ? WHERE id = ?'
      )
        .bind(attempts, lockedUntil, admin.id)
        .run();
      await audit(env.DB, { actorRole: 'admin', actorId: admin.id, action: 'admin_login_failed', ip });
      return json({ error: 'Credenciais inválidas.' }, 401, origin);
    }

    await env.DB.prepare('UPDATE admins SET failed_attempts = 0, locked_until = NULL WHERE id = ?')
      .bind(admin.id)
      .run();

    const hours = parseInt(env.SESSION_HOURS || '8', 10);
    const session = await createSession(env.DB, { role: 'admin', adminId: admin.id, hours });
    await audit(env.DB, { actorRole: 'admin', actorId: admin.id, action: 'admin_login', ip });

    return json(
      { ok: true, role: 'admin', email: admin.email, expiresAt: session.expiresAt },
      200,
      origin,
      { 'Set-Cookie': sessionCookie(session.token, hours * 3600) }
    );
  }

  if (path === '/auth/admin/logout' && request.method === 'POST') {
    const session = await getSession(env.DB, request);
    if (session) {
      await audit(env.DB, {
        actorRole: 'admin',
        actorId: session.admin_id,
        action: 'admin_logout',
        ip,
      });
    }
    await destroySession(env.DB, request);
    return json({ ok: true }, 200, origin, { 'Set-Cookie': clearSessionCookie() });
  }

  if (path === '/auth/admin/me' && request.method === 'GET') {
    const session = await requireAdmin(env.DB, request);
    if (!session) return json({ error: 'Não autenticado.' }, 401, origin);
    const admin = await env.DB.prepare('SELECT email FROM admins WHERE id = ?')
      .bind(session.admin_id)
      .first();
    return json({ role: 'admin', email: admin?.email, expiresAt: session.expires_at }, 200, origin);
  }

  return null;
}
