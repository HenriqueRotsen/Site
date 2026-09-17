CREATE TABLE IF NOT EXISTS contracts (
  id TEXT PRIMARY KEY,
  client_id TEXT NOT NULL REFERENCES clients(id),
  number TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'enviado' CHECK (status IN ('rascunho', 'enviado')),
  send_email TEXT NOT NULL,
  contract_date TEXT NOT NULL,
  start_date TEXT,
  duration_months INTEGER,
  payment_day INTEGER,
  subscription_period TEXT,
  implementation_fee_cents INTEGER NOT NULL DEFAULT 0,
  subscription_fee_cents INTEGER NOT NULL DEFAULT 0,
  scope TEXT,
  client_legal_name TEXT,
  client_cnpj_formatted TEXT,
  client_address TEXT,
  variables_json TEXT,
  body_html TEXT NOT NULL,
  pdf_key TEXT,
  pdf_checksum TEXT,
  sent_at TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_contracts_client ON contracts(client_id);
CREATE INDEX IF NOT EXISTS idx_contracts_status ON contracts(status);
CREATE INDEX IF NOT EXISTS idx_contracts_created ON contracts(created_at);

CREATE TABLE IF NOT EXISTS contract_sequences (
  year INTEGER PRIMARY KEY,
  last_number INTEGER NOT NULL DEFAULT 0
);
