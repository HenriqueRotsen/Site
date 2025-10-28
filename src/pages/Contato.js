import '../App.css';
import '../styles/Contato.css';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Turnstile } from '@marsidev/react-turnstile';
import EmailButton from '../components/EmailButton.js';

const TURNSTILE_SITE_KEY = "0x4AAAAAAB9J1GRCy4T4B_pH";
const WORKER_URL = "https://siteworker.henriquerotsensf.workers.dev/";

export const Contato = () => {
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    message: ''
  });

  const [turnstileToken, setTurnstileToken] = useState('');
  const [submissionStatus, setSubmissionStatus] = useState('');
  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const validationErrors = {};
    if (!formData.name) validationErrors.name = t('contato.erroNome');
    if (!formData.email) validationErrors.email = t('contato.erroEmail');
    if (!formData.message) validationErrors.message = t('contato.erroMensagem');

    if (!turnstileToken) {
      setSubmissionStatus(t('contato.erroVerificacao') || 'Por favor, complete a verificação de segurança.');
      return;
    }

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setErrors({});
    setSubmissionStatus('Enviando...');

    const dataToSend = new FormData();
    dataToSend.append('name', formData.name);
    dataToSend.append('email', formData.email);
    dataToSend.append('message', formData.message);
    dataToSend.append('cf-turnstile-response', turnstileToken);

    try {
      const response = await fetch(WORKER_URL, {
        method: 'POST',
        body: dataToSend,
      });

      if (response.ok) {
        console.log('Mensagem enviada via Worker.');
        setSubmissionStatus(t('contato.emailSucesso'));
        setFormData({ name: '', email: '', message: '' });
        setTurnstileToken('');
      } else {
        const errorText = await response.text();
        console.log('ERRO NO WORKER: ', errorText);
        setSubmissionStatus(`${t('contato.emailErro')} ${errorText}`);
      }
    } catch (error) {
      console.error('ERRO DE CONEXÃO: ', error);
      setSubmissionStatus('Erro de conexão com o servidor. Tente novamente.');
    }
  };

  return (
    <div className="contato-box">
      <div className='contato'>
        <h1>{t('contato.titulo')}</h1>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <input
              type="text"
              id="name"
              name="name"
              placeholder={t('contato.placeholderNome')}
              value={formData.name}
              onChange={handleChange}
              required
            />
            {errors.name && <p className="error-message">{errors.name}</p>}
          </div>
          <div className="form-group">
            <input
              type="email"
              id="email"
              name="email"
              placeholder={t('contato.placeholderEmail')}
              value={formData.email}
              onChange={handleChange}
              required
            />
            {errors.email && <p className="error-message">{errors.email}</p>}
          </div>
          <div className="form-group-message">
            <textarea
              id="message"
              name="message"
              placeholder={t('contato.placeholderMensagem')}
              value={formData.message}
              onChange={handleChange}
              required
            ></textarea>
            {errors.message && <p className="error-message">{errors.message}</p>}
          </div>
          <div className="form-group-turnstile">
                    <Turnstile
                        siteKey={TURNSTILE_SITE_KEY} 
                        onSuccess={(token) => setTurnstileToken(token)}
                        onExpire={() => setTurnstileToken('')}
                    />
                    {submissionStatus.includes('Por favor') && <p className="error-message">{submissionStatus}</p>}
                </div>
          <div className="form-group-button">
            <EmailButton
              type="submit"
              className='btn-send'
              buttonStyle={'btn--outline'}
              disabled={submissionStatus === 'Enviando...' || !turnstileToken}
            >
              {t('contato.botao')}
            </EmailButton>
          </div>
          {submissionStatus && !submissionStatus.includes('Por favor') && <p>{submissionStatus}</p>}
        </form>
      </div>
    </div>
  );
};