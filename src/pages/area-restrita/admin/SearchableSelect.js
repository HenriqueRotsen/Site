import React, { useEffect, useRef, useState } from 'react';

export function SearchableSelect({
  options,
  value,
  onChange,
  placeholder = 'Selecione...',
  searchPlaceholder = 'Buscar...',
  required = false,
  id,
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const wrapRef = useRef(null);

  const selected = options.find((option) => option.value === value);
  const normalizedQuery = query.trim().toLowerCase();
  const filtered = options.filter((option) => {
    if (!normalizedQuery) return true;
    return (
      option.label.toLowerCase().includes(normalizedQuery) ||
      (option.searchText || '').toLowerCase().includes(normalizedQuery)
    );
  });

  useEffect(() => {
    const handleClick = (event) => {
      if (wrapRef.current && !wrapRef.current.contains(event.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  return (
    <div className={`searchable-select ${open ? 'is-open' : ''}`} ref={wrapRef}>
      <button
        type="button"
        id={id}
        className="searchable-select__trigger"
        onClick={() => setOpen((current) => !current)}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span className={selected ? '' : 'searchable-select__placeholder'}>
          {selected ? selected.label : placeholder}
        </span>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden="true">
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>
      {required && (
        <input
          tabIndex={-1}
          className="searchable-select__validator"
          value={value || ''}
          required
          onChange={() => {}}
          aria-hidden="true"
        />
      )}
      {open && (
        <div className="searchable-select__menu">
          <input
            type="text"
            className="searchable-select__search"
            placeholder={searchPlaceholder}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoFocus
          />
          <ul className="searchable-select__list" role="listbox">
            {filtered.length === 0 ? (
              <li className="searchable-select__empty">Nenhum resultado</li>
            ) : (
              filtered.map((option) => (
                <li key={option.value}>
                  <button
                    type="button"
                    role="option"
                    aria-selected={option.value === value}
                    className={`searchable-select__option ${option.value === value ? 'is-selected' : ''}`}
                    onClick={() => {
                      onChange(option.value);
                      setOpen(false);
                      setQuery('');
                    }}
                  >
                    <span>{option.label}</span>
                    {option.hint && <small>{option.hint}</small>}
                  </button>
                </li>
              ))
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
