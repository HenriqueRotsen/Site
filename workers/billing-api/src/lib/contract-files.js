export function contractPdfFilename(number) {
  const value = String(number || 'contrato')
    .trim()
    .replace(/\//g, '-')
    .replace(/[^\w.\-]+/g, '_');
  return `${value || 'contrato'}.pdf`;
}
