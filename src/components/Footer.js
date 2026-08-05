import React from 'react';
import { getYear } from 'date-fns';
import '../styles/Footer.css';
import Wordmark from './images/wordmark-branca.png';
import { useTranslation } from 'react-i18next';

function Footer() {
  const anoAtual = getYear(new Date());
  const { t } = useTranslation();

  return (
    <>
      <div className='footer-container'>
        <div className='social-medias'>
          <a href='https://www.linkedin.com/in/henrique-rotsen-santos-ferreira/' target="_blank" rel="noopener noreferrer">
            <i className="fab fa-linkedin" />
          </a>
          <a href='https://github.com/HenriqueRotsen' target="_blank" rel="noopener noreferrer">
            <i className="fab fa-github" />
          </a>
        </div>
        <div className='copyright'>
          <p className="copyright-line">
            <span>
              {t('footer.texto1')} - {anoAtual} ©
            </span>
            <img src={Wordmark} alt="Henrique Rotsen" className="footer-wordmark" />
          </p>
        </div>
      </div>
    </>
  );
}

export default Footer;
