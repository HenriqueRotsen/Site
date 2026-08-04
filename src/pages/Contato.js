import '../App.css';
import '../styles/Contato.css';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import EmailButton from '../components/EmailButton.js';
import { useReveal } from '../hooks/useScrollAnimation';

const CONTACT_API_URL =
  process.env.REACT_APP_CONTACT_API_URL ||
  'https://contact-api.henriquerotsen.com.br';

export const Contato = () => {
  const { t, i18n } = useTranslation();
  const formRef = useReveal('up', 0, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    message: '',
    website: '',
  });

  const [submissionStatus, setSubmissionStatus] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });

    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const validationErrors = {};

    if (!formData.name) {
      validationErrors.name = t('contato.erroNome');
    }
    if (!formData.email) {
      validationErrors.email = t('contato.erroEmail');
    }
    if (!formData.message) {
      validationErrors.message = t('contato.erroMensagem');
    }

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      setSubmissionStatus('');
      return;
    }

    setErrors({});
    setIsSubmitting(true);
    setSubmissionStatus('');

    try {
      const response = await fetch(CONTACT_API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name.trim(),
          email: formData.email.trim(),
          message: formData.message.trim(),
          website: formData.website,
          lang: i18n.language?.startsWith('en') ? 'en' : 'pt',
        }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.error || 'Request failed');
      }

      setIsSuccess(true);
      setSubmissionStatus(t('contato.emailSucesso'));
      setFormData({
        name: '',
        email: '',
        message: '',
        website: '',
      });
    } catch (error) {
      setIsSuccess(false);
      setSubmissionStatus(`${t('contato.emailErro')} ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="contato-box">
      <div className="contato-card" ref={formRef}>
        <header className="contato-header">
          <h1>{t('contato.titulo')}</h1>
          <p className="contato-subtitle">{t('contato.subtitulo')}</p>
        </header>

        <form className="contato-form" onSubmit={handleSubmit} noValidate>
          <div className={`form-field ${errors.name ? 'form-field--error' : ''}`}>
            <label htmlFor="name">{t('contato.labelNome')}</label>
            <input
              type="text"
              id="name"
              name="name"
              placeholder={t('contato.placeholderNome')}
              value={formData.name}
              onChange={handleChange}
              autoComplete="name"
              disabled={isSubmitting}
            />
            {errors.name && <p className="error-message">{errors.name}</p>}
          </div>

          <div className={`form-field ${errors.email ? 'form-field--error' : ''}`}>
            <label htmlFor="email">{t('contato.labelEmail')}</label>
            <input
              type="email"
              id="email"
              name="email"
              placeholder={t('contato.placeholderEmail')}
              value={formData.email}
              onChange={handleChange}
              autoComplete="email"
              disabled={isSubmitting}
            />
            {errors.email && <p className="error-message">{errors.email}</p>}
          </div>

          <div className={`form-field ${errors.message ? 'form-field--error' : ''}`}>
            <label htmlFor="message">{t('contato.labelMensagem')}</label>
            <textarea
              id="message"
              name="message"
              placeholder={t('contato.placeholderMensagem')}
              value={formData.message}
              onChange={handleChange}
              rows={5}
              disabled={isSubmitting}
            />
            {errors.message && <p className="error-message">{errors.message}</p>}
          </div>

          <div className="form-field form-field--honeypot" aria-hidden="true">
            <label htmlFor="website">Website</label>
            <input
              type="text"
              id="website"
              name="website"
              value={formData.website}
              onChange={handleChange}
              tabIndex={-1}
              autoComplete="off"
            />
          </div>

          <div className="form-submit">
            <EmailButton type="submit" buttonStyle="btn--primary" buttonSize="btn--large">
              {isSubmitting ? t('contato.enviando') : t('contato.botao')}
            </EmailButton>
          </div>

          {submissionStatus && (
            <p className={`form-status ${isSuccess ? 'form-status--success' : 'form-status--error'}`}>
              {submissionStatus}
            </p>
          )}
        </form>
      </div>
    </div>
  );
};
