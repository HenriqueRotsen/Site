import '../App.css';
import '../styles/Home.css';
import React from 'react';
import Logo from '../components/images/logo-branca.png';
import LogoHr from '../components/images/hr-branca.png';
import ProfessionalFoto from '../components/images/profissional2.jpg';
import LogoAika from '../components/images/clients/aika-editora.png';
import LogoJrl from '../components/images/clients/jrl-engenharia.png';
import LogoAdac from '../components/images/clients/adac-motors.webp';
import LogoRadioMemory from '../components/images/clients/radio-memory.png';
import LogoNox from '../components/images/clients/nox.png';
import LogoTatajuba from '../components/images/clients/instituto-tatajuba.png';
import LogoRamosSantana from '../components/images/clients/ramos-santana.png';
import Button from '../components/Button.js';
import { useTranslation } from 'react-i18next';
import { useReveal, useRevealChildren } from '../hooks/useScrollAnimation';

const SKILL_GROUPS = [
  {
    key: 'grupoIa',
    items: ['Python', 'PyTorch', 'Pandas', 'Scikit-learn', 'Numpy'],
  },
  {
    key: 'grupoSeguranca',
    items: ['Wazuh', 'TheHive', 'MISP', 'SonarQube', 'OwaspZap'],
  },
  {
    key: 'grupoCloud',
    items: ['AWS', 'Azure DevOPS', 'Jenkins', 'JavaScript', '.NET'],
  },
];

const TRUSTED_COMPANIES = [
  { name: 'Aika Editora', src: LogoAika },
  { name: 'JRL Engenharia', src: LogoJrl },
  { name: 'ADAC Motors', src: LogoAdac },
  { name: 'Radio Memory', src: LogoRadioMemory },
  { name: 'NOX Engenharia Off-site', src: LogoNox },
  { name: 'Instituto Tatajubá', src: LogoTatajuba },
  { name: 'Ramos e Santana Advogados', src: LogoRamosSantana, tone: 'soft' },
];

export const Home = () => {
  const { t } = useTranslation();
  const heroTextRef = useReveal('up', 0);
  const heroImageRef = useReveal('up', 0);
  const trustRef = useReveal('up', 60);
  const aboutRef = useReveal('up', 80);
  const skillsRef = useRevealChildren('.skill-group', 100, 'up');
  const closeCopyRef = useReveal('up', 80);
  const logoRef = useReveal('scale', 220);
  const ctaRef = useReveal('scale', 160);

  const marqueeLogos = [...TRUSTED_COMPANIES, ...TRUSTED_COMPANIES];

  return (
    <div className="home-page">
      <div className="home-watermarks" aria-hidden="true">
        <img src={LogoHr} alt="" className="home-watermark home-watermark--1" />
        <img src={LogoHr} alt="" className="home-watermark home-watermark--2" />
        <img src={LogoHr} alt="" className="home-watermark home-watermark--3" />
      </div>

      <section className="home-hero">
        <div className="home-shell home-hero-grid">
          <div className="home-hero-copy" ref={heroTextRef}>
            <h1 className="home-brand">Henrique Rotsen</h1>
            <p className="home-headline">{t('home.headline')}</p>
            <p className="home-lead">{t('home.subtitulo')}</p>
            <div className="home-hero-cta">
              <Button path="/trabalhos" buttonStyle="btn--outline" buttonSize="btn--large">
                {t('home.btnTrabalhos')}
              </Button>
            </div>
            <blockquote className="home-quote">{t('home.frase')}</blockquote>
          </div>
          <div className="home-hero-media" ref={heroImageRef}>
            <img
              src={ProfessionalFoto}
              alt={t('home.marca')}
              className="home-hero-photo"
            />
          </div>
        </div>
      </section>

      <section className="home-trust" ref={trustRef} aria-label={t('home.confiancaTitulo')}>
        <div className="home-shell">
          <p className="home-section-label home-trust__label">{t('home.confiancaTitulo')}</p>
        </div>
        <div className="home-trust__track-wrap">
          <div className="home-trust__track">
            {marqueeLogos.map((company, index) => (
              <div
                className={`home-trust__item${company.tone ? ` home-trust__item--${company.tone}` : ''}`}
                key={`${company.name}-${index}`}
                aria-hidden={index >= TRUSTED_COMPANIES.length ? true : undefined}
              >
                <img
                  src={company.src}
                  alt={index < TRUSTED_COMPANIES.length ? company.name : ''}
                />
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="home-section home-about" ref={aboutRef}>
        <div className="home-shell">
          <p className="home-section-label">{t('home.sobre')}</p>
          <h2 className="home-section-title">{t('home.descricao')}</h2>
          <p className="home-section-text">{t('home.descricao_graduacao')}</p>
        </div>
      </section>

      <section className="home-section home-skills" ref={skillsRef}>
        <div className="home-shell">
          <p className="home-section-label">{t('home.skillsTitulo')}</p>
          <div className="skill-groups">
            {SKILL_GROUPS.map((group) => (
              <div className="skill-group" key={group.key}>
                <h3 className="skill-group-title">{t(`home.${group.key}`)}</h3>
                <ul className="skill-chips">
                  {group.items.map((item) => (
                    <li className="skill-chip" key={item}>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="home-section home-close">
        <div className="home-shell home-close-grid">
          <div className="home-close-copy" ref={closeCopyRef}>
            <p className="home-section-label">{t('home.interessesTitulo')}</p>
            <p className="home-section-text">{t('home.interesses')}</p>
            <p className="home-section-text home-section-text--soft">{t('home.interesses2')}</p>
            <div className="home-close-cta" ref={ctaRef}>
              <Button path="/trabalhos" buttonStyle="btn--outline" buttonSize="btn--large">
                {t('home.btnTrabalhos')}
              </Button>
            </div>
          </div>
          <div className="home-close-logo-box" ref={logoRef}>
            <img src={Logo} alt="" className="home-close-logo" />
          </div>
        </div>
      </section>
    </div>
  );
};
