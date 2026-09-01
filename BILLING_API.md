# Billing API (Cloudflare Worker + D1 + R2 + Resend)

Área restrita: gestão de clientes, faturas, PDFs e portal do cliente.

## Arquitetura

- **Frontend:** React em GitHub Pages (`/#/area-restrita`)
- **API:** Worker `billing-api-henrique`
- **Banco:** Cloudflare D1 (`billing-henrique`)
- **PDFs:** Cloudflare R2 (`billing-pdfs-henrique`)
- **E-mail:** Resend (OTP, faturas, lembretes)

## Pré-requisitos

1. Conta Cloudflare do domínio `henriquerotsen.com.br`
2. Resend com domínio verificado
3. Node.js 20+

## Setup inicial (Cloudflare)

### 1. Criar D1

```bash
cd workers/billing-api
npm install
npx wrangler d1 create billing-henrique
```

Copie o `database_id` retornado para `wrangler.toml` (substitua o placeholder).

### 2. Aplicar migrations

```bash
npx wrangler d1 migrations apply billing-henrique --local   # dev
npx wrangler d1 migrations apply billing-henrique --remote  # produção
```

### 3. Criar bucket R2

No dashboard Cloudflare → R2 → Create bucket → `billing-pdfs-henrique`  
(O nome deve coincidir com `wrangler.toml`.)

### 4. Secrets e variáveis

```bash
npx wrangler secret put RESEND_API_KEY
npx wrangler secret put SESSION_SECRET      # string aleatória longa (32+ chars)
npx wrangler secret put CNPJ_HMAC_SECRET    # string aleatória longa (32+ chars)
```

Bootstrap do admin (primeiro login — use uma vez e remova depois):

```bash
npx wrangler secret put ADMIN_PASSWORD
```

E em `wrangler.toml` [vars] ou via dashboard:

```
ADMIN_EMAIL = "seu@email.com"
```

No primeiro login com esse e-mail/senha, o admin é criado automaticamente.

### 5. Deploy

```bash
npx wrangler deploy
```

### 6. Custom domain

Workers → `billing-api-henrique` → Settings → Domains → adicionar:

`billing-api.henriquerotsen.com.br`

### 7. Cron (lembretes)

O cron está em `wrangler.toml` (`0 12 * * *` = 09:00 BRT). Marca faturas atrasadas e envia lembrete semanal.

## Desenvolvimento local

Terminal 1 — API:

```bash
cd workers/billing-api
npx wrangler dev --port 8788
```

Terminal 2 — React:

```bash
cp .env.example .env.local
npm start
```

Acesse: `http://localhost:3000/#/area-restrita`

## Rotas da API

| Método | Rota | Descrição |
|--------|------|-----------|
| POST | `/auth/admin/login` | Login admin |
| POST | `/auth/client/request-code` | OTP por CNPJ |
| POST | `/auth/client/verify-code` | Verificar OTP (sessão 8h) |
| GET | `/admin/dashboard` | Insights |
| GET/POST | `/admin/clients` | CRUD clientes |
| GET/POST | `/admin/invoices` | Faturas |
| POST | `/admin/invoices/:id/emit` | Gerar PDF + enviar e-mail |
| GET | `/client/invoices` | Portal do cliente |

## Fluxo de fatura

1. Cadastre o cliente (CNPJ + e-mail)
2. Crie fatura em rascunho (itens + link PIX do banco)
3. Clique **Emitir** → gera PDF, salva no R2, envia e-mail
4. Cliente acessa portal com CNPJ + código

## Segurança

- CNPJ armazenado como HMAC hash (nunca em texto puro)
- Senhas admin com PBKDF2 (210k iterações)
- Sessões em cookie HttpOnly + Secure + SameSite=Strict
- Rate limit em OTP
- Audit log de ações críticas
- PDFs privados no R2 (sem acesso público)

## Frontend

Variável de produção no GitHub Actions:

`REACT_APP_BILLING_API_URL=https://billing-api.henriquerotsen.com.br`

## Troubleshooting

| Problema | Solução |
|----------|---------|
| 401 no portal | Cookie bloqueado — use HTTPS e domínio customizado |
| OTP não chega | Verifique Resend + e-mail do cliente cadastrado |
| PDF vazio | Re-emita a fatura |
| Admin não existe | Configure ADMIN_EMAIL + ADMIN_PASSWORD e faça login |
