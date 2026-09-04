CREATE TABLE IF NOT EXISTS nfse_documents (
  id TEXT PRIMARY KEY,
  client_id TEXT NOT NULL REFERENCES clients(id),
  invoice_id TEXT REFERENCES invoices(id),
  access_key TEXT NOT NULL UNIQUE,
  number TEXT NOT NULL,
  competence_date TEXT NOT NULL,
  issued_at TEXT,
  dps_number TEXT,
  dps_series TEXT,
  taker_name TEXT,
  taker_cnpj_formatted TEXT,
  service_code TEXT,
  service_description TEXT,
  amount_cents INTEGER NOT NULL DEFAULT 0,
  municipality TEXT,
  pdf_key TEXT NOT NULL,
  pdf_checksum TEXT,
  original_filename TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_nfse_client ON nfse_documents(client_id);
CREATE INDEX IF NOT EXISTS idx_nfse_invoice ON nfse_documents(invoice_id);
CREATE INDEX IF NOT EXISTS idx_nfse_competence ON nfse_documents(competence_date);
CREATE INDEX IF NOT EXISTS idx_nfse_number ON nfse_documents(number);
