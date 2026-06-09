import DownloadButton from '../components/DownloadButton.js';
import '../App.css';
import '../styles/Trabalhos.css';
import { useTranslation } from 'react-i18next';
import { useReveal } from '../hooks/useScrollAnimation';
import MDA from '../components/files/Mineracao_Dados_Apartamentos_EUA.pdf';

const WORKS_REVEAL = { threshold: 0.06, rootMargin: '0px 0px -24px 0px' };

export const Trabalhos = () => {
  const { t } = useTranslation();
  const titleRef = useReveal('up', 0, WORKS_REVEAL);
  const doutoradoRef = useReveal('left', 0, WORKS_REVEAL);
  const gestaoRef = useReveal('right', 0, WORKS_REVEAL);
  const cibersegRef = useReveal('left', 0, WORKS_REVEAL);
  const iaRef = useReveal('right', 0, WORKS_REVEAL);
  const mineracaoRef = useReveal('left', 0, WORKS_REVEAL);
  const simplexRef = useReveal('right', 0, WORKS_REVEAL);
  const gpsRef = useReveal('left', 0, WORKS_REVEAL);
  const softwareRef = useReveal('right', 0, WORKS_REVEAL);

  return (
    <>
      <section className='works'>
        <h1 className='main-title' ref={titleRef}>{t('trabalhos.titulo')}</h1>
        <hr className='divider' />
        <div className='work'>
          <div className='info-container-1' ref={doutoradoRef}>
            <h2 className='work-title'>{t('trabalhos.doutorado')}</h2>
            <p>{t('trabalhos.doutorado_desc')}</p>
            <ul className='vertical'>
              <li><b>{t('trabalhos.doutorado_area')}</b></li>
              <li><b>{t('trabalhos.doutorado_tema')}</b></li>
            </ul>
          </div>
        </div>
        <hr className='divider' />

        <div className='work'>
          <div className='info-container-2' ref={gestaoRef}>
            <h2 className='work-title'>{t('trabalhos.gestao')}</h2>
            <p>{t('trabalhos.gestao_desc')}</p>
          </div>
        </div>
        <hr className='divider' />

        <div className='work'>
          <div className='info-container-1' ref={cibersegRef}>
            <h2 className='work-title'>{t('trabalhos.ciberseguranca')}</h2>
            <p>{t('trabalhos.ciberseguranca_desc')}</p>
            <p><a href='https://sol.sbc.org.br/index.php/semish/article/view/36832' target="_blank" rel="noopener noreferrer">{t('trabalhos.veja_trabalho')}</a></p>
            <p>{t('trabalhos.ciberseguranca_desc2')}</p>
            <p><a href='https://horizontes.sbc.org.br/index.php/2025/05/a-computacao-quantica-e-a-ciberseguranca-o-futuro-promissor-e-seus-desafios/' target="_blank" rel="noopener noreferrer">{t('trabalhos.veja_trabalho')}</a></p>
          </div>
        </div>
        <hr className='divider' />

        <div className='work'>
          <div className='info-container-2' ref={iaRef}>
            <h2 className='work-title'>{t('trabalhos.ia')}</h2>
            <p>{t('trabalhos.ia_desc')}</p>
          </div>
        </div>

        <hr className='divider' />
        <div className='work'>
          <div className='info-container-1' ref={mineracaoRef}>
            <h2 className='work-title'>{t('trabalhos.mineracao')}</h2>
            <p>{t('trabalhos.mineracao_desc')}</p>
            <ul className='vertical'>
              <li><b>{t('trabalhos.analise')}</b><br />{t('trabalhos.analise_desc')}</li>
              <li><b>{t('trabalhos.itemsets')}</b><br />{t('trabalhos.itemsets_desc')}</li>
              <li><b>{t('trabalhos.subgrupos')}</b><br />{t('trabalhos.subgrupos_desc')}</li>
            </ul>
            <DownloadButton downloadUrl={MDA} downloadFileName="Mineracao_Dados_Apartamentos_EUA">
              {t('trabalhos.veja_trabalho')}
            </DownloadButton>
          </div>
        </div>

        <hr className='divider' />
        <div className='work'>
          <div className='info-container-2' ref={simplexRef}>
            <h2 className='work-title'>{t('trabalhos.simplex')}</h2>
            <p>{t('trabalhos.simplex_desc')} <br /><br />
              <a href='https://github.com/HenriqueRotsen/Simplex'>SIMPLEX</a>
            </p>
          </div>
        </div>

        <hr className='divider' />
        <div className='work'>
          <div className='info-container-1' ref={gpsRef}>
            <h2 className='work-title'>{t('trabalhos.gps')}</h2>
            <p>{t('trabalhos.gps_desc')}</p>
            <ul>
              <li>Arduino</li>
              <li>C++</li>
              <li>GPS U-blox NEO-6M®️</li>
              <li>Google Colab</li>
              <li>Python</li>
              <li>Pandas</li>
              <li>Folium</li>
              <li>Plotly</li>
              <li>TinyGPS</li>
            </ul>
            <p>{t('trabalhos.gps_desc2')} <br />
              <a href='https://colab.research.google.com/drive/1xw8AI5gp2rZgYm2RLGmsxwaIqsB-6qwc?usp=sharing'>Análise de Dados - GPS</a>
            </p>
          </div>
        </div>

        <hr className='divider' />
        <div className='work'>
          <div className='info-container-2' ref={softwareRef}>
            <h2 className='work-title'>{t('trabalhos.desenv_software')}</h2>
            <p>{t('trabalhos.desenv_software_desc')}</p>
            <ul className='vertical'>
              <li><a href='https://github.com/caiotcunha/foodFit'>FoodFit<br /></a>{t('trabalhos.foodfit_desc')}</li>
              <li><a href='https://github.com/HenriqueRotsen/coManda'>coManda<br /></a>{t('trabalhos.comanda_desc')}</li>
              <li><a href='https://santiagocotton.com/'>Santiago Cotton<br /></a>{t('trabalhos.santiago_desc')}</li>
            </ul>
          </div>
        </div>
      </section>
    </>
  );
}
