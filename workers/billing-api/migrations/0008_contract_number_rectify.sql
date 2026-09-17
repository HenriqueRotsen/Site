-- Numeração N/AAAA + retificação (mesmo número, status retificado)
CREATE TABLE contracts_new (
  id TEXT PRIMARY KEY,
  client_id TEXT NOT NULL REFERENCES clients(id),
  template_id TEXT REFERENCES contract_templates(id),
  number TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'enviado' CHECK (status IN ('rascunho', 'enviado', 'retificado')),
  revision INTEGER NOT NULL DEFAULT 0,
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
  body_text TEXT,
  pdf_key TEXT,
  pdf_checksum TEXT,
  sent_at TEXT,
  rectified_at TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

INSERT INTO contracts_new (
  id, client_id, template_id, number, status, revision, send_email, contract_date, start_date,
  duration_months, payment_day, subscription_period, implementation_fee_cents, subscription_fee_cents,
  scope, client_legal_name, client_cnpj_formatted, client_address, variables_json, body_html,
  pdf_key, pdf_checksum, sent_at, created_at, updated_at
)
SELECT
  id, client_id, template_id, number, status, 0, send_email, contract_date, start_date,
  duration_months, payment_day, subscription_period, implementation_fee_cents, subscription_fee_cents,
  scope, client_legal_name, client_cnpj_formatted, client_address, variables_json, body_html,
  pdf_key, pdf_checksum, sent_at, created_at, updated_at
FROM contracts;

DROP TABLE contracts;
ALTER TABLE contracts_new RENAME TO contracts;

CREATE INDEX IF NOT EXISTS idx_contracts_client ON contracts(client_id);
CREATE INDEX IF NOT EXISTS idx_contracts_status ON contracts(status);
CREATE INDEX IF NOT EXISTS idx_contracts_created ON contracts(created_at);
CREATE INDEX IF NOT EXISTS idx_contracts_number ON contracts(number);
