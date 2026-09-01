import React, { useState } from 'react';
import { maskCnpjInput } from '../../../api/billing';

function normalizeCnpj(value) {
  return String(value || '').replace(/\D/g, '');
}

function isValidCnpjLength(value) {
  return normalizeCnpj(value).length === 14;
}

export function DeleteClientModal({ client, onClose, onConfirm, loading }) {
  const [typedCnpj, setTypedCnpj] = useState('');
  const [copied, setCopied] = useState(false);

  const cnpj = client.cnpjFormatted || '';
  const cnpjMasked = client.cnpjMasked || '';
  const isLegacyClient = !cnpj;
  const normalizedTyped = normalizeCnpj(typedCnpj);
  const canConfirm = isLegacyClient
    ? isValidCnpjLength(typedCnpj)
    : normalizedTyped === normalizeCnpj(cnpj);

  const handleCopy = async () => {
    if (!cnpj) return;
    await navigator.clipboard.writeText(cnpj);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="admin-modal-overlay" role="presentation" onClick={onClose}>
      <div
        className="admin-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="delete-client-title"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="delete-client-title">Excluir cliente</h2>
        <p className="admin-modal__lead">
          Esta ação desativa o cliente <strong>{client.legalName}</strong>. Para confirmar, digite o CNPJ abaixo.
        </p>

        {cnpj ? (
          <div className="admin-modal__cnpj-box">
            <div>
              <span className="admin-modal__label">CNPJ do cliente</span>
              <code>{cnpj}</code>
            </div>
            <button type="button" className="admin-btn admin-btn--secondary admin-btn--sm" onClick={handleCopy}>
              {copied ? 'Copiado!' : 'Copiar'}
            </button>
          </div>
        ) : (
          <div className="admin-modal__cnpj-box">
            <div>
              <span className="admin-modal__label">CNPJ do cliente</span>
              <code>{cnpjMasked}</code>
              <p className="admin-modal__hint">
                Cadastro anterior à atualização do sistema. Digite o CNPJ completo para confirmar a exclusão.
              </p>
            </div>
          </div>
        )}

        <div className="admin-field">
          <label htmlFor="confirm-cnpj">Digite o CNPJ para confirmar</label>
          <input
            id="confirm-cnpj"
            value={typedCnpj}
            onChange={(e) => setTypedCnpj(maskCnpjInput(e.target.value))}
            placeholder="00.000.000/0000-00"
            disabled={loading}
          />
        </div>

        <div className="admin-modal__actions">
          <button type="button" className="admin-btn admin-btn--secondary" onClick={onClose} disabled={loading}>
            Cancelar
          </button>
          <button
            type="button"
            className="admin-btn admin-btn--danger"
            disabled={!canConfirm || loading}
            onClick={() => onConfirm(normalizeCnpj(typedCnpj))}
          >
            {loading ? 'Excluindo...' : 'Excluir cliente'}
          </button>
        </div>
      </div>
    </div>
  );
}
