import React from 'react';
import { Link } from 'react-router-dom';
import LogoHr from '../../components/images/hr-cinza.png';
import '../../styles/AreaRestrita.css';

export function AreaRestritaLayout({ children, wide = false }) {
  return (
    <div className="area-page">
      <div className="area-watermarks" aria-hidden="true">
        <img src={LogoHr} alt="" className="area-watermark area-watermark--1" />
        <img src={LogoHr} alt="" className="area-watermark area-watermark--2" />
      </div>
      <div className={`area-shell ${wide ? 'area-shell--wide' : ''}`}>
        {children}
      </div>
    </div>
  );
}

export function AreaCard({ children, className = '', mark = false }) {
  return (
    <div className={`area-card ${className}`.trim()}>
      {mark && <img src={LogoHr} alt="" className="area-card-mark" />}
      {children}
    </div>
  );
}

export function AreaBack({ to = '/area-restrita', label = '← Área restrita' }) {
  return (
    <Link to={to} className="area-back">
      {label}
    </Link>
  );
}
