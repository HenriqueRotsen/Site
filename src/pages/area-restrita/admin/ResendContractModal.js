import React, { useEffect, useState } from 'react';

export function ResendContractModal({
  contract,
  loading = false,
  onClose,
  onConfirm,
}) {
  const [sendEmail, setSendEmail] = useState('');
  const [ccEmails, setCcEmails] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!contract) return;
    setSendEmail(contract.sendEmail || '');
    setCcEmails(contract.ccEmails || '');
    setError('');
  }, [contract]);

  if (!contract) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    const to = sendEmail.trim();
    if (!to || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(to)) {
      setError('Informe um e-mail válido em Para.');
      return;
    }
    setError('');
    onConfirm({
      sendEmail: to,
      ccEmails: ccEmails.trim(),
    });
  };

  return (
    <div className="admin-modal-overlay" role="presentation" onClick={onClose}>
      <div
        className="admin-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="resend-contract-title"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="resend-contract-title">Reenviar contrato {contract.number}</h2>
        <p className="admin-modal__lead">
          Escolha para quem enviar. Você também recebe cópia automática.
        </p>
        <form className="admin-form" onSubmit={handleSubmit} style={{ padding: 0 }}>
          <div className="admin-field">
            <label htmlFor="resend-to">Para</label>
            <input
              id="resend-to"
              type="email"
              value={sendEmail}
              onChange={(e) => setSendEmail(e.target.value)}
              placeholder="destinatario@empresa.com"
              required
              autoFocus
              disabled={loading}
            />
          </div>
          <div className="admin-field" style={{ marginTop: 14 }}>
            <label htmlFor="resend-cc">Com cópia (Cc)</label>
            <input
              id="resend-cc"
              type="text"
              value={ccEmails}
              onChange={(e) => setCcEmails(e.target.value)}
              placeholder="opcional@empresa.com, outro@empresa.com"
              disabled={loading}
            />
            <small className="admin-field-hint">Separe vários e-mails por vírgula</small>
          </div>
          {error && (
            <div className="admin-alert admin-alert--error" style={{ marginTop: 14 }}>
              {error}
            </div>
          )}
          <div className="admin-modal__actions" style={{ marginTop: 20 }}>
            <button type="button" className="admin-btn admin-btn--secondary" onClick={onClose} disabled={loading}>
              Cancelar
            </button>
            <button type="submit" className="admin-btn" disabled={loading}>
              {loading ? 'Reenviando…' : 'Reenviar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
