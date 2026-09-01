function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function emailAssetUrl(siteUrl, path) {
  return `${String(siteUrl || 'https://henriquerotsen.com.br').replace(/\/$/, '')}${path}`;
}

export function brandedEmailShell({
  siteUrl,
  label,
  title,
  bodyHtml,
  ctaLabel,
  ctaUrl,
  footerNote,
}) {
  const safeSiteUrl = escapeHtml(siteUrl || 'https://henriquerotsen.com.br');
  const logoUrl = escapeHtml(emailAssetUrl(siteUrl, '/logo-email.png?v=4'));
  const logoMarkUrl = escapeHtml(emailAssetUrl(siteUrl, '/logo-mark-email.png?v=4'));
  const ctaBlock = ctaLabel && ctaUrl
    ? `<a href="${escapeHtml(ctaUrl)}" style="display:inline-block;background-color:#ffffff;color:#191919;text-decoration:none;padding:14px 22px;border-radius:2px;font-family:Arial,Helvetica,sans-serif;font-size:14px;font-weight:700;letter-spacing:0.04em;">${escapeHtml(ctaLabel)}</a>`
    : '';

  return `<!DOCTYPE html>
<html lang="pt-BR">
  <body style="margin:0;padding:0;background:#ffffff;">
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
                        <p style="margin:0 0 8px;font-family:Arial,Helvetica,sans-serif;font-size:11px;letter-spacing:0.16em;text-transform:uppercase;color:rgba(255,255,255,0.55);">${escapeHtml(label)}</p>
                        <h1 style="margin:0 0 24px;font-family:Arial,Helvetica,sans-serif;font-size:24px;line-height:1.25;letter-spacing:0.04em;text-transform:uppercase;color:#ffffff;font-weight:700;">${escapeHtml(title)}</h1>
                        ${bodyHtml}
                        ${ctaBlock ? `<p style="margin:28px 0 0;">${ctaBlock}</p>` : ''}
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
                              <p style="margin:0;font-family:Arial,Helvetica,sans-serif;font-size:12px;line-height:1.55;color:rgba(255,255,255,0.5);">${footerNote}</p>
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
  </body>
</html>`;
}

export async function sendEmail(apiKey, { from, to, subject, html, attachments }) {
  const payload = { from, to, subject, html };
  if (attachments?.length) payload.attachments = attachments;

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`Resend error: ${response.status} ${detail}`);
  }
  return response.json();
}

export function otpEmailHtml({ code, siteUrl }) {
  const bodyHtml = `
    <p style="margin:0 0 16px;font-size:16px;line-height:1.65;color:#ffffff;">Use o código abaixo para acessar suas faturas.</p>
    <p style="margin:0 0 16px;font-size:32px;letter-spacing:0.3em;font-weight:700;color:#ffffff;">${escapeHtml(code)}</p>
    <p style="margin:0;font-size:14px;line-height:1.65;color:rgba(255,255,255,0.78);">O código expira em 10 minutos. Se você não solicitou este acesso, ignore este e-mail.</p>`;

  return brandedEmailShell({
    siteUrl,
    label: 'Área restrita',
    title: 'Código de acesso',
    bodyHtml,
    ctaLabel: 'Acessar o site',
    ctaUrl: `${siteUrl}/#/area-restrita/cliente`,
    footerNote: `Enviado automaticamente por <a href="${escapeHtml(siteUrl)}" style="color:#ffffff;text-decoration:none;">henriquerotsen.com.br</a>. Não responda a este e-mail.`,
  });
}

export function invoiceEmailHtml({
  clientName,
  invoiceNumber,
  dueDate,
  totalFormatted,
  portalUrl,
  paymentLink,
  siteUrl,
  pdfFilename,
}) {
  const pixBlock = paymentLink
    ? `<p style="margin:20px 0 0;"><a href="${escapeHtml(paymentLink)}" style="display:inline-block;background-color:#ffffff;color:#191919;text-decoration:none;padding:12px 20px;border-radius:2px;font-family:Arial,Helvetica,sans-serif;font-size:13px;font-weight:700;letter-spacing:0.04em;">Pagar via PIX</a></p>`
    : '';

  const bodyHtml = `
    <p style="margin:0 0 16px;font-size:16px;line-height:1.65;color:#ffffff;">Olá, <strong>${escapeHtml(clientName)}</strong>!</p>
    <p style="margin:0 0 16px;font-size:16px;line-height:1.65;color:rgba(255,255,255,0.78);">
      Sua fatura <strong>${escapeHtml(invoiceNumber)}</strong> chegou. O valor é de
      <strong>${escapeHtml(totalFormatted)}</strong>, com vencimento em <strong>${escapeHtml(dueDate)}</strong>.
    </p>
    <p style="margin:0 0 16px;font-size:16px;line-height:1.65;color:rgba(255,255,255,0.78);">
      O PDF da fatura está em anexo (${escapeHtml(pdfFilename || 'NF.pdf')}). Você também pode visualizar e baixar suas faturas na área do cliente.
    </p>
    ${pixBlock}
    <p style="margin:24px 0 0;font-size:14px;line-height:1.65;color:rgba(255,255,255,0.55);">
      Dúvidas? Escreva para <a href="mailto:contato@henriquerotsen.com.br" style="color:#ffffff;text-decoration:underline;font-weight:700;">contato@henriquerotsen.com.br</a>.
    </p>`;

  return brandedEmailShell({
    siteUrl,
    label: 'Faturamento',
    title: 'Sua fatura chegou',
    bodyHtml,
    ctaLabel: 'Acessar área do cliente',
    ctaUrl: portalUrl,
    footerNote: `Enviado automaticamente por <a href="${escapeHtml(siteUrl || 'https://henriquerotsen.com.br')}" style="color:#ffffff;text-decoration:none;">henriquerotsen.com.br</a> a partir de no-reply@henriquerotsen.com.br. Não responda a este e-mail.`,
  });
}

export function reminderEmailHtml({
  clientName,
  invoiceNumber,
  dueDate,
  totalFormatted,
  portalUrl,
  paymentLink,
  siteUrl,
}) {
  const pixBlock = paymentLink
    ? `<p style="margin:20px 0 0;"><a href="${escapeHtml(paymentLink)}" style="color:#ffffff;font-weight:700;text-decoration:underline;">Abrir link de pagamento PIX</a></p>`
    : '';

  const bodyHtml = `
    <p style="margin:0 0 16px;font-size:16px;line-height:1.65;color:#ffffff;">Olá, <strong>${escapeHtml(clientName)}</strong>!</p>
    <p style="margin:0 0 16px;font-size:16px;line-height:1.65;color:rgba(255,255,255,0.78);">
      A fatura <strong>${escapeHtml(invoiceNumber)}</strong>, no valor de <strong>${escapeHtml(totalFormatted)}</strong>,
      com vencimento em <strong>${escapeHtml(dueDate)}</strong>, ainda está em aberto.
    </p>
    ${pixBlock}`;

  return brandedEmailShell({
    siteUrl,
    label: 'Lembrete',
    title: 'Fatura em aberto',
    bodyHtml,
    ctaLabel: 'Ver faturas no portal',
    ctaUrl: portalUrl,
    footerNote: `Enviado automaticamente por <a href="${escapeHtml(siteUrl || 'https://henriquerotsen.com.br')}" style="color:#ffffff;text-decoration:none;">henriquerotsen.com.br</a>. Não responda a este e-mail.`,
  });
}

export function formatBRL(cents) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(cents / 100);
}

export function formatDateBR(isoDate) {
  const [y, m, d] = isoDate.split('-');
  return `${d}/${m}/${y}`;
}
