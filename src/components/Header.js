import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import '../styles/Header.css';
import LogoHr from './images/hr-branca.png';
import LanguageSelector from './LanguageSelector';
import { useTranslation } from 'react-i18next';

function Header() {
  const [click, setClick] = useState(false);

  const handleClick = () => setClick(!click);
  const closeMobileMenu = () => setClick(false);

  const { t } = useTranslation();

  return (
    <>
      <nav className='navbar'>
        <div className='navbar-container'>
          <Link to='/' className='navbar-logo' onClick={closeMobileMenu}>
            <img src={LogoHr} alt='Henrique Rotsen' width='56' height='40' />
          </Link>
          <div className='menu-icon' onClick={handleClick}>
            <i className={click ? 'fas fa-times' : 'fas fa-bars'} />
          </div>
          <ul className={click ? 'nav-menu active' : 'nav-menu'}>
            <li className='nav-item'>
              <Link to='/' className='nav-links' onClick={closeMobileMenu}>
                Home
              </Link>
            </li>
            <li className='nav-item'>
              <Link to='/trabalhos' className='nav-links' onClick={closeMobileMenu}>
                {t('header.trabalhos')}
              </Link>
            </li>
            <li className='nav-item'>
              <Link to='/curriculo' className='nav-links' onClick={closeMobileMenu}>
                {t('header.curriculo')}
              </Link>
            </li>
            <li className='nav-item'>
              <Link to='/contato' className='nav-links' onClick={closeMobileMenu}>
                {t('header.contato')}
              </Link>
            </li>

            <li className='nav-item language-selector-mobile'>
              <LanguageSelector variant='mobile' />
            </li>
          </ul>

          <LanguageSelector variant='desktop' />
        </div>
        <hr className='nav-hr' />
      </nav>
    </>
  );
}

export default Header;
