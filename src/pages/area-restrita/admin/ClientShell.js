import React from 'react';
import LogoHr from '../../../components/images/hr-cinza.png';
import NfseIcon from '../../../components/images/nfse-icon.png';
import '../../../styles/AdminShell.css';

function Icon({ children }) {
  return <span className="admin-nav-icon" aria-hidden="true">{children}</span>;
}

const icons = {
  home: (
    <Icon>
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
        <path d="M3 9.5 12 3l9 6.5V20a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1V9.5z" />
      </svg>
    </Icon>
  ),
  invoices: (
    <Icon>
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" />
      </svg>
    </Icon>
  ),
  nfse: (
    <Icon>
      <span
        className="admin-nav-icon__mask"
        style={{
          WebkitMaskImage: `url(${NfseIcon})`,
          maskImage: `url(${NfseIcon})`,
        }}
      />
    </Icon>
  ),
  logout: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" />
    </svg>
  ),
};

export function ClientShell({ clientName, clientCnpjMasked, clientEmail, activePage, onNavigate, onLogout, children }) {
  return (
    <div className="admin-app">
      <aside className="admin-sidebar">
        <div className="admin-sidebar__brand">
          <img src={LogoHr} alt="Henrique Rotsen" />
        </div>
        <nav className="admin-sidebar__nav" aria-label="Menu do cliente">
          <ul>
            <li>
              <button
                type="button"
                className={`admin-nav-item ${activePage === 'home' ? 'active' : ''}`}
                onClick={() => onNavigate('home')}
              >
                {icons.home}
                Visão geral
              </button>
            </li>
            <li>
              <button
                type="button"
                className={`admin-nav-item ${activePage === 'invoices' ? 'active' : ''}`}
                onClick={() => onNavigate('invoices')}
              >
                {icons.invoices}
                Minhas faturas
              </button>
            </li>
            <li>
              <button
                type="button"
                className={`admin-nav-item ${activePage === 'nfse' ? 'active' : ''}`}
                onClick={() => onNavigate('nfse')}
              >
                {icons.nfse}
                NFS-e
              </button>
            </li>
          </ul>
        </nav>
        <div className="admin-sidebar__footer">
          <p>{clientName}</p>
          <small>{clientCnpjMasked}</small>
          <small>{clientEmail}</small>
          <button type="button" className="admin-sidebar__logout" onClick={onLogout}>
            {icons.logout}
            Sair
          </button>
        </div>
      </aside>
      <main className="admin-main">
        <div className="admin-main__inner">{children}</div>
      </main>
    </div>
  );
}

export { AdminPageHeader, StatusBadge, StatCard } from './AdminShell';
