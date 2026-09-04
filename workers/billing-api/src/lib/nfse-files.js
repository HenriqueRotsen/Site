export function nfsePdfFilename({ number, competenceDate } = {}) {
  const num = String(number || 'sem-numero').replace(/[^\w.-]+/g, '-');
  const date = String(competenceDate || '')
    .slice(0, 10)
    .replace(/-/g, '');
  if (date) return `NFS-e-${num}-${date}.pdf`;
  return `NFS-e-${num}.pdf`;
}
