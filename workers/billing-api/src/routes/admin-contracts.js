import { json, readJson, corsHeaders } from '../lib/http.js';
import { uuid, nowIso } from '../lib/crypto.js';
import { requireAdmin } from '../lib/session.js';
import { audit } from '../lib/audit.js';
import { sha256Bytes } from '../lib/pdf.js';
import { renderPdfFromHtml } from '../lib/pdf-render.js';
import { sendEmail, contractEmailHtml, formatBRL, ownerCopyEmails, mergeCcEmails } from '../lib/email.js';
import { parsePagination, paginationMeta } from '../lib/pagination.js';
import { contractPdfFilename } from '../lib/contract-files.js';
import {
  CONTRACT_VARIABLES,
  defaultContractBodyTemplate,
  mergeContractBody,
  buildContractDocumentHtml,
  buildContractVariables,
  plainTextToContractHtml,
  fillTemplate,
  isSystemPartyVariable,
} from '../lib/contract-template.js';
import { resolveIssuer, issuerAsEnv } from '../lib/issuer.js';

const CONTRACT_CONTACT_EMAIL = 'contato@henriquerotsen.com.br';
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

async function contractIssuerEnv(env) {
  return issuerAsEnv(await resolveIssuer(env, env.DB), env);
}

function bytesToBase64(bytes) {
  const arr = new Uint8Array(bytes);
  let binary = '';
  const chunk = 0x8000;
  for (let i = 0; i < arr.length; i += chunk) {
    binary += String.fromCharCode(...arr.subarray(i, i + chunk));
  }
  return btoa(binary);
}

function parseEmailList(raw) {
  if (Array.isArray(raw)) {
    return [...new Set(raw.map((e) => String(e || '').trim().toLowerCase()).filter((e) => EMAIL_RE.test(e)))];
  }
  return [
    ...new Set(
      String(raw || '')
        .split(/[,;\n]+/)
        .map((e) => e.trim().toLowerCase())
        .filter((e) => EMAIL_RE.test(e))
    ),
  ];
}

function contractFromAddress(env) {
  return (
    env.CONTRACT_FROM_EMAIL ||
    `Henrique Rotsen <${CONTRACT_CONTACT_EMAIL}>`
  );
}

function serializeCcEmails(list) {
  return list?.length ? list.join(', ') : null;
}

async function dispatchContractEmail(env, {
  to,
  cc = [],
  clientName,
  contractNumber,
  filename,
  pdfBytes,
  isRectified = false,
}) {
  if (!env.RESEND_API_KEY) {
    throw new Error('Serviço de e-mail não configurado.');
  }
  const html = contractEmailHtml({
    clientName,
    contractNumber,
    siteUrl: env.SITE_URL,
    pdfFilename: filename,
    isRectified,
    portalUrl: `${String(env.SITE_URL || 'https://henriquerotsen.com.br').replace(/\/$/, '')}/#/area-restrita/cliente`,
  });
  const toNorm = String(to || '').trim().toLowerCase();
  const ccList = mergeCcEmails(toNorm, cc, ownerCopyEmails(env));
  await sendEmail(env.RESEND_API_KEY, {
    from: contractFromAddress(env),
    to: toNorm,
    cc: ccList.length ? ccList : undefined,
    replyTo: CONTRACT_CONTACT_EMAIL,
    subject: isRectified
      ? `Contrato ${contractNumber} (retificado) — Henrique Rotsen`
      : `Proposta / Contrato ${contractNumber} — Henrique Rotsen`,
    html,
    attachments: [{ filename, content: bytesToBase64(pdfBytes) }],
  });
  return ccList;
}

function applyClientAsContratante(input, client) {
  if (!client) return input;
  const addressParts = [
    client.address_street,
    client.address_number,
    client.address_complement,
    client.address_neighborhood,
    client.address_city && client.address_state
      ? `${client.address_city} - ${client.address_state}`
      : client.address_city,
    client.address_zip,
  ].filter(Boolean);
  const clientAddress = addressParts.join(', ') || input.clientAddress || 'endereço a informar';
  input.clientLegalName = client.legal_name;
  input.clientCnpj = client.cnpj_formatted || input.clientCnpj || '';
  input.clientAddress = clientAddress;
  input.variables = {
    ...(input.variables || {}),
    clientLegalName: client.legal_name,
    clientTradeName: input.variables?.clientTradeName || client.contact_name || '',
    clientCnpj: client.cnpj_formatted || '',
    clientAddress,
    clientZip: client.address_zip || '',
    clientCityUf:
      client.address_city && client.address_state
        ? `${client.address_city} / ${client.address_state}`
        : client.address_city || '',
    clientEmail: input.sendEmail || client.billing_email || '',
    clientPhone: client.contact_phone || '',
    clientRepresentativeName: input.variables?.clientRepresentativeName || '',
  };
  return input;
}

async function loadClientRow(db, clientId) {
  if (!clientId) return null;
  return db
    .prepare(
      `SELECT id, legal_name, cnpj_formatted, billing_email, contact_name, contact_phone,
              address_street, address_number, address_complement, address_neighborhood,
              address_city, address_state, address_zip
       FROM clients WHERE id = ?`
    )
    .bind(clientId)
    .first();
}

function htmlResponse(html, origin) {
  return new Response(html, {
    status: 200,
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      ...corsHeaders(origin),
    },
  });
}

function pdfResponse(bytes, filename, origin, inline = false) {
  const disposition = inline ? 'inline' : 'attachment';
  return new Response(bytes, {
    status: 200,
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `${disposition}; filename="${filename}"`,
      ...corsHeaders(origin),
    },
  });
}

async function nextContractNumber(db) {
  const year = new Date().getFullYear();
  const row = await db.prepare('SELECT last_number FROM contract_sequences WHERE year = ?').bind(year).first();
  const next = (row?.last_number || 0) + 1;
  if (row) {
    await db.prepare('UPDATE contract_sequences SET last_number = ? WHERE year = ?').bind(next, year).run();
  } else {
    await db.prepare('INSERT INTO contract_sequences (year, last_number) VALUES (?, ?)').bind(year, next).run();
  }
  return `${next}/${year}`;
}

async function peekNextContractNumber(db) {
  const year = new Date().getFullYear();
  const row = await db.prepare('SELECT last_number FROM contract_sequences WHERE year = ?').bind(year).first();
  const next = (row?.last_number || 0) + 1;
  return `${next}/${year}`;
}

function reaisToCents(value) {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return Math.round(value * (value >= 1000 ? 1 : 100));
  }
  const raw = String(value || '').trim();
  if (!raw) return 0;
  if (/^\d+$/.test(raw) && !raw.includes(',')) return parseInt(raw, 10) * 100;
  const normalized = raw.replace(/[R$\s]/gi, '').replace(/\./g, '').replace(',', '.');
  const amount = parseFloat(normalized);
  return Number.isFinite(amount) ? Math.round(amount * 100) : 0;
}

function parseContractInput(body = {}) {
  const variables = body.variables && typeof body.variables === 'object' ? body.variables : {};
  const merged = { ...variables, ...body };
  return {
    templateId: String(body.templateId || '').trim(),
    clientId: String(body.clientId || '').trim(),
    sendEmail: String(body.sendEmail || merged.sendEmail || '').trim().toLowerCase(),
    ccEmails: parseEmailList(body.ccEmails ?? body.cc ?? merged.ccEmails),
    contractDate: String(merged.contractDate || '').trim(),
    startDate: String(merged.startDate || merged.contractDate || '').trim(),
    durationMonths: parseInt(merged.durationMonths, 10) || 12,
    paymentDay: parseInt(merged.paymentDay, 10) || 10,
    subscriptionPeriod: String(merged.subscriptionPeriod || 'mensal').trim(),
    implementationFeeCents:
      merged.implementationFeeCents != null
        ? Math.round(Number(merged.implementationFeeCents))
        : reaisToCents(merged.implementationFee),
    subscriptionFeeCents:
      merged.subscriptionFeeCents != null
        ? Math.round(Number(merged.subscriptionFeeCents))
        : reaisToCents(merged.subscriptionFee),
    firstMonthTotalCents:
      merged.firstMonthTotalCents != null
        ? Math.round(Number(merged.firstMonthTotalCents))
        : reaisToCents(merged.firstMonthTotal),
    newDemandFeeCents:
      merged.newDemandFeeCents != null
        ? Math.round(Number(merged.newDemandFeeCents))
        : reaisToCents(merged.newDemandFee),
    scope: String(merged.scope || '').trim(),
    clientLegalName: String(merged.clientLegalName || '').trim(),
    clientCnpj: String(merged.clientCnpj || '').trim(),
    clientAddress: String(merged.clientAddress || '').trim(),
    city: String(merged.city || 'Belo Horizonte / MG').trim(),
    bodyText: body.bodyText != null ? String(body.bodyText) : null,
    bodyHtml: body.bodyHtml != null ? String(body.bodyHtml) : null,
    variables: merged,
    send: body.send !== false,
  };
}

function contractDto(row) {
  let variables = {};
  try {
    variables = row.variables_json ? JSON.parse(row.variables_json) : {};
  } catch {
    variables = {};
  }
  return {
    id: row.id,
    clientId: row.client_id,
    clientName: row.client_name || row.client_legal_name,
    templateId: row.template_id || null,
    number: row.number,
    status: row.status,
    revision: row.revision || 0,
    isRectified: row.status === 'retificado' || (row.revision || 0) > 0,
    sendEmail: row.send_email,
    ccEmails: row.cc_emails || '',
    contractDate: row.contract_date,
    startDate: row.start_date,
    durationMonths: row.duration_months,
    paymentDay: row.payment_day,
    subscriptionPeriod: row.subscription_period,
    implementationFeeCents: row.implementation_fee_cents,
    subscriptionFeeCents: row.subscription_fee_cents,
    scope: row.scope,
    clientLegalName: row.client_legal_name,
    clientCnpjFormatted: row.client_cnpj_formatted,
    clientAddress: row.client_address,
    bodyHtml: row.body_html,
    bodyText: row.body_text || null,
    variables,
    hasPdf: Boolean(row.pdf_key),
    sentAt: row.sent_at,
    rectifiedAt: row.rectified_at || null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

async function loadContract(db, id) {
  return db
    .prepare(
      `SELECT c.*, cl.legal_name as client_name
       FROM contracts c
       JOIN clients cl ON cl.id = c.client_id
       WHERE c.id = ?`
    )
    .bind(id)
    .first();
}

function resolveBody(input, env, templateBody = null) {
  const vars = buildContractVariables(input.variables || input, env);
  if (input.bodyHtml && String(input.bodyHtml).includes('<')) {
    return { bodyHtml: input.bodyHtml, vars };
  }
  if (input.bodyText) {
    const filled = fillTemplate(input.bodyText, vars);
    return {
      bodyHtml: plainTextToContractHtml(filled),
      vars,
      bodyText: filled,
    };
  }
  const template = templateBody || defaultContractBodyTemplate(env);
  const merged = mergeContractBody(template, input.variables || input, env);
  return { bodyHtml: merged.bodyHtml, vars: merged.vars, bodyText: merged.bodyText };
}

export async function handleAdminContracts(request, env, origin, path) {
  if (!path.startsWith('/admin/contracts')) return null;

  const session = await requireAdmin(env.DB, request);
  if (!session) return json({ error: 'Não autenticado.' }, 401, origin);
  const ip = request.headers.get('CF-Connecting-IP') || '';

  if (path === '/admin/contracts/template' && request.method === 'GET') {
    const issuerEnv = await contractIssuerEnv(env);
    return json(
      {
        variables: CONTRACT_VARIABLES.filter((v) => !isSystemPartyVariable(v.key)),
        bodyTemplate: defaultContractBodyTemplate(issuerEnv),
        note: 'A Cláusula 1ª (partes) é gerada pelo sistema: CONTRATADA = cadastro em Clientes; CONTRATANTE = cliente selecionado.',
      },
      200,
      origin
    );
  }

  if (path === '/admin/contracts/preview' && request.method === 'POST') {
    const body = await readJson(request);
    const input = parseContractInput(body);
    if (input.clientId) {
      const client = await loadClientRow(env.DB, input.clientId);
      if (client) applyClientAsContratante(input, client);
    }
    let templateBody = null;
    if (input.templateId) {
      const tpl = await env.DB.prepare(
        'SELECT body_template FROM contract_templates WHERE id = ?'
      )
        .bind(input.templateId)
        .first();
      templateBody = tpl?.body_template || null;
    }
    const issuerEnv = await contractIssuerEnv(env);
    const resolved = resolveBody(input, issuerEnv, templateBody);
    const previewNumber =
      String(body?.number || '').trim() || (await peekNextContractNumber(env.DB));
    const html = await buildContractDocumentHtml({
      bodyHtml: resolved.bodyHtml,
      number: previewNumber,
      env: issuerEnv,
      vars: resolved.vars,
      isRectified: Boolean(body?.isRectified),
    });

    const wantPdf = body?.format === 'pdf' || new URL(request.url).searchParams.get('format') === 'pdf';
    if (wantPdf) {
      const pdfBytes = await renderPdfFromHtml(env, html);
      return pdfResponse(pdfBytes, 'contrato-previa.pdf', origin, true);
    }
    return htmlResponse(html, origin);
  }

  if (path === '/admin/contracts' && request.method === 'GET') {
    const url = new URL(request.url);
    const { page, limit, offset } = parsePagination(url);
    const countRow = await env.DB.prepare('SELECT COUNT(*) as total FROM contracts').first();
    const { results } = await env.DB.prepare(
      `SELECT c.*, cl.legal_name as client_name
       FROM contracts c
       JOIN clients cl ON cl.id = c.client_id
       ORDER BY c.created_at DESC
       LIMIT ? OFFSET ?`
    )
      .bind(limit, offset)
      .all();

    return json(
      {
        contracts: results.map(contractDto),
        pagination: paginationMeta(page, limit, countRow.total),
      },
      200,
      origin
    );
  }

  if (path === '/admin/contracts' && request.method === 'POST') {
    const body = await readJson(request);
    const input = parseContractInput(body);

    if (!input.clientId) return json({ error: 'Cliente é obrigatório.' }, 400, origin);
    if (!input.sendEmail || !EMAIL_RE.test(input.sendEmail)) {
      return json({ error: 'E-mail do destinatário inválido.' }, 400, origin);
    }
    if (!input.contractDate) {
      return json({ error: 'Informe a data do contrato.' }, 400, origin);
    }
    if (!input.bodyText && !input.bodyHtml && !input.templateId) {
      return json({ error: 'Selecione um modelo ou informe o texto do contrato.' }, 400, origin);
    }

    let templateBody = null;
    if (input.templateId) {
      const tpl = await env.DB.prepare(
        'SELECT id, body_template FROM contract_templates WHERE id = ? AND is_active = 1'
      )
        .bind(input.templateId)
        .first();
      if (!tpl) return json({ error: 'Modelo de contrato não encontrado.' }, 404, origin);
      templateBody = tpl.body_template;
    }

    const client = await loadClientRow(env.DB, input.clientId);
    if (!client) return json({ error: 'Cliente não encontrado.' }, 404, origin);
    applyClientAsContratante(input, client);
    if (!input.scope) {
      input.scope = String(input.variables?.scope || 'Contrato de prestação de serviços').trim();
    }
    if (!input.startDate) input.startDate = input.contractDate;

    const issuerEnv = await contractIssuerEnv(env);
    const resolved = resolveBody(input, issuerEnv, templateBody);
    const number = await nextContractNumber(env.DB);
    const documentHtml = await buildContractDocumentHtml({
      bodyHtml: resolved.bodyHtml,
      number,
      env: issuerEnv,
      vars: resolved.vars,
      isRectified: false,
    });
    const pdfBytes = await renderPdfFromHtml(env, documentHtml);
    const checksum = await sha256Bytes(pdfBytes);
    const filename = contractPdfFilename(number);
    const pdfKey = `contracts/${client.id}/${filename}`;
    const id = uuid();
    const now = nowIso();

    await env.PDFS.put(pdfKey, pdfBytes, {
      httpMetadata: { contentType: 'application/pdf' },
      customMetadata: { checksum, contractId: id },
    });

    await env.DB.prepare(
      `INSERT INTO contracts (
         id, client_id, template_id, number, status, revision, send_email, cc_emails, contract_date, start_date, duration_months,
         payment_day, subscription_period, implementation_fee_cents, subscription_fee_cents,
         scope, client_legal_name, client_cnpj_formatted, client_address, variables_json,
         body_html, body_text, pdf_key, pdf_checksum, sent_at, created_at, updated_at
       ) VALUES (?, ?, ?, ?, ?, 0, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
      .bind(
        id,
        client.id,
        input.templateId || null,
        number,
        'enviado',
        input.sendEmail,
        serializeCcEmails(input.ccEmails),
        input.contractDate,
        input.startDate,
        input.durationMonths,
        input.paymentDay,
        input.subscriptionPeriod,
        input.implementationFeeCents,
        input.subscriptionFeeCents,
        input.scope,
        input.clientLegalName,
        input.clientCnpj,
        input.clientAddress,
        JSON.stringify(resolved.vars),
        resolved.bodyHtml,
        resolved.bodyText || input.bodyText || null,
        pdfKey,
        checksum,
        now,
        now,
        now
      )
      .run();

    if (input.send) {
      try {
        await dispatchContractEmail(env, {
          to: input.sendEmail,
          cc: input.ccEmails,
          clientName: input.clientLegalName || client.legal_name,
          contractNumber: number,
          filename,
          pdfBytes,
          isRectified: false,
        });
      } catch (err) {
        return json({ error: err.message || 'Falha ao enviar e-mail.' }, 500, origin);
      }
    }

    await audit(env.DB, {
      actorRole: 'admin',
      actorId: session.admin_id,
      action: 'contract_created',
      resourceType: 'contract',
      resourceId: id,
      ip,
      metadata: { number, sendEmail: input.sendEmail, ccEmails: input.ccEmails },
    });

    const row = await loadContract(env.DB, id);
    return json({ contract: contractDto(row) }, 201, origin);
  }

  const getMatch = path.match(/^\/admin\/contracts\/([^/]+)$/);
  if (getMatch && request.method === 'GET') {
    const row = await loadContract(env.DB, getMatch[1]);
    if (!row) return json({ error: 'Contrato não encontrado.' }, 404, origin);
    return json({ contract: contractDto(row) }, 200, origin);
  }

  const rectifyMatch = path.match(/^\/admin\/contracts\/([^/]+)\/rectify$/);
  if (rectifyMatch && request.method === 'POST') {
    const id = rectifyMatch[1];
    const existing = await loadContract(env.DB, id);
    if (!existing) return json({ error: 'Contrato não encontrado.' }, 404, origin);

    const body = await readJson(request);
    const input = parseContractInput({
      ...body,
      clientId: body.clientId || existing.client_id,
      templateId: body.templateId || existing.template_id,
    });

    if (!input.sendEmail || !EMAIL_RE.test(input.sendEmail)) {
      return json({ error: 'E-mail do destinatário inválido.' }, 400, origin);
    }
    if (!input.contractDate) {
      return json({ error: 'Informe a data do contrato.' }, 400, origin);
    }
    if (!input.bodyText && !input.bodyHtml && !input.templateId) {
      return json({ error: 'Informe o texto do contrato ou um modelo.' }, 400, origin);
    }

    let templateBody = null;
    if (input.templateId) {
      const tpl = await env.DB.prepare('SELECT body_template FROM contract_templates WHERE id = ?')
        .bind(input.templateId)
        .first();
      templateBody = tpl?.body_template || null;
    }

    const client = await loadClientRow(env.DB, input.clientId || existing.client_id);
    if (client) applyClientAsContratante(input, client);
    else {
      input.clientLegalName = input.clientLegalName || existing.client_legal_name;
      input.clientCnpj = input.clientCnpj || existing.client_cnpj_formatted;
      input.clientAddress = input.clientAddress || existing.client_address;
    }

    if (!input.startDate) input.startDate = input.contractDate;
    if (!input.scope) {
      input.scope = String(input.variables?.scope || existing.scope || 'Contrato de prestação de serviços').trim();
    }

    const issuerEnv = await contractIssuerEnv(env);
    const resolved = resolveBody(input, issuerEnv, templateBody);
    const number = existing.number;
    const revision = (existing.revision || 0) + 1;
    const documentHtml = await buildContractDocumentHtml({
      bodyHtml: resolved.bodyHtml,
      number,
      env: issuerEnv,
      vars: resolved.vars,
      isRectified: true,
      revision,
    });
    const pdfBytes = await renderPdfFromHtml(env, documentHtml);
    const checksum = await sha256Bytes(pdfBytes);
    const filename = contractPdfFilename(`${number}-r${revision}`);
    const pdfKey = `contracts/${existing.client_id}/${filename}`;
    const now = nowIso();

    await env.PDFS.put(pdfKey, pdfBytes, {
      httpMetadata: { contentType: 'application/pdf' },
      customMetadata: { checksum, contractId: id, revision: String(revision) },
    });

    await env.DB.prepare(
      `UPDATE contracts SET
         template_id = ?, status = 'retificado', revision = ?, send_email = ?, cc_emails = ?, contract_date = ?, start_date = ?,
         duration_months = ?, payment_day = ?, subscription_period = ?,
         implementation_fee_cents = ?, subscription_fee_cents = ?, scope = ?,
         client_legal_name = ?, client_cnpj_formatted = ?, client_address = ?,
         variables_json = ?, body_html = ?, body_text = ?, pdf_key = ?, pdf_checksum = ?,
         sent_at = ?, rectified_at = ?, updated_at = ?
       WHERE id = ?`
    )
      .bind(
        input.templateId || existing.template_id || null,
        revision,
        input.sendEmail,
        serializeCcEmails(input.ccEmails),
        input.contractDate,
        input.startDate,
        input.durationMonths,
        input.paymentDay,
        input.subscriptionPeriod,
        input.implementationFeeCents,
        input.subscriptionFeeCents,
        input.scope,
        input.clientLegalName,
        input.clientCnpj,
        input.clientAddress,
        JSON.stringify(resolved.vars),
        resolved.bodyHtml,
        resolved.bodyText || input.bodyText || null,
        pdfKey,
        checksum,
        now,
        now,
        now,
        id
      )
      .run();

    if (input.send !== false) {
      try {
        await dispatchContractEmail(env, {
          to: input.sendEmail,
          cc: input.ccEmails,
          clientName: input.clientLegalName || existing.client_name,
          contractNumber: number,
          filename,
          pdfBytes,
          isRectified: true,
        });
      } catch (err) {
        return json({ error: err.message || 'Falha ao enviar e-mail.' }, 500, origin);
      }
    }

    await audit(env.DB, {
      actorRole: 'admin',
      actorId: session.admin_id,
      action: 'contract_rectified',
      resourceType: 'contract',
      resourceId: id,
      ip,
      metadata: { number, revision, sendEmail: input.sendEmail, ccEmails: input.ccEmails },
    });

    const row = await loadContract(env.DB, id);
    return json({ contract: contractDto(row) }, 200, origin);
  }

  const pdfMatch = path.match(/^\/admin\/contracts\/([^/]+)\/pdf$/);
  if (pdfMatch && request.method === 'GET') {
    const id = pdfMatch[1];
    const row = await loadContract(env.DB, id);
    if (!row?.pdf_key) return json({ error: 'PDF não disponível.' }, 404, origin);
    const obj = await env.PDFS.get(row.pdf_key);
    if (!obj) return json({ error: 'PDF não encontrado.' }, 404, origin);
    const bytes = new Uint8Array(await obj.arrayBuffer());
    const inline = new URL(request.url).searchParams.get('inline') === '1';
    return pdfResponse(bytes, contractPdfFilename(row.number), origin, inline);
  }

  const resendMatch = path.match(/^\/admin\/contracts\/([^/]+)\/resend$/);
  if (resendMatch && request.method === 'POST') {
    const id = resendMatch[1];
    const body = await readJson(request);
    const row = await loadContract(env.DB, id);
    if (!row) return json({ error: 'Contrato não encontrado.' }, 404, origin);
    if (!row.pdf_key) return json({ error: 'PDF não disponível.' }, 400, origin);

    const to = String(body?.sendEmail || row.send_email || '')
      .trim()
      .toLowerCase();
    if (!to || !EMAIL_RE.test(to)) {
      return json({ error: 'E-mail do destinatário inválido.' }, 400, origin);
    }
    const ccEmails =
      body?.ccEmails != null || body?.cc != null
        ? parseEmailList(body.ccEmails ?? body.cc)
        : parseEmailList(row.cc_emails);

    const obj = await env.PDFS.get(row.pdf_key);
    if (!obj) return json({ error: 'PDF não encontrado.' }, 404, origin);
    const pdfBytes = new Uint8Array(await obj.arrayBuffer());
    const filename = contractPdfFilename(row.number);

    try {
      await dispatchContractEmail(env, {
        to,
        cc: ccEmails,
        clientName: row.client_legal_name || row.client_name,
        contractNumber: row.number,
        filename,
        pdfBytes,
        isRectified: row.status === 'retificado' || (row.revision || 0) > 0,
      });
    } catch (err) {
      return json({ error: err.message || 'Falha ao enviar e-mail.' }, 500, origin);
    }

    const now = nowIso();
    await env.DB.prepare(
      `UPDATE contracts SET send_email = ?, cc_emails = ?, sent_at = ?, status = 'enviado', updated_at = ? WHERE id = ?`
    )
      .bind(to, serializeCcEmails(ccEmails), now, now, id)
      .run();

    await audit(env.DB, {
      actorRole: 'admin',
      actorId: session.admin_id,
      action: 'contract_resent',
      resourceType: 'contract',
      resourceId: id,
      ip,
      metadata: { sendEmail: to, ccEmails },
    });

    const updated = await loadContract(env.DB, id);
    return json({ contract: contractDto(updated) }, 200, origin);
  }

  return null;
}
