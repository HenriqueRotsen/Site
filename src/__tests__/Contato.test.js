import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Contato } from '../pages/Contato';
import emailjs from '@emailjs/browser';

// 1. Mock do EmailJS (Para não enviar email real)
jest.mock('@emailjs/browser', () => ({
  send: jest.fn().mockResolvedValue({ status: 200, text: 'OK' }),
}));

// 2. Mock do i18next (Tradução)
jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key) => key, // Retorna a própria chave como texto (ex: 'contato.botao')
  }),
}));

// Mock do componente de botão customizado para simplificar o teste
jest.mock('../components/EmailButton.js', () => {
  return ({ children, onClick, type }) => (
    <button onClick={onClick} type={type}>{children}</button>
  );
});

describe('Componente Contato', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('deve chamar emailjs.send quando o formulário é preenchido corretamente', async () => {
    render(<Contato />);

    // Preenche os campos
    fireEvent.change(screen.getByPlaceholderText('contato.placeholderNome'), {
      target: { value: 'Henrique Teste' },
    });
    fireEvent.change(screen.getByPlaceholderText('contato.placeholderEmail'), {
      target: { value: 'teste@exemplo.com' },
    });
    fireEvent.change(screen.getByPlaceholderText('contato.placeholderMensagem'), {
      target: { value: 'Esta é uma mensagem de teste automatizado.' },
    });

    // Clica no botão de enviar
    const submitButton = screen.getByText('contato.botao');
    fireEvent.click(submitButton);

    // Verifica se a função send foi chamada com os parâmetros corretos
    await waitFor(() => {
      expect(emailjs.send).toHaveBeenCalledTimes(1);
      expect(emailjs.send).toHaveBeenCalledWith(
        'service_c3pkaiw',
        'template_tjl9zii',
        {
          from_name: 'Henrique Teste',
          email: 'teste@exemplo.com',
          message: 'Esta é uma mensagem de teste automatizado.',
        },
        'Aj6r553aDRSOBjQ5W'
      );
    });

    // Verifica se a mensagem de sucesso apareceu
    expect(screen.getByText('contato.emailSucesso')).toBeInTheDocument();
  });

  test('não deve enviar email se os campos estiverem vazios', async () => {
    render(<Contato />);

    const submitButton = screen.getByText('contato.botao');
    fireEvent.click(submitButton);

    // Verifica que o send NÃO foi chamado
    await waitFor(() => {
      expect(emailjs.send).not.toHaveBeenCalled();
    });
    
    // Opcional: verificar se msg de erro apareceu (depende da sua lógica de i18n no teste)
  });
});