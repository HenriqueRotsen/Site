import { nowIso } from './crypto.js';

const EMPTY = '';

function pick(value, fallback) {
  const v = value == null ? '' : String(value).trim();
  return v || fallback || EMPTY;
}

function normalizeSite(site, fallback) {
  const value = pick(site, fallback);
  if (!value) return fallback || 'https://henriquerotsen.com.br';
  if (value.startsWith('http://') || value.startsWith('https://')) return value;
  return `https://${value}`;
}

/** Defaults a partir das vars do Worker (wrangler / secrets). */
export function issuerEnvDefaults(env = {}) {
  return {
    name: pick(env.ISSUER_NAME, 'Henrique Rotsen'),
    legalName: pick(env.ISSUER_LEGAL_NAME, '66.268.938 HENRIQUE ROTSEN SANTOS FERREIRA'),
    civilName: pick(env.ISSUER_CIVIL_NAME, 'HENRIQUE ROTSEN SANTOS FERREIRA'),
    cnpj: pick(env.ISSUER_CNPJ, '66.268.938/0001-03'),
    cpf: pick(env.ISSUER_CPF, '071.914.556-24'),
    stateRegistration: pick(env.ISSUER_STATE_REGISTRATION, 'MEI — dispensado / não informado'),
    address: pick(
      env.ISSUER_ADDRESS,
      'Rua Alessandra Salum Cadar, 731, Apt 102 - Buritis, Belo Horizonte - MG, 30575-190'
    ),
    email: pick(env.ISSUER_EMAIL, 'contato@henriquerotsen.com.br'),
    site: normalizeSite(env.ISSUER_SITE, 'https://henriquerotsen.com.br'),
    cityUf: pick(env.ISSUER_CITY_UF, 'Belo Horizonte / MG'),
    phone: pick(env.ISSUER_PHONE, '(31) 3234-0271'),
    bank: pick(env.ISSUER_BANK, ''),
    agency: pick(env.ISSUER_AGENCY, ''),
    account: pick(env.ISSUER_ACCOUNT, ''),
    pixKey: pick(env.ISSUER_PIX_KEY, ''),
  };
}

function rowToDto(row) {
  if (!row) return null;
  return {
    name: row.name || '',
    legalName: row.legal_name || '',
    civilName: row.civil_name || '',
    cnpj: row.cnpj || '',
    cpf: row.cpf || '',
    stateRegistration: row.state_registration || '',
    address: row.address || '',
    email: row.email || '',
    site: row.site || '',
    cityUf: row.city_uf || '',
    phone: row.phone || '',
    bank: row.bank || '',
    agency: row.agency || '',
    account: row.account || '',
    pixKey: row.pix_key || '',
    updatedAt: row.updated_at || null,
  };
}

export async function loadIssuerRow(db) {
  if (!db) return null;
  return db.prepare('SELECT * FROM issuer_profile WHERE id = 1').first();
}

/**
 * Perfil efetivo: cadastro em Clientes (D1) sobrescreve defaults do env.
 */
export async function resolveIssuer(env, db) {
  const base = issuerEnvDefaults(env);
  const row = await loadIssuerRow(db);
  if (!row) return { ...base, source: 'env' };

  return {
    name: pick(row.name, base.name),
    legalName: pick(row.legal_name, base.legalName),
    civilName: pick(row.civil_name, base.civilName),
    cnpj: pick(row.cnpj, base.cnpj),
    cpf: pick(row.cpf, base.cpf),
    stateRegistration: pick(row.state_registration, base.stateRegistration),
    address: pick(row.address, base.address),
    email: pick(row.email, base.email),
    site: normalizeSite(row.site, base.site),
    cityUf: pick(row.city_uf, base.cityUf),
    phone: pick(row.phone, base.phone),
    bank: pick(row.bank, base.bank),
    agency: pick(row.agency, base.agency),
    account: pick(row.account, base.account),
    pixKey: pick(row.pix_key, base.pixKey),
    updatedAt: row.updated_at || null,
    source: 'db',
  };
}

/** Shape usado em faturas (invoice-template). */
export function issuerForInvoice(profile) {
  return {
    name: profile.name,
    legalName: profile.legalName,
    email: profile.email,
    address: profile.address,
    phone: profile.phone,
    bank: profile.bank,
    agency: profile.agency,
    account: profile.account,
    cnpj: profile.cnpj,
    pixKey: profile.pixKey,
    site: profile.site,
  };
}

/**
 * Env-like com ISSUER_* preenchidos pelo perfil resolvido —
 * compatível com issuerDefaults / issuerFromEnv existentes.
 */
export function issuerAsEnv(profile, baseEnv = {}) {
  return {
    ...baseEnv,
    ISSUER_NAME: profile.name,
    ISSUER_LEGAL_NAME: profile.legalName,
    ISSUER_CIVIL_NAME: profile.civilName,
    ISSUER_CNPJ: profile.cnpj,
    ISSUER_CPF: profile.cpf,
    ISSUER_STATE_REGISTRATION: profile.stateRegistration,
    ISSUER_ADDRESS: profile.address,
    ISSUER_EMAIL: profile.email,
    ISSUER_SITE: profile.site,
    ISSUER_CITY_UF: profile.cityUf,
    ISSUER_PHONE: profile.phone,
    ISSUER_BANK: profile.bank,
    ISSUER_AGENCY: profile.agency,
    ISSUER_ACCOUNT: profile.account,
    ISSUER_PIX_KEY: profile.pixKey,
  };
}

export async function getIssuerDto(env, db) {
  const profile = await resolveIssuer(env, db);
  const { source, updatedAt, ...fields } = profile;
  return { issuer: fields, source, updatedAt: updatedAt || null };
}

export function normalizeIssuerBody(body = {}) {
  return {
    name: String(body.name || '').trim() || null,
    legalName: String(body.legalName || '').trim() || null,
    civilName: String(body.civilName || '').trim() || null,
    cnpj: String(body.cnpj || '').trim() || null,
    cpf: String(body.cpf || '').trim() || null,
    stateRegistration: String(body.stateRegistration || '').trim() || null,
    address: String(body.address || '').trim() || null,
    email: String(body.email || '').trim() || null,
    site: String(body.site || '').trim() || null,
    cityUf: String(body.cityUf || '').trim() || null,
    phone: String(body.phone || '').trim() || null,
    bank: String(body.bank || '').trim() || null,
    agency: String(body.agency || '').trim() || null,
    account: String(body.account || '').trim() || null,
    pixKey: String(body.pixKey || '').trim() || null,
  };
}

export async function upsertIssuerProfile(db, body) {
  const data = normalizeIssuerBody(body);
  const updatedAt = nowIso();
  await db
    .prepare(
      `INSERT INTO issuer_profile (
         id, name, legal_name, civil_name, cnpj, cpf, state_registration,
         address, email, site, city_uf, phone, bank, agency, account, pix_key, updated_at
       ) VALUES (1, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(id) DO UPDATE SET
         name = excluded.name,
         legal_name = excluded.legal_name,
         civil_name = excluded.civil_name,
         cnpj = excluded.cnpj,
         cpf = excluded.cpf,
         state_registration = excluded.state_registration,
         address = excluded.address,
         email = excluded.email,
         site = excluded.site,
         city_uf = excluded.city_uf,
         phone = excluded.phone,
         bank = excluded.bank,
         agency = excluded.agency,
         account = excluded.account,
         pix_key = excluded.pix_key,
         updated_at = excluded.updated_at`
    )
    .bind(
      data.name,
      data.legalName,
      data.civilName,
      data.cnpj,
      data.cpf,
      data.stateRegistration,
      data.address,
      data.email,
      data.site,
      data.cityUf,
      data.phone,
      data.bank,
      data.agency,
      data.account,
      data.pixKey,
      updatedAt
    )
    .run();

  const row = await loadIssuerRow(db);
  return rowToDto(row);
}
