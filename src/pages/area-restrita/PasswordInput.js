import React, { useState } from 'react';

function EyeIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M2 12C2 12 5.5 5 12 5C18.5 5 22 12 22 12C22 12 18.5 19 12 19C5.5 19 2 12 2 12Z"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.75" />
    </svg>
  );
}

function EyeOffIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M17.94 17.94C16.23 19.24 14.21 20 12 20C5.5 20 2 13 2 13C3.07 11.17 4.76 9.67 6.74 8.63M9.9 5.24C10.58 5.08 11.28 5 12 5C18.5 5 22 12 22 12C21.27 13.45 20.27 14.72 19.06 15.76M14.12 14.12C13.78 14.45 13.41 14.71 13 14.89M9.88 9.88C9.45 10.22 9.09 10.64 8.82 11.12M3 3L21 21"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function PasswordInput({ id, value, onChange, className = '', ...props }) {
  const [visible, setVisible] = useState(false);

  return (
    <div className={`area-password-wrap ${className}`.trim()}>
      <input
        id={id}
        type={visible ? 'text' : 'password'}
        value={value}
        onChange={onChange}
        autoComplete="current-password"
        {...props}
      />
      <button
        type="button"
        className="area-password-toggle"
        onClick={() => setVisible((show) => !show)}
        aria-label={visible ? 'Ocultar senha' : 'Mostrar senha'}
        tabIndex={-1}
      >
        {visible ? <EyeOffIcon /> : <EyeIcon />}
      </button>
    </div>
  );
}
