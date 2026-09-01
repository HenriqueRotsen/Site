export function invoicePdfFilename(number) {
  const value = String(number || '').trim();
  if (!value || value === 'PRÉVIA') return 'NF-previa.pdf';
  if (value.startsWith('NF-')) return `${value}.pdf`;
  if (value.startsWith('INV-')) return `${value.replace(/^INV-/, 'NF-')}.pdf`;
  return `NF-${value}.pdf`;
}
