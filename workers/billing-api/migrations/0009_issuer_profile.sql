-- Cadastro editável da CONTRATADA (emissor CCMEI). Uma única linha (id = 1).
CREATE TABLE IF NOT EXISTS issuer_profile (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  name TEXT,
  legal_name TEXT,
  civil_name TEXT,
  cnpj TEXT,
  cpf TEXT,
  state_registration TEXT,
  address TEXT,
  email TEXT,
  site TEXT,
  city_uf TEXT,
  phone TEXT,
  bank TEXT,
  agency TEXT,
  account TEXT,
  pix_key TEXT,
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
