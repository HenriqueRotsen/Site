import { randomToken, sha256Hex, uuid, nowIso, addHours, isExpired } from './crypto.js';

const COOKIE_NAME = 'billing_session';

function cookieFlags(maxAgeSeconds, { secure = true } = {}) {
  const parts = [`Path=/`, `HttpOnly`, `SameSite=Strict`, `Max-Age=${maxAgeSeconds}`];
  if (secure) parts.splice(2, 0, 'Secure');
  return parts.join('; ');
}

export function sessionCookie(token, maxAgeSeconds, options = {}) {
  return `${COOKIE_NAME}=${token}; ${cookieFlags(maxAgeSeconds, options)}`;
}

export function clearSessionCookie(options = {}) {
  return `${COOKIE_NAME}=; ${cookieFlags(0, options)}`;
}

export function parseSessionCookie(request) {
  const cookie = request.headers.get('Cookie') || '';
  const match = cookie.match(new RegExp(`${COOKIE_NAME}=([^;]+)`));
  return match ? match[1] : null;
}

export async function createSession(db, { role, adminId, clientId, hours }) {
  const token = randomToken(32);
  const tokenHash = await sha256Hex(token);
  const id = uuid();
  const expiresAt = addHours(nowIso(), hours);
  await db
    .prepare(
      `INSERT INTO sessions (id, token_hash, role, admin_id, client_id, expires_at)
       VALUES (?, ?, ?, ?, ?, ?)`
    )
    .bind(id, tokenHash, role, adminId || null, clientId || null, expiresAt)
    .run();
  return { token, expiresAt, sessionId: id };
}

export async function getSession(db, request) {
  const token = parseSessionCookie(request);
  if (!token) return null;
  const tokenHash = await sha256Hex(token);
  const row = await db
    .prepare(
      `SELECT id, role, admin_id, client_id, expires_at FROM sessions WHERE token_hash = ?`
    )
    .bind(tokenHash)
    .first();
  if (!row || isExpired(row.expires_at)) {
    if (row) {
      await db.prepare('DELETE FROM sessions WHERE id = ?').bind(row.id).run();
    }
    return null;
  }
  return { ...row, token };
}

export async function destroySession(db, request) {
  const token = parseSessionCookie(request);
  if (!token) return;
  const tokenHash = await sha256Hex(token);
  await db.prepare('DELETE FROM sessions WHERE token_hash = ?').bind(tokenHash).run();
}

export async function requireAdmin(db, request) {
  const session = await getSession(db, request);
  if (!session || session.role !== 'admin') return null;
  return session;
}

export async function requireClient(db, request) {
  const session = await getSession(db, request);
  if (!session || session.role !== 'client') return null;
  return session;
}

export async function cleanupExpiredSessions(db) {
  await db.prepare(`DELETE FROM sessions WHERE expires_at < ?`).bind(nowIso()).run();
  await db.prepare(`DELETE FROM client_otp WHERE expires_at < ?`).bind(nowIso()).run();
}
