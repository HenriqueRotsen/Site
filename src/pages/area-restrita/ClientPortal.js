import React, { useEffect, useState } from 'react';
import { billingApi, formatBRL, formatDate, maskCnpjInput, downloadBlob, invoicePdfFilename } from '../../api/billing';
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

const CLIENT_CNPJ_STORAGE_KEY = 'billing_client_cnpj_digits';

function getCnpjDigits(value) {
  return String(value || '').replace(/\D/g, '');
}

export function ClientPortal() {
  const [step, setStep] = useState('loading');
  const [cnpj, setCnpj] = useState('');
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [client, setClient] = useState(null);
  const [invoices, setInvoices] = useState([]);

  const loadSession = async () => {
    try {
      const data = await billingApi.clientMe();
      setClient(data.client);
      const inv = await billingApi.clientInvoices();
      setInvoices(inv.invoices);
      setStep('portal');
    } catch {
      setStep('cnpj');
    }
  };

  useEffect(() => {
    loadSession();
  }, []);

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

  const handleVerify = async (e) => {
    e.preventDefault();
    setError('');
    const cnpjDigits = getCnpjDigits(cnpj) || sessionStorage.getItem(CLIENT_CNPJ_STORAGE_KEY) || '';
    if (cnpjDigits.length !== 14) {
      setError('CNPJ não encontrado nesta sessão. Volte e informe o CNPJ novamente.');
      return;
    }
    try {
      const data = await billingApi.clientVerifyCode(cnpjDigits, code.trim());
      sessionStorage.removeItem(CLIENT_CNPJ_STORAGE_KEY);
      setClient(data.client);
      const inv = await billingApi.clientInvoices();
      setInvoices(inv.invoices);
      setStep('portal');
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
    setCode('');
  };

  const handleDownload = async (id, number) => {
    try {
      const blob = await billingApi.downloadClientPdf(id);
      await downloadBlob(blob, invoicePdfFilename(number));
    } catch (err) {
      setError(err.message);
    }
  };

  if (step === 'loading') {
    return (
      <AreaRestritaLayout>
        <AreaCard>Carregando...</AreaCard>
      </AreaRestritaLayout>
    );
  }

  return (
    <AreaRestritaLayout wide={step === 'portal'}>
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
          <p className="area-lead">
            CNPJ: {maskCnpjInput(getCnpjDigits(cnpj) || sessionStorage.getItem(CLIENT_CNPJ_STORAGE_KEY) || '')}
          </p>
          {message && <div className="area-alert area-alert-success">{message}</div>}
          {error && <div className="area-alert area-alert-error">{error}</div>}
          <form className="area-form" onSubmit={handleVerify}>
            <label htmlFor="code">Código de 6 dígitos</label>
            <input
              id="code"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="000000"
              inputMode="numeric"
              autoComplete="one-time-code"
              required
            />
            <button type="submit" className="area-btn">Entrar</button>
            <button type="button" className="area-btn area-btn-secondary" style={{ marginLeft: 8 }} onClick={handleResendCode}>
              Reenviar código
            </button>
            <button type="button" className="area-btn area-btn-secondary" style={{ marginLeft: 8 }} onClick={() => setStep('cnpj')}>
              Voltar
            </button>
          </form>
        </AreaCard>
      )}

      {step === 'portal' && client && (
        <>
          <div className="area-header-row area-page-header">
            <div>
              <h2>{client.name}</h2>
              <p>{client.cnpjMasked} · {client.email}</p>
            </div>
            <button type="button" className="area-btn area-btn-secondary" onClick={handleLogout}>Sair</button>
          </div>

          {error && <div className="area-alert area-alert-error">{error}</div>}

          <AreaCard>
            <h3>Suas faturas</h3>
            {invoices.length === 0 ? (
              <p className="area-lead">Nenhuma fatura disponível.</p>
            ) : (
              <table className="area-table">
                <thead>
                  <tr>
                    <th>Número</th>
                    <th>Vencimento</th>
                    <th>Valor</th>
                    <th>Status</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {invoices.map((inv) => (
                    <tr key={inv.id}>
                      <td>{inv.number}</td>
                      <td>{formatDate(inv.dueDate)}</td>
                      <td>{formatBRL(inv.totalCents)}</td>
                      <td><StatusBadge status={inv.status} /></td>
                      <td>
                        <div className="area-actions">
                          {inv.hasPdf && (
                            <button type="button" className="area-btn area-btn-secondary" onClick={() => handleDownload(inv.id, inv.number)}>
                              PDF
                            </button>
                          )}
                          {inv.paymentLink && (
                            <a href={inv.paymentLink} target="_blank" rel="noopener noreferrer" className="area-btn area-btn-secondary">
                              PIX
                            </a>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </AreaCard>
        </>
      )}
    </AreaRestritaLayout>
  );
}
