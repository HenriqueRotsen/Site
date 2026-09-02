import { json, noContent } from './lib/http.js';
import { cleanupExpiredSessions } from './lib/session.js';
import { handleAdminAuth } from './routes/auth-admin.js';
import { handleClientAuth } from './routes/auth-client.js';
import { handleAdminClients } from './routes/admin-clients.js';
import { handleAdminInvoices } from './routes/admin-invoices.js';
import { handleAdminDashboard } from './routes/admin-dashboard.js';
import { handleAdminCnpjLookup } from './routes/admin-cnpj-lookup.js';
import { handleClientPortal } from './routes/client-portal.js';
import { handleCron } from './cron.js';

async function route(request, env) {
  const url = new URL(request.url);
  const origin = request.headers.get('Origin') || '';
  const path = url.pathname.replace(/\/$/, '') || '/';

  if (request.method === 'OPTIONS') {
    return noContent(204, origin);
  }

  if (path === '/health' && request.method === 'GET') {
    return json({ ok: true, service: 'billing-api-henrique' }, 200, origin);
  }

  const handlers = [
    handleAdminAuth,
    handleClientAuth,
    handleClientPortal,
    handleAdminClients,
    handleAdminInvoices,
    handleAdminDashboard,
    handleAdminCnpjLookup,
  ];

  for (const handler of handlers) {
    const response = await handler(request, env, origin, path);
    if (response) return response;
  }

  return json({ error: 'Not found' }, 404, origin);
}

export default {
  async fetch(request, env, ctx) {
    try {
      ctx.waitUntil(cleanupExpiredSessions(env.DB));
      return await route(request, env);
    } catch (err) {
      console.error('billing-api error:', err);
      const origin = request.headers.get('Origin') || '';
      return json({ error: 'Internal server error' }, 500, origin);
    }
  },

  async scheduled(event, env, ctx) {
    ctx.waitUntil(handleCron(env));
  },
};
