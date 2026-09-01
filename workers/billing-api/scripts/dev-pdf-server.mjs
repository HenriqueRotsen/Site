import http from 'node:http';
import puppeteer from 'puppeteer';
import { invoicePdfOptions, invoicePdfViewport } from '../src/lib/pdf-options.js';

const PORT = Number(process.env.PDF_RENDER_PORT || 8789);
const HOST = '127.0.0.1';

let browserPromise = null;

async function getBrowser() {
  if (!browserPromise) {
    browserPromise = puppeteer.launch({
      headless: true,
      executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || '/usr/bin/google-chrome',
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });
  }
  return browserPromise;
}

async function renderPdf(html) {
  const browser = await getBrowser();
  const page = await browser.newPage();
  try {
    await page.setViewport(invoicePdfViewport);
    await page.setContent(html, { waitUntil: 'load', timeout: 30000 });
    return await page.pdf(invoicePdfOptions);
  } finally {
    await page.close();
  }
}

const server = http.createServer(async (req, res) => {
  if (req.method === 'POST' && req.url === '/render') {
    const chunks = [];
    for await (const chunk of req) chunks.push(chunk);
    const html = Buffer.concat(chunks).toString('utf8');

    try {
      const pdf = await renderPdf(html);
      res.writeHead(200, { 'Content-Type': 'application/pdf' });
      res.end(pdf);
    } catch (err) {
      console.error('dev-pdf-server error:', err);
      res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end(String(err?.message || err));
    }
    return;
  }

  res.writeHead(404);
  res.end('Not found');
});

server.listen(PORT, HOST, () => {
  console.log(`dev-pdf-server listening on http://${HOST}:${PORT}/render`);
});
