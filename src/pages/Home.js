import '../App.css';
import '../styles/Home.css';
import React from 'react';
import Logo from '../components/images/logo-no-background.png';
import LogoMark from '../components/images/logo-no-background-canto.png';
import ProfessionalFoto from '../components/images/profissional2.jpg';
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

export const Home = () => {
  const { t } = useTranslation();
  const heroTextRef = useReveal('up');
  const heroImageRef = useReveal('right', 180);
  const aboutRef = useReveal('up', 80);
  const skillsRef = useRevealChildren('.skill-group', 100, 'up');
  const closeCopyRef = useReveal('up', 80);
  const logoRef = useReveal('scale', 220);
  const ctaRef = useReveal('scale', 160);

  return (
    <div className="home-page">
      <div className="home-watermarks" aria-hidden="true">
        <img src={LogoMark} alt="" className="home-watermark home-watermark--1" />
        <img src={LogoMark} alt="" className="home-watermark home-watermark--2" />
        <img src={LogoMark} alt="" className="home-watermark home-watermark--3" />
      </div>

      <section className="home-hero">
        <div className="home-shell home-hero-grid">
          <div className="home-hero-copy" ref={heroTextRef}>
            <h1 className="home-brand">{t('home.marca')}</h1>
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
            <img
              src={Logo}
              alt=""
              className="home-close-logo"
            />
          </div>
        </div>
      </section>
    </div>
  );
};
