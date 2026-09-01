import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';

const BRAND = rgb(25 / 255, 25 / 255, 25 / 255);
const MUTED = rgb(0.45, 0.45, 0.45);
const WHITE = rgb(1, 1, 1);

function formatBRL(cents) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(cents / 100);
}

function formatDateBR(isoDate) {
  const [y, m, d] = isoDate.split('-');
  return `${d}/${m}/${y}`;
}

export async function generateInvoicePdf({
  issuerName,
  issuerEmail,
  clientName,
  clientCnpjMasked,
  invoiceNumber,
  issueDate,
  dueDate,
  items,
  totalCents,
  paymentLink,
  notes,
}) {
  const pdf = await PDFDocument.create();
  const page = pdf.addPage([595.28, 841.89]); // A4
  const { width, height } = page.getSize();
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdf.embedFont(StandardFonts.HelveticaBold);

  let y = height - 48;

  // Header bar
  page.drawRectangle({ x: 0, y: height - 80, width, height: 80, color: BRAND });
  page.drawText('FATURA', { x: 48, y: height - 52, size: 11, font: fontBold, color: WHITE });
  page.drawText(invoiceNumber, { x: 48, y: height - 68, size: 18, font: fontBold, color: WHITE });
  page.drawText(issuerName, { x: width - 220, y: height - 52, size: 10, font, color: WHITE });
  page.drawText(issuerEmail, { x: width - 220, y: height - 66, size: 9, font, color: rgb(0.8, 0.8, 0.8) });

  y = height - 120;
  page.drawText('Cliente', { x: 48, y, size: 9, font: fontBold, color: MUTED });
  y -= 16;
  page.drawText(clientName, { x: 48, y, size: 12, font: fontBold, color: BRAND });
  y -= 14;
  page.drawText(`CNPJ: ${clientCnpjMasked}`, { x: 48, y, size: 10, font, color: BRAND });

  y -= 28;
  page.drawText(`Emissão: ${formatDateBR(issueDate)}`, { x: 48, y, size: 10, font, color: BRAND });
  page.drawText(`Vencimento: ${formatDateBR(dueDate)}`, { x: 200, y, size: 10, font: fontBold, color: BRAND });

  y -= 36;
  page.drawLine({ start: { x: 48, y }, end: { x: width - 48, y }, thickness: 1, color: rgb(0.85, 0.85, 0.85) });
  y -= 20;

  // Table header
  page.drawText('Descrição', { x: 48, y, size: 9, font: fontBold, color: MUTED });
  page.drawText('Qtd', { x: 340, y, size: 9, font: fontBold, color: MUTED });
  page.drawText('Valor unit.', { x: 390, y, size: 9, font: fontBold, color: MUTED });
  page.drawText('Total', { x: width - 100, y, size: 9, font: fontBold, color: MUTED });
  y -= 8;
  page.drawLine({ start: { x: 48, y }, end: { x: width - 48, y }, thickness: 0.5, color: rgb(0.9, 0.9, 0.9) });
  y -= 18;

  for (const item of items) {
    const lineTotal = Math.round(item.quantity * item.unit_price_cents);
    const desc = item.description.length > 50 ? `${item.description.slice(0, 47)}...` : item.description;
    page.drawText(desc, { x: 48, y, size: 10, font, color: BRAND });
    page.drawText(String(item.quantity), { x: 345, y, size: 10, font, color: BRAND });
    page.drawText(formatBRL(item.unit_price_cents), { x: 390, y, size: 10, font, color: BRAND });
    page.drawText(formatBRL(lineTotal), { x: width - 100, y, size: 10, font, color: BRAND });
    y -= 20;
    if (y < 200) break;
  }

  y -= 12;
  page.drawLine({ start: { x: 48, y }, end: { x: width - 48, y }, thickness: 1, color: BRAND });
  y -= 24;
  page.drawText('TOTAL', { x: width - 180, y, size: 11, font: fontBold, color: MUTED });
  page.drawText(formatBRL(totalCents), { x: width - 100, y, size: 14, font: fontBold, color: BRAND });

  if (paymentLink) {
    y -= 40;
    page.drawText('Pagamento via PIX', { x: 48, y, size: 10, font: fontBold, color: BRAND });
    y -= 14;
    const linkLines = paymentLink.match(/.{1,70}/g) || [paymentLink];
    for (const line of linkLines.slice(0, 3)) {
      page.drawText(line, { x: 48, y, size: 8, font, color: MUTED });
      y -= 11;
    }
  }

  if (notes) {
    y -= 16;
    page.drawText('Observações', { x: 48, y, size: 9, font: fontBold, color: MUTED });
    y -= 14;
    const noteLines = notes.match(/.{1,80}/g) || [notes];
    for (const line of noteLines.slice(0, 4)) {
      page.drawText(line, { x: 48, y, size: 9, font, color: BRAND });
      y -= 12;
    }
  }

  page.drawText('Documento gerado automaticamente.', {
    x: 48,
    y: 40,
    size: 8,
    font,
    color: MUTED,
  });

  const bytes = await pdf.save({ useObjectStreams: true });
  return bytes;
}

export async function sha256Bytes(data) {
  const hash = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hash), (b) => b.toString(16).padStart(2, '0')).join('');
}
