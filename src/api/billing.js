const API_URL =
  process.env.REACT_APP_BILLING_API_URL?.trim() ||
  'https://billing-api.henriquerotsen.com.br';

async function request(path, options = {}) {
  let response;
  try {
    response = await fetch(`${API_URL}${path}`, {
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers || {}),
      },
      ...options,
    });
  } catch {
    throw new Error(
      'Não foi possível conectar à API de faturamento. Verifique se o billing-api está rodando.'
    );
  }

  const contentType = response.headers.get('Content-Type') || '';
  if (contentType.includes('text/html')) {
    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      throw new Error(data.error || 'Erro na requisição.');
    }
    return response.text();
  }
  if (contentType.includes('application/pdf')) {
    if (!response.ok) throw new Error('Falha ao baixar PDF.');
    return response.blob();
  }

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.error || 'Erro na requisição.');
  }
  return data;
}

export const billingApi = {
  // Admin auth
  adminLogin: (email, password) =>
    request('/auth/admin/login', { method: 'POST', body: JSON.stringify({ email, password }) }),
  adminLogout: () => request('/auth/admin/logout', { method: 'POST' }),
  adminMe: () => request('/auth/admin/me'),

  // Client auth
  clientRequestCode: (cnpj) =>
    request('/auth/client/request-code', { method: 'POST', body: JSON.stringify({ cnpj }) }),
  clientVerifyCode: (cnpj, code) =>
    request('/auth/client/verify-code', { method: 'POST', body: JSON.stringify({ cnpj, code }) }),
  clientLogout: () => request('/auth/client/logout', { method: 'POST' }),
  clientMe: () => request('/auth/client/me'),

  // Admin dashboard
  getDashboard: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request(`/admin/dashboard${qs ? `?${qs}` : ''}`);
  },
  lookupCnpj: (cnpj) =>
    request(`/admin/cnpj-lookup?cnpj=${encodeURIComponent(String(cnpj).replace(/\D/g, ''))}`),

  // Clients
  listClients: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request(`/admin/clients${qs ? `?${qs}` : ''}`);
  },
  listClientOptions: () => request('/admin/clients/options'),
  getClientBySlug: (slug) => request(`/admin/clients/slug/${encodeURIComponent(slug)}`),
  createClient: (payload) =>
    request('/admin/clients', { method: 'POST', body: JSON.stringify(payload) }),
  updateClient: (id, payload) =>
    request(`/admin/clients/${id}`, { method: 'PUT', body: JSON.stringify(payload) }),
  updateClientBySlug: (slug, payload) =>
    request(`/admin/clients/slug/${encodeURIComponent(slug)}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    }),
  deactivateClient: (id, cnpj) =>
    request(`/admin/clients/${id}`, { method: 'DELETE', body: JSON.stringify({ cnpj }) }),
  deactivateClientBySlug: (slug, cnpj) =>
    request(`/admin/clients/slug/${encodeURIComponent(slug)}`, {
      method: 'DELETE',
      body: JSON.stringify({ cnpj }),
    }),

  // Invoices
  listInvoices: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request(`/admin/invoices${qs ? `?${qs}` : ''}`);
  },
  createInvoice: (payload) =>
    request('/admin/invoices', { method: 'POST', body: JSON.stringify(payload) }),
  previewInvoice: (payload) =>
    request('/admin/invoices/preview', { method: 'POST', body: JSON.stringify(payload) }),
  previewInvoicePdf: (id) => request(`/admin/invoices/${id}/preview`),
  deleteInvoice: (id) => request(`/admin/invoices/${id}`, { method: 'DELETE' }),
  emitInvoice: (id) => request(`/admin/invoices/${id}/emit`, { method: 'POST' }),
  updateInvoiceStatus: (id, status) =>
    request(`/admin/invoices/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }),
  downloadAdminPdf: (id) => request(`/admin/invoices/${id}/pdf`),

  // Client portal
  clientInvoices: () => request('/client/invoices'),
  clientInvoice: (id) => request(`/client/invoices/${id}`),
  downloadClientPdf: (id) => request(`/client/invoices/${id}/pdf`),
};

export function invoicePdfFilename(number) {
  const value = String(number || '').trim();
  if (!value || value === 'PRÉVIA') return 'NF-previa.pdf';
  if (value.startsWith('NF-')) return `${value}.pdf`;
  if (value.startsWith('INV-')) return `${value.replace(/^INV-/, 'NF-')}.pdf`;
  return `NF-${value}.pdf`;
}

export function formatBRL(cents) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(
    (cents || 0) / 100
  );
}

export function formatDate(iso) {
  if (!iso) return '—';
  const [y, m, d] = iso.split('-');
  return `${d}/${m}/${y}`;
}

export function maskCnpjInput(value) {
  const digits = String(value).replace(/\D/g, '').slice(0, 14);
  return digits
    .replace(/^(\d{2})(\d)/, '$1.$2')
    .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
    .replace(/\.(\d{3})(\d)/, '.$1/$2')
    .replace(/(\d{4})(\d)/, '$1-$2');
}

export async function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function openPdfPreview(blob) {
  const url = URL.createObjectURL(blob);
  window.open(url, '_blank', 'noopener,noreferrer');
  setTimeout(() => URL.revokeObjectURL(url), 60000);
}
