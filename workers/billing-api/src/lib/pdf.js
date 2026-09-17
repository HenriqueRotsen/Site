import { buildInvoiceHtml, issuerFromEnv } from './invoice-template.js';
import { renderPdfFromHtml } from './pdf-render.js';

export { issuerFromEnv };

export async function generateInvoicePdf(env, data) {
  const html = await buildInvoiceHtml(data);
  return renderPdfFromHtml(env, html);
}

export async function sha256Bytes(data) {
  const bytes =
    data instanceof ArrayBuffer
      ? data
      : data?.buffer
        ? data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength)
        : new Uint8Array(data).buffer;
  const hash = await crypto.subtle.digest('SHA-256', bytes);
  return Array.from(new Uint8Array(hash), (b) => b.toString(16).padStart(2, '0')).join('');
}
