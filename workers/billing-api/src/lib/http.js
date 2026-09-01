const ALLOWED_ORIGINS = [
  'https://henriquerotsen.com.br',
  'https://www.henriquerotsen.com.br',
  'http://localhost:3000',
  'http://127.0.0.1:3000',
  'http://localhost:3001',
  'http://127.0.0.1:3001',
];

function isAllowedOrigin(origin) {
  if (!origin) return false;
  if (ALLOWED_ORIGINS.includes(origin)) return true;
  try {
    const { hostname, protocol } = new URL(origin);
    return (hostname === 'localhost' || hostname === '127.0.0.1') && protocol === 'http:';
  } catch {
    return false;
  }
}

export function corsHeaders(origin, extra = {}) {
  const allowed = isAllowedOrigin(origin) ? origin : ALLOWED_ORIGINS[0];
  return {
    'Access-Control-Allow-Origin': allowed,
    'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Credentials': 'true',
    'Access-Control-Max-Age': '86400',
    ...extra,
  };
}

export function json(body, status, origin, extraHeaders = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...corsHeaders(origin),
      ...extraHeaders,
    },
  });
}

export function noContent(status, origin) {
  return new Response(null, { status, headers: corsHeaders(origin) });
}

export async function readJson(request) {
  try {
    return await request.json();
  } catch {
    return null;
  }
}
