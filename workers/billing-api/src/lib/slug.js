import { cnpjLast4 } from './cnpj.js';

export function slugify(text) {
  return String(text || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48);
}

export async function uniqueClientSlug(db, legalName, cnpj) {
  const base = slugify(legalName) || `cliente-${cnpjLast4(cnpj)}`;
  let slug = base;
  let suffix = 0;

  while (true) {
    const exists = await db.prepare('SELECT id FROM clients WHERE slug = ?').bind(slug).first();
    if (!exists) return slug;
    suffix += 1;
    slug = `${base}-${suffix}`;
  }
}
