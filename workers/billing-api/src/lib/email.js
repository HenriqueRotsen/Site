function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export async function sendEmail(apiKey, { from, to, subject, html }) {
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ from, to, subject, html }),
  });
  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`Resend error: ${response.status} ${detail}`);
  }
  return response.json();
}

export function otpEmailHtml({ code, siteUrl }) {
  return `<!DOCTYPE html><html><body style="margin:0;padding:24px;background:#f5f5f5;font-family:Arial,sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center">
  <table width="560" style="background:#191919;border-radius:8px;padding:32px;color:#fff">
    <tr><td>
      <p style="margin:0 0 8px;font-size:11px;letter-spacing:0.16em;text-transform:uppercase;color:rgba(255,255,255,0.55)">Área restrita</p>
      <h1 style="margin:0 0 24px;font-size:22px">Código de acesso</h1>
      <p style="margin:0 0 16px;line-height:1.6;color:rgba(255,255,255,0.85)">Use o código abaixo para acessar suas faturas. Ele expira em 10 minutos.</p>
      <p style="margin:0 0 24px;font-size:32px;letter-spacing:0.3em;font-weight:700">${escapeHtml(code)}</p>
      <p style="margin:0;font-size:12px;color:rgba(255,255,255,0.55)">Se você não solicitou este código, ignore este e-mail.</p>
      <p style="margin:24px 0 0;font-size:12px"><a href="${escapeHtml(siteUrl)}" style="color:#fff">${escapeHtml(siteUrl)}</a></p>
    </td></tr>
  </table></td></tr></table></body></html>`;
}

export function invoiceEmailHtml({ clientName, invoiceNumber, dueDate, totalFormatted, portalUrl, paymentLink }) {
  const pixBlock = paymentLink
    ? `<p style="margin:16px 0"><a href="${escapeHtml(paymentLink)}" style="display:inline-block;background:#fff;color:#191919;padding:12px 24px;text-decoration:none;border-radius:4px;font-weight:700">Pagar via PIX</a></p>`
    : '';
  return `<!DOCTYPE html><html><body style="margin:0;padding:24px;background:#f5f5f5;font-family:Arial,sans-serif">
  <table width="100%"><tr><td align="center">
  <table width="560" style="background:#191919;border-radius:8px;padding:32px;color:#fff">
    <tr><td>
      <p style="margin:0 0 8px;font-size:11px;letter-spacing:0.16em;text-transform:uppercase;color:rgba(255,255,255,0.55)">Fatura</p>
      <h1 style="margin:0 0 16px;font-size:22px">${escapeHtml(invoiceNumber)}</h1>
      <p style="margin:0 0 8px;color:rgba(255,255,255,0.85)">Olá, ${escapeHtml(clientName)}!</p>
      <p style="margin:0 0 16px;line-height:1.6;color:rgba(255,255,255,0.85)">
        Sua fatura no valor de <strong>${escapeHtml(totalFormatted)}</strong> vence em <strong>${escapeHtml(dueDate)}</strong>.
        O PDF está anexo. Você também pode acessar o portal para visualizar e baixar suas faturas.
      </p>
      ${pixBlock}
      <p style="margin:24px 0 0"><a href="${escapeHtml(portalUrl)}" style="color:#fff">Acessar área do cliente</a></p>
    </td></tr>
  </table></td></tr></table></body></html>`;
}

export function reminderEmailHtml({ clientName, invoiceNumber, dueDate, totalFormatted, portalUrl, paymentLink }) {
  return `<!DOCTYPE html><html><body style="margin:0;padding:24px;background:#f5f5f5;font-family:Arial,sans-serif">
  <table width="100%"><tr><td align="center">
  <table width="560" style="background:#191919;border-radius:8px;padding:32px;color:#fff">
    <tr><td>
      <p style="margin:0 0 8px;font-size:11px;letter-spacing:0.16em;text-transform:uppercase;color:#e8a87c">Lembrete</p>
      <h1 style="margin:0 0 16px;font-size:22px">Fatura ${escapeHtml(invoiceNumber)} em aberto</h1>
      <p style="margin:0 0 16px;line-height:1.6;color:rgba(255,255,255,0.85)">
        Olá, ${escapeHtml(clientName)}. Lembramos que a fatura de <strong>${escapeHtml(totalFormatted)}</strong>
        com vencimento em <strong>${escapeHtml(dueDate)}</strong> ainda está pendente.
      </p>
      ${paymentLink ? `<p style="margin:16px 0"><a href="${escapeHtml(paymentLink)}" style="color:#fff;font-weight:700">Link de pagamento PIX</a></p>` : ''}
      <p style="margin:24px 0 0"><a href="${escapeHtml(portalUrl)}" style="color:#fff">Ver faturas no portal</a></p>
    </td></tr>
  </table></td></tr></table></body></html>`;
}

export function formatBRL(cents) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(cents / 100);
}

export function formatDateBR(isoDate) {
  const [y, m, d] = isoDate.split('-');
  return `${d}/${m}/${y}`;
}
