import React from 'react';
import LogoHr from '../../../components/images/hr-cinza.png';
import '../../../styles/AdminShell.css';

function Icon({ children }) {
  return <span className="admin-nav-icon" aria-hidden="true">{children}</span>;
}

const icons = {
  dashboard: (
    <Icon>
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
        <rect x="3" y="3" width="7" height="9" rx="1" />
        <rect x="14" y="3" width="7" height="5" rx="1" />
        <rect x="14" y="12" width="7" height="9" rx="1" />
        <rect x="3" y="16" width="7" height="5" rx="1" />
      </svg>
    </Icon>
  ),
  clients: (
    <Icon>
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
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
  newClient: (
    <Icon>
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M19 8v6M22 11h-6" />
      </svg>
    </Icon>
  ),
  newInvoice: (
    <Icon>
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
        <path d="M12 5v14M5 12h14" />
      </svg>
    </Icon>
  ),
  logout: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" />
    </svg>
  ),
};

const NAV_ITEMS = [
  { key: 'dashboard', label: 'Insights', icon: icons.dashboard },
  { key: 'clients', label: 'Clientes', icon: icons.clients },
  { key: 'invoices', label: 'Faturas', icon: icons.invoices },
  { key: 'new-client', label: 'Novo cliente', icon: icons.newClient },
  { key: 'new-invoice', label: 'Nova fatura', icon: icons.newInvoice, cta: true },
];

export function AdminShell({ userEmail, activePage, onNavigate, onLogout, children }) {
  return (
    <div className="admin-app">
      <aside className="admin-sidebar">
        <div className="admin-sidebar__brand">
          <img src={LogoHr} alt="Henrique Rotsen" />
        </div>
        <nav className="admin-sidebar__nav" aria-label="Menu administrativo">
          <ul>
            {NAV_ITEMS.map((item) => (
              <li key={item.key}>
                <button
                  type="button"
                  className={`admin-nav-item ${activePage === item.key ? 'active' : ''} ${item.cta ? 'cta' : ''}`}
                  onClick={() => onNavigate(item.key)}
                >
                  {item.icon}
                  {item.label}
                </button>
              </li>
            ))}
          </ul>
        </nav>
        <div className="admin-sidebar__footer">
          <p>{userEmail}</p>
          <small>Administrador</small>
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

export function AdminPageHeader({ title, subtitle, action }) {
  return (
    <div className="admin-page-header">
      <div>
        <h1>{title}</h1>
        {subtitle && <p>{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

export function StatusBadge({ status }) {
  const labels = {
    rascunho: 'Rascunho',
    enviada: 'Enviada',
    paga: 'Paga',
    atrasada: 'Atrasada',
    cancelada: 'Cancelada',
    active: 'Ativo',
    inactive: 'Inativo',
  };
  return (
    <span className={`admin-badge admin-badge--${status}`}>
      {labels[status] || status}
    </span>
  );
}

const statIcons = {
  revenue: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden="true">
      <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
    </svg>
  ),
  pending: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden="true">
      <circle cx="12" cy="12" r="10" />
      <path d="M12 6v6l4 2" />
    </svg>
  ),
  overdue: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden="true">
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
      <path d="M12 9v4M12 17h.01" />
    </svg>
  ),
  clients: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden="true">
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  ),
};

export function StatCard({ icon, label, value, hint, tone = 'default' }) {
  return (
    <article className={`admin-stat-card admin-stat-card--${tone}`}>
      <div className="admin-stat-card__top">
        <div className="admin-stat-card__icon">{statIcons[icon]}</div>
      </div>
      <p className="admin-stat-card__label">{label}</p>
      <p className="admin-stat-card__value">{value}</p>
      {hint && <p className="admin-stat-card__hint">{hint}</p>}
    </article>
  );
}
