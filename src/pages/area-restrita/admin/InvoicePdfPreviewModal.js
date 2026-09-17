import React, { useEffect } from 'react';

export function InvoicePdfPreviewModal({ title, html, pdfUrl, loading, onClose }) {
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
          <div className="admin-pdf-modal__header-actions">
            {pdfUrl && (
              <a
                className="admin-btn admin-btn--secondary admin-btn--sm"
                href={pdfUrl}
                target="_blank"
                rel="noreferrer"
              >
                Abrir em nova aba
              </a>
            )}
            <button type="button" className="admin-btn admin-btn--secondary admin-btn--sm" onClick={onClose}>
              Fechar
            </button>
          </div>
        </div>
        <div className={`admin-pdf-modal__body${html && !pdfUrl ? ' admin-pdf-modal__body--html' : ''}`}>
          {loading ? (
            <div className="admin-pdf-modal__loading">Carregando prévia...</div>
          ) : pdfUrl ? (
            <object data={pdfUrl} type="application/pdf" className="admin-pdf-modal__frame" title={title}>
              <iframe src={pdfUrl} title={title} className="admin-pdf-modal__frame" />
            </object>
          ) : html ? (
            <iframe
              srcDoc={html}
              title={title}
              className="admin-pdf-modal__frame admin-pdf-modal__frame--html"
              sandbox="allow-same-origin"
            />
          ) : (
            <div className="admin-pdf-modal__loading">Nada para exibir.</div>
          )}
        </div>
      </div>
    </div>
  );
}
