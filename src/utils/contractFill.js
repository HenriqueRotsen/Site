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

function numberToWordsPt(n) {
  const units = [
    '', 'um', 'dois', 'três', 'quatro', 'cinco', 'seis', 'sete', 'oito', 'nove',
    'dez', 'onze', 'doze', 'treze', 'quatorze', 'quinze', 'dezesseis', 'dezessete', 'dezoito', 'dezenove',
  ];
  const tens = ['', '', 'vinte', 'trinta', 'quarenta', 'cinquenta', 'sessenta', 'setenta', 'oitenta', 'noventa'];
  const hundreds = [
    '', 'cento', 'duzentos', 'trezentos', 'quatrocentos', 'quinhentos',
    'seiscentos', 'setecentos', 'oitocentos', 'novecentos',
  ];
  const value = Math.max(0, Math.round(Number(n) || 0));
  if (value === 0) return 'zero';
  if (value === 100) return 'cem';
  if (value < 20) return units[value];
  if (value < 100) {
    const t = Math.floor(value / 10);
    const u = value % 10;
    return u ? `${tens[t]} e ${units[u]}` : tens[t];
  }
  if (value < 1000) {
    const h = Math.floor(value / 100);
    const rest = value % 100;
    const head = hundreds[h];
    return rest ? `${head} e ${numberToWordsPt(rest)}` : head;
  }
  if (value < 1000000) {
    const mil = Math.floor(value / 1000);
    const rest = value % 1000;
    const head = mil === 1 ? 'mil' : `${numberToWordsPt(mil)} mil`;
    return rest ? `${head} e ${numberToWordsPt(rest)}` : head;
  }
  return String(value);
}

function reaisToCents(value) {
  const raw = String(value || '').trim();
  if (!raw) return 0;
  if (/^\d+$/.test(raw) && !raw.includes(',')) return parseInt(raw, 10) * 100;
  const normalized = raw.replace(/[R$\s]/gi, '').replace(/\./g, '').replace(',', '.');
  const amount = parseFloat(normalized);
  return Number.isFinite(amount) ? Math.round(amount * 100) : 0;
}

function formatBRL(cents) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format((cents || 0) / 100);
}

function moneyToExtenso(cents) {
  const value = Math.max(0, Math.round(Number(cents) || 0));
  const reais = Math.floor(value / 100);
  const centavos = value % 100;
  let text = `${numberToWordsPt(reais)} ${reais === 1 ? 'real' : 'reais'}`;
  if (centavos > 0) {
    text += ` e ${numberToWordsPt(centavos)} ${centavos === 1 ? 'centavo' : 'centavos'}`;
  }
  return text;
}

function formatDateBR(isoDate) {
  if (!isoDate) return '';
  const [y, m, d] = String(isoDate).split('-');
  if (!y || !m || !d) return String(isoDate);
  return `${d}/${m}/${y}`;
}

/** Expande variáveis do formulário com derivados (extenso, formatados, data por extenso). */
export function expandContractValues(values = {}) {
  const implementationFeeCents = reaisToCents(values.implementationFee);
  const subscriptionFeeCents = reaisToCents(values.subscriptionFee);
  const firstMonthTotalCents =
    reaisToCents(values.firstMonthTotal) || implementationFeeCents + subscriptionFeeCents;
  const newDemandFeeCents = reaisToCents(values.newDemandFee);
  const contractDate = String(values.contractDate || '').trim();
  const [cy, cm, cd] = contractDate.split('-');
  const monthNum = parseInt(cm, 10) || 0;
  const proposalValidityDays = parseInt(values.proposalValidityDays, 10) || 0;
  const durationMonths = parseInt(values.durationMonths, 10) || 0;
  const maxProjects = parseInt(values.maxProjects, 10) || 0;
  const deliveryWeeks = parseInt(values.deliveryWeeks, 10) || 0;
  const trainingHours = parseInt(values.trainingHours, 10) || 0;
  const newDemandHours = parseInt(values.newDemandHours, 10) || 0;

  return {
    ...values,
    proposalValidityDays: values.proposalValidityDays != null ? String(values.proposalValidityDays) : '',
    proposalValidityDaysExtenso: proposalValidityDays ? numberToWordsPt(proposalValidityDays) : '',
    durationMonths: values.durationMonths != null ? String(values.durationMonths) : '',
    durationMonthsExtenso: durationMonths ? numberToWordsPt(durationMonths) : '',
    maxProjects: values.maxProjects != null ? String(values.maxProjects) : '',
    maxProjectsExtenso: maxProjects ? numberToWordsPt(maxProjects) : '',
    deliveryWeeks: values.deliveryWeeks != null ? String(values.deliveryWeeks) : '',
    deliveryWeeksExtenso: deliveryWeeks ? numberToWordsPt(deliveryWeeks) : '',
    trainingHours: values.trainingHours != null ? String(values.trainingHours) : '',
    trainingHoursExtenso: trainingHours ? numberToWordsPt(trainingHours) : '',
    newDemandHours: values.newDemandHours != null ? String(values.newDemandHours) : '',
    newDemandHoursExtenso: newDemandHours ? numberToWordsPt(newDemandHours) : '',
    paymentDay: values.paymentDay != null ? String(values.paymentDay) : '',
    contractDateFormatted: formatDateBR(contractDate),
    startDateFormatted: formatDateBR(values.startDate || contractDate),
    contractDay: cd || '_____',
    contractMonthName: MONTH_NAMES_PT[monthNum] || '_________________',
    contractYear: cy || '____',
    implementationFeeFormatted: implementationFeeCents ? formatBRL(implementationFeeCents) : (values.implementationFee || ''),
    implementationFeeExtenso: implementationFeeCents ? moneyToExtenso(implementationFeeCents) : '',
    subscriptionFeeFormatted: subscriptionFeeCents ? formatBRL(subscriptionFeeCents) : (values.subscriptionFee || ''),
    subscriptionFeeExtenso: subscriptionFeeCents ? moneyToExtenso(subscriptionFeeCents) : '',
    firstMonthTotalFormatted: firstMonthTotalCents ? formatBRL(firstMonthTotalCents) : (values.firstMonthTotal || ''),
    firstMonthTotalExtenso: firstMonthTotalCents ? moneyToExtenso(firstMonthTotalCents) : '',
    newDemandFeeFormatted: newDemandFeeCents ? formatBRL(newDemandFeeCents) : (values.newDemandFee || ''),
    newDemandFeeExtenso: newDemandFeeCents ? moneyToExtenso(newDemandFeeCents) : '',
  };
}

export function fillContractTemplate(template, values) {
  const expanded = expandContractValues(values);
  return String(template || '').replace(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g, (match, key) => {
    // Não apaga placeholders do sistema (issuer etc.) se ainda não vieram no formulário.
    if (!(key in expanded)) return match;
    const value = expanded[key];
    return value == null ? '' : String(value);
  });
}
