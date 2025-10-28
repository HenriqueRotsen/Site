import '../App.css';
import '../styles/Contato.css';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import EmailButton from '../components/EmailButton.js';
import emailjs from '@emailjs/browser';

export const Contato = () => {
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    message: ''
  });

  const [submissionStatus, setSubmissionStatus] = useState('');
  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleSubmit = (e) => {
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
      return;
    } else {
      setErrors({});
    }

    const templateParams = {
      from_name: formData.name,
      message: formData.message,
      email: formData.email
    };

    emailjs.send(
      'service_c3pkaiw',
      'template_tjl9zii',
      templateParams,
      'Aj6r553aDRSOBjQ5W'
    )
      .then((response) => {
        console.log('EMAIL ENVIADO', response.status, response.text);
        setSubmissionStatus(t('contato.emailSucesso'));
        setFormData({
          name: '',
          email: '',
          message: ''
        });
      }, (error) => {
        console.log('ERRO: ', error);
        setSubmissionStatus(`${t('contato.emailErro')} ${error.text}`);
      });
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
          <div className="form-group-button">
            <EmailButton type="submit" className='btn-send' buttonStyle={'btn--outline'}>
              {t('contato.botao')}
            </EmailButton>
          </div>
          {submissionStatus && <p>{submissionStatus}</p>}
        </form>
      </div>
    </div>
  );
};
