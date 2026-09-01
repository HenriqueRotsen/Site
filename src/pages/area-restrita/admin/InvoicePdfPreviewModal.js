import React, { useEffect } from 'react';

export function InvoicePdfPreviewModal({ title, html, loading, onClose }) {
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  return (
    <div className="admin-modal-overlay" role="presentation" onClick={onClose}>
      <div
        className="admin-pdf-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="pdf-preview-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="admin-pdf-modal__header">
          <h2 id="pdf-preview-title">{title}</h2>
          <button type="button" className="admin-btn admin-btn--secondary admin-btn--sm" onClick={onClose}>
            Fechar
          </button>
        </div>
        <div className="admin-pdf-modal__body">
          {loading ? (
            <div className="admin-pdf-modal__loading">Gerando prévia...</div>
          ) : (
            <iframe
              srcDoc={html}
              title={title}
              className="admin-pdf-modal__frame"
              sandbox="allow-scripts allow-same-origin"
              allow="clipboard-write"
            />
          )}
        </div>
      </div>
    </div>
  );
}
