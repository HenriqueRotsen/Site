import '../App.css';
import '../styles/Home.css';
import React, { useState, useEffect } from 'react';
import Logo from '../components/images/logo-no-background.png';
import ProfessionalFoto from '../components/images/profissional2.jpg';
import Button from '../components/Button.js';
import { useTranslation } from 'react-i18next';
import { useReveal, useRevealChildren } from '../hooks/useScrollAnimation';

export const Home = () => {
    const [showLogo, setShowLogo] = useState(false);
    const { t } = useTranslation();
    const titleRef = useReveal('up');
    const imageRef = useReveal('right', 200);
    const interestsRef = useReveal('up', 150);
    const buttonRef = useReveal('scale', 200);
    const skillsRef = useRevealChildren('.item', 50, 'up');

    useEffect(() => {
        const timer = setTimeout(() => {
            setShowLogo(true);
        }, 1500);

        return () => clearTimeout(timer);
    }, []);

    return (
        <>
            <div className='main-box'>
                <img src={Logo} alt='Logo' className={`logo-main-box ${showLogo ? 'show' : ''}`} />
            </div>
            <h1 ref={titleRef}>{t('home.sobre')}</h1>
            <section className='about-container'>
                <div className='side-text' ref={skillsRef}>
                    <p>{t('home.descricao')}<br />{t('home.descricao_graduacao')}<br /><b>{t('home.descricao2')}</b></p>
                    <b className='skill-heading'>{t('home.linguagens')}</b>
                    <ul className='has-bar'>
                        <li className='item'>Python</li>
                        <li className='item'>C</li>
                        <li className='item'>C++</li>
                        <li className='item'>C#</li>
                        <li className='item'>JavaScript</li>
                        <li className='item'>Java</li>
                        <li className='item'>Matlab</li>
                        <li className='item'>Vue</li>
                        <li className='item'>Html</li>
                        <li className='item'>Css</li>
                    </ul>

                    <b className='skill-heading'>{t('home.bibliotecas')}</b>
                    <ul className='has-bar'>
                        <li className='item'>PyTorch</li>
                        <li className='item'>Pandas</li>
                        <li className='item'>Scikit-learn</li>
                        <li className='item'>Statsmodels</li>
                        <li className='item'>Scypi</li>
                        <li className='item'>Numpy</li>
                        <li className='item'>Seaborn</li>
                        <li className='item'>.NET</li>
                    </ul>

                    <b className='skill-heading'>{t('home.outrasTecnologias')}</b>
                    <ul className='tecnologies'>
                        <li className='item'>AWS</li>
                        <li className='item'>SonarQube</li>
                        <li className='item'>Jenkins</li>
                        <li className='item'>OwaspZap</li>
                        <li className='item'>Wazuh</li>
                        <li className='item'>Shuffle</li>
                        <li className='item'>TheHive</li>
                        <li className='item'>MISP</li>
                        <li className='item'>Cortex</li>
                        <li className='item'>Azure DevOPS</li>
                        <li className='item'>Visual Studio</li>
                        <li className='item'>Excel</li>
                        <li className='item'>Scrum</li>
                        <li className='item'>Kanban</li>
                        <li className='item'>Design Thinking</li>
                        <li className='item'>Knime</li>
                    </ul>
                    <div ref={interestsRef}>
                        <p>{t('home.interesses')}</p>
                        <p>{t('home.interesses2')}</p>
                    </div>
                </div>

                <div className='professional-image-box' ref={imageRef}>
                    <img src={ProfessionalFoto} alt='Henrique Rotsen' className='professional-image' />
                </div>
            </section>
            <div className='btn-contato' ref={buttonRef}>
                <Button path='/trabalhos' buttonSize={'btn--medium'}>
                    {t('home.btnTrabalhos')}
                </Button>
            </div>
        </>
    );
};
