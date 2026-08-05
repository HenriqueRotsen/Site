const ALLOWED_ORIGINS = [
  'https://henriquerotsen.com.br',
  'https://www.henriquerotsen.com.br',
  'http://localhost:3000',
  'http://127.0.0.1:3000',
];

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const COPY = {
  pt: {
    label: 'Contato',
    title: 'Recebi sua mensagem',
    greeting: (name) => `Olá, ${name}!`,
    thanks:
      'Obrigado por entrar em contato pelo meu site. Sua mensagem chegou corretamente e eu retorno o mais breve possível.',
    autoNoteBefore:
      'Este é um e-mail automático de confirmação. Se precisar complementar alguma informação, envie uma nova mensagem pelo site ou escreva para',
    quote: '“Todo dia temos uma nova oportunidade de sermos um pouco melhor.”',
    regards: 'Atenciosamente,',
    role: 'Diretor de Tecnologia · Doutorando · IA &amp; Cibersegurança',
    cta: 'Visitar o site',
    footerBefore: 'Enviado automaticamente por',
    footerAfter: 'a partir de no-reply@henriquerotsen.com.br.',
    noReply: 'Não responda a este e-mail.',
    subject: 'Recebi sua mensagem — Henrique Rotsen',
  },
  en: {
    label: 'Contact',
    title: 'I received your message',
    greeting: (name) => `Hello, ${name}!`,
    thanks:
      'Thank you for getting in touch through my website. Your message arrived successfully and I will get back to you as soon as possible.',
    autoNoteBefore:
      'This is an automatic confirmation email. If you need to add more information, please send a new message through the site or write to',
    quote: '“Every day we have a new opportunity to become a little better.”',
    regards: 'Best regards,',
    role: 'Chief Technology Officer · PhD Candidate · AI &amp; Cybersecurity',
    cta: 'Visit the website',
    footerBefore: 'Sent automatically by',
    footerAfter: 'from no-reply@henriquerotsen.com.br.',
    noReply: 'Please do not reply to this email.',
    subject: 'I received your message — Henrique Rotsen',
  },
};

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

function resolveLang(value) {
  const lang = String(value || '').toLowerCase();
  return lang.startsWith('en') ? 'en' : 'pt';
}

function buildAutoReplyHtml({ lang, safeName, safeSiteUrl, logoUrl, logoMarkUrl }) {
  const t = COPY[lang] || COPY.pt;

  // White canvas + dark #191919 card.
  // Top: wordmark branca · Bottom: HR branca (both on dark card).
  return `
      <div style="margin:0;padding:0;background:#ffffff;font-family:Georgia,'Times New Roman',serif;color:#191919;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" bgcolor="#ffffff" style="background-color:#ffffff;padding:40px 12px;">
          <tr>
            <td align="center" bgcolor="#ffffff" style="background-color:#ffffff;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:560px;width:100%;border-collapse:collapse;">
                <tr>
                  <td bgcolor="#191919" style="background-color:#191919;">
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                      <tr>
                        <td align="center" bgcolor="#191919" style="background-color:#191919;padding:36px 28px 8px;">
                          <a href="${safeSiteUrl}" style="text-decoration:none;">
                            <img src="${logoUrl}" alt="Henrique Rotsen" width="220" height="47" style="display:block;width:220px;max-width:70%;height:auto;border:0;margin:0 auto;outline:none;" />
                          </a>
                        </td>
                      </tr>
                      <tr>
                        <td bgcolor="#191919" style="background-color:#191919;padding:28px 28px 8px;">
                          <p style="margin:0 0 8px;font-family:Arial,Helvetica,sans-serif;font-size:11px;letter-spacing:0.16em;text-transform:uppercase;color:rgba(255,255,255,0.55);">${t.label}</p>
                          <h1 style="margin:0 0 24px;font-family:Arial,Helvetica,sans-serif;font-size:24px;line-height:1.25;letter-spacing:0.04em;text-transform:uppercase;color:#ffffff;font-weight:700;">${t.title}</h1>
                          <p style="margin:0 0 16px;font-size:16px;line-height:1.65;color:#ffffff;">${t.greeting(safeName)}</p>
                          <p style="margin:0 0 16px;font-size:16px;line-height:1.65;color:rgba(255,255,255,0.78);">${t.thanks}</p>
                          <p style="margin:0 0 28px;font-size:16px;line-height:1.65;color:rgba(255,255,255,0.78);">${t.autoNoteBefore} <a href="mailto:contato@henriquerotsen.com.br" style="color:#ffffff;text-decoration:underline;font-weight:700;">contato@henriquerotsen.com.br</a>.</p>
                          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin:0 0 28px;">
                            <tr>
                              <td style="border-left:2px solid rgba(255,255,255,0.55);padding:4px 0 4px 18px;">
                                <p style="margin:0;font-family:Georgia,'Times New Roman',serif;font-size:17px;font-style:italic;line-height:1.4;color:rgba(255,255,255,0.72);">${t.quote}</p>
                              </td>
                            </tr>
                          </table>
                          <p style="margin:0 0 8px;font-size:16px;line-height:1.65;color:#ffffff;">${t.regards}<br /><strong style="font-family:Arial,Helvetica,sans-serif;letter-spacing:0.04em;">Henrique Rotsen</strong></p>
                          <p style="margin:0 0 28px;font-family:Arial,Helvetica,sans-serif;font-size:12px;letter-spacing:0.08em;text-transform:uppercase;color:rgba(255,255,255,0.55);">${t.role}</p>
                          <a href="${safeSiteUrl}" style="display:inline-block;background-color:#ffffff;color:#191919;text-decoration:none;padding:14px 22px;border-radius:2px;font-family:Arial,Helvetica,sans-serif;font-size:14px;font-weight:700;letter-spacing:0.04em;">${t.cta}</a>
                        </td>
                      </tr>
                      <tr>
                        <td align="center" bgcolor="#191919" style="background-color:#191919;padding:32px 28px 36px;">
                          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-top:1px solid rgba(255,255,255,0.14);">
                            <tr>
                              <td align="center" bgcolor="#191919" style="background-color:#191919;padding-top:24px;">
                                <a href="${safeSiteUrl}" style="text-decoration:none;">
                                  <img src="${logoMarkUrl}" alt="HR" width="48" height="34" style="display:block;width:48px;max-width:18%;height:auto;border:0;margin:0 auto 14px;outline:none;" />
                                </a>
                                <p style="margin:0;font-family:Arial,Helvetica,sans-serif;font-size:12px;line-height:1.55;color:rgba(255,255,255,0.5);">${t.footerBefore} <a href="${safeSiteUrl}" style="color:#ffffff;text-decoration:none;">henriquerotsen.com.br</a> ${t.footerAfter}<br />${t.noReply}</p>
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </div>
    `;
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
    const message =
      data?.message ||
      data?.error?.message ||
      (typeof data?.error === 'string' ? data.error : null) ||
      JSON.stringify(data) ||
      `Resend HTTP ${response.status}`;
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
    const lang = resolveLang(body.lang);

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
    const templateId =
      lang === 'en'
        ? env.RESEND_AUTO_REPLY_TEMPLATE_ID_EN || env.RESEND_AUTO_REPLY_TEMPLATE_ID
        : env.RESEND_AUTO_REPLY_TEMPLATE_ID;
    const siteUrl = env.SITE_URL || 'https://henriquerotsen.com.br';
    const safeName = escapeHtml(name);
    const safeSiteUrl = escapeHtml(siteUrl);
    const copy = COPY[lang];

    const autoReplyHtml = buildAutoReplyHtml({
      lang,
      safeName,
      safeSiteUrl,
      // ?v= busts client caches after logo asset updates
      logoUrl: `${safeSiteUrl}/logo-email.png?v=4`,
      logoMarkUrl: `${safeSiteUrl}/logo-mark-email.png?v=4`,
    });

    try {
      await sendResend(env.RESEND_API_KEY, {
        from: fromNoReply,
        to: [inboxTo],
        reply_to: [email],
        subject: `Novo contato pelo site — ${name}`,
        html: `
          <div style="font-family: Arial, sans-serif; color: #191919; line-height: 1.6;">
            <h2 style="margin: 0 0 16px;">Nova mensagem do site</h2>
            <p><strong>Nome:</strong> ${safeName}</p>
            <p><strong>E-mail:</strong> ${escapeHtml(email)}</p>
            <p><strong>Idioma:</strong> ${lang}</p>
            <p><strong>Mensagem:</strong></p>
            <p style="white-space: pre-wrap; background: #f7f8fa; padding: 16px; border-radius: 8px;">${escapeHtml(message)}</p>
          </div>
        `,
      });

      try {
        if (templateId) {
          await sendResend(env.RESEND_API_KEY, {
            from: fromNoReply,
            to: [email],
            subject: copy.subject,
            template: {
              id: templateId,
              variables: {
                CONTACT_NAME: name,
                SITE_URL: siteUrl,
              },
            },
          });
        } else {
          await sendResend(env.RESEND_API_KEY, {
            from: fromNoReply,
            to: [email],
            subject: copy.subject,
            html: autoReplyHtml,
          });
        }
      } catch (autoReplyError) {
        // If the Resend dashboard template is broken, fall back to HTML.
        const autoDetail =
          autoReplyError instanceof Error ? autoReplyError.message : String(autoReplyError);
        console.error('auto-reply template failed, using HTML fallback:', autoDetail);
        await sendResend(env.RESEND_API_KEY, {
          from: fromNoReply,
          to: [email],
          subject: copy.subject,
          html: autoReplyHtml,
        });
      }

      return json({ ok: true }, 200, origin);
    } catch (error) {
      const detail = error instanceof Error ? error.message : String(error);
      console.error('contact-api error:', detail);
      return json({ error: 'Failed to send email', detail }, 502, origin);
    }
  },
};
