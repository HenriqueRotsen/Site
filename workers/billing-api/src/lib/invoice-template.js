import { qrCodeDataUrl } from './invoice-qrcode.js';

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function formatBRL(cents) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format((cents || 0) / 100);
}

function formatDateBR(isoDate) {
  const [y, m, d] = isoDate.split('-');
  return `${d}/${m}/${y}`;
}

function formatQuantity(value) {
  const number = Number(value);
  if (Number.isInteger(number)) return String(number);
  return number.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
}

function displayInvoiceNumber(number) {
  const match = String(number).match(/(\d+)$/);
  if (!match) return String(number);
  return `#${parseInt(match[1], 10)}`;
}

function siteHref(site) {
  const value = String(site || 'henriquerotsen.com.br').trim();
  if (value.startsWith('http://') || value.startsWith('https://')) return value;
  return `https://${value}`;
}

function bytesToDataUrl(bytes, mimeType) {
  let binary = '';
  for (let i = 0; i < bytes.length; i += 1) {
    binary += String.fromCharCode(bytes[i]);
  }
  return `data:${mimeType};base64,${btoa(binary)}`;
}

async function getWordmarkDataUrl(wordmarkBytes) {
  const bytes = wordmarkBytes ?? (await import('./invoice-wordmark.js')).getInvoiceWordmarkBytes();
  return bytesToDataUrl(bytes, 'image/png');
}

async function getInvoiceCss(overrideCss) {
  if (overrideCss) return overrideCss;
  const mod = await import('../templates/invoice.css');
  return mod.default;
}

export function issuerFromEnv(env) {
  return {
    name: env.ISSUER_NAME || 'Henrique Rotsen',
    legalName: env.ISSUER_LEGAL_NAME || 'HENRIQUE ROTSEN SANTOS FERREIRA',
    email: env.ISSUER_EMAIL || 'contato@henriquerotsen.com.br',
    address:
      env.ISSUER_ADDRESS ||
      'Rua Alvarenga Peixoto, 1408 - Santo Agostinho, Belo Horizonte - MG, 30180-003',
    phone: env.ISSUER_PHONE || '',
    bank: env.ISSUER_BANK || '',
    agency: env.ISSUER_AGENCY || '',
    account: env.ISSUER_ACCOUNT || '',
    cnpj: env.ISSUER_CNPJ || '',
    pixKey: env.ISSUER_PIX_KEY || '',
    site: env.ISSUER_SITE || 'henriquerotsen.com.br',
  };
}

function renderItems(items) {
  return items
    .map((item) => {
      const lineTotal = Math.round(item.quantity * item.unit_price_cents);
      return `
        <tr>
          <td class="is-desc">${escapeHtml(item.description)}</td>
          <td class="is-num">${escapeHtml(formatBRL(item.unit_price_cents))}</td>
          <td class="is-num">${escapeHtml(formatQuantity(item.quantity))}</td>
          <td class="is-num"><strong>${escapeHtml(formatBRL(lineTotal))}</strong></td>
        </tr>
      `;
    })
    .join('');
}

function renderBankDetails(issuer) {
  const fields = [
    ['Banco', issuer.bank],
    ['Agência', issuer.agency],
    ['Conta', issuer.account],
    ['CNPJ', issuer.cnpj],
    ['Titular', issuer.legalName],
    ['Chave Pix', issuer.pixKey],
  ].filter(([, value]) => value);

  if (!fields.length) return '';

  return `
    <section class="invoice-bank">
      <h3 class="invoice-panel__title">Dados bancários</h3>
      <div class="invoice-bank__grid">
        ${fields
          .map(
            ([label, value]) => `
              <div>
                <span class="invoice-bank__item-label">${escapeHtml(label)}</span>
                <span class="invoice-bank__item-value ${label === 'Chave Pix' ? 'is-strong' : ''}">${escapeHtml(value)}</span>
              </div>
            `
          )
          .join('')}
      </div>
    </section>
  `;
}

function renderPixSection(paymentLink, qrDataUrl, dueDate) {
  if (paymentLink && qrDataUrl) {
    const pixCodeJson = JSON.stringify(paymentLink);
    return `
      <section class="invoice-panel">
        <h3 class="invoice-panel__title">Pagamento via Pix</h3>
        <div class="invoice-pix">
          <img class="invoice-pix__qr" src="${qrDataUrl}" alt="QR Code Pix" />
          <button type="button" class="invoice-pix__btn" onclick="copyPixCode()">Copiar código Pix</button>
          <p class="invoice-pix__hint">Ou copie o código abaixo</p>
          <pre class="invoice-pix__code" id="pix-code">${escapeHtml(paymentLink)}</pre>
        </div>
      </section>
      <script>
        function copyPixCode() {
          const text = ${pixCodeJson};
          const done = () => {
            const btn = document.querySelector('.invoice-pix__btn');
            if (btn) btn.textContent = 'Copiado!';
          };

          const textarea = document.createElement('textarea');
          textarea.value = text;
          textarea.setAttribute('readonly', '');
          textarea.style.position = 'fixed';
          textarea.style.top = '0';
          textarea.style.left = '0';
          textarea.style.width = '1px';
          textarea.style.height = '1px';
          textarea.style.opacity = '0';
          document.body.appendChild(textarea);
          textarea.focus();
          textarea.select();
          textarea.setSelectionRange(0, text.length);

          let copied = false;
          try {
            copied = document.execCommand('copy');
          } catch {
            copied = false;
          }
          document.body.removeChild(textarea);

          if (copied) {
            done();
            return;
          }

          if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(text).then(done).catch(() => {});
          }
        }
      </script>
    `;
  }

  return `
    <section class="invoice-panel">
      <h3 class="invoice-panel__title">Vencimento</h3>
      <p class="invoice-summary__due" style="margin:0;padding:0;border:0;">
        Data limite para pagamento
        <strong>${escapeHtml(formatDateBR(dueDate))}</strong>
      </p>
    </section>
  `;
}

export async function buildInvoiceHtml({
  issuer,
  clientName,
  clientCnpj,
  clientPhone,
  clientAddress,
  invoiceNumber,
  issueDate,
  dueDate,
  items,
  totalCents,
  paymentLink,
  notes,
  wordmarkBytes,
  templateCss,
}) {
  const invoiceCss = await getInvoiceCss(templateCss);
  const wordmarkDataUrl = await getWordmarkDataUrl(wordmarkBytes);
  const qrDataUrl = paymentLink ? qrCodeDataUrl(paymentLink, 120) : null;
  const addressText = clientAddress || issuer.address;
  const phoneText = clientPhone || issuer.phone;
  const noteText = notes?.trim() || 'Serviços prestados conforme itens acima.';

  return `<!DOCTYPE html>
<html lang="pt-BR">
  <head>
    <meta charset="UTF-8" />
    <title>Fatura ${escapeHtml(displayInvoiceNumber(invoiceNumber))}</title>
    <style>${invoiceCss}</style>
  </head>
  <body>
    <div class="invoice">
      <header class="invoice-header">
        <div class="invoice-header__brand">
          <img class="invoice-header__wordmark" src="${wordmarkDataUrl}" alt="Henrique Rotsen" />
        </div>
        <div class="invoice-header__doc">
          <p class="invoice-header__doc-label">Fatura</p>
          <p class="invoice-header__doc-number">${escapeHtml(displayInvoiceNumber(invoiceNumber))}</p>
          <p class="invoice-header__doc-meta">Emitida em ${escapeHtml(formatDateBR(issueDate))}</p>
          <p class="invoice-header__doc-meta">Vencimento ${escapeHtml(formatDateBR(dueDate))}</p>
        </div>
      </header>

      <main class="invoice-body">
        <div class="invoice-cards">
          <section class="invoice-card">
            <h2 class="invoice-card__label">Cliente</h2>
            <p class="invoice-card__title">${escapeHtml(clientName)}</p>
            ${clientCnpj ? `<p class="invoice-card__line">CNPJ ${escapeHtml(clientCnpj)}</p>` : ''}
            <p class="invoice-card__line">${escapeHtml(addressText)}</p>
            ${phoneText ? `<p class="invoice-card__line">${escapeHtml(phoneText)}</p>` : ''}
          </section>

          <section class="invoice-card invoice-summary">
            <h2 class="invoice-card__label">Resumo</h2>
            <p class="invoice-summary__total">${escapeHtml(formatBRL(totalCents))}</p>
            <p class="invoice-summary__due">
              Vencimento
              <strong>${escapeHtml(formatDateBR(dueDate))}</strong>
            </p>
          </section>
        </div>

        <div class="invoice-table-wrap">
          <table class="invoice-table">
            <colgroup>
              <col class="invoice-col-desc" />
              <col class="invoice-col-unit" />
              <col class="invoice-col-qty" />
              <col class="invoice-col-total" />
            </colgroup>
            <thead>
              <tr>
                <th>Descrição</th>
                <th class="is-num">Unitário</th>
                <th class="is-num">Qtd.</th>
                <th class="is-num">Total</th>
              </tr>
            </thead>
            <tbody>
              ${renderItems(items)}
            </tbody>
          </table>
        </div>

        <div class="invoice-bottom">
          <section class="invoice-panel">
            <h3 class="invoice-panel__title">Observações</h3>
            <p class="invoice-panel__text">${escapeHtml(noteText)}</p>
          </section>
          ${renderPixSection(paymentLink, qrDataUrl, dueDate)}
        </div>

        ${renderBankDetails(issuer)}
      </main>

      <footer class="invoice-footer">
        <a class="invoice-footer__link" href="${escapeHtml(siteHref(issuer.site))}">${escapeHtml(issuer.site || 'henriquerotsen.com.br')}</a>
        · ${escapeHtml(issuer.email)}
      </footer>
    </div>
  </body>
</html>`;
}
