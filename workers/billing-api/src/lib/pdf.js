import { buildInvoiceHtml, issuerFromEnv } from './invoice-template.js';
import { renderPdfFromHtml } from './pdf-render.js';

export { issuerFromEnv };

export async function generateInvoicePdf(env, data) {
  const html = await buildInvoiceHtml(data);
  return renderPdfFromHtml(env, html);
}

export async function sha256Bytes(data) {
  const hash = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hash), (b) => b.toString(16).padStart(2, '0')).join('');
}
