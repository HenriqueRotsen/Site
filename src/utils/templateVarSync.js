/** Extrai chaves {{var}} do texto do modelo. */
export function extractPlaceholderKeys(text) {
  const keys = new Set();
  const re = /\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g;
  let match;
  const source = String(text || '');
  while ((match = re.exec(source)) !== null) {
    keys.add(match[1]);
  }
  return [...keys];
}

const SYSTEM_PARTY_KEYS = new Set([
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

const DERIVED_ONLY_KEYS = new Set([
  'contractDay',
  'contractMonthName',
  'contractYear',
  'contractDateFormatted',
  'startDateFormatted',
]);

export function isSystemPartyKey(key) {
  const k = String(key || '');
  return SYSTEM_PARTY_KEYS.has(k) || k.startsWith('issuer');
}

export function isDerivedPlaceholderKey(key) {
  const k = String(key || '');
  return (
    DERIVED_ONLY_KEYS.has(k) ||
    /(?:Formatted|Extenso|Cents)$/.test(k)
  );
}

/** Chave base editável a partir de um placeholder (ex.: feeFormatted → fee). */
export function baseVariableKey(key) {
  const k = String(key || '');
  if (DERIVED_ONLY_KEYS.has(k)) {
    if (k === 'contractDay' || k === 'contractMonthName' || k === 'contractYear' || k === 'contractDateFormatted') {
      return 'contractDate';
    }
    if (k === 'startDateFormatted') return 'startDate';
  }
  return k.replace(/(Formatted|Extenso|Cents)$/, '');
}

function guessLabel(key) {
  return String(key || '')
    .replace(/_/g, ' ')
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/^./, (c) => c.toUpperCase());
}

function guessType(key) {
  const k = String(key || '');
  if (/Date$/i.test(k) || k === 'contractDate' || k === 'startDate' || k === 'proposalDate') return 'date';
  if (/Fee$|Total$|Price$|Amount$/i.test(k) || /Fee|Total|Price|Amount/.test(k)) return 'money';
  if (/Days$|Months$|Hours$|Weeks$|Day$|Projects$/i.test(k) || k === 'paymentDay' || k === 'durationMonths') {
    return 'number';
  }
  if (/scope|detail|description|list/i.test(k)) return 'textarea';
  if (k === 'subscriptionPeriod') return 'select';
  return 'text';
}

function newVariableFromKey(key) {
  const type = guessType(key);
  return {
    key,
    label: guessLabel(key),
    type,
    required: false,
    defaultValue: '',
    ...(type === 'select' ? { options: ['mensal', 'trimestral', 'anual'] } : {}),
  };
}

/**
 * Chaves que devem existir na tabela a partir do texto
 * (ignora partes do sistema e placeholders só derivados).
 */
export function editableKeysFromBody(bodyTemplate) {
  const keys = extractPlaceholderKeys(bodyTemplate);
  const editable = new Set();
  for (const key of keys) {
    if (isSystemPartyKey(key)) continue;
    const base = baseVariableKey(key);
    if (isSystemPartyKey(base)) continue;
    if (!base) continue;
    // Se o placeholder no texto é só derivado, ainda assim a base entra na tabela.
    editable.add(base);
  }
  return [...editable];
}

/** Remove do texto todos os {{key}}, {{keyFormatted}}, {{keyExtenso}}, etc. */
export function stripKeyFromBody(bodyTemplate, key) {
  const k = String(key || '').replace(/[^a-zA-Z0-9_]/g, '');
  if (!k) return String(bodyTemplate || '');
  const related = [k, `${k}Formatted`, `${k}Extenso`, `${k}Cents`];
  if (k === 'contractDate') {
    related.push('contractDay', 'contractMonthName', 'contractYear', 'contractDateFormatted');
  }
  if (k === 'startDate') related.push('startDateFormatted');
  let next = String(bodyTemplate || '');
  for (const name of related) {
    const re = new RegExp(`\\{\\{\\s*${name}\\s*\\}\\}`, 'g');
    next = next.replace(re, '');
  }
  return next.replace(/[ \t]+\n/g, '\n').replace(/\n{3,}/g, '\n\n');
}

/** Renomeia placeholders da chave antiga para a nova no texto. */
export function renameKeyInBody(bodyTemplate, oldKey, newKey) {
  const from = String(oldKey || '').replace(/[^a-zA-Z0-9_]/g, '');
  const to = String(newKey || '').replace(/[^a-zA-Z0-9_]/g, '');
  if (!from || !to || from === to) return String(bodyTemplate || '');
  const pairs = [
    [from, to],
    [`${from}Formatted`, `${to}Formatted`],
    [`${from}Extenso`, `${to}Extenso`],
    [`${from}Cents`, `${to}Cents`],
  ];
  let next = String(bodyTemplate || '');
  for (const [a, b] of pairs) {
    const re = new RegExp(`\\{\\{\\s*${a}\\s*\\}\\}`, 'g');
    next = next.replace(re, `{{${b}}}`);
  }
  return next;
}

/**
 * Sincroniza a lista de variáveis com o texto:
 * - remove da tabela chaves que sumiram do texto
 * - adiciona na tabela chaves novas encontradas no texto
 * Preserva metadados (label, type, default) das existentes.
 */
export function syncVariablesFromBody(bodyTemplate, variables = []) {
  const wanted = editableKeysFromBody(bodyTemplate);
  const wantedSet = new Set(wanted);
  const prevByKey = new Map(
    (variables || []).filter((v) => v?.key).map((v) => [v.key, v])
  );

  const next = [];
  for (const key of wanted) {
    if (prevByKey.has(key)) {
      next.push({ ...prevByKey.get(key) });
    } else {
      next.push(newVariableFromKey(key));
    }
  }

  // Mantém variáveis ainda sem chave válida / em edição (chave vazia) se houver.
  for (const v of variables || []) {
    if (!v?.key && v?.label) next.push(v);
  }

  // Ordem: existentes na ordem anterior, depois novas
  const ordered = [];
  const seen = new Set();
  for (const v of variables || []) {
    if (v?.key && wantedSet.has(v.key) && !seen.has(v.key)) {
      ordered.push(next.find((x) => x.key === v.key));
      seen.add(v.key);
    }
  }
  for (const v of next) {
    if (v?.key && !seen.has(v.key)) {
      ordered.push(v);
      seen.add(v.key);
    } else if (!v?.key) {
      ordered.push(v);
    }
  }

  return ordered.filter(Boolean);
}
