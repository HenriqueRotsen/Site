import { json, readJson } from '../lib/http.js';
import {
  hashPassword,
  verifyPassword,
  uuid,
  nowIso,
  otpCode,
  sha256Hex,
  addMinutes,
} from '../lib/crypto.js';
import {
  createSession,
  destroySession,
  getSession,
  sessionCookie,
  clearSessionCookie,
  requireAdmin,
} from '../lib/session.js';
import { audit, checkRateLimit } from '../lib/audit.js';
import { sendEmail, otpEmailHtml } from '../lib/email.js';

function maskEmail(email) {
  const value = String(email || '');
  const [local, domain] = value.split('@');
  if (!local || !domain) return value;
  const visible = local.slice(0, Math.min(2, local.length));
  return `${visible}${'*'.repeat(Math.max(local.length - visible.length, 1))}@${domain}`;
}

async function ensureAdminExists(env) {
  const email = env.ADMIN_EMAIL?.toLowerCase().trim();
  const password = env.ADMIN_PASSWORD;
  if (!email || !password) return;

  const passwordHash = await hashPassword(password);
  const count = await env.DB.prepare('SELECT COUNT(*) as c FROM admins').first();

  if (count.c === 0) {
    await env.DB.prepare('INSERT INTO admins (id, email, password_hash) VALUES (?, ?, ?)')
      .bind(uuid(), email, passwordHash)
      .run();
    return;
  }

  // Local dev only (.dev.vars): mantém senha do admin alinhada ao ADMIN_PASSWORD
  if (env.DEV_BOOTSTRAP_ADMIN === 'true') {
    await env.DB.prepare(
      'UPDATE admins SET password_hash = ?, failed_attempts = 0, locked_until = NULL WHERE email = ?'
    )
      .bind(passwordHash, email)
      .run();
  }
}

async function issueAdminOtp(env, admin, ip, origin) {
  const rateKey = `admin-otp:${ip}:${admin.id}`;
  const rate = await checkRateLimit(env.DB, rateKey, 5, 15);
  if (!rate.allowed) {
    return json({ error: 'Muitas tentativas. Aguarde alguns minutos.' }, 429, origin);
  }

  const code = otpCode();
  const codeHash = await sha256Hex(code);
  const otpMinutes = parseInt(env.OTP_MINUTES || '10', 10);
  const expiresAt = addMinutes(nowIso(), otpMinutes);

  await env.DB.prepare('DELETE FROM admin_otp WHERE admin_id = ?').bind(admin.id).run();
  await env.DB.prepare(
    `INSERT INTO admin_otp (id, admin_id, code_hash, expires_at, ip_address) VALUES (?, ?, ?, ?, ?)`
  )
    .bind(uuid(), admin.id, codeHash, expiresAt, ip)
    .run();

  const payload = {
    ok: true,
    requiresOtp: true,
    email: admin.email,
    emailMasked: maskEmail(admin.email),
    message: 'Enviamos um código de verificação para o seu e-mail.',
  };

  if (env.DEV_BOOTSTRAP_ADMIN === 'true' && !env.RESEND_API_KEY) {
    payload.devCode = code;
    payload.message = 'Modo local: use o código de desenvolvimento (e-mail não configurado).';
    await audit(env.DB, {
      actorRole: 'admin',
      actorId: admin.id,
      action: 'admin_otp_requested',
      ip,
      metadata: { mode: 'dev' },
    });
    return json(payload, 200, origin);
  }

  if (!env.RESEND_API_KEY) {
    return json({ error: 'Serviço de e-mail não configurado.' }, 500, origin);
  }

  await sendEmail(env.RESEND_API_KEY, {
    from: env.FROM_EMAIL,
    to: admin.email,
    subject: 'Código de acesso — Administração',
    html: otpEmailHtml({ code, siteUrl: env.SITE_URL, purpose: 'admin' }),
  });

  await audit(env.DB, {
    actorRole: 'admin',
    actorId: admin.id,
    action: 'admin_otp_requested',
    ip,
  });

  return json(payload, 200, origin);
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

    return issueAdminOtp(env, admin, ip, origin);
  }

  if (path === '/auth/admin/verify-code' && request.method === 'POST') {
    const body = await readJson(request);
    const email = String(body?.email || '')
      .toLowerCase()
      .trim();
    const code = String(body?.code || '').trim();
    if (!email || !/^\d{6}$/.test(code)) {
      return json({ error: 'E-mail ou código inválido.' }, 400, origin);
    }

    const admin = await env.DB.prepare('SELECT * FROM admins WHERE email = ?').bind(email).first();
    if (!admin) return json({ error: 'Código inválido.' }, 401, origin);

    const otp = await env.DB.prepare(
      `SELECT * FROM admin_otp WHERE admin_id = ? ORDER BY created_at DESC LIMIT 1`
    )
      .bind(admin.id)
      .first();

    if (!otp) {
      return json({ error: 'Nenhum código ativo. Faça login novamente.' }, 401, origin);
    }

    if (new Date(otp.expires_at) < new Date()) {
      return json({ error: 'Código expirado. Faça login novamente.' }, 401, origin);
    }

    const maxAttempts = parseInt(env.OTP_MAX_ATTEMPTS || '5', 10);
    if (otp.attempts >= maxAttempts) {
      return json({ error: 'Muitas tentativas. Faça login novamente.' }, 429, origin);
    }

    const codeHash = await sha256Hex(code);
    if (codeHash !== otp.code_hash) {
      await env.DB.prepare('UPDATE admin_otp SET attempts = attempts + 1 WHERE id = ?')
        .bind(otp.id)
        .run();
      return json({ error: 'Código incorreto. Use o código do e-mail mais recente.' }, 401, origin);
    }

    await env.DB.prepare('DELETE FROM admin_otp WHERE admin_id = ?').bind(admin.id).run();

    const hours = parseInt(env.SESSION_HOURS || '8', 10);
    const session = await createSession(env.DB, { role: 'admin', adminId: admin.id, hours });
    await audit(env.DB, { actorRole: 'admin', actorId: admin.id, action: 'admin_login', ip });

    const cookieOptions = { secure: env.DEV_BOOTSTRAP_ADMIN !== 'true' };

    return json(
      { ok: true, role: 'admin', email: admin.email, expiresAt: session.expiresAt },
      200,
      origin,
      { 'Set-Cookie': sessionCookie(session.token, hours * 3600, cookieOptions) }
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
    const cookieOptions = { secure: env.DEV_BOOTSTRAP_ADMIN !== 'true' };
    return json({ ok: true }, 200, origin, { 'Set-Cookie': clearSessionCookie(cookieOptions) });
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
