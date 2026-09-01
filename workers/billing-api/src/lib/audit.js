import { uuid, nowIso } from './crypto.js';

export async function audit(db, { actorRole, actorId, action, resourceType, resourceId, ip, metadata }) {
  await db
    .prepare(
      `INSERT INTO audit_log (id, actor_role, actor_id, action, resource_type, resource_id, ip_address, metadata)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .bind(
      uuid(),
      actorRole || null,
      actorId || null,
      action,
      resourceType || null,
      resourceId || null,
      ip || null,
      metadata ? JSON.stringify(metadata) : null
    )
    .run();
}

export async function checkRateLimit(db, key, maxCount, windowMinutes) {
  const now = nowIso();
  const row = await db.prepare('SELECT count, window_start FROM rate_limits WHERE key = ?').bind(key).first();

  if (!row) {
    await db
      .prepare('INSERT INTO rate_limits (key, count, window_start) VALUES (?, 1, ?)')
      .bind(key, now)
      .run();
    return { allowed: true };
  }

  const windowStart = new Date(row.window_start).getTime();
  const elapsed = Date.now() - windowStart;
  if (elapsed > windowMinutes * 60000) {
    await db
      .prepare('UPDATE rate_limits SET count = 1, window_start = ? WHERE key = ?')
      .bind(now, key)
      .run();
    return { allowed: true };
  }

  if (row.count >= maxCount) {
    return { allowed: false, retryAfterMinutes: Math.ceil((windowMinutes * 60000 - elapsed) / 60000) };
  }

  await db.prepare('UPDATE rate_limits SET count = count + 1 WHERE key = ?').bind(key).run();
  return { allowed: true };
}
