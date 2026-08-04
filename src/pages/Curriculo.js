import '../App.css';
import '../styles/Curriculo.css';
import React from 'react';
import { useTranslation } from 'react-i18next';
import DownloadButton from '../components/DownloadButton.js';
import ResumeEnglish from '../components/files/Henrique_Rotsen_resume_english.pdf';
import ResumePortuguese from '../components/files/Henrique_Rotsen_curriculo_portugues.pdf';
import ResumeLinkedin from '../components/files/Henrique_Rotsen_curriculo_linkedin.pdf';
import LogoMark from '../components/images/logo-no-background-canto.png';
import { useReveal, useRevealChildren } from '../hooks/useScrollAnimation';

export const Curriculo = () => {
  const { t } = useTranslation();
  const mainRef = useReveal('up');
  const resumeItemsRef = useRevealChildren('.item-resume', 120, 'up');

  return (
    <div className='curriculo-page'>
      <div className="curriculo-watermarks" aria-hidden="true">
        <img src={LogoMark} alt="" className="curriculo-watermark curriculo-watermark--1" />
        <img src={LogoMark} alt="" className="curriculo-watermark curriculo-watermark--2" />
        <img src={LogoMark} alt="" className="curriculo-watermark curriculo-watermark--3" />
      </div>

      <main className='main' ref={mainRef}>
        <h2>{t('curriculo.titulo')}</h2>
        <ul className='files' ref={resumeItemsRef}>
          <li className='item-resume'>
            <h3>{t('curriculo.cv')}</h3>
            <DownloadButton
              buttonStyle="btn--primary"
              downloadUrl={ResumePortuguese}
              downloadFileName="Henrique_Rotsen_curriculo_portugues"
            >
              {t('curriculo.baixar')}
            </DownloadButton>
            <p>{t('curriculo.idiomaPt')}</p>
          </li>
          <li className='item-resume'>
            <h3>{t('curriculo.cv')}</h3>
            <DownloadButton
              downloadUrl={ResumeEnglish}
              downloadFileName="Henrique_Rotsen_resume_english"
              buttonStyle="btn--primary"
            >
              {t('curriculo.baixar')}
            </DownloadButton>
            <p>{t('curriculo.idiomaEn')}</p>
          </li>
          <li className='item-resume'>
            <h3>LinkedIn</h3>
            <DownloadButton
              downloadUrl={ResumeLinkedin}
              downloadFileName="Henrique_Rotsen_curriculo_linkedin"
              buttonStyle="btn--primary"
            >
              {t('curriculo.baixar')}
            </DownloadButton>
            <p>{t('curriculo.idiomaEn')}</p>
          </li>
        </ul>
      </main>
    </div>
  );
};