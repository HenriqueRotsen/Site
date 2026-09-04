import { getDocument } from 'pdfjs-dist/webpack.mjs';

/** Prestador fixo da NFS-e (emissor). Nunca deve ser tratado como tomador. */
export const NFSE_PRESTADOR = {
  legalName: '66.268.938 HENRIQUE ROTSEN SANTOS FERREIRA',
  cnpj: '66.268.938/0001-03',
  cnpjDigits: '66268938000103',
};

function digitsOnly(value) {
  return String(value || '').replace(/\D/g, '');
}

function isPrestadorCnpj(value) {
  return digitsOnly(value) === NFSE_PRESTADOR.cnpjDigits;
}

function afterLabel(text, labels, { untilLabels = [], multiline = false } = {}) {
  const sources = Array.isArray(labels) ? labels : [labels];
  for (const label of sources) {
    const escaped = label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const until = untilLabels.length
      ? untilLabels.map((l) => l.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')
      : null;
    const pattern = multiline
      ? new RegExp(`${escaped}\\s*[:\\n]?\\s*([\\s\\S]*?)(?=${until ? `(?:${until})` : '$'})`, 'i')
      : new RegExp(`${escaped}\\s*[:\\n]?\\s*([^\\n]+)`, 'i');
    const match = text.match(pattern);
    if (match?.[1]) {
      return match[1].replace(/\s+/g, ' ').trim();
    }
  }
  return '';
}

function parseBrDateToIso(value) {
  const match = String(value || '').match(/(\d{2})\/(\d{2})\/(\d{4})/);
  if (!match) return '';
  return `${match[3]}-${match[2]}-${match[1]}`;
}

function parseMoneyBr(value) {
  const match = String(value || '').match(/R\$\s*([\d.]+,\d{2}|\d+)/i);
  if (!match) {
    const fallback = String(value || '').match(/([\d.]+,\d{2})/);
    return fallback ? fallback[1] : '';
  }
  return match[1];
}

function extractAccessKey(text) {
  const labeled = text.match(/Chave de Acesso(?: da NFS-e)?\s*[:\n]?\s*(\d{40,50})/i);
  if (labeled?.[1]) return labeled[1];
  const any = text.match(/\b(\d{44,50})\b/);
  return any?.[1] || '';
}

function extractPartyFromBlock(block) {
  const cnpjMatches = [...String(block || '').matchAll(/\b(\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2})\b/g)].map(
    (m) => m[1]
  );
  const labeledCnpj =
    block.match(/CNPJ\s*\/\s*CPF\s*\/\s*NIF\s*[:\n]?\s*([\d./-]+)/i)?.[1] ||
    block.match(/CNPJ\s*[:\n]?\s*([\d./-]+)/i)?.[1] ||
    '';
  const cnpj =
    (labeledCnpj && !isPrestadorCnpj(labeledCnpj) ? labeledCnpj : '') ||
    cnpjMatches.find((value) => !isPrestadorCnpj(value)) ||
    '';
  const name =
    afterLabel(block, ['Nome / Nome Empresarial', 'Nome Empresarial', 'Nome'], {
      untilLabels: ['E-mail', 'Endereço', 'Endereco', 'Município', 'Municipio', 'CEP', 'Inscrição', 'Inscricao', 'CNPJ'],
    }) || '';
  if (name && /HENRIQUE ROTSEN/i.test(name) && !cnpj) {
    return { cnpj: '', name: '' };
  }
  return { cnpj, name };
}

function extractSection(text, startLabels, endLabels) {
  const start = startLabels.map((l) => l.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|');
  const end = endLabels.map((l) => l.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|');
  const match = text.match(new RegExp(`(?:${start})[\\s\\S]*?(?=${end}|$)`, 'i'));
  return match?.[0] || '';
}

function extractTakerBlock(text) {
  const takerSection = extractSection(
    text,
    ['TOMADOR DO SERVI[CÇ]O', 'TOMADOR'],
    ['INTERMEDI[AÁ]RIO', 'SERVI[CÇ]O PRESTADO', 'TRIBUTA[CÇ][AÃ]O', 'PRESTADOR DO SERVI[CÇ]O']
  );
  const prestadorSection = extractSection(
    text,
    ['PRESTADOR DO SERVI[CÇ]O', 'PRESTADOR'],
    ['TOMADOR DO SERVI[CÇ]O', 'TOMADOR', 'INTERMEDI[AÁ]RIO', 'SERVI[CÇ]O PRESTADO']
  );

  let fromTaker = extractPartyFromBlock(takerSection);
  if (isPrestadorCnpj(fromTaker.cnpj) || /HENRIQUE ROTSEN/i.test(fromTaker.name || '')) {
    fromTaker = { cnpj: '', name: '' };
  }

  // Se a seção do tomador falhou, tenta CNPJs do documento que não sejam o prestador.
  if (!fromTaker.cnpj) {
    const allCnpjs = [...text.matchAll(/\b(\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2})\b/g)].map((m) => m[1]);
    const prestadorInDoc = extractPartyFromBlock(prestadorSection);
    const candidate = allCnpjs.find(
      (value) => !isPrestadorCnpj(value) && digitsOnly(value) !== digitsOnly(prestadorInDoc.cnpj)
    );
    if (candidate) {
      fromTaker = { ...fromTaker, cnpj: candidate };
    }
  }

  if (fromTaker.name && isPrestadorCnpj(fromTaker.cnpj)) {
    fromTaker.name = '';
  }

  return fromTaker;
}

export function parseDanfseText(rawText) {
  const text = String(rawText || '')
    .replace(/\r/g, '\n')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{2,}/g, '\n');

  const accessKey = extractAccessKey(text);
  const number = afterLabel(text, ['Número da NFS-e', 'Numero da NFS-e']);
  const competenceRaw = afterLabel(text, ['Competência da NFS-e', 'Competencia da NFS-e']);
  const issuedAt =
    afterLabel(text, ['Data e Hora da emissão da NFS-e', 'Data e Hora da emissao da NFS-e']) || '';
  const dpsNumber = afterLabel(text, ['Número da DPS', 'Numero da DPS']);
  const dpsSeries = afterLabel(text, ['Série da DPS', 'Serie da DPS']);
  const { cnpj: takerCnpj, name: takerName } = extractTakerBlock(text);

  const serviceCodeLine =
    afterLabel(text, ['Código de Tributação Nacional', 'Codigo de Tributacao Nacional']) || '';
  const serviceCode = serviceCodeLine.match(/(\d{2}\.\d{2}(?:\.\d{2})?)/)?.[1] || '';

  let serviceDescription =
    afterLabel(text, ['Descrição do Serviço', 'Descricao do Servico'], {
      untilLabels: [
        'Banco:',
        'TRIBUTAÇÃO MUNICIPAL',
        'TRIBUTACAO MUNICIPAL',
        'Tributação do ISSQN',
        'Valor do Serviço',
      ],
      multiline: true,
    }) || '';
  serviceDescription = serviceDescription.replace(/\s*Banco:.*$/i, '').trim();

  const municipality =
    afterLabel(text, ['Município de Incidência do ISSQN', 'Municipio de Incidencia do ISSQN']) ||
    'Belo Horizonte - MG';

  const amount =
    parseMoneyBr(afterLabel(text, ['Valor Líquido da NFS-e', 'Valor Liquido da NFS-e'])) ||
    parseMoneyBr(afterLabel(text, ['Valor do Serviço', 'Valor do Servico'])) ||
    '';

  return {
    accessKey,
    number,
    competenceDate: parseBrDateToIso(competenceRaw),
    issuedAt,
    dpsNumber,
    dpsSeries,
    takerName: isPrestadorCnpj(takerCnpj) ? '' : takerName,
    takerCnpj: isPrestadorCnpj(takerCnpj) ? '' : takerCnpj,
    serviceCode,
    serviceDescription,
    amount,
    municipality: /belo horizonte/i.test(municipality) ? 'Belo Horizonte - MG' : municipality,
  };
}

export async function extractTextFromPdf(file) {
  const data = new Uint8Array(await file.arrayBuffer());
  const loadingTask = getDocument({ data });
  const pdf = await loadingTask.promise;
  const pages = [];
  for (let i = 1; i <= pdf.numPages; i += 1) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    const strings = content.items.map((item) => ('str' in item ? item.str : '')).filter(Boolean);
    pages.push(strings.join('\n'));
  }
  return pages.join('\n');
}

export async function extractDanfseFromPdf(file) {
  const text = await extractTextFromPdf(file);
  return { text, parsed: parseDanfseText(text) };
}
