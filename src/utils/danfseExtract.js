import { getDocument } from 'pdfjs-dist/webpack.mjs';

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

function extractTakerBlock(text) {
  const takerSection = text.match(
    /TOMADOR DO SERVI[CÇ]O[\s\S]*?(?=INTERMEDI[AÁ]RIO|SERVI[CÇ]O PRESTADO|TRIBUTA[CÇ][AÃ]O|$)/i
  );
  const block = takerSection?.[0] || text;
  const cnpj =
    block.match(/CNPJ\s*\/\s*CPF\s*\/\s*NIF\s*[:\n]?\s*([\d./-]+)/i)?.[1] ||
    block.match(/\b(\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2})\b/)?.[1] ||
    '';
  const name =
    afterLabel(block, ['Nome / Nome Empresarial', 'Nome Empresarial', 'Nome'], {
      untilLabels: ['E-mail', 'Endereço', 'Município', 'CEP', 'Inscrição'],
    }) || '';
  return { cnpj, name };
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
    takerName,
    takerCnpj,
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
