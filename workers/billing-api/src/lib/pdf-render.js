import puppeteer from '@cloudflare/puppeteer';
import { invoicePdfOptions, invoicePdfViewport } from './pdf-options.js';

const LOCAL_PDF_URL = 'http://127.0.0.1:8789/render';

async function renderPdfViaLocalServer(renderUrl, html) {
  const response = await fetch(renderUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
    body: html,
  });

  if (!response.ok) {
    const message = await response.text().catch(() => '');
    throw new Error(message || 'Falha ao gerar PDF no servidor local de desenvolvimento.');
  }

  return new Uint8Array(await response.arrayBuffer());
}

async function tryLocalDevPdf(html) {
  try {
    const response = await fetch(LOCAL_PDF_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
      body: html,
      signal: AbortSignal.timeout(8000),
    });
    if (!response.ok) return null;
    return new Uint8Array(await response.arrayBuffer());
  } catch {
    return null;
  }
}

export async function renderPdfFromHtml(env, html) {
  if (env?.PDF_RENDER_URL) {
    return renderPdfViaLocalServer(env.PDF_RENDER_URL, html);
  }

  const localPdf = await tryLocalDevPdf(html);
  if (localPdf) return localPdf;

  if (env?.DEV_BOOTSTRAP_ADMIN === 'true') {
    throw new Error(
      'Servidor PDF local não está rodando. Em outro terminal, execute: npm run dev:pdf (em workers/billing-api).'
    );
  }

  if (!env?.BROWSER) {
    throw new Error(
      'Não foi possível gerar o PDF. Em desenvolvimento local, rode `npm run dev:pdf` em workers/billing-api.'
    );
  }

  const browser = await puppeteer.launch(env.BROWSER);
  try {
    const page = await browser.newPage();
    await page.setViewport(invoicePdfViewport);
    await page.setContent(html, { waitUntil: 'load', timeout: 30000 });
    await Promise.race([
      page.evaluate(() => document.fonts.ready),
      new Promise((resolve) => setTimeout(resolve, 3000)),
    ]);
    const pdf = await page.pdf(invoicePdfOptions);
    return pdf;
  } finally {
    await browser.close();
  }
}
