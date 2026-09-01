ALTER TABLE clients ADD COLUMN slug TEXT;
ALTER TABLE clients ADD COLUMN cnpj_formatted TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS idx_clients_slug ON clients(slug);

UPDATE clients
SET slug = 'cliente-' || substr(replace(id, '-', ''), 1, 12)
WHERE slug IS NULL;
