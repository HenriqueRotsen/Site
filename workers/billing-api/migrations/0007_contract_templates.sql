CREATE TABLE IF NOT EXISTS contract_templates (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  body_template TEXT NOT NULL,
  variables_json TEXT NOT NULL DEFAULT '[]',
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_contract_templates_active ON contract_templates(is_active);
CREATE INDEX IF NOT EXISTS idx_contract_templates_name ON contract_templates(name);

ALTER TABLE contracts ADD COLUMN template_id TEXT REFERENCES contract_templates(id);
