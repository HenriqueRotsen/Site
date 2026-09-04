import React, { useEffect, useMemo, useState } from 'react';
import {
  billingApi,
  formatBRL,
  formatDate,
  maskCnpjInput,
  maskCnpjDisplay,
  downloadBlob,
  invoicePdfFilename,
  nfsePdfFilename,
} from '../../api/billing';
import { AreaRestritaLayout, AreaCard, AreaBack } from './AreaRestritaLayout';
import { OtpInput } from './OtpInput';
import { ClientShell, AdminPageHeader, StatusBadge, StatCard } from './admin/ClientShell';
import '../../styles/AreaRestrita.css';
import '../../styles/AdminShell.css';

const CLIENT_CNPJ_STORAGE_KEY = 'billing_client_cnpj_digits';

function getCnpjDigits(value) {
  return String(value || '').replace(/\D/g, '');
}

function isOpenInvoice(status) {
  return status === 'enviada' || status === 'atrasada';
}

export function ClientPortal() {
  const [step, setStep] = useState('loading');
  const [page, setPage] = useState('home');
  const [cnpj, setCnpj] = useState('');
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [client, setClient] = useState(null);
  const [invoices, setInvoices] = useState([]);
  const [nfseDocuments, setNfseDocuments] = useState([]);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const loadSession = async () => {
    try {
      const data = await billingApi.clientMe();
      setClient(data.client);
      const [inv, nfse] = await Promise.all([billingApi.clientInvoices(), billingApi.clientNfse()]);
      setInvoices(inv.invoices);
      setNfseDocuments(nfse.documents || []);
      setStep('portal');
    } catch {
      setStep('cnpj');
    }
  };

  useEffect(() => {
    loadSession();
  }, []);

  const summary = useMemo(() => {
    const open = invoices.filter((inv) => isOpenInvoice(inv.status));
    const paid = invoices.filter((inv) => inv.status === 'paga');
    const openTotal = open.reduce((sum, inv) => sum + inv.totalCents, 0);
    const paidTotal = paid.reduce((sum, inv) => sum + inv.totalCents, 0);
    const nextDue = open
      .map((inv) => inv.dueDate)
      .filter(Boolean)
      .sort()[0];

    return {
      openCount: open.length,
      openTotal,
      paidCount: paid.length,
      paidTotal,
      nextDue,
      totalCount: invoices.length,
    };
  }, [invoices]);

  const handleRequestCode = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    const cnpjDigits = getCnpjDigits(cnpj);
    try {
      const res = await billingApi.clientRequestCode(cnpjDigits);
      sessionStorage.setItem(CLIENT_CNPJ_STORAGE_KEY, cnpjDigits);
      setMessage(res.message);
      setStep('code');
    } catch (err) {
      setError(err.message);
    }
  };

  const handleVerify = async (e, codeOverride) => {
    if (e?.preventDefault) e.preventDefault();
    setError('');
    const cnpjDigits = getCnpjDigits(cnpj) || sessionStorage.getItem(CLIENT_CNPJ_STORAGE_KEY) || '';
    const codeValue = String(codeOverride ?? code).replace(/\D/g, '');
    if (cnpjDigits.length !== 14) {
      setError('CNPJ não encontrado nesta sessão. Volte e informe o CNPJ novamente.');
      return;
    }
    if (!/^\d{6}$/.test(codeValue)) {
      setError('Informe o código de 6 dígitos.');
      return;
    }
    try {
      const data = await billingApi.clientVerifyCode(cnpjDigits, codeValue);
      sessionStorage.removeItem(CLIENT_CNPJ_STORAGE_KEY);
      setClient(data.client);
      const [inv, nfse] = await Promise.all([billingApi.clientInvoices(), billingApi.clientNfse()]);
      setInvoices(inv.invoices);
      setNfseDocuments(nfse.documents || []);
      setStep('portal');
      setPage('home');
    } catch (err) {
      setError(err.message);
    }
  };

  const handleResendCode = async () => {
    setError('');
    setMessage('');
    const cnpjDigits = getCnpjDigits(cnpj) || sessionStorage.getItem(CLIENT_CNPJ_STORAGE_KEY) || '';
    if (cnpjDigits.length !== 14) {
      setError('Informe o CNPJ novamente.');
      setStep('cnpj');
      return;
    }
    try {
      const res = await billingApi.clientRequestCode(cnpjDigits);
      sessionStorage.setItem(CLIENT_CNPJ_STORAGE_KEY, cnpjDigits);
      setCode('');
      setMessage(res.message);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleLogout = async () => {
    await billingApi.clientLogout();
    setStep('cnpj');
    setClient(null);
    setInvoices([]);
    setNfseDocuments([]);
    setSelectedInvoice(null);
    setCode('');
    setPage('home');
  };

  const handleDownload = async (id, number) => {
    setError('');
    try {
      const blob = await billingApi.downloadClientPdf(id);
      await downloadBlob(blob, invoicePdfFilename(number));
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDownloadNfse = async (doc) => {
    setError('');
    try {
      const blob = await billingApi.downloadClientNfsePdf(doc.id);
      await downloadBlob(blob, nfsePdfFilename(doc));
    } catch (err) {
      setError(err.message);
    }
  };

  const handleOpenInvoice = async (invoice) => {
    setDetailLoading(true);
    setError('');
    try {
      const data = await billingApi.clientInvoice(invoice.id);
      setSelectedInvoice(data.invoice);
      setPage('invoices');
    } catch (err) {
      setError(err.message);
    } finally {
      setDetailLoading(false);
    }
  };

  const storedCnpjMasked = maskCnpjDisplay(
    getCnpjDigits(cnpj) || sessionStorage.getItem(CLIENT_CNPJ_STORAGE_KEY) || ''
  );

  if (step === 'loading') {
    return <div className="admin-loading">Carregando...</div>;
  }

  if (step === 'cnpj' || step === 'code') {
    return (
      <AreaRestritaLayout>
        <AreaBack />
        {step === 'cnpj' && (
          <AreaCard mark>
            <h2>Portal do cliente</h2>
            <p className="area-lead">
              Informe o CNPJ cadastrado. Enviaremos um código de acesso ao e-mail de faturamento.
            </p>
            {error && <div className="area-alert area-alert-error">{error}</div>}
            <form className="area-form" onSubmit={handleRequestCode}>
              <label htmlFor="cnpj">CNPJ</label>
              <input
                id="cnpj"
                value={cnpj}
                onChange={(e) => setCnpj(maskCnpjInput(e.target.value))}
                placeholder="00.000.000/0000-00"
                required
              />
              <button type="submit" className="area-btn">Enviar código</button>
            </form>
          </AreaCard>
        )}
        {step === 'code' && (
          <AreaCard mark>
            <h2>Código de acesso</h2>
            <p className="area-lead">CNPJ: {storedCnpjMasked}</p>
            {message && <div className="area-alert area-alert-success">{message}</div>}
            {error && <div className="area-alert area-alert-error">{error}</div>}
            <form className="area-form" onSubmit={handleVerify}>
              <label htmlFor="client-otp">Código de 6 dígitos</label>
              <OtpInput
                id="client-otp"
                value={code}
                onChange={(next) => {
                  setCode(next);
                  if (next.length === 6) {
                    handleVerify(null, next);
                  }
                }}
                autoFocus
              />
              <button type="submit" className="area-btn" disabled={code.length !== 6}>Entrar</button>
              <button type="button" className="area-btn area-btn-secondary" style={{ marginLeft: 8 }} onClick={handleResendCode}>
                Reenviar código
              </button>
              <button type="button" className="area-btn area-btn-secondary" style={{ marginLeft: 8 }} onClick={() => setStep('cnpj')}>
                Voltar
              </button>
            </form>
          </AreaCard>
        )}
      </AreaRestritaLayout>
    );
  }

  return (
    <ClientShell
      clientName={client.name}
      clientCnpjMasked={client.cnpjMasked}
      clientEmail={client.email}
      activePage={page}
      onNavigate={setPage}
      onLogout={handleLogout}
    >
      {error && <div className="admin-alert admin-alert--error">{error}</div>}

      {page === 'home' && (
        <>
          <AdminPageHeader
            title="Visão geral"
            subtitle="Resumo da sua conta e faturamento"
          />
          <div className="admin-stats">
            <StatCard
              icon="pending"
              label="Em aberto"
              value={formatBRL(summary.openTotal)}
              hint={summary.openCount === 1 ? '1 fatura pendente' : `${summary.openCount} faturas pendentes`}
              tone="soft"
            />
            <StatCard
              icon="revenue"
              label="Pagas"
              value={formatBRL(summary.paidTotal)}
              hint={summary.paidCount === 1 ? '1 fatura quitada' : `${summary.paidCount} faturas quitadas`}
            />
            <StatCard
              icon="overdue"
              label="Próximo vencimento"
              value={summary.nextDue ? formatDate(summary.nextDue) : '—'}
              hint={summary.openCount ? 'Fatura mais próxima do vencimento' : 'Nenhuma fatura em aberto'}
              tone={summary.openCount ? 'default' : 'soft'}
            />
            <StatCard
              icon="clients"
              label="Total de faturas"
              value={summary.totalCount}
              hint="Histórico disponível no portal"
              tone="soft"
            />
          </div>

          {nfseDocuments.length > 0 && (
            <div className="admin-panel" style={{ marginBottom: 24 }}>
              <div className="admin-panel__header">
                <div>
                  <h2>NFS-e recentes</h2>
                  <p>{nfseDocuments.length} nota{nfseDocuments.length === 1 ? '' : 's'} fiscal{nfseDocuments.length === 1 ? '' : 'is'} de serviço</p>
                </div>
                <button type="button" className="admin-btn admin-btn--secondary admin-btn--sm" onClick={() => setPage('nfse')}>
                  Ver todas
                </button>
              </div>
              <div className="admin-table-wrap">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Número</th>
                      <th>Competência</th>
                      <th>Valor</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {nfseDocuments.slice(0, 3).map((doc) => (
                      <tr key={doc.id}>
                        <td>{doc.number}</td>
                        <td>{formatDate(doc.competenceDate)}</td>
                        <td>{formatBRL(doc.amountCents)}</td>
                        <td>
                          {doc.hasPdf && (
                            <button
                              type="button"
                              className="admin-btn admin-btn--sm admin-btn--secondary"
                              onClick={() => handleDownloadNfse(doc)}
                            >
                              PDF
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          <div className="admin-panel">
            <div className="admin-panel__header">
              <h2>Dados da conta</h2>
            </div>
            <div className="admin-panel__body">
              <dl className="admin-detail-grid admin-detail-grid--account">
                <div className="admin-detail-grid__item admin-detail-grid__item--wide">
                  <dt>Razão social</dt>
                  <dd className="admin-detail-grid__value--emphasis">{client.name}</dd>
                </div>
                <div>
                  <dt>CNPJ</dt>
                  <dd>{client.cnpjMasked}</dd>
                </div>
                <div>
                  <dt>E-mail de faturamento</dt>
                  <dd>{client.email}</dd>
                </div>
                {client.contactName && (
                  <div>
                    <dt>Contato</dt>
                    <dd>{client.contactName}</dd>
                  </div>
                )}
              </dl>
            </div>
          </div>

          {invoices.length > 0 && (
            <div className="admin-panel">
              <div className="admin-panel__header">
                <div>
                  <h2>Últimas faturas</h2>
                  <p>Clique em uma fatura para ver os detalhes</p>
                </div>
                <button type="button" className="admin-btn admin-btn--secondary admin-btn--sm" onClick={() => setPage('invoices')}>
                  Ver todas
                </button>
              </div>
              <div className="admin-table-wrap">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Número</th>
                      <th>Emissão</th>
                      <th>Vencimento</th>
                      <th>Valor</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {invoices.slice(0, 5).map((inv) => (
                      <tr key={inv.id} className="admin-table__row-link" onClick={() => handleOpenInvoice(inv)}>
                        <td>{inv.number}</td>
                        <td>{formatDate(inv.issueDate)}</td>
                        <td>{formatDate(inv.dueDate)}</td>
                        <td>{formatBRL(inv.totalCents)}</td>
                        <td><StatusBadge status={inv.status} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}

      {page === 'invoices' && (
        <>
          <AdminPageHeader
            title="Minhas faturas"
            subtitle={`${invoices.length} fatura${invoices.length === 1 ? '' : 's'} no histórico`}
          />

          {selectedInvoice && (
            <div className="admin-panel" style={{ marginBottom: 24 }}>
              <div className="admin-panel__header">
                <div>
                  <h2>{selectedInvoice.number}</h2>
                  <p>
                    Emitida em {formatDate(selectedInvoice.issueDate)} · Vencimento {formatDate(selectedInvoice.dueDate)}
                  </p>
                </div>
                <button type="button" className="admin-btn admin-btn--secondary admin-btn--sm" onClick={() => setSelectedInvoice(null)}>
                  Fechar
                </button>
              </div>
              <div className="admin-panel__body">
              <dl className="admin-detail-grid" style={{ marginBottom: 20 }}>
                <div>
                  <dt>Status</dt>
                  <dd><StatusBadge status={selectedInvoice.status} /></dd>
                </div>
                <div>
                  <dt>Valor total</dt>
                  <dd>{formatBRL(selectedInvoice.totalCents)}</dd>
                </div>
                {selectedInvoice.sentAt && (
                  <div>
                    <dt>Enviada em</dt>
                    <dd>{formatDate(selectedInvoice.sentAt.slice(0, 10))}</dd>
                  </div>
                )}
                {selectedInvoice.paidAt && (
                  <div>
                    <dt>Paga em</dt>
                    <dd>{formatDate(selectedInvoice.paidAt.slice(0, 10))}</dd>
                  </div>
                )}
              </dl>
              {selectedInvoice.items?.length > 0 && (
                <div className="admin-table-wrap">
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>Descrição</th>
                        <th>Qtd.</th>
                        <th>Valor unit.</th>
                        <th>Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedInvoice.items.map((item, index) => (
                        <tr key={`${item.description}-${index}`}>
                          <td>{item.description}</td>
                          <td>{item.quantity}</td>
                          <td>{formatBRL(item.unitPriceCents)}</td>
                          <td>{formatBRL(item.lineTotalCents)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              {selectedInvoice.notes && (
                <div style={{ marginTop: 16 }}>
                  <p className="admin-stat-card__label">Observações</p>
                  <p style={{ whiteSpace: 'pre-wrap', margin: '8px 0 0' }}>{selectedInvoice.notes}</p>
                </div>
              )}
              <div className="admin-table__actions" style={{ marginTop: 20 }}>
                {selectedInvoice.hasPdf && (isOpenInvoice(selectedInvoice.status) || selectedInvoice.status === 'paga') && (
                  <button
                    type="button"
                    className="admin-btn admin-btn--sm admin-btn--secondary"
                    onClick={() => handleDownload(selectedInvoice.id, selectedInvoice.number)}
                  >
                    Baixar PDF
                  </button>
                )}
                {selectedInvoice.paymentLink && isOpenInvoice(selectedInvoice.status) && (
                  <a
                    href={selectedInvoice.paymentLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="admin-btn admin-btn--sm"
                  >
                    Pagar via PIX
                  </a>
                )}
              </div>
              </div>
            </div>
          )}

          {detailLoading && <p className="admin-loading-inline">Carregando detalhes...</p>}

          <div className="admin-panel">
            {invoices.length === 0 ? (
              <div className="admin-panel__body">
                <p className="area-lead">Nenhuma fatura disponível no momento.</p>
              </div>
            ) : (
              <div className="admin-table-wrap">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Número</th>
                      <th>Emissão</th>
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
                        <td>{formatDate(inv.issueDate)}</td>
                        <td>{formatDate(inv.dueDate)}</td>
                        <td>{formatBRL(inv.totalCents)}</td>
                        <td><StatusBadge status={inv.status} /></td>
                        <td>
                          <div className="admin-table__actions">
                            <button
                              type="button"
                              className="admin-btn admin-btn--sm admin-btn--secondary"
                              onClick={() => handleOpenInvoice(inv)}
                            >
                              Detalhes
                            </button>
                            {inv.hasPdf && (inv.status === 'paga' || isOpenInvoice(inv.status)) && (
                              <button
                                type="button"
                                className="admin-btn admin-btn--sm admin-btn--secondary"
                                onClick={() => handleDownload(inv.id, inv.number)}
                              >
                                PDF
                              </button>
                            )}
                            {inv.paymentLink && isOpenInvoice(inv.status) && (
                              <a
                                href={inv.paymentLink}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="admin-btn admin-btn--sm"
                              >
                                PIX
                              </a>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}

      {page === 'nfse' && (
        <>
          <AdminPageHeader
            title="NFS-e"
            subtitle={`${nfseDocuments.length} nota${nfseDocuments.length === 1 ? '' : 's'} fiscal${nfseDocuments.length === 1 ? '' : 'is'} de serviço`}
          />
          <div className="admin-panel">
            {nfseDocuments.length === 0 ? (
              <div className="admin-panel__body">
                <p className="area-lead">Nenhuma NFS-e disponível no momento.</p>
              </div>
            ) : (
              <div className="admin-table-wrap">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Número</th>
                      <th>Competência</th>
                      <th>Valor</th>
                      <th>Serviço</th>
                      <th>Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {nfseDocuments.map((doc) => (
                      <tr key={doc.id}>
                        <td>{doc.number}</td>
                        <td>{formatDate(doc.competenceDate)}</td>
                        <td>{formatBRL(doc.amountCents)}</td>
                        <td>{doc.serviceCode || doc.serviceDescription || '—'}</td>
                        <td>
                          <div className="admin-table__actions">
                            {doc.hasPdf && (
                              <button
                                type="button"
                                className="admin-btn admin-btn--sm admin-btn--secondary"
                                onClick={() => handleDownloadNfse(doc)}
                              >
                                Baixar PDF
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </ClientShell>
  );
}
