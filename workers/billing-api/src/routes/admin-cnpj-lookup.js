import { json } from '../lib/http.js';
import { requireAdmin } from '../lib/session.js';
import { normalizeCnpj, validateCnpj } from '../lib/cnpj.js';

function formatCep(cep) {
  const digits = String(cep || '').replace(/\D/g, '');
  if (digits.length !== 8) return digits;
  return `${digits.slice(0, 5)}-${digits.slice(5)}`;
}

function formatPhoneFromApi(raw) {
  const digits = String(raw || '').replace(/\D/g, '');
  if (!digits) return '';
  if (digits.length === 10) {
    return digits.replace(/^(\d{2})(\d{4})(\d{4})$/, '($1) $2-$3');
  }
  if (digits.length === 11) {
    return digits.replace(/^(\d{2})(\d{5})(\d{4})$/, '($1) $2-$3');
  }
  return digits;
}

export async function handleAdminCnpjLookup(request, env, origin, path) {
  if (path !== '/admin/cnpj-lookup') return null;

  const session = await requireAdmin(env.DB, request);
  if (!session) return json({ error: 'Não autenticado.' }, 401, origin);

  if (request.method !== 'GET') return null;

  const url = new URL(request.url);
  const cnpj = normalizeCnpj(url.searchParams.get('cnpj') || '');
  if (!validateCnpj(cnpj)) {
    return json({ error: 'CNPJ inválido.' }, 400, origin);
  }

  try {
    const response = await fetch(`https://minhareceita.org/${cnpj}`, {
      headers: { Accept: 'application/json' },
    });

    if (response.status === 404) {
      return json({ error: 'CNPJ não encontrado na Receita Federal.' }, 404, origin);
    }

    if (!response.ok) {
      return json({ error: 'Não foi possível consultar o CNPJ. Tente novamente.' }, 502, origin);
    }

    const data = await response.json();

    return json(
      {
        legalName: data.razao_social || '',
        tradeName: data.nome_fantasia || '',
        billingEmail: data.email || '',
        contactPhone: formatPhoneFromApi(data.ddd_telefone_1),
        addressStreet: data.logradouro || '',
        addressNumber: data.numero || '',
        addressComplement: data.complemento || '',
        addressNeighborhood: data.bairro || '',
        addressCity: data.municipio || '',
        addressState: data.uf || '',
        addressZip: formatCep(data.cep),
        status: data.descricao_situacao_cadastral || '',
      },
      200,
      origin
    );
  } catch {
    return json({ error: 'Falha ao consultar CNPJ.' }, 502, origin);
  }
}
