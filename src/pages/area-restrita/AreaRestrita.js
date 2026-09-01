import React from 'react';
import { Link } from 'react-router-dom';
import { AreaRestritaLayout, AreaCard } from './AreaRestritaLayout';
import '../../styles/AreaRestrita.css';

export function AreaRestrita() {
  return (
    <AreaRestritaLayout>
      <AreaCard mark className="area-card--intro">
        <h1>Área restrita</h1>
        <p className="area-lead">Acesso exclusivo para administração e clientes.</p>
        <div className="area-grid-2">
          <Link to="/area-restrita/admin" className="area-choice-btn">
            <strong>Administração</strong>
          </Link>
          <Link to="/area-restrita/cliente" className="area-choice-btn">
            <strong>Portal do cliente</strong>
          </Link>
        </div>
      </AreaCard>
    </AreaRestritaLayout>
  );
}
