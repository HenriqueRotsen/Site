import React from 'react';

export function Pagination({ page, totalPages, total, onPageChange }) {
  if (!total || totalPages <= 1) return null;

  const pages = [];
  const addPage = (value) => pages.push(value);

  if (totalPages <= 7) {
    for (let i = 1; i <= totalPages; i += 1) addPage(i);
  } else {
    addPage(1);
    if (page > 3) addPage('…');
    for (let i = Math.max(2, page - 1); i <= Math.min(totalPages - 1, page + 1); i += 1) {
      addPage(i);
    }
    if (page < totalPages - 2) addPage('…');
    addPage(totalPages);
  }

  return (
    <div className="admin-pagination">
      <span className="admin-pagination__info">
        {total} {total === 1 ? 'registro' : 'registros'} · página {page} de {totalPages}
      </span>
      <div className="admin-pagination__controls">
        <button
          type="button"
          className="admin-pagination__btn"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
        >
          Anterior
        </button>
        {pages.map((item, index) =>
          item === '…' ? (
            <span key={`ellipsis-${index}`} className="admin-pagination__ellipsis">…</span>
          ) : (
            <button
              key={item}
              type="button"
              className={`admin-pagination__btn ${item === page ? 'is-active' : ''}`}
              onClick={() => onPageChange(item)}
            >
              {item}
            </button>
          )
        )}
        <button
          type="button"
          className="admin-pagination__btn"
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
        >
          Próxima
        </button>
      </div>
    </div>
  );
}
