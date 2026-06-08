import { useTranslation } from 'react-i18next';
import '../styles/LanguageSelector.css';

const LANGUAGES = [
  { code: 'pt', label: 'PT' },
  { code: 'en', label: 'EN' },
];

function LanguageSelector({ variant = 'desktop' }) {
  const { i18n, t } = useTranslation();

  const currentLanguage = i18n.language?.startsWith('en') ? 'en' : 'pt';

  const handleLanguageChange = (code) => {
    if (code !== currentLanguage) {
      i18n.changeLanguage(code);
    }
  };

  return (
    <div
      className={`language-toggle language-toggle--${variant}`}
      role="group"
      aria-label={t('header.idioma')}
    >
      {LANGUAGES.map(({ code, label }) => (
        <button
          key={code}
          type="button"
          className={`language-toggle-btn ${currentLanguage === code ? 'active' : ''}`}
          onClick={() => handleLanguageChange(code)}
          aria-pressed={currentLanguage === code}
        >
          {label}
        </button>
      ))}
    </div>
  );
}

export default LanguageSelector;
