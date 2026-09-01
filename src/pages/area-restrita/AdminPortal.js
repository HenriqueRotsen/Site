import React, { useEffect, useState, useCallback } from 'react';
import { billingApi, formatBRL, formatDate, maskCnpjInput, downloadBlob } from '../../api/billing';
import { AreaRestritaLayout, AreaCard, AreaBack } from './AreaRestritaLayout';
import '../../styles/AreaRestrita.css';

const STATUS_LABELS = {
  rascunho: 'Rascunho',
  enviada: 'Enviada',
  paga: 'Paga',
  atrasada: 'Atrasada',
  cancelada: 'Cancelada',
};

function StatusBadge({ status }) {
  return <span className={`status-badge status-${status}`}>{STATUS_LABELS[status] || status}</span>;
}

const emptyClient = { legalName: '', cnpj: '', billingEmail: '', contactName: '', contactPhone: '', notes: '' };
const emptyItem = { description: '', quantity: 1, unitPriceCents: 0 };

export function AdminPortal() {
  const [step, setStep] = useState('loading');
  const [tab, setTab] = useState('dashboard');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [adminEmail, setAdminEmail] = useState('');

  const [dashboard, setDashboard] = useState(null);
  const [clients, setClients] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [clientForm, setClientForm] = useState(emptyClient);
  const [invoiceForm, setInvoiceForm] = useState({
    clientId: '',
    dueDate: '',
    paymentLink: '',
    notes: '',
    items: [{ ...emptyItem }],
  });

  const refreshAll = useCallback(async () => {
    const [dash, cls, inv] = await Promise.all([
      billingApi.getDashboard(),
      billingApi.listClients(),
      billingApi.listInvoices(),
    ]);
    setDashboard(dash);
    setClients(cls.clients);
    setInvoices(inv.invoices);
  }, []);

  const loadAdmin = useCallback(async () => {
    try {
      const me = await billingApi.adminMe();
      setAdminEmail(me.email);
      setStep('app');
      await refreshAll();
    } catch {
      setStep('login');
    }
  }, [refreshAll]);

  useEffect(() => {
    loadAdmin();
  }, [loadAdmin]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const data = await billingApi.adminLogin(email, password);
      setAdminEmail(data.email);
      setStep('app');
      await refreshAll();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleLogout = async () => {
    await billingApi.adminLogout();
    setStep('login');
    setPassword('');
  };

  const handleCreateClient = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await billingApi.createClient({
        legalName: clientForm.legalName,
        cnpj: clientForm.cnpj.replace(/\D/g, ''),
        billingEmail: clientForm.billingEmail,
        contactName: clientForm.contactName,
        contactPhone: clientForm.contactPhone,
        notes: clientForm.notes,
      });
      setClientForm(emptyClient);
      await refreshAll();
      setTab('clients');
    } catch (err) {
      setError(err.message);
    }
  };

  const handleCreateInvoice = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const items = invoiceForm.items.map((item) => ({
        description: item.description,
        quantity: parseFloat(item.quantity) || 1,
        unitPriceCents: Math.round(parseFloat(item.unitPriceCents) * 100) || 0,
      }));
      await billingApi.createInvoice({
        clientId: invoiceForm.clientId,
        dueDate: invoiceForm.dueDate,
        paymentLink: invoiceForm.paymentLink,
        notes: invoiceForm.notes,
        items,
      });
      setInvoiceForm({ clientId: '', dueDate: '', paymentLink: '', notes: '', items: [{ ...emptyItem }] });
      await refreshAll();
      setTab('invoices');
    } catch (err) {
      setError(err.message);
    }
  };

  const handleEmit = async (id) => {
    setError('');
    try {
      await billingApi.emitInvoice(id);
      await refreshAll();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleStatus = async (id, status) => {
    setError('');
    try {
      await billingApi.updateInvoiceStatus(id, status);
      await refreshAll();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDownload = async (id, number) => {
    try {
      const blob = await billingApi.downloadAdminPdf(id);
      await downloadBlob(blob, `${number}.pdf`);
    } catch (err) {
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

  if (step === 'loading') {
    return (
      <AreaRestritaLayout>
        <AreaCard>Carregando...</AreaCard>
      </AreaRestritaLayout>
    );
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
            <input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
            <button type="submit" className="area-btn">Entrar</button>
          </form>
        </AreaCard>
      </AreaRestritaLayout>
    );
  }

  return (
    <AreaRestritaLayout wide>
      <AreaBack />
      <div className="area-header-row area-page-header">
        <div>
          <h2>Painel administrativo</h2>
          <p>{adminEmail}</p>
        </div>
        <button type="button" className="area-btn area-btn-secondary" onClick={handleLogout}>Sair</button>
      </div>

      {error && <div className="area-alert area-alert-error">{error}</div>}

        <div className="area-tabs">
          {['dashboard', 'clients', 'invoices', 'new-client', 'new-invoice'].map((t) => (
            <button
              key={t}
              type="button"
              className={`area-tab ${tab === t ? 'active' : ''}`}
              onClick={() => setTab(t)}
            >
              {{ dashboard: 'Insights', clients: 'Clientes', invoices: 'Faturas', 'new-client': '+ Cliente', 'new-invoice': '+ Fatura' }[t]}
            </button>
          ))}
        </div>

        {tab === 'dashboard' && dashboard && (
          <>
            <div className="area-grid-2" style={{ marginBottom: '1.5rem' }}>
              <div className="area-stat">
                <div className="area-stat-label">Faturado no mês</div>
                <div className="area-stat-value">{formatBRL(dashboard.summary.paidThisMonthCents)}</div>
              </div>
              <div className="area-stat">
                <div className="area-stat-label">Pendente</div>
                <div className="area-stat-value">{formatBRL(dashboard.summary.pendingCents)}</div>
              </div>
              <div className="area-stat">
                <div className="area-stat-label">Atrasadas</div>
                <div className="area-stat-value">{dashboard.summary.overdueCount}</div>
              </div>
              <div className="area-stat">
                <div className="area-stat-label">Clientes ativos</div>
                <div className="area-stat-value">{dashboard.summary.activeClients}</div>
              </div>
            </div>

            {dashboard.overdueInvoices.length > 0 && (
              <div className="area-card">
                <h3>Faturas em atraso</h3>
                <table className="area-table">
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
            )}

            <div className="area-card">
              <h3>Faturas recentes</h3>
              <table className="area-table">
                <thead>
                  <tr><th>Número</th><th>Cliente</th><th>Status</th><th>Valor</th></tr>
                </thead>
                <tbody>
                  {dashboard.recentInvoices.map((inv) => (
                    <tr key={inv.id}>
                      <td>{inv.number}</td>
                      <td>{inv.clientName}</td>
                      <td><StatusBadge status={inv.status} /></td>
                      <td>{formatBRL(inv.totalCents)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        {tab === 'clients' && (
          <div className="area-card">
            <h3>Clientes</h3>
            <table className="area-table">
              <thead>
                <tr><th>Nome</th><th>CNPJ</th><th>E-mail</th><th>Status</th></tr>
              </thead>
              <tbody>
                {clients.map((c) => (
                  <tr key={c.id}>
                    <td>{c.legalName}</td>
                    <td>{c.cnpjMasked}</td>
                    <td>{c.billingEmail}</td>
                    <td>{c.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {tab === 'invoices' && (
          <div className="area-card">
            <h3>Faturas</h3>
            <table className="area-table">
              <thead>
                <tr><th>Número</th><th>Cliente</th><th>Vencimento</th><th>Valor</th><th>Status</th><th>Ações</th></tr>
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
                      <div className="area-actions">
                        {inv.status === 'rascunho' && (
                          <button type="button" className="area-btn" onClick={() => handleEmit(inv.id)}>Emitir</button>
                        )}
                        {inv.hasPdf && (
                          <button type="button" className="area-btn area-btn-secondary" onClick={() => handleDownload(inv.id, inv.number)}>PDF</button>
                        )}
                        {inv.status === 'enviada' && (
                          <button type="button" className="area-btn area-btn-secondary" onClick={() => handleStatus(inv.id, 'paga')}>Marcar paga</button>
                        )}
                        {inv.status !== 'cancelada' && inv.status !== 'paga' && (
                          <button type="button" className="area-btn area-btn-danger" onClick={() => handleStatus(inv.id, 'cancelada')}>Cancelar</button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {tab === 'new-client' && (
          <div className="area-card" style={{ maxWidth: 520 }}>
            <h3>Novo cliente</h3>
            <form className="area-form" onSubmit={handleCreateClient}>
              <label>Razão social</label>
              <input value={clientForm.legalName} onChange={(e) => setClientForm({ ...clientForm, legalName: e.target.value })} required />
              <label>CNPJ</label>
              <input value={clientForm.cnpj} onChange={(e) => setClientForm({ ...clientForm, cnpj: maskCnpjInput(e.target.value) })} required />
              <label>E-mail de faturamento</label>
              <input type="email" value={clientForm.billingEmail} onChange={(e) => setClientForm({ ...clientForm, billingEmail: e.target.value })} required />
              <label>Contato</label>
              <input value={clientForm.contactName} onChange={(e) => setClientForm({ ...clientForm, contactName: e.target.value })} />
              <label>Telefone</label>
              <input value={clientForm.contactPhone} onChange={(e) => setClientForm({ ...clientForm, contactPhone: e.target.value })} />
              <label>Notas</label>
              <textarea rows={3} value={clientForm.notes} onChange={(e) => setClientForm({ ...clientForm, notes: e.target.value })} />
              <button type="submit" className="area-btn">Salvar cliente</button>
            </form>
          </div>
        )}

        {tab === 'new-invoice' && (
          <div className="area-card" style={{ maxWidth: 600 }}>
            <h3>Nova fatura</h3>
            <form className="area-form" onSubmit={handleCreateInvoice}>
              <label>Cliente</label>
              <select value={invoiceForm.clientId} onChange={(e) => setInvoiceForm({ ...invoiceForm, clientId: e.target.value })} required>
                <option value="">Selecione...</option>
                {clients.filter((c) => c.status === 'active').map((c) => (
                  <option key={c.id} value={c.id}>{c.legalName}</option>
                ))}
              </select>
              <label>Vencimento</label>
              <input type="date" value={invoiceForm.dueDate} onChange={(e) => setInvoiceForm({ ...invoiceForm, dueDate: e.target.value })} required />
              <label>Link PIX (do banco)</label>
              <input value={invoiceForm.paymentLink} onChange={(e) => setInvoiceForm({ ...invoiceForm, paymentLink: e.target.value })} placeholder="Cole o link de pagamento" />
              <label>Observações</label>
              <textarea rows={2} value={invoiceForm.notes} onChange={(e) => setInvoiceForm({ ...invoiceForm, notes: e.target.value })} />

              <h4 style={{ marginTop: '1rem' }}>Itens</h4>
              {invoiceForm.items.map((item, idx) => (
                <div key={idx} style={{ marginBottom: '1rem', paddingBottom: '1rem', borderBottom: '1px solid rgba(25,25,25,0.08)' }}>
                  <label>Descrição</label>
                  <input value={item.description} onChange={(e) => updateInvoiceItem(idx, 'description', e.target.value)} required />
                  <label>Quantidade</label>
                  <input type="number" min="0.01" step="0.01" value={item.quantity} onChange={(e) => updateInvoiceItem(idx, 'quantity', e.target.value)} />
                  <label>Valor unitário (R$)</label>
                  <input type="number" min="0" step="0.01" value={item.unitPriceCents} onChange={(e) => updateInvoiceItem(idx, 'unitPriceCents', e.target.value)} required />
                </div>
              ))}
              <button type="button" className="area-btn area-btn-secondary" onClick={() => setInvoiceForm((p) => ({ ...p, items: [...p.items, { ...emptyItem }] }))}>
                + Item
              </button>
              <div style={{ marginTop: '1rem' }}>
                <button type="submit" className="area-btn">Criar rascunho</button>
              </div>
            </form>
          </div>
        )}
    </AreaRestritaLayout>
  );
}
