import { json, readJson } from '../lib/http.js';
import { otpCode, sha256Hex, uuid, nowIso, addMinutes } from '../lib/crypto.js';
import { validateCnpj, cnpjHash, normalizeCnpj } from '../lib/cnpj.js';
import { createSession, destroySession, getSession, sessionCookie, clearSessionCookie, requireClient } from '../lib/session.js';
import { audit, checkRateLimit } from '../lib/audit.js';
import { sendEmail, otpEmailHtml } from '../lib/email.js';

export async function handleClientAuth(request, env, origin, path) {
  const ip = request.headers.get('CF-Connecting-IP') || '';

  if (path === '/auth/client/request-code' && request.method === 'POST') {
    const body = await readJson(request);
    const cnpj = normalizeCnpj(body?.cnpj);
    if (!validateCnpj(cnpj)) {
      return json({ error: 'CNPJ inválido.' }, 400, origin);
    }

    const rateKey = `otp:${ip}:${cnpj}`;
    const rate = await checkRateLimit(env.DB, rateKey, 5, 15);
    if (!rate.allowed) {
      return json({ error: 'Muitas tentativas. Aguarde alguns minutos.' }, 429, origin);
    }

    const hash = await cnpjHash(env.CNPJ_HMAC_SECRET, cnpj);
    const client = await env.DB.prepare(
      `SELECT id, legal_name, billing_email, status FROM clients WHERE cnpj_hash = ?`
    )
      .bind(hash)
      .first();

    if (!client || client.status !== 'active') {
      // Generic message to avoid enumeration
      return json({ ok: true, message: 'Se o CNPJ estiver cadastrado, enviaremos um código por e-mail.' }, 200, origin);
    }

    const code = otpCode();
    const codeHash = await sha256Hex(code);
    const otpMinutes = parseInt(env.OTP_MINUTES || '10', 10);
    const expiresAt = addMinutes(nowIso(), otpMinutes);

    await env.DB.prepare('DELETE FROM client_otp WHERE client_id = ?').bind(client.id).run();
    await env.DB.prepare(
      `INSERT INTO client_otp (id, client_id, code_hash, expires_at, ip_address) VALUES (?, ?, ?, ?, ?)`
    )
      .bind(uuid(), client.id, codeHash, expiresAt, ip)
      .run();

    if (!env.RESEND_API_KEY) {
      return json({ error: 'Serviço de e-mail não configurado.' }, 500, origin);
    }

    await sendEmail(env.RESEND_API_KEY, {
      from: env.FROM_EMAIL,
      to: client.billing_email,
      subject: 'Código de acesso — Área do cliente',
      html: otpEmailHtml({ code, siteUrl: env.SITE_URL }),
    });

    await audit(env.DB, {
      actorRole: 'client',
      actorId: client.id,
      action: 'otp_requested',
      ip,
      metadata: { cnpj_last4: cnpj.slice(-4) },
    });

    return json({ ok: true, message: 'Se o CNPJ estiver cadastrado, enviaremos um código por e-mail.' }, 200, origin);
  }

  if (path === '/auth/client/verify-code' && request.method === 'POST') {
    const body = await readJson(request);
    const cnpj = normalizeCnpj(body?.cnpj);
    const code = String(body?.code || '').trim();
    if (!validateCnpj(cnpj) || !/^\d{6}$/.test(code)) {
      return json({ error: 'CNPJ ou código inválido.' }, 400, origin);
    }

    const hash = await cnpjHash(env.CNPJ_HMAC_SECRET, cnpj);
    const client = await env.DB.prepare('SELECT id FROM clients WHERE cnpj_hash = ? AND status = ?')
      .bind(hash, 'active')
      .first();
    if (!client) return json({ error: 'CNPJ não encontrado ou inativo.' }, 401, origin);

    const otp = await env.DB.prepare(
      `SELECT * FROM client_otp WHERE client_id = ? ORDER BY created_at DESC LIMIT 1`
    )
      .bind(client.id)
      .first();

    if (!otp) {
      return json({ error: 'Nenhum código ativo. Solicite um novo código.' }, 401, origin);
    }

    if (new Date(otp.expires_at) < new Date()) {
      return json({ error: 'Código expirado. Solicite um novo código.' }, 401, origin);
    }

    const maxAttempts = parseInt(env.OTP_MAX_ATTEMPTS || '5', 10);
    if (otp.attempts >= maxAttempts) {
      return json({ error: 'Muitas tentativas. Solicite um novo código.' }, 429, origin);
    }

    const codeHash = await sha256Hex(code);
    if (codeHash !== otp.code_hash) {
      await env.DB.prepare('UPDATE client_otp SET attempts = attempts + 1 WHERE id = ?')
        .bind(otp.id)
        .run();
      return json({ error: 'Código incorreto. Use o código do e-mail mais recente.' }, 401, origin);
    }

    await env.DB.prepare('DELETE FROM client_otp WHERE client_id = ?').bind(client.id).run();

    const hours = parseInt(env.SESSION_HOURS || '8', 10);
    const session = await createSession(env.DB, { role: 'client', clientId: client.id, hours });
    await audit(env.DB, { actorRole: 'client', actorId: client.id, action: 'client_login', ip });

    const clientRow = await env.DB.prepare(
      'SELECT legal_name, cnpj_last4, billing_email FROM clients WHERE id = ?'
    )
      .bind(client.id)
      .first();

    const cookieOptions = { secure: env.DEV_BOOTSTRAP_ADMIN !== 'true' };

    return json(
      {
        ok: true,
        role: 'client',
        client: {
          name: clientRow.legal_name,
          cnpjMasked: `**.***.***/****-${clientRow.cnpj_last4}`,
          email: clientRow.billing_email,
        },
        expiresAt: session.expiresAt,
      },
      200,
      origin,
      { 'Set-Cookie': sessionCookie(session.token, hours * 3600, cookieOptions) }
    );
  }

  if (path === '/auth/client/logout' && request.method === 'POST') {
    const session = await getSession(env.DB, request);
    if (session?.client_id) {
      await audit(env.DB, { actorRole: 'client', actorId: session.client_id, action: 'client_logout', ip });
    }
    await destroySession(env.DB, request);
    const cookieOptions = { secure: env.DEV_BOOTSTRAP_ADMIN !== 'true' };
    return json({ ok: true }, 200, origin, { 'Set-Cookie': clearSessionCookie(cookieOptions) });
  }

  if (path === '/auth/client/me' && request.method === 'GET') {
    const session = await requireClient(env.DB, request);
    if (!session) return json({ error: 'Não autenticado.' }, 401, origin);
    const client = await env.DB.prepare(
      'SELECT legal_name, cnpj_last4, billing_email FROM clients WHERE id = ?'
    )
      .bind(session.client_id)
      .first();
    return json(
      {
        role: 'client',
        client: {
          name: client.legal_name,
          cnpjMasked: `**.***.***/****-${client.cnpj_last4}`,
          email: client.billing_email,
        },
        expiresAt: session.expires_at,
      },
      200,
      origin
    );
  }

  return null;
}
