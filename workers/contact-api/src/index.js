const ALLOWED_ORIGINS = [
  'https://henriquerotsen.com.br',
  'https://www.henriquerotsen.com.br',
  'http://localhost:3000',
  'http://127.0.0.1:3000',
];

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function corsHeaders(origin) {
  const allowed = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  return {
    'Access-Control-Allow-Origin': allowed,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Max-Age': '86400',
  };
}

function json(body, status, origin) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...corsHeaders(origin),
    },
  });
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

async function sendResend(apiKey, payload) {
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message = data?.message || data?.error?.message || 'Resend request failed';
    throw new Error(message);
  }
  return data;
}

export default {
  async fetch(request, env) {
    const origin = request.headers.get('Origin') || '';

    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: corsHeaders(origin) });
    }

    if (request.method !== 'POST') {
      return json({ error: 'Method not allowed' }, 405, origin);
    }

    if (!ALLOWED_ORIGINS.includes(origin)) {
      return json({ error: 'Origin not allowed' }, 403, origin);
    }

    let body;
    try {
      body = await request.json();
    } catch {
      return json({ error: 'Invalid JSON body' }, 400, origin);
    }

    // Honeypot: bots fill this; humans leave it empty
    if (body.website) {
      return json({ ok: true }, 200, origin);
    }

    const name = String(body.name || '').trim();
    const email = String(body.email || '').trim().toLowerCase();
    const message = String(body.message || '').trim();

    if (!name || name.length > 120) {
      return json({ error: 'Invalid name' }, 400, origin);
    }
    if (!email || !EMAIL_RE.test(email) || email.length > 200) {
      return json({ error: 'Invalid email' }, 400, origin);
    }
    if (!message || message.length > 5000) {
      return json({ error: 'Invalid message' }, 400, origin);
    }

    if (!env.RESEND_API_KEY) {
      return json({ error: 'Server misconfigured' }, 500, origin);
    }

    const fromNoReply = env.FROM_NO_REPLY || 'Henrique Rotsen <no-reply@henriquerotsen.com.br>';
    const inboxTo = env.INBOX_TO || 'contato@henriquerotsen.com.br';
    const templateId = env.RESEND_AUTO_REPLY_TEMPLATE_ID;
    const siteUrl = env.SITE_URL || 'https://henriquerotsen.com.br';

    try {
      await sendResend(env.RESEND_API_KEY, {
        from: fromNoReply,
        to: [inboxTo],
        reply_to: email,
        subject: `Novo contato pelo site — ${name}`,
        html: `
          <div style="font-family: Arial, sans-serif; color: #191919; line-height: 1.6;">
            <h2 style="margin: 0 0 16px;">Nova mensagem do site</h2>
            <p><strong>Nome:</strong> ${escapeHtml(name)}</p>
            <p><strong>E-mail:</strong> ${escapeHtml(email)}</p>
            <p><strong>Mensagem:</strong></p>
            <p style="white-space: pre-wrap; background: #f7f8fa; padding: 16px; border-radius: 8px;">${escapeHtml(message)}</p>
          </div>
        `,
      });

      const autoReplyPayload = {
        from: fromNoReply,
        to: [email],
        subject: 'Recebi sua mensagem — Henrique Rotsen',
      };

      if (templateId) {
        autoReplyPayload.template = {
          id: templateId,
          variables: {
            CONTACT_NAME: name,
            SITE_URL: siteUrl,
          },
        };
      } else {
        autoReplyPayload.html = `
          <div style="font-family: Arial, sans-serif; color: #191919; line-height: 1.6;">
            <p>Olá, ${escapeHtml(name)}!</p>
            <p>Obrigado por entrar em contato. Recebi sua mensagem e respondo o mais breve possível.</p>
            <p>Este é um e-mail automático de confirmação. Para complementar informações, use o site ou escreva para contato@henriquerotsen.com.br.</p>
            <p>Atenciosamente,<br/>Henrique Rotsen</p>
            <p><a href="${escapeHtml(siteUrl)}">${escapeHtml(siteUrl)}</a></p>
          </div>
        `;
      }

      await sendResend(env.RESEND_API_KEY, autoReplyPayload);

      return json({ ok: true }, 200, origin);
    } catch (error) {
      console.error(error);
      return json({ error: 'Failed to send email' }, 502, origin);
    }
  },
};
