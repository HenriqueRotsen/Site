import { writeFileSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import puppeteer from 'puppeteer';
import { buildInvoiceHtml, issuerFromEnv } from '../src/lib/invoice-template.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const wordmarkBytes = readFileSync(join(__dirname, '../assets/wordmark-branca.png'));
const templateCss = readFileSync(join(__dirname, '../src/templates/invoice.css'), 'utf8');

const issuer = issuerFromEnv({
  ISSUER_NAME: 'Henrique Rotsen',
  ISSUER_LEGAL_NAME: '66.268.938 HENRIQUE ROTSEN SANTOS FERREIRA',
  ISSUER_EMAIL: 'contato@henriquerotsen.com.br',
  ISSUER_ADDRESS: 'Rua Alvarenga Peixoto, 1408 - Santo Agostinho, Belo Horizonte - MG, 30180-003',
  ISSUER_PHONE: '(31) 3234-0271',
  ISSUER_BANK: '336 - Banco C6 S.A.',
  ISSUER_AGENCY: '0001',
  ISSUER_ACCOUNT: '42115929-4',
  ISSUER_CNPJ: '66.268.938/0001-03',
  ISSUER_PIX_KEY: '66.268.938/0001-03',
  ISSUER_SITE: 'henriquerotsen.com.br',
});

const html = await buildInvoiceHtml({
  issuer,
  clientName: 'VIVAS CULTURA E ESPORTE LTDA',
  clientCnpj: '66.268.938/0001-03',
  clientPhone: null,
  invoiceNumber: 'INV-2026-0003',
  issueDate: '2026-09-01',
  dueDate: '2026-09-15',
  items: [
    {
      description: 'Criação e Gestão de Formulários',
      quantity: 7,
      unit_price_cents: 10000,
    },
  ],
  totalCents: 70000,
  paymentLink: 'https://henriquerotsen.com.br/pix/exemplo',
  wordmarkBytes,
  templateCss,
  notes: `Segue aqui o nome de cada formulário e a pasta em que ele pode ser visualizado caso tenha acesso.

1. Projeta - FORMULÁRIO DE INSCRIÇÃO VÁRIOS PROJETA CULTURA 2026
2. Projeta - FORMULÁRIO DE INSCRIÇÃO VÁRIOS.2 PROJETA CULTURA 2026
3. Projeta - Formulário de Avaliação - Oficina de elaboração de projetos
4. Projeta - Formulário de Avaliação - Oficina de IA
5. Movimenta Cultura - FORMULÁRIO DE INSCRIÇÃO Parauapebas MOVIMENTA CULTURA
6. Movimenta Cultura - FORMULÁRIO DE INSCRIÇÃO PINDARÉ MIRIM MOVIMENTA CULTURA
7. Movimenta Cultura - Formulário de Avaliação - Marabá`,
});

const browser = await puppeteer.launch({
  headless: true,
  executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || '/usr/bin/google-chrome',
  args: ['--no-sandbox', '--disable-setuid-sandbox'],
});
try {
  const page = await browser.newPage();
  await page.setContent(html, { waitUntil: 'networkidle0' });
  await page.evaluate(() => document.fonts.ready);
  const bytes = await page.pdf({
    format: 'A4',
    printBackground: true,
    margin: { top: '0', right: '0', bottom: '0', left: '0' },
  });
  writeFileSync('/tmp/fatura-preview.pdf', bytes);
  console.log('Gerado: /tmp/fatura-preview.pdf');
} finally {
  await browser.close();
}
