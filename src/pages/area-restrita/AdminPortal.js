import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { billingApi, formatBRL, formatDate, maskCnpjInput, downloadBlob, invoicePdfFilename, nfsePdfFilename } from '../../api/billing';
import { maskPhoneInput, maskCepInput, fetchCep, formatAddressLine } from '../../utils/brazilianInput';
import { AreaRestritaLayout, AreaCard, AreaBack } from './AreaRestritaLayout';
import { PasswordInput } from './PasswordInput';
import { AdminShell, AdminPageHeader, StatusBadge, StatCard } from './admin/AdminShell';
import { SearchableSelect } from './admin/SearchableSelect';
import { DeleteClientModal } from './admin/DeleteClientModal';
import { InvoicePdfPreviewModal } from './admin/InvoicePdfPreviewModal';
import { NfseUploadForm } from './admin/NfseUploadForm';
import { Pagination } from './admin/Pagination';
import '../../styles/AreaRestrita.css';
import '../../styles/AdminShell.css';

const PAGE_SIZE = 10;

const emptyClient = {
  legalName: '',
  cnpj: '',
  billingEmail: '',
  contactName: '',
  contactPhone: '',
  addressStreet: '',
  addressNumber: '',
  addressComplement: '',
  addressNeighborhood: '',
  addressCity: '',
  addressState: '',
  addressZip: '',
  notes: '',
};

const emptyItem = { description: '', quantity: 1, unitPriceCents: 0 };

const emptyNfse = {
  clientId: '',
  accessKey: '',
  number: '',
  competenceDate: '',
  issuedAt: '',
  dpsNumber: '',
  dpsSeries: '',
  takerName: '',
  takerCnpj: '',
  serviceCode: '',
  serviceDescription: '',
  amount: '',
  municipality: 'Belo Horizonte - MG',
};

function reaisInputToCents(value) {
  const raw = String(value || '').trim();
  if (!raw) return 0;
  if (/^\d+$/.test(raw)) return parseInt(raw, 10) * 100;
  const normalized = raw.replace(/[R$\s]/gi, '').replace(/\./g, '').replace(',', '.');
  const amount = parseFloat(normalized);
  return Number.isFinite(amount) ? Math.round(amount * 100) : 0;
}

const UF_LIST = [
  'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS', 'MG',
  'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO',
];

function clientToForm(client) {
  return {
    legalName: client.legalName || '',
    cnpj: client.cnpjFormatted || '',
    billingEmail: client.billingEmail || '',
    contactName: client.contactName || '',
    contactPhone: client.contactPhone || '',
    addressStreet: client.addressStreet || '',
    addressNumber: client.addressNumber || '',
    addressComplement: client.addressComplement || '',
    addressNeighborhood: client.addressNeighborhood || '',
    addressCity: client.addressCity || '',
    addressState: client.addressState || '',
    addressZip: client.addressZip || '',
    notes: client.notes || '',
  };
}

export function AdminPortal() {
  const navigate = useNavigate();
  const { slug: clientSlug } = useParams();
  const [step, setStep] = useState('loading');
  const [page, setPage] = useState('dashboard');
  const [email, setEmail] = useState('comercial.henriquerotsen@gmail.com');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [adminEmail, setAdminEmail] = useState('');
  const [cnpjLoading, setCnpjLoading] = useState(false);
  const [activeClient, setActiveClient] = useState(null);
  const [clientDetailLoading, setClientDetailLoading] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [emittingInvoiceId, setEmittingInvoiceId] = useState(null);
  const [pdfPreview, setPdfPreview] = useState(null);

  const [dashboard, setDashboard] = useState(null);
  const [clients, setClients] = useState([]);
  const [clientSelectOptions, setClientSelectOptions] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [nfseDocuments, setNfseDocuments] = useState([]);
  const [clientsPage, setClientsPage] = useState(1);
  const [invoicesPage, setInvoicesPage] = useState(1);
  const [nfsePage, setNfsePage] = useState(1);
  const [dashboardRecentPage, setDashboardRecentPage] = useState(1);
  const [dashboardOverduePage, setDashboardOverduePage] = useState(1);
  const [clientsPagination, setClientsPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  const [invoicesPagination, setInvoicesPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  const [nfsePagination, setNfsePagination] = useState({ page: 1, totalPages: 1, total: 0 });
  const [clientForm, setClientForm] = useState(emptyClient);
  const [invoiceForm, setInvoiceForm] = useState({
    clientId: '',
    dueDate: '',
    paymentLink: '',
    notes: '',
    items: [{ ...emptyItem }],
  });
  const [nfseForm, setNfseForm] = useState(emptyNfse);
  const [nfseFile, setNfseFile] = useState(null);
  const [nfseUploading, setNfseUploading] = useState(false);

  const loadDashboard = useCallback(async (recentPage = 1, overduePage = 1) => {
    const dash = await billingApi.getDashboard({
      recentPage,
      overduePage,
      limit: PAGE_SIZE,
    });
    setDashboard(dash);
  }, []);

  const loadClients = useCallback(async (pageNumber = 1) => {
    const data = await billingApi.listClients({ page: pageNumber, limit: PAGE_SIZE });
    setClients(data.clients);
    setClientsPagination(data.pagination);
  }, []);

  const loadInvoices = useCallback(async (pageNumber = 1) => {
    const data = await billingApi.listInvoices({ page: pageNumber, limit: PAGE_SIZE });
    setInvoices(data.invoices);
    setInvoicesPagination(data.pagination);
  }, []);

  const loadNfse = useCallback(async (pageNumber = 1) => {
    const data = await billingApi.listNfse({ page: pageNumber, limit: PAGE_SIZE });
    setNfseDocuments(data.documents);
    setNfsePagination(data.pagination);
  }, []);

  const loadClientOptions = useCallback(async () => {
    const data = await billingApi.listClientOptions();
    setClientSelectOptions(data.clients);
  }, []);

  const refreshCurrentView = useCallback(async () => {
    if (page === 'dashboard') {
      await loadDashboard(dashboardRecentPage, dashboardOverduePage);
    } else if (page === 'clients') {
      await loadClients(clientsPage);
    } else if (page === 'invoices') {
      await loadInvoices(invoicesPage);
    } else if (page === 'nfse' || page === 'new-nfse') {
      if (page === 'nfse') await loadNfse(nfsePage);
      await loadClientOptions();
    } else if (page === 'new-invoice') {
      await loadClientOptions();
    } else {
      await loadDashboard(dashboardRecentPage, dashboardOverduePage);
    }
  }, [
    page,
    clientsPage,
    invoicesPage,
    nfsePage,
    dashboardRecentPage,
    dashboardOverduePage,
    loadDashboard,
    loadClients,
    loadInvoices,
    loadNfse,
    loadClientOptions,
  ]);

  const loadAdmin = useCallback(async () => {
    try {
      const me = await billingApi.adminMe();
      setAdminEmail(me.email);
      setStep('app');
      await loadDashboard(1, 1);
    } catch {
      setStep('login');
    }
  }, [loadDashboard]);

  useEffect(() => {
    loadAdmin();
  }, [loadAdmin]);

  useEffect(() => {
    if (step !== 'app' || clientSlug) return;
    if (page === 'dashboard') loadDashboard(dashboardRecentPage, dashboardOverduePage);
    if (page === 'clients') loadClients(clientsPage);
    if (page === 'invoices') loadInvoices(invoicesPage);
    if (page === 'nfse') loadNfse(nfsePage);
    if (page === 'new-invoice' || page === 'new-nfse') loadClientOptions();
  }, [
    step,
    page,
    clientSlug,
    clientsPage,
    invoicesPage,
    nfsePage,
    dashboardRecentPage,
    dashboardOverduePage,
    loadDashboard,
    loadClients,
    loadInvoices,
    loadNfse,
    loadClientOptions,
  ]);

  const loadClientDetail = useCallback(async (slug) => {
    setClientDetailLoading(true);
    setError('');
    try {
      const { client } = await billingApi.getClientBySlug(slug);
      setActiveClient(client);
      setClientForm(clientToForm(client));
      setPage('client-detail');
    } catch (err) {
      setError(err.message);
      navigate('/area-restrita/admin');
      setPage('clients');
    } finally {
      setClientDetailLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    if (step !== 'app' || !clientSlug) return;
    loadClientDetail(clientSlug);
  }, [step, clientSlug, loadClientDetail]);

  const navigatePage = (key) => {
    setError('');
    setInfo('');
    if (key !== 'client-detail') {
      navigate('/area-restrita/admin');
      setActiveClient(null);
    }
    if (key === 'clients') setClientsPage(1);
    if (key === 'invoices') setInvoicesPage(1);
    if (key === 'nfse') setNfsePage(1);
    if (key === 'new-nfse' || key === 'new-invoice') {
      loadClientOptions().catch(() => {});
    }
    if (key === 'dashboard') {
      setDashboardRecentPage(1);
      setDashboardOverduePage(1);
    }
    setPage(key);
  };

  const openClient = (slug) => {
    navigate(`/area-restrita/admin/clientes/${slug}`);
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const data = await billingApi.adminLogin(email, password);
      setAdminEmail(data.email);
      setStep('app');
      await refreshCurrentView();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleLogout = async () => {
    await billingApi.adminLogout();
    setStep('login');
    setPassword('');
    setPage('dashboard');
  };

  const handleCnpjLookup = async (cnpjMasked) => {
    const digits = cnpjMasked.replace(/\D/g, '');
    if (digits.length !== 14) return;
    setCnpjLoading(true);
    setError('');
    setInfo('');
    try {
      const data = await billingApi.lookupCnpj(digits);
      setClientForm((prev) => ({
        ...prev,
        legalName: data.legalName || prev.legalName,
        billingEmail: data.billingEmail || prev.billingEmail,
        contactPhone: data.contactPhone ? maskPhoneInput(data.contactPhone) : prev.contactPhone,
        addressStreet: data.addressStreet || prev.addressStreet,
        addressNumber: data.addressNumber || prev.addressNumber,
        addressComplement: data.addressComplement || prev.addressComplement,
        addressNeighborhood: data.addressNeighborhood || prev.addressNeighborhood,
        addressCity: data.addressCity || prev.addressCity,
        addressState: data.addressState || prev.addressState,
        addressZip: data.addressZip || prev.addressZip,
        contactName: data.tradeName || prev.contactName,
      }));
      if (data.status) setInfo(`Situação cadastral: ${data.status}`);
    } catch (err) {
      setError(err.message);
    } finally {
      setCnpjLoading(false);
    }
  };

  const handleCepLookup = async (cepMasked) => {
    const data = await fetchCep(cepMasked);
    if (!data) return;
    setClientForm((prev) => ({
      ...prev,
      addressStreet: data.addressStreet || prev.addressStreet,
      addressNeighborhood: data.addressNeighborhood || prev.addressNeighborhood,
      addressCity: data.addressCity || prev.addressCity,
      addressState: data.addressState || prev.addressState,
    }));
  };

  const handleCreateClient = async (e) => {
    e.preventDefault();
    setError('');
    setInfo('');
    try {
      const { client } = await billingApi.createClient({
        legalName: clientForm.legalName,
        cnpj: clientForm.cnpj.replace(/\D/g, ''),
        billingEmail: clientForm.billingEmail,
        contactName: clientForm.contactName,
        contactPhone: clientForm.contactPhone,
        addressStreet: clientForm.addressStreet,
        addressNumber: clientForm.addressNumber,
        addressComplement: clientForm.addressComplement,
        addressNeighborhood: clientForm.addressNeighborhood,
        addressCity: clientForm.addressCity,
        addressState: clientForm.addressState,
        addressZip: clientForm.addressZip,
        notes: clientForm.notes,
      });
      setClientForm(emptyClient);
      await refreshCurrentView();
      openClient(client.slug);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleUpdateClient = async (e) => {
    e.preventDefault();
    if (!clientSlug) return;
    setError('');
    setInfo('');
    try {
      const { client } = await billingApi.updateClientBySlug(clientSlug, {
        legalName: clientForm.legalName,
        cnpj: clientForm.cnpj.replace(/\D/g, ''),
        billingEmail: clientForm.billingEmail,
        contactName: clientForm.contactName,
        contactPhone: clientForm.contactPhone,
        addressStreet: clientForm.addressStreet,
        addressNumber: clientForm.addressNumber,
        addressComplement: clientForm.addressComplement,
        addressNeighborhood: clientForm.addressNeighborhood,
        addressCity: clientForm.addressCity,
        addressState: clientForm.addressState,
        addressZip: clientForm.addressZip,
        notes: clientForm.notes,
      });
      setActiveClient(client);
      setClientForm(clientToForm(client));
      await refreshCurrentView();
      setInfo('Cliente atualizado com sucesso.');
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDeleteClient = async (cnpj) => {
    if (!clientSlug) return;
    setDeleteLoading(true);
    setError('');
    try {
      await billingApi.deactivateClientBySlug(clientSlug, cnpj);
      setDeleteModalOpen(false);
      setActiveClient(null);
      await refreshCurrentView();
      navigate('/area-restrita/admin');
      setPage('clients');
    } catch (err) {
      setError(err.message);
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleCreateInvoice = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await billingApi.createInvoice(buildInvoicePayload());
      setInvoiceForm({ clientId: '', dueDate: '', paymentLink: '', notes: '', items: [{ ...emptyItem }] });
      await refreshCurrentView();
      setPage('invoices');
    } catch (err) {
      setError(err.message);
    }
  };

  const handleEmit = async (id) => {
    setError('');
    setEmittingInvoiceId(id);
    try {
      await billingApi.emitInvoice(id);
      await refreshCurrentView();
    } catch (err) {
      setError(err.message);
    } finally {
      setEmittingInvoiceId(null);
    }
  };

  const handleStatus = async (id, status) => {
    setError('');
    try {
      await billingApi.updateInvoiceStatus(id, status);
      await refreshCurrentView();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDeleteInvoice = async (id, number) => {
    if (!window.confirm(`Excluir a fatura ${number}? Esta ação não pode ser desfeita.`)) return;
    setError('');
    try {
      await billingApi.deleteInvoice(id);
      setInfo('Fatura excluída com sucesso.');
      await refreshCurrentView();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDownload = async (id, number) => {
    try {
      const blob = await billingApi.downloadAdminPdf(id);
      await downloadBlob(blob, invoicePdfFilename(number));
    } catch (err) {
      setError(err.message);
    }
  };

  const handleUploadNfse = async (e) => {
    e.preventDefault();
    setError('');
    setInfo('');
    if (!nfseFile) {
      setError('Selecione o PDF da NFS-e.');
      return;
    }
    if (!nfseForm.clientId || !nfseForm.accessKey || !nfseForm.number || !nfseForm.competenceDate) {
      setError('Cliente, chave de acesso, número e competência são obrigatórios.');
      return;
    }

    setNfseUploading(true);
    try {
      const formData = new FormData();
      formData.append('pdf', nfseFile);
      formData.append('clientId', nfseForm.clientId);
      formData.append('accessKey', nfseForm.accessKey.replace(/\D/g, ''));
      formData.append('number', nfseForm.number.trim());
      formData.append('competenceDate', nfseForm.competenceDate);
      if (nfseForm.issuedAt) formData.append('issuedAt', nfseForm.issuedAt.trim());
      if (nfseForm.dpsNumber) formData.append('dpsNumber', nfseForm.dpsNumber.trim());
      if (nfseForm.dpsSeries) formData.append('dpsSeries', nfseForm.dpsSeries.trim());
      if (nfseForm.takerName) formData.append('takerName', nfseForm.takerName.trim());
      if (nfseForm.takerCnpj) formData.append('takerCnpj', nfseForm.takerCnpj.replace(/\D/g, ''));
      if (nfseForm.serviceCode) formData.append('serviceCode', nfseForm.serviceCode.trim());
      if (nfseForm.serviceDescription) formData.append('serviceDescription', nfseForm.serviceDescription.trim());
      formData.append('amountCents', String(reaisInputToCents(nfseForm.amount)));
      if (nfseForm.municipality) formData.append('municipality', nfseForm.municipality.trim());

      await billingApi.uploadNfse(formData);
      setNfseForm(emptyNfse);
      setNfseFile(null);
      setInfo('NFS-e enviada com sucesso.');
      setPage('nfse');
      setNfsePage(1);
      await loadNfse(1);
    } catch (err) {
      setError(err.message);
    } finally {
      setNfseUploading(false);
    }
  };

  const handleDeleteNfse = async (id, number) => {
    if (!window.confirm(`Excluir a NFS-e ${number}? Esta ação não pode ser desfeita.`)) return;
    setError('');
    try {
      await billingApi.deleteNfse(id);
      setInfo('NFS-e excluída.');
      await loadNfse(nfsePage);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDownloadNfse = async (doc) => {
    try {
      const blob = await billingApi.downloadAdminNfsePdf(doc.id);
      await downloadBlob(blob, nfsePdfFilename(doc));
    } catch (err) {
      setError(err.message);
    }
  };

  const buildInvoicePayload = () => ({
    clientId: invoiceForm.clientId,
    dueDate: invoiceForm.dueDate,
    paymentLink: invoiceForm.paymentLink,
    notes: invoiceForm.notes,
    items: invoiceForm.items.map((item) => ({
      description: item.description,
      quantity: parseFloat(item.quantity) || 1,
      unitPriceCents: Math.round(parseFloat(item.unitPriceCents) * 100) || 0,
    })),
  });

  const closePdfPreview = useCallback(() => {
    setPdfPreview(null);
  }, []);

  const showHtmlPreview = useCallback((html, title) => {
    setPdfPreview({
      title,
      html,
      loading: false,
    });
  }, []);

  const handlePreviewDraft = async () => {
    setError('');
    if (!invoiceForm.clientId || !invoiceForm.dueDate) {
      setError('Selecione o cliente e a data de vencimento para ver a prévia.');
      return;
    }
    if (invoiceForm.items.some((item) => !item.description?.trim())) {
      setError('Preencha a descrição de todos os itens para ver a prévia.');
      return;
    }

    setPreviewLoading(true);
    setPdfPreview({ title: 'Prévia da fatura', loading: true });
    try {
      const html = await billingApi.previewInvoice(buildInvoicePayload());
      showHtmlPreview(html, 'Prévia da fatura');
    } catch (err) {
      setPdfPreview(null);
      setError(err.message);
    } finally {
      setPreviewLoading(false);
    }
  };

  const handlePreviewInvoice = async (id, number) => {
    setError('');
    setPdfPreview({ title: `Prévia — ${number}`, loading: true });
    try {
      const html = await billingApi.previewInvoicePdf(id);
      showHtmlPreview(html, `Prévia — ${number}`);
    } catch (err) {
      setPdfPreview(null);
      setError(err.message);
    }
  };

  const updateInvoiceItem = (idx, field, value) => {
    setInvoiceForm((prev) => {
      const items = [...prev.items];
      items[idx] = { ...items[idx], [field]: value };
      return { ...prev, items };
    });
  };

  const removeInvoiceItem = (idx) => {
    setInvoiceForm((prev) => {
      if (prev.items.length <= 1) return prev;
      return { ...prev, items: prev.items.filter((_, itemIdx) => itemIdx !== idx) };
    });
  };

  const getInvoiceItemTotalCents = (item) => {
    const quantity = parseFloat(item.quantity) || 0;
    const unitReais = parseFloat(item.unitPriceCents) || 0;
    return Math.round(quantity * unitReais * 100);
  };

  const invoiceItemsTotalCents = invoiceForm.items.reduce(
    (sum, item) => sum + getInvoiceItemTotalCents(item),
    0
  );

  const maxRevenue = dashboard?.revenueByMonth?.length
    ? Math.max(...dashboard.revenueByMonth.map((m) => m.totalCents))
    : 0;

  const invoiceClientOptions = clientSelectOptions.map((c) => ({
    value: c.id,
    label: c.legalName,
    hint: c.cnpjFormatted || c.cnpjMasked,
    searchText: [c.legalName, c.cnpjFormatted, c.cnpjMasked, c.billingEmail, c.addressCity]
      .filter(Boolean)
      .join(' '),
  }));

  if (step === 'loading') {
    return <div className="admin-loading">Carregando...</div>;
  }

  if (step === 'login') {
    return (
      <AreaRestritaLayout>
        <AreaBack />
        <AreaCard mark>
          <h2>Administração</h2>
          {error && <div className="area-alert area-alert-error">{error}</div>}
          <form className="area-form" onSubmit={handleLogin}>
            <label htmlFor="email">E-mail</label>
            <input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            <label htmlFor="password">Senha</label>
            <PasswordInput
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <button type="submit" className="area-btn">Entrar</button>
          </form>
        </AreaCard>
      </AreaRestritaLayout>
    );
  }

  return (
    <AdminShell
      userEmail={adminEmail}
      activePage={page === 'client-detail' ? 'clients' : page === 'new-nfse' ? 'nfse' : page}
      onNavigate={navigatePage}
      onLogout={handleLogout}
    >
      {error && <div className="admin-alert admin-alert--error">{error}</div>}
      {info && <div className="admin-alert admin-alert--info">{info}</div>}

      {page === 'dashboard' && dashboard && (
        <>
          <AdminPageHeader
            title="Insights"
            subtitle="Visão geral do faturamento e pendências"
          />
          <div className="admin-stats">
            <StatCard
              icon="revenue"
              label="Faturado no mês"
              value={formatBRL(dashboard.summary.paidThisMonthCents)}
              hint="Recebido neste período"
            />
            <StatCard
              icon="pending"
              label="Pendente"
              value={formatBRL(dashboard.summary.pendingCents)}
              hint="Enviadas e aguardando pagamento"
              tone="soft"
            />
            <StatCard
              icon="overdue"
              label="Atrasadas"
              value={dashboard.summary.overdueCount}
              hint={dashboard.summary.overdueCount === 1 ? 'Fatura vencida' : 'Faturas vencidas'}
              tone="warning"
            />
            <StatCard
              icon="clients"
              label="Clientes ativos"
              value={dashboard.summary.activeClients}
              hint="Cadastros em operação"
            />
          </div>

          {dashboard.revenueByMonth?.length > 0 && (
            <div className="admin-panel">
              <div className="admin-panel__header">
                <h2>Receita por mês</h2>
              </div>
              <div className="admin-revenue-bars">
                {[...dashboard.revenueByMonth].reverse().slice(-6).map((m) => (
                  <div key={m.month} className="admin-revenue-bar">
                    <div
                      className="admin-revenue-bar__fill"
                      style={{ height: `${maxRevenue ? (m.totalCents / maxRevenue) * 100 : 0}%` }}
                      title={formatBRL(m.totalCents)}
                    />
                    <span>{m.month.slice(5)}/{m.month.slice(2, 4)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {(dashboard.overduePagination?.total || 0) > 0 && (
            <div className="admin-panel">
              <div className="admin-panel__header">
                <h2>Faturas em atraso</h2>
              </div>
              <div className="admin-table-wrap">
                <table className="admin-table">
                  <thead>
                    <tr><th>Número</th><th>Cliente</th><th>Vencimento</th><th>Valor</th></tr>
                  </thead>
                  <tbody>
                    {dashboard.overdueInvoices.map((inv) => (
                      <tr key={inv.id}>
                        <td>{inv.number}</td>
                        <td>{inv.clientName}</td>
                        <td>{formatDate(inv.dueDate)}</td>
                        <td>{formatBRL(inv.totalCents)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <Pagination
                page={dashboard.overduePagination.page}
                totalPages={dashboard.overduePagination.totalPages}
                total={dashboard.overduePagination.total}
                onPageChange={setDashboardOverduePage}
              />
            </div>
          )}

          <div className="admin-panel">
            <div className="admin-panel__header">
              <h2>Faturas recentes</h2>
            </div>
            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead>
                  <tr><th>Número</th><th>Cliente</th><th>Status</th><th>Valor</th></tr>
                </thead>
                <tbody>
                  {dashboard.recentInvoices.length === 0 ? (
                    <tr>
                      <td colSpan={4}>Nenhuma fatura encontrada.</td>
                    </tr>
                  ) : (
                    dashboard.recentInvoices.map((inv) => (
                      <tr key={inv.id}>
                        <td>{inv.number}</td>
                        <td>{inv.clientName}</td>
                        <td><StatusBadge status={inv.status} /></td>
                        <td>{formatBRL(inv.totalCents)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            <Pagination
              page={dashboard.recentPagination.page}
              totalPages={dashboard.recentPagination.totalPages}
              total={dashboard.recentPagination.total}
              onPageChange={setDashboardRecentPage}
            />
          </div>
        </>
      )}

      {page === 'clients' && (
        <>
          <AdminPageHeader
            title="Clientes"
            subtitle={`${clientsPagination.total} cadastrados`}
            action={
              <button type="button" className="admin-btn" onClick={() => navigatePage('new-client')}>
                Novo cliente
              </button>
            }
          />
          <div className="admin-panel">
            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Nome</th>
                    <th>CNPJ</th>
                    <th>E-mail</th>
                    <th>Cidade</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {clients.map((c) => (
                    <tr
                      key={c.id}
                      className="admin-table__row-link"
                      onClick={() => c.slug && openClient(c.slug)}
                    >
                      <td>{c.legalName}</td>
                      <td>{c.cnpjFormatted || c.cnpjMasked}</td>
                      <td>{c.billingEmail}</td>
                      <td>{c.addressCity ? `${c.addressCity} - ${c.addressState || ''}` : '—'}</td>
                      <td><StatusBadge status={c.status} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pagination
              page={clientsPagination.page}
              totalPages={clientsPagination.totalPages}
              total={clientsPagination.total}
              onPageChange={setClientsPage}
            />
          </div>
        </>
      )}

      {page === 'invoices' && (
        <>
          <AdminPageHeader
            title="Faturas"
            subtitle={`${invoicesPagination.total} no total`}
            action={
              <button type="button" className="admin-btn" onClick={() => navigatePage('new-invoice')}>
                Nova fatura
              </button>
            }
          />
          <div className="admin-panel">
            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Número</th>
                    <th>Cliente</th>
                    <th>Vencimento</th>
                    <th>Valor</th>
                    <th>Status</th>
                    <th>Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {invoices.map((inv) => (
                    <tr key={inv.id}>
                      <td>{inv.number}</td>
                      <td>{inv.clientName}</td>
                      <td>{formatDate(inv.dueDate)}</td>
                      <td>{formatBRL(inv.totalCents)}</td>
                      <td><StatusBadge status={inv.status} /></td>
                      <td>
                        <div className="admin-table__actions">
                          {inv.status === 'rascunho' && (
                            <>
                              <button
                                type="button"
                                className="admin-btn admin-btn--sm admin-btn--secondary"
                                onClick={() => handlePreviewInvoice(inv.id, inv.number)}
                              >
                                Ver rascunho
                              </button>
                              <button
                                type="button"
                                className="admin-btn admin-btn--sm"
                                onClick={() => handleEmit(inv.id)}
                                disabled={emittingInvoiceId === inv.id}
                              >
                                {emittingInvoiceId === inv.id ? 'Emitindo...' : 'Emitir'}
                              </button>
                              <button
                                type="button"
                                className="admin-btn admin-btn--sm admin-btn--danger"
                                onClick={() => handleDeleteInvoice(inv.id, inv.number)}
                              >
                                Excluir
                              </button>
                            </>
                          )}
                          {inv.hasPdf && (
                            <button type="button" className="admin-btn admin-btn--sm admin-btn--secondary" onClick={() => handleDownload(inv.id, inv.number)}>
                              PDF
                            </button>
                          )}
                          {inv.status === 'enviada' && (
                            <button type="button" className="admin-btn admin-btn--sm admin-btn--secondary" onClick={() => handleStatus(inv.id, 'paga')}>
                              Marcar paga
                            </button>
                          )}
                          {['enviada', 'atrasada'].includes(inv.status) && (
                            <button type="button" className="admin-btn admin-btn--sm admin-btn--danger" onClick={() => handleStatus(inv.id, 'cancelada')}>
                              Cancelar
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pagination
              page={invoicesPagination.page}
              totalPages={invoicesPagination.totalPages}
              total={invoicesPagination.total}
              onPageChange={setInvoicesPage}
            />
          </div>
        </>
      )}

      {page === 'nfse' && (
        <>
          <AdminPageHeader
            title="NFS-e"
            subtitle={`${nfsePagination.total} documento${nfsePagination.total === 1 ? '' : 's'} arquivado${nfsePagination.total === 1 ? '' : 's'}. Essas notas também aparecerão para os clientes.`}
            action={
              <button type="button" className="admin-btn" onClick={() => navigatePage('new-nfse')}>
                Enviar NFS-e
              </button>
            }
          />
          <div className="admin-panel">
            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Número</th>
                    <th>Cliente</th>
                    <th>Competência</th>
                    <th>Valor</th>
                    <th>Tomador</th>
                    <th>Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {nfseDocuments.length === 0 ? (
                    <tr>
                      <td colSpan={6}>Nenhuma NFS-e arquivada.</td>
                    </tr>
                  ) : (
                    nfseDocuments.map((doc) => (
                      <tr key={doc.id}>
                        <td>{doc.number}</td>
                        <td>{doc.clientName}</td>
                        <td>{formatDate(doc.competenceDate)}</td>
                        <td>{formatBRL(doc.amountCents)}</td>
                        <td>{doc.takerName || '—'}</td>
                        <td>
                          <div className="admin-table__actions">
                            <button
                              type="button"
                              className="admin-btn admin-btn--sm admin-btn--secondary"
                              onClick={() => handleDownloadNfse(doc)}
                            >
                              PDF
                            </button>
                            <button
                              type="button"
                              className="admin-btn admin-btn--sm admin-btn--danger"
                              onClick={() => handleDeleteNfse(doc.id, doc.number)}
                            >
                              Excluir
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            <Pagination
              page={nfsePagination.page}
              totalPages={nfsePagination.totalPages}
              total={nfsePagination.total}
              onPageChange={setNfsePage}
            />
          </div>
        </>
      )}

      {page === 'new-nfse' && (
        <>
          <AdminPageHeader
            title="Enviar NFS-e"
            subtitle="Solte o PDF da DANFSe — os dados são lidos automaticamente. A nota também aparecerá no portal do cliente."
          />
          <div className="admin-panel admin-panel--nfse-form" style={{ padding: 20 }}>
            <NfseUploadForm
              form={nfseForm}
              setForm={setNfseForm}
              file={nfseFile}
              setFile={setNfseFile}
              clientOptions={invoiceClientOptions}
              uploading={nfseUploading}
              onCancel={() => navigatePage('nfse')}
              onSubmit={handleUploadNfse}
            />
          </div>
        </>
      )}

      {page === 'new-client' && (
        <>
          <AdminPageHeader
            title="Novo cliente"
            subtitle="Preencha o CNPJ para buscar os dados automaticamente"
          />
          <div className="admin-panel">
            <form className="admin-form" onSubmit={handleCreateClient}>
              <div className="admin-form-section">
                <h3>Dados da empresa</h3>
                <div className="admin-form-grid">
                  <div className="admin-field">
                    <label>CNPJ</label>
                    <input
                      value={clientForm.cnpj}
                      onChange={(e) => setClientForm({ ...clientForm, cnpj: maskCnpjInput(e.target.value) })}
                      onBlur={(e) => handleCnpjLookup(e.target.value)}
                      placeholder="00.000.000/0000-00"
                      required
                    />
                    {cnpjLoading && <small style={{ color: '#6b6b6b' }}>Consultando Receita Federal...</small>}
                  </div>
                  <div className="admin-field">
                    <label>Razão social</label>
                    <input
                      value={clientForm.legalName}
                      onChange={(e) => setClientForm({ ...clientForm, legalName: e.target.value })}
                      required
                    />
                  </div>
                  <div className="admin-field">
                    <label>Nome fantasia / contato</label>
                    <input
                      value={clientForm.contactName}
                      onChange={(e) => setClientForm({ ...clientForm, contactName: e.target.value })}
                    />
                  </div>
                  <div className="admin-field">
                    <label>E-mail de faturamento</label>
                    <input
                      type="email"
                      value={clientForm.billingEmail}
                      onChange={(e) => setClientForm({ ...clientForm, billingEmail: e.target.value })}
                      required
                    />
                  </div>
                  <div className="admin-field">
                    <label>Telefone</label>
                    <input
                      value={clientForm.contactPhone}
                      onChange={(e) => setClientForm({ ...clientForm, contactPhone: maskPhoneInput(e.target.value) })}
                      placeholder="(31) 99999-9999"
                    />
                  </div>
                </div>
              </div>

              <div className="admin-form-section">
                <h3>Endereço</h3>
                <div className="admin-form-grid admin-form-grid--3">
                  <div className="admin-field">
                    <label>CEP</label>
                    <input
                      value={clientForm.addressZip}
                      onChange={(e) => setClientForm({ ...clientForm, addressZip: maskCepInput(e.target.value) })}
                      onBlur={(e) => handleCepLookup(e.target.value)}
                      placeholder="00000-000"
                    />
                  </div>
                  <div className="admin-field" style={{ gridColumn: 'span 2' }}>
                    <label>Logradouro</label>
                    <input
                      value={clientForm.addressStreet}
                      onChange={(e) => setClientForm({ ...clientForm, addressStreet: e.target.value })}
                    />
                  </div>
                  <div className="admin-field">
                    <label>Número</label>
                    <input
                      value={clientForm.addressNumber}
                      onChange={(e) => setClientForm({ ...clientForm, addressNumber: e.target.value })}
                    />
                  </div>
                  <div className="admin-field">
                    <label>Complemento</label>
                    <input
                      value={clientForm.addressComplement}
                      onChange={(e) => setClientForm({ ...clientForm, addressComplement: e.target.value })}
                    />
                  </div>
                  <div className="admin-field">
                    <label>Bairro</label>
                    <input
                      value={clientForm.addressNeighborhood}
                      onChange={(e) => setClientForm({ ...clientForm, addressNeighborhood: e.target.value })}
                    />
                  </div>
                  <div className="admin-field">
                    <label>Cidade</label>
                    <input
                      value={clientForm.addressCity}
                      onChange={(e) => setClientForm({ ...clientForm, addressCity: e.target.value })}
                    />
                  </div>
                  <div className="admin-field">
                    <label>UF</label>
                    <select
                      value={clientForm.addressState}
                      onChange={(e) => setClientForm({ ...clientForm, addressState: e.target.value })}
                    >
                      <option value="">—</option>
                      {UF_LIST.map((uf) => (
                        <option key={uf} value={uf}>{uf}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              <div className="admin-form-section">
                <div className="admin-field full">
                  <label>Observações</label>
                  <textarea
                    rows={3}
                    value={clientForm.notes}
                    onChange={(e) => setClientForm({ ...clientForm, notes: e.target.value })}
                  />
                </div>
              </div>

              <div className="admin-form-actions">
                <button type="submit" className="admin-btn">Salvar cliente</button>
                <button type="button" className="admin-btn admin-btn--secondary" onClick={() => navigatePage('clients')}>
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </>
      )}

      {page === 'client-detail' && (
        <>
          <AdminPageHeader
            title={activeClient?.legalName || 'Cliente'}
            subtitle={clientDetailLoading ? 'Carregando...' : undefined}
            action={
              <button type="button" className="admin-btn admin-btn--secondary" onClick={() => navigatePage('clients')}>
                Voltar
              </button>
            }
          />
          {clientDetailLoading ? (
            <div className="admin-panel admin-form">Carregando cliente...</div>
          ) : activeClient ? (
            <div className="admin-panel">
              <div className="admin-client-meta">
                <div>
                  <span className="admin-modal__label">CNPJ</span>
                  <p>{activeClient.cnpjFormatted || activeClient.cnpjMasked}</p>
                </div>
                <div>
                  <span className="admin-modal__label">Status</span>
                  <p><StatusBadge status={activeClient.status} /></p>
                </div>
                <div>
                  <span className="admin-modal__label">Endereço</span>
                  <p>{formatAddressLine(activeClient) || '—'}</p>
                </div>
              </div>
              <form className="admin-form" onSubmit={handleUpdateClient}>
                <div className="admin-form-section">
                  <h3>Editar dados</h3>
                  <div className="admin-form-grid">
                    <div className="admin-field">
                      <label>CNPJ</label>
                      <input
                        value={clientForm.cnpj}
                        onChange={(e) => setClientForm({ ...clientForm, cnpj: maskCnpjInput(e.target.value) })}
                        onBlur={(e) => handleCnpjLookup(e.target.value)}
                        placeholder={
                          activeClient.cnpjFormatted
                            ? '00.000.000/0000-00'
                            : `Informe o CNPJ completo (termina em ${activeClient.cnpjMasked?.slice(-4) || '????'})`
                        }
                        required
                      />
                    </div>
                    <div className="admin-field">
                      <label>Razão social</label>
                      <input
                        value={clientForm.legalName}
                        onChange={(e) => setClientForm({ ...clientForm, legalName: e.target.value })}
                        required
                      />
                    </div>
                    <div className="admin-field">
                      <label>Nome fantasia / contato</label>
                      <input
                        value={clientForm.contactName}
                        onChange={(e) => setClientForm({ ...clientForm, contactName: e.target.value })}
                      />
                    </div>
                    <div className="admin-field">
                      <label>E-mail de faturamento</label>
                      <input
                        type="email"
                        value={clientForm.billingEmail}
                        onChange={(e) => setClientForm({ ...clientForm, billingEmail: e.target.value })}
                        required
                      />
                    </div>
                    <div className="admin-field">
                      <label>Telefone</label>
                      <input
                        value={clientForm.contactPhone}
                        onChange={(e) => setClientForm({ ...clientForm, contactPhone: maskPhoneInput(e.target.value) })}
                        placeholder="(31) 99999-9999"
                      />
                    </div>
                  </div>
                </div>

                <div className="admin-form-section">
                  <h3>Endereço</h3>
                  <div className="admin-form-grid admin-form-grid--3">
                    <div className="admin-field">
                      <label>CEP</label>
                      <input
                        value={clientForm.addressZip}
                        onChange={(e) => setClientForm({ ...clientForm, addressZip: maskCepInput(e.target.value) })}
                        onBlur={(e) => handleCepLookup(e.target.value)}
                        placeholder="00000-000"
                      />
                    </div>
                    <div className="admin-field" style={{ gridColumn: 'span 2' }}>
                      <label>Logradouro</label>
                      <input
                        value={clientForm.addressStreet}
                        onChange={(e) => setClientForm({ ...clientForm, addressStreet: e.target.value })}
                      />
                    </div>
                    <div className="admin-field">
                      <label>Número</label>
                      <input
                        value={clientForm.addressNumber}
                        onChange={(e) => setClientForm({ ...clientForm, addressNumber: e.target.value })}
                      />
                    </div>
                    <div className="admin-field">
                      <label>Complemento</label>
                      <input
                        value={clientForm.addressComplement}
                        onChange={(e) => setClientForm({ ...clientForm, addressComplement: e.target.value })}
                      />
                    </div>
                    <div className="admin-field">
                      <label>Bairro</label>
                      <input
                        value={clientForm.addressNeighborhood}
                        onChange={(e) => setClientForm({ ...clientForm, addressNeighborhood: e.target.value })}
                      />
                    </div>
                    <div className="admin-field">
                      <label>Cidade</label>
                      <input
                        value={clientForm.addressCity}
                        onChange={(e) => setClientForm({ ...clientForm, addressCity: e.target.value })}
                      />
                    </div>
                    <div className="admin-field">
                      <label>UF</label>
                      <select
                        value={clientForm.addressState}
                        onChange={(e) => setClientForm({ ...clientForm, addressState: e.target.value })}
                      >
                        <option value="">—</option>
                        {UF_LIST.map((uf) => (
                          <option key={uf} value={uf}>{uf}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                <div className="admin-form-section">
                  <div className="admin-field full">
                    <label>Observações</label>
                    <textarea
                      rows={3}
                      value={clientForm.notes}
                      onChange={(e) => setClientForm({ ...clientForm, notes: e.target.value })}
                    />
                  </div>
                </div>

                <div className="admin-form-actions">
                  <button type="submit" className="admin-btn">Salvar alterações</button>
                  <button
                    type="button"
                    className="admin-btn admin-btn--danger"
                    onClick={() => setDeleteModalOpen(true)}
                  >
                    Excluir cliente
                  </button>
                </div>
              </form>
            </div>
          ) : null}
        </>
      )}

      {page === 'new-invoice' && (
        <>
          <AdminPageHeader title="Nova fatura" subtitle="Crie um rascunho e emita quando estiver pronto" />
          <div className="admin-panel">
            <form className="admin-form" onSubmit={handleCreateInvoice}>
              <div className="admin-form-grid">
                <div className="admin-field">
                  <label>Cliente</label>
                  <SearchableSelect
                    id="invoice-client"
                    value={invoiceForm.clientId}
                    onChange={(value) => setInvoiceForm({ ...invoiceForm, clientId: value })}
                    options={invoiceClientOptions}
                    placeholder="Selecione um cliente..."
                    searchPlaceholder="Buscar por nome, CNPJ ou e-mail"
                    required
                  />
                </div>
                <div className="admin-field">
                  <label>Vencimento</label>
                  <input
                    type="date"
                    value={invoiceForm.dueDate}
                    onChange={(e) => setInvoiceForm({ ...invoiceForm, dueDate: e.target.value })}
                    required
                  />
                </div>
                <div className="admin-field full">
                  <label>Link PIX (do banco)</label>
                  <input
                    value={invoiceForm.paymentLink}
                    onChange={(e) => setInvoiceForm({ ...invoiceForm, paymentLink: e.target.value })}
                    placeholder="Cole o link de pagamento"
                  />
                </div>
                <div className="admin-field full">
                  <label>Descrição detalhada (aparece no PDF)</label>
                  <textarea
                    rows={4}
                    value={invoiceForm.notes}
                    onChange={(e) => setInvoiceForm({ ...invoiceForm, notes: e.target.value })}
                    placeholder="Lista de serviços, formulários, etc."
                  />
                </div>
              </div>

              <div className="admin-form-section">
                <div className="admin-invoice-items__heading">
                  <h3>Itens da fatura</h3>
                  <span className="admin-invoice-items__count">
                    {invoiceForm.items.length} {invoiceForm.items.length === 1 ? 'item' : 'itens'}
                  </span>
                </div>

                <div className="admin-invoice-items">
                  {invoiceForm.items.map((item, idx) => (
                    <div key={idx} className="admin-invoice-item">
                      <div className="admin-invoice-item__header">
                        <span className="admin-invoice-item__number">Item {idx + 1}</span>
                        <button
                          type="button"
                          className="admin-invoice-item__remove"
                          onClick={() => removeInvoiceItem(idx)}
                          disabled={invoiceForm.items.length <= 1}
                          title={invoiceForm.items.length <= 1 ? 'É necessário pelo menos um item' : 'Remover item'}
                          aria-label={`Remover item ${idx + 1}`}
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden="true">
                            <path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6" />
                            <path d="M10 11v6M14 11v6" />
                          </svg>
                          Remover
                        </button>
                      </div>

                      <div className="admin-invoice-item__body">
                        <div className="admin-field admin-invoice-item__description">
                          <label htmlFor={`invoice-item-desc-${idx}`}>Descrição</label>
                          <input
                            id={`invoice-item-desc-${idx}`}
                            value={item.description}
                            onChange={(e) => updateInvoiceItem(idx, 'description', e.target.value)}
                            placeholder="Ex.: Consultoria mensal"
                            required
                          />
                        </div>
                        <div className="admin-field">
                          <label htmlFor={`invoice-item-qty-${idx}`}>Quantidade</label>
                          <input
                            id={`invoice-item-qty-${idx}`}
                            type="number"
                            min="0.01"
                            step="0.01"
                            value={item.quantity}
                            onChange={(e) => updateInvoiceItem(idx, 'quantity', e.target.value)}
                          />
                        </div>
                        <div className="admin-field">
                          <label htmlFor={`invoice-item-price-${idx}`}>Valor unitário (R$)</label>
                          <input
                            id={`invoice-item-price-${idx}`}
                            type="number"
                            min="0"
                            step="0.01"
                            value={item.unitPriceCents}
                            onChange={(e) => updateInvoiceItem(idx, 'unitPriceCents', e.target.value)}
                            placeholder="0,00"
                            required
                          />
                        </div>
                        <div className="admin-invoice-item__subtotal">
                          <span className="admin-invoice-item__subtotal-label">Subtotal</span>
                          <strong>{formatBRL(getInvoiceItemTotalCents(item))}</strong>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="admin-invoice-items__footer">
                  <button
                    type="button"
                    className="admin-btn admin-btn--secondary admin-btn--sm"
                    onClick={() => setInvoiceForm((p) => ({ ...p, items: [...p.items, { ...emptyItem }] }))}
                  >
                    + Adicionar item
                  </button>
                  <div className="admin-invoice-items__total">
                    <span>Total da fatura</span>
                    <strong>{formatBRL(invoiceItemsTotalCents)}</strong>
                  </div>
                </div>
              </div>

              <div className="admin-form-actions">
                <button type="button" className="admin-btn admin-btn--secondary" onClick={handlePreviewDraft} disabled={previewLoading}>
                  {previewLoading ? 'Gerando prévia...' : 'Ver prévia do PDF'}
                </button>
                <button type="submit" className="admin-btn">Criar rascunho</button>
                <button type="button" className="admin-btn admin-btn--secondary" onClick={() => navigatePage('invoices')}>
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </>
      )}

      {pdfPreview && (
        <InvoicePdfPreviewModal
          title={pdfPreview.title}
          html={pdfPreview.html}
          loading={pdfPreview.loading}
          onClose={closePdfPreview}
        />
      )}

      {deleteModalOpen && activeClient && (
        <DeleteClientModal
          client={activeClient}
          onClose={() => setDeleteModalOpen(false)}
          onConfirm={handleDeleteClient}
          loading={deleteLoading}
        />
      )}
    </AdminShell>
  );
}
