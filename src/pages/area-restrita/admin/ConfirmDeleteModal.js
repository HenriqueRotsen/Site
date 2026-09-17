import React from 'react';

export function ConfirmDeleteModal({
  title = 'Confirmar exclusão',
  message,
  confirmLabel = 'Excluir',
  loading = false,
  onClose,
  onConfirm,
}) {
  return (
    <div className="admin-modal-overlay" role="presentation" onClick={onClose}>
      <div
        className="admin-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-delete-title"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="confirm-delete-title">{title}</h2>
        <p className="admin-modal__lead">{message}</p>
        <div className="admin-modal__actions">
          <button type="button" className="admin-btn admin-btn--secondary" onClick={onClose} disabled={loading}>
            Cancelar
          </button>
          <button type="button" className="admin-btn admin-btn--danger" onClick={onConfirm} disabled={loading}>
            {loading ? 'Excluindo...' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
