import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Contato } from '../pages/Contato';
import emailjs from '@emailjs/browser';

// 1. Mock Estrutural do EmailJS
jest.mock('@emailjs/browser', () => {
  return {
    __esModule: true,
    default: {
      send: jest.fn(), // Simula: import emailjs from...
    },
    send: jest.fn(),   // Simula: import { send } from...
  };
});

// 2. Mock do i18next
jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key) => key,
  }),
}));

// 3. Mock do componente de botão
jest.mock('../components/EmailButton.js', () => {
  return ({ children, type }) => (
    <button type={type}>
      {children}
    </button>
  );
});


describe('Componente Contato', () => {
  beforeEach(() => {
    emailjs.send.mockResolvedValue({ status: 200, text: 'OK' });
  });

  test('deve chamar emailjs.send quando o formulário é preenchido corretamente', async () => {
    render(<Contato />);

    fireEvent.change(screen.getByPlaceholderText('contato.placeholderNome'), {
      target: { value: 'Henrique Teste' },
    });

    fireEvent.change(screen.getByPlaceholderText('contato.placeholderEmail'), {
      target: { value: 'teste@exemplo.com' },
    });

    fireEvent.change(screen.getByPlaceholderText('contato.placeholderMensagem'), {
      target: { value: 'Msg Automatica' },
    });

    fireEvent.click(screen.getByText('contato.botao'));

    await waitFor(() => {
      expect(emailjs.send).toHaveBeenCalledTimes(1);
    });

    await waitFor(() => {
      expect(screen.getByText('contato.emailSucesso')).toBeInTheDocument();
    });
  });


  test('não deve enviar email se os campos estiverem vazios', async () => {
    render(<Contato />);

    const submitButton = screen.getByText('contato.botao');
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(emailjs.send).not.toHaveBeenCalled();
    });
  });
});