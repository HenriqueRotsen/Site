function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function formatBRL(cents) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format((cents || 0) / 100);
}

export function formatDateBR(isoDate) {
  if (!isoDate) return '';
  const [y, m, d] = String(isoDate).split('-');
  if (!y || !m || !d) return String(isoDate);
  return `${d}/${m}/${y}`;
}

/**
 * Campos de qualificação das partes — preenchidos pelo sistema
 * (CONTRATADA = CCMEI; CONTRATANTE = cliente selecionado). Não entram nos modelos.
 */
export const SYSTEM_PARTY_VARIABLE_KEYS = new Set([
  'issuerName',
  'issuerLegalName',
  'issuerCivilName',
  'issuerCnpj',
  'issuerCpf',
  'issuerDocument',
  'issuerStateRegistration',
  'issuerAddress',
  'issuerEmail',
  'issuerSite',
  'issuerCityUf',
  'issuerPhone',
  'clientLegalName',
  'clientTradeName',
  'clientCnpj',
  'clientStateRegistration',
  'clientAddress',
  'clientZip',
  'clientCityUf',
  'clientEmail',
  'clientPhone',
]);

export function isSystemPartyVariable(key) {
  const k = String(key || '');
  return SYSTEM_PARTY_VARIABLE_KEYS.has(k) || k.startsWith('issuer');
}

/** Campos estruturados do formulário (além do corpo editável). Sem dados das partes. */
export const CONTRACT_VARIABLES = [
  { key: 'contractDate', label: 'Data do contrato', type: 'date', required: true },
  { key: 'scope', label: 'Objeto / escopo do serviço', type: 'textarea', required: true },
  { key: 'implementationFee', label: 'Taxa de implementação (R$)', type: 'money', required: true },
  { key: 'subscriptionFee', label: 'Valor da assinatura (R$)', type: 'money', required: true },
  { key: 'subscriptionPeriod', label: 'Periodicidade da assinatura', type: 'select', required: true, options: ['mensal', 'trimestral', 'anual'] },
  { key: 'startDate', label: 'Início da vigência', type: 'date', required: true },
  { key: 'durationMonths', label: 'Prazo (meses)', type: 'number', required: true },
  { key: 'paymentDay', label: 'Dia de vencimento', type: 'number', required: false },
  { key: 'city', label: 'Cidade de foro', type: 'text', required: false },
  { key: 'clientRepresentativeName', label: 'Representante legal (contratante)', type: 'text', required: false },
  { key: 'clientRepresentativeCpf', label: 'CPF do representante', type: 'text', required: false },
  { key: 'clientRepresentativeRole', label: 'Cargo / poderes do representante', type: 'text', required: false },
];

export function issuerDefaults(env = {}) {
  return {
    issuerName: env.ISSUER_NAME || 'Henrique Rotsen',
    issuerLegalName: env.ISSUER_LEGAL_NAME || '66.268.938 HENRIQUE ROTSEN SANTOS FERREIRA',
    issuerCivilName: env.ISSUER_CIVIL_NAME || 'HENRIQUE ROTSEN SANTOS FERREIRA',
    issuerCnpj: env.ISSUER_CNPJ || '66.268.938/0001-03',
    issuerCpf: env.ISSUER_CPF || '071.914.556-24',
    issuerDocument: env.ISSUER_CNPJ || '66.268.938/0001-03',
    issuerStateRegistration: env.ISSUER_STATE_REGISTRATION || 'MEI — dispensado / não informado',
    issuerAddress:
      env.ISSUER_ADDRESS ||
      'Rua Alessandra Salum Cadar, 731, Apt 102 - Buritis, Belo Horizonte - MG, 30575-190',
    issuerEmail: env.ISSUER_EMAIL || 'contato@henriquerotsen.com.br',
    issuerSite: env.ISSUER_SITE
      ? String(env.ISSUER_SITE).startsWith('http')
        ? env.ISSUER_SITE
        : `https://${env.ISSUER_SITE}`
      : 'https://henriquerotsen.com.br',
    issuerCityUf: env.ISSUER_CITY_UF || 'Belo Horizonte / MG',
    issuerPhone: env.ISSUER_PHONE || '(31) 3234-0271',
  };
}

/**
 * Modelo padrão — sem qualificação das partes (isso é injetado pelo sistema no PDF).
 * Blocos: [TITLE], [TABLE], [SIGNATURES], [CHECKLIST]. Placeholders: {{chave}}
 */
export function defaultContractBodyTemplate(_env = {}) {
  return `[TITLE]
CONTRATO DE PRESTAÇÃO DE SERVIÇOS
[/TITLE]

CLÁUSULA 2ª — DO OBJETO
2.1. O presente contrato tem por objeto a prestação dos seguintes serviços pela CONTRATADA à CONTRATANTE:
{{scope}}

CLÁUSULA 3ª — DOS VALORES E FORMA DE PAGAMENTO
3.1. Pela implantação dos serviços, a CONTRATANTE pagará à CONTRATADA a taxa de implementação no valor de {{implementationFeeFormatted}} ({{implementationFeeExtenso}}), em parcela única.
3.2. Pela manutenção/assinatura dos serviços, a CONTRATANTE pagará à CONTRATADA o valor de {{subscriptionFeeFormatted}} ({{subscriptionFeeExtenso}}) com periodicidade {{subscriptionPeriod}}.
3.3. Os pagamentos deverão ser efetuados até o dia {{paymentDay}} de cada período de competência, mediante boleto, PIX ou outro meio indicado pela CONTRATADA.
3.4. O atraso no pagamento sujeitará a CONTRATANTE a juros de 1% (um por cento) ao mês e multa de 2% (dois por cento) sobre o valor em atraso.

CLÁUSULA 4ª — DA VIGÊNCIA
4.1. O presente contrato inicia-se em {{startDateFormatted}} e terá prazo de {{durationMonths}} ({{durationMonthsExtenso}}) meses, podendo ser renovado automaticamente por iguais períodos, salvo denúncia por qualquer das partes com antecedência mínima de 30 (trinta) dias.

CLÁUSULA 5ª — DAS OBRIGAÇÕES DAS PARTES
5.1. Caberá à CONTRATADA executar os serviços com diligência, qualidade técnica e sigilo das informações recebidas.
5.2. Caberá à CONTRATANTE fornecer as informações, acessos e materiais necessários à execução dos serviços, bem como efetuar os pagamentos nas datas acordadas.

CLÁUSULA 6ª — DA CONFIDENCIALIDADE
6.1. As partes comprometem-se a manter confidencialidade sobre informações técnicas, comerciais e operacionais a que tiverem acesso em razão deste contrato, pelo prazo de vigência e por 2 (dois) anos após o seu término.

CLÁUSULA 7ª — DA RESCISÃO
7.1. O contrato poderá ser rescindido por qualquer das partes mediante aviso prévio de 30 (trinta) dias, ou imediatamente em caso de inadimplemento grave.
7.2. Em caso de rescisão, os valores já devidos até a data da rescisão permanecem exigíveis.

CLÁUSULA 8ª — DO FORO
8.1. Fica eleito o foro da comarca de {{city}} para dirimir quaisquer dúvidas oriundas deste contrato, com renúncia a qualquer outro, por mais privilegiado que seja.

E, por estarem assim justas e contratadas, as partes firmam o presente instrumento.

LOCAL E DATA
{{city}}, {{contractDateFormatted}}.

[SIGNATURES]
CONTRATADA
Nome: {{issuerCivilName}}
Nome empresarial: {{issuerLegalName}}
CNPJ: {{issuerDocument}}
---
CONTRATANTE
Razão social: {{clientLegalName}}
Nome do representante: {{clientRepresentativeName}}
CNPJ: {{clientCnpj}}
[/SIGNATURES]
`;
}

/** Qualificação formal das partes — sempre gerada pelo sistema (não vem do modelo). */
export function buildPartiesClauseHtml(vars = {}, env = {}) {
  const issuer = issuerDefaults(env);
  const clientName = escapeHtml(vars.clientLegalName || '_________________________________');
  const clientTrade = vars.clientTradeName
    ? `<p class="contract-party__line"><strong>Nome fantasia:</strong> ${escapeHtml(vars.clientTradeName)}</p>`
    : '';
  const clientCnpj = escapeHtml(vars.clientCnpj || '________________');
  const clientAddress = escapeHtml(vars.clientAddress || 'endereço a informar');
  const clientZip = vars.clientZip ? escapeHtml(vars.clientZip) : '';
  const clientCityUf = vars.clientCityUf ? escapeHtml(vars.clientCityUf) : '';
  const clientEmail = escapeHtml(vars.clientEmail || '________________');
  const clientPhone = vars.clientPhone ? escapeHtml(vars.clientPhone) : '';
  const clientIe = escapeHtml(vars.clientStateRegistration || '—');
  const repName = vars.clientRepresentativeName
    ? `<p class="contract-party__line"><strong>Representante legal:</strong> ${escapeHtml(vars.clientRepresentativeName)}</p>`
    : '';
  const repCpf = vars.clientRepresentativeCpf
    ? `<p class="contract-party__line"><strong>CPF do representante:</strong> ${escapeHtml(vars.clientRepresentativeCpf)}</p>`
    : '';
  const repRole = vars.clientRepresentativeRole
    ? `<p class="contract-party__line"><strong>Cargo / poderes:</strong> ${escapeHtml(vars.clientRepresentativeRole)}</p>`
    : '';

  return `
    <section class="contract-clause contract-parties-clause">
      <h2 class="contract-heading">CLÁUSULA 1ª — DAS PARTES</h2>
      <p class="contract-paragraph">Pelo presente instrumento particular, as partes abaixo qualificadas têm entre si justo e contratado o seguinte.</p>
      <div class="contract-party">
        <h3 class="contract-party__title">1.1. CONTRATADA</h3>
        <p class="contract-party__line"><strong>Nome empresarial:</strong> ${escapeHtml(issuer.issuerLegalName)}</p>
        <p class="contract-party__line"><strong>Nome civil:</strong> ${escapeHtml(issuer.issuerCivilName)}</p>
        <p class="contract-party__line"><strong>CNPJ:</strong> ${escapeHtml(issuer.issuerCnpj)}</p>
        <p class="contract-party__line"><strong>CPF do empresário:</strong> ${escapeHtml(issuer.issuerCpf)}</p>
        <p class="contract-party__line"><strong>Inscrição estadual / municipal:</strong> ${escapeHtml(issuer.issuerStateRegistration)}</p>
        <p class="contract-party__line"><strong>Endereço:</strong> ${escapeHtml(issuer.issuerAddress)}</p>
        <p class="contract-party__line"><strong>E-mail:</strong> ${escapeHtml(issuer.issuerEmail)}</p>
        <p class="contract-party__line"><strong>Site:</strong> ${escapeHtml(issuer.issuerSite)}</p>
        <p class="contract-party__line"><strong>Cidade / UF:</strong> ${escapeHtml(issuer.issuerCityUf)}</p>
        <p class="contract-paragraph">doravante denominada simplesmente CONTRATADA.</p>
      </div>
      <div class="contract-party">
        <h3 class="contract-party__title">1.2. CONTRATANTE</h3>
        <p class="contract-party__line"><strong>Razão social:</strong> ${clientName}</p>
        ${clientTrade}
        <p class="contract-party__line"><strong>CNPJ:</strong> ${clientCnpj}</p>
        <p class="contract-party__line"><strong>Inscrição estadual / municipal:</strong> ${clientIe}</p>
        <p class="contract-party__line"><strong>Endereço completo:</strong> ${clientAddress}</p>
        ${
          clientZip || clientCityUf
            ? `<p class="contract-party__line"><strong>CEP / Cidade:</strong> ${[clientZip, clientCityUf].filter(Boolean).join(' — ')}</p>`
            : ''
        }
        <p class="contract-party__line"><strong>E-mail para comunicações:</strong> ${clientEmail}</p>
        ${clientPhone ? `<p class="contract-party__line"><strong>Telefone:</strong> ${clientPhone}</p>` : ''}
        ${repName}${repCpf}${repRole}
        <p class="contract-paragraph">doravante denominada simplesmente CONTRATANTE.</p>
      </div>
      <p class="contract-paragraph"><strong>1.3.</strong> CONTRATADA e CONTRATANTE são doravante denominadas, em conjunto, Partes e, individualmente, Parte.</p>
    </section>
  `;
}

function numberToWordsPt(n) {
  const units = [
    '',
    'um',
    'dois',
    'três',
    'quatro',
    'cinco',
    'seis',
    'sete',
    'oito',
    'nove',
    'dez',
    'onze',
    'doze',
    'treze',
    'quatorze',
    'quinze',
    'dezesseis',
    'dezessete',
    'dezoito',
    'dezenove',
  ];
  const tens = ['', '', 'vinte', 'trinta', 'quarenta', 'cinquenta', 'sessenta', 'setenta', 'oitenta', 'noventa'];
  const hundreds = [
    '',
    'cento',
    'duzentos',
    'trezentos',
    'quatrocentos',
    'quinhentos',
    'seiscentos',
    'setecentos',
    'oitocentos',
    'novecentos',
  ];
  if (n === 0) return 'zero';
  if (n === 100) return 'cem';
  if (n < 20) return units[n];
  if (n < 100) {
    const t = Math.floor(n / 10);
    const u = n % 10;
    return u ? `${tens[t]} e ${units[u]}` : tens[t];
  }
  if (n < 1000) {
    const h = Math.floor(n / 100);
    const rest = n % 100;
    const head = hundreds[h];
    return rest ? `${head} e ${numberToWordsPt(rest)}` : head;
  }
  if (n < 1000000) {
    const mil = Math.floor(n / 1000);
    const rest = n % 1000;
    const head = mil === 1 ? 'mil' : `${numberToWordsPt(mil)} mil`;
    return rest ? `${head} e ${numberToWordsPt(rest)}` : head;
  }
  return String(n);
}

export function moneyToExtenso(cents) {
  const value = Math.max(0, Math.round(Number(cents) || 0));
  const reais = Math.floor(value / 100);
  const centavos = value % 100;
  let text = `${numberToWordsPt(reais)} ${reais === 1 ? 'real' : 'reais'}`;
  if (centavos > 0) {
    text += ` e ${numberToWordsPt(centavos)} ${centavos === 1 ? 'centavo' : 'centavos'}`;
  }
  return text;
}

export function monthsToExtenso(months) {
  const n = Math.max(0, parseInt(months, 10) || 0);
  return numberToWordsPt(n);
}

const MONTH_NAMES_PT = [
  '',
  'janeiro',
  'fevereiro',
  'março',
  'abril',
  'maio',
  'junho',
  'julho',
  'agosto',
  'setembro',
  'outubro',
  'novembro',
  'dezembro',
];

function reaisToCentsLocal(value) {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value >= 1000 && Number.isInteger(value) ? value : Math.round(value * 100);
  }
  const raw = String(value || '').trim();
  if (!raw) return 0;
  if (/^\d+$/.test(raw) && !raw.includes(',')) return parseInt(raw, 10) * 100;
  const normalized = raw.replace(/[R$\s]/gi, '').replace(/\./g, '').replace(',', '.');
  const amount = parseFloat(normalized);
  return Number.isFinite(amount) ? Math.round(amount * 100) : 0;
}

function resolveMoneyCents(input, key) {
  const centsKey = `${key}Cents`;
  if (input[centsKey] != null && input[centsKey] !== '') {
    return Math.round(Number(input[centsKey]) || 0);
  }
  if (input[key] != null && input[key] !== '') {
    return reaisToCentsLocal(input[key]);
  }
  return 0;
}

export function buildContractVariables(input = {}, env = {}) {
  const issuer = issuerDefaults(env);
  const implementationFeeCents = resolveMoneyCents(input, 'implementationFee');
  const subscriptionFeeCents = resolveMoneyCents(input, 'subscriptionFee');
  const firstMonthTotalCents =
    resolveMoneyCents(input, 'firstMonthTotal') || implementationFeeCents + subscriptionFeeCents;
  const newDemandFeeCents = resolveMoneyCents(input, 'newDemandFee');
  const durationMonths = parseInt(input.durationMonths, 10) || 12;
  const paymentDay = parseInt(input.paymentDay, 10) || 10;
  const proposalValidityDays = parseInt(input.proposalValidityDays, 10) || 15;
  const maxProjects = parseInt(input.maxProjects, 10) || 30;
  const deliveryWeeks = parseInt(input.deliveryWeeks, 10) || 2;
  const trainingHours = parseInt(input.trainingHours, 10) || 1;
  const newDemandHours = parseInt(input.newDemandHours, 10) || 4;
  const contractDate = String(input.contractDate || '').trim();
  const [cy, cm, cd] = contractDate.split('-');
  const monthNum = parseInt(cm, 10) || 0;

  return {
    ...issuer,
    // CONTRATADA é sempre a empresa do CCMEI (não vem do formulário)
    issuerLegalName: issuer.issuerLegalName,
    issuerCivilName: issuer.issuerCivilName,
    issuerDocument: issuer.issuerDocument,
    issuerCnpj: issuer.issuerCnpj,
    issuerCpf: issuer.issuerCpf,
    issuerStateRegistration: issuer.issuerStateRegistration,
    issuerAddress: issuer.issuerAddress,
    issuerEmail: issuer.issuerEmail,
    issuerSite: issuer.issuerSite,
    issuerCityUf: issuer.issuerCityUf,
    issuerPhone: issuer.issuerPhone,
    contractDate,
    contractDateFormatted: formatDateBR(contractDate),
    contractDay: cd || '_____',
    contractMonthName: MONTH_NAMES_PT[monthNum] || '_________________',
    contractYear: cy || '____',
    clientLegalName: String(input.clientLegalName || '').trim(),
    clientTradeName: String(input.clientTradeName || '').trim() || '_________________________________',
    clientCnpj: String(input.clientCnpj || '').trim(),
    clientStateRegistration: String(input.clientStateRegistration || '—').trim(),
    clientAddress: String(input.clientAddress || 'endereço a informar').trim(),
    clientZip: String(input.clientZip || '').trim() || '_____________',
    clientCityUf: String(input.clientCityUf || '').trim() || '_____________ / ____',
    clientEmail: String(input.clientEmail || input.sendEmail || '').trim(),
    clientPhone: String(input.clientPhone || '').trim() || '_________________________________',
    clientRepresentativeName: String(input.clientRepresentativeName || '').trim() || '_________________________________',
    clientRepresentativeCpf: String(input.clientRepresentativeCpf || '').trim() || '_________________________________',
    clientRepresentativeRole: String(input.clientRepresentativeRole || '').trim() || '_________________________________',
    scope: String(input.scope || '').trim(),
    proposalDate: String(input.proposalDate || '').trim(),
    proposalValidityDays: String(proposalValidityDays),
    proposalValidityDaysExtenso: monthsToExtenso(proposalValidityDays),
    implementationFeeCents,
    implementationFeeFormatted: formatBRL(implementationFeeCents),
    implementationFeeExtenso: moneyToExtenso(implementationFeeCents),
    subscriptionFeeCents,
    subscriptionFeeFormatted: formatBRL(subscriptionFeeCents),
    subscriptionFeeExtenso: moneyToExtenso(subscriptionFeeCents),
    firstMonthTotalCents,
    firstMonthTotalFormatted: formatBRL(firstMonthTotalCents),
    firstMonthTotalExtenso: moneyToExtenso(firstMonthTotalCents),
    newDemandFeeCents,
    newDemandFeeFormatted: formatBRL(newDemandFeeCents),
    newDemandFeeExtenso: moneyToExtenso(newDemandFeeCents),
    newDemandHours: String(newDemandHours),
    newDemandHoursExtenso: monthsToExtenso(newDemandHours),
    maxProjects: String(maxProjects),
    maxProjectsExtenso: monthsToExtenso(maxProjects),
    deliveryWeeks: String(deliveryWeeks),
    deliveryWeeksExtenso: monthsToExtenso(deliveryWeeks),
    trainingHours: String(trainingHours),
    trainingHoursExtenso: monthsToExtenso(trainingHours),
    subscriptionPeriod: String(input.subscriptionPeriod || 'mensal').trim(),
    startDate: input.startDate || contractDate || '',
    startDateFormatted: formatDateBR(input.startDate || contractDate),
    durationMonths: String(durationMonths),
    durationMonthsExtenso: monthsToExtenso(durationMonths),
    paymentDay: String(paymentDay),
    city: String(input.city || issuer.issuerCityUf || 'Belo Horizonte / MG').trim(),
  };
}

export function fillTemplate(template, vars) {
  return String(template || '').replace(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g, (_, key) => {
    const value = vars[key];
    return value == null ? '' : String(value);
  });
}

export function plainTextToContractHtml(text) {
  const source = String(text || '');

  // Extrai blocos especiais antes do escape, depois escapa células/linhas.
  const segments = [];
  const specialRe = /\[(TITLE|TABLE|SIGNATURES|CHECKLIST)\]([\s\S]*?)\[\/\1\]/gi;
  let lastIndex = 0;
  let match;
  while ((match = specialRe.exec(source)) !== null) {
    if (match.index > lastIndex) {
      segments.push({ type: 'text', value: source.slice(lastIndex, match.index) });
    }
    segments.push({ type: match[1].toUpperCase(), value: match[2].trim() });
    lastIndex = match.index + match[0].length;
  }
  if (lastIndex < source.length) {
    segments.push({ type: 'text', value: source.slice(lastIndex) });
  }
  if (!segments.length) segments.push({ type: 'text', value: source });

  const parts = [];
  for (const segment of segments) {
    if (segment.type === 'TITLE') {
      parts.push(renderTitleBlock(segment.value));
      continue;
    }
    if (segment.type === 'TABLE') {
      parts.push(renderContractTable(segment.value));
      continue;
    }
    if (segment.type === 'SIGNATURES') {
      parts.push(renderSignaturesBlock(segment.value));
      continue;
    }
    if (segment.type === 'CHECKLIST') {
      parts.push(renderChecklistBlock(segment.value));
      continue;
    }
    parts.push(renderTextBlocks(segment.value));
  }

  return `<div class="contract-content">${parts.join('\n')}</div>`;
}

function renderTitleBlock(raw) {
  const lines = String(raw || '')
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);
  if (!lines.length) return '';
  return `<h1 class="contract-doc-title">${lines.map((line) => escapeHtml(line)).join('<br />')}</h1>`;
}

function renderChecklistBlock(raw) {
  const items = String(raw || '')
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => line.replace(/^[-•*]\s*/, '').replace(/^☐\s*/, ''));

  if (!items.length) return '';

  return `
    <div class="contract-checklist-wrap">
      <ul class="contract-checklist">
        ${items
          .map(
            (item) => `
          <li class="contract-checklist__item">
            <span class="contract-checklist__box" aria-hidden="true"></span>
            <span class="contract-checklist__text">${escapeHtml(item)}</span>
          </li>`
          )
          .join('')}
      </ul>
    </div>
  `;
}

function renderContractTable(raw) {
  const rows = String(raw || '')
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .filter((line) => line.includes('|'))
    .map((line) => line.split('|').map((cell) => escapeHtml(cell.trim())));

  if (rows.length < 2) {
    return `<section class="contract-clause"><p class="contract-paragraph">${escapeHtml(raw)}</p></section>`;
  }

  const [header, ...body] = rows;
  return `
    <div class="contract-table-wrap">
      <table class="contract-table">
        <thead>
          <tr>${header.map((cell) => `<th>${cell}</th>`).join('')}</tr>
        </thead>
        <tbody>
          ${body
            .map((row) => `<tr>${row.map((cell) => `<td>${cell}</td>`).join('')}</tr>`)
            .join('')}
        </tbody>
      </table>
    </div>
  `;
}

function renderSignaturesBlock(raw) {
  const parties = String(raw || '')
    .split(/\n---\n/)
    .map((chunk) => chunk.trim())
    .filter(Boolean);

  const partyHtml = [];
  let witnessesHtml = '';

  for (const chunk of parties) {
    const lines = chunk.split('\n').map((l) => l.trim()).filter(Boolean);
    if (!lines.length) continue;
    const title = lines[0];
    const details = lines.slice(1);

    if (/^TESTEMUNHAS/i.test(title)) {
      const witnessPairs = [];
      for (let i = 0; i < details.length; i += 2) {
        witnessPairs.push(details.slice(i, i + 2));
      }
      witnessesHtml = `
        <div class="contract-witnesses">
          <h3 class="contract-signatures__subtitle">Testemunhas (opcional)</h3>
          <div class="contract-witnesses__grid">
            ${witnessPairs
              .map(
                (pair) => `
              <div class="contract-witness">
                <div class="contract-sign-line"></div>
                <p class="contract-sign-caption">Assinatura</p>
                ${pair.map((line) => `<p class="contract-sign-meta">${escapeHtml(line)}</p>`).join('')}
              </div>`
              )
              .join('')}
          </div>
        </div>
      `;
      continue;
    }

    partyHtml.push(`
      <div class="contract-sign-party">
        <h3 class="contract-signatures__party-title">${escapeHtml(title)}</h3>
        <div class="contract-sign-space">
          <div class="contract-sign-line"></div>
          <p class="contract-sign-caption">Assinatura</p>
        </div>
        <div class="contract-sign-details">
          ${details.map((line) => `<p class="contract-sign-meta">${escapeHtml(line)}</p>`).join('')}
        </div>
      </div>
    `);
  }

  return `
    <section class="contract-signatures">
      <h2 class="contract-heading">Assinaturas</h2>
      <div class="contract-signatures__grid">
        ${partyHtml.join('')}
      </div>
      ${witnessesHtml}
    </section>
  `;
}

function renderTextBlocks(text) {
  const escaped = escapeHtml(text);
  const blocks = escaped
    .split(/\n{2,}/)
    .map((block) => block.trim())
    .filter(Boolean);

  const parts = [];
  let clauseOpen = false;

  const closeClause = () => {
    if (clauseOpen) {
      parts.push('</section>');
      clauseOpen = false;
    }
  };

  for (const block of blocks) {
    const withBreaks = block.replace(/\n/g, '<br />');
    const firstLine = block.replace(/<br \/>/g, '\n').split('\n')[0].trim();

    if (/^CONTRATO DE /i.test(firstLine)) {
      closeClause();
      parts.push(`<h1 class="contract-doc-title">${withBreaks}</h1>`);
      continue;
    }

    if (/^Validade da proposta/i.test(firstLine)) {
      closeClause();
      parts.push(`<p class="contract-eyebrow">${withBreaks}</p>`);
      continue;
    }

    if (/^(LOCAL E DATA)\b/i.test(firstLine)) {
      closeClause();
      const rest = block
        .replace(/<br \/>/g, '\n')
        .split('\n')
        .slice(1)
        .join('\n')
        .trim();
      parts.push(`
        <section class="contract-locale">
          <h2 class="contract-heading">${firstLine}</h2>
          ${rest ? `<p class="contract-locale__date">${rest.replace(/\n/g, '<br />')}</p>` : ''}
        </section>
      `);
      continue;
    }

    if (/^(CLÁUSULA|CLAUSULA|PREÂMBULO|PREAMBULO|ANEXO)\b/i.test(firstLine)) {
      closeClause();
      parts.push('<section class="contract-clause">');
      parts.push(`<h2 class="contract-heading">${firstLine}</h2>`);
      const rest = block
        .replace(/<br \/>/g, '\n')
        .split('\n')
        .slice(1)
        .join('\n')
        .trim();
      if (rest) {
        parts.push(`<p class="contract-paragraph">${rest.replace(/\n/g, '<br />')}</p>`);
      }
      clauseOpen = true;
      continue;
    }

    if (!clauseOpen) {
      parts.push('<section class="contract-clause">');
      clauseOpen = true;
    }
    parts.push(`<p class="contract-paragraph">${withBreaks}</p>`);
  }

  closeClause();
  return parts.join('\n');
}

function bytesToDataUrl(bytes, mimeType) {
  let binary = '';
  for (let i = 0; i < bytes.length; i += 1) {
    binary += String.fromCharCode(bytes[i]);
  }
  return `data:${mimeType};base64,${btoa(binary)}`;
}

async function getWordmarkDataUrl() {
  const { getInvoiceWordmarkBytes } = await import('./invoice-wordmark.js');
  return bytesToDataUrl(getInvoiceWordmarkBytes(), 'image/png');
}

async function getContractCss() {
  const mod = await import('../templates/contract.css');
  return mod.default;
}

function siteHref(site) {
  const value = String(site || 'henriquerotsen.com.br').trim();
  if (value.startsWith('http://') || value.startsWith('https://')) return value;
  return `https://${value}`;
}

function formatDateDisplay(iso) {
  if (!iso) return '';
  if (String(iso).includes('/')) return String(iso);
  const [y, m, d] = String(iso).split('-');
  if (!y || !m || !d) return String(iso);
  return `${d}/${m}/${y}`;
}

export async function buildContractDocumentHtml({
  bodyHtml,
  number,
  env,
  vars = {},
  isRectified = false,
  revision = 0,
}) {
  const issuer = issuerDefaults(env);
  const css = await getContractCss();
  const wordmarkDataUrl = await getWordmarkDataUrl();
  const content = String(bodyHtml || '').includes('<')
    ? bodyHtml
    : plainTextToContractHtml(bodyHtml);

  const contractDate =
    vars.contractDateFormatted || formatDateDisplay(vars.contractDate) || '';
  const showRectified = Boolean(isRectified) || Number(revision) > 0;

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8" />
  <title>Contrato ${escapeHtml(number || '')}${showRectified ? ' (retificado)' : ''}</title>
  <style>${css}</style>
</head>
<body>
  <div class="contract">
    <header class="contract-header">
      <div class="contract-header__brand">
        <img class="contract-header__wordmark" src="${wordmarkDataUrl}" alt="Henrique Rotsen" />
      </div>
      <div class="contract-header__doc">
        <p class="contract-header__doc-label">Contrato</p>
        ${number ? `<p class="contract-header__doc-number">${escapeHtml(number)}</p>` : ''}
        ${
          showRectified
            ? `<p class="contract-header__badge">Retificado${revision ? ` · rev. ${escapeHtml(String(revision))}` : ''}</p>`
            : ''
        }
        ${
          contractDate
            ? `<p class="contract-header__doc-meta">Data ${escapeHtml(contractDate)}</p>`
            : ''
        }
        <p class="contract-header__doc-meta">CNPJ ${escapeHtml(issuer.issuerCnpj)}</p>
      </div>
    </header>

    <main class="contract-body">
      ${buildPartiesClauseHtml(vars, env)}

      ${content}
    </main>

    <footer class="contract-footer">
      <a class="contract-footer__link" href="${escapeHtml(siteHref(issuer.issuerSite))}">${escapeHtml(
    String(issuer.issuerSite || '').replace(/^https?:\/\//, '')
  )}</a>
      · ${escapeHtml(issuer.issuerEmail)}
    </footer>
  </div>
</body>
</html>`;
}

export function mergeContractBody(template, variables, env) {
  const vars = buildContractVariables(variables, env);
  const filled = fillTemplate(template || defaultContractBodyTemplate(env), vars);
  return { vars, bodyText: filled, bodyHtml: plainTextToContractHtml(filled) };
}
