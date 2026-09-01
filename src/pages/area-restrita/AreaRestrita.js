import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { AreaRestritaLayout, AreaCard } from './AreaRestritaLayout';
import '../../styles/AreaRestrita.css';

export function AreaRestrita() {
  const { t } = useTranslation();

  return (
    <AreaRestritaLayout>
      <AreaCard mark className="area-card--intro">
        <h1>{t('areaRestrita.titulo')}</h1>
        <p className="area-lead">{t('areaRestrita.subtitulo')}</p>
        <div className="area-grid-2">
          <Link to="/area-restrita/admin" className="area-choice-btn">
            <strong>{t('areaRestrita.adminTitulo')}</strong>
          </Link>
          <Link to="/area-restrita/cliente" className="area-choice-btn">
            <strong>{t('areaRestrita.clienteTitulo')}</strong>
          </Link>
        </div>
      </AreaCard>
    </AreaRestritaLayout>
  );
}
