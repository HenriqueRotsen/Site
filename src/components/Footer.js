import React from 'react';
import { getYear } from 'date-fns';
import '../styles/Footer.css'
import { useTranslation } from 'react-i18next';


function Footer() {
  const anoAtual = getYear(new Date());
  const { t } = useTranslation();
  
  return (
    <>
      <div className='footer-container'>
        <div className='social-medias'>
          <a href='https://www.linkedin.com/in/henrique-rotsen-santos-ferreira/' target="_blank" rel="noopener noreferrer">
            <i class="fab fa-linkedin"/>
          </a>
          <a href='https://github.com/HenriqueRotsen' target="_blank" rel="noopener noreferrer">
            <i class="fab fa-github" />
          </a>
        </div>
        <div className='copyright'>
        {t('footer.texto1')} - {anoAtual} {t('footer.texto2')} ©
        </div>
      </div>
    </>
  );
}

export default Footer;