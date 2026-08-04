import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Contato } from '../pages/Contato';

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key) => key,
  }),
}));

jest.mock('../components/EmailButton.js', () => {
  return ({ children, type }) => (
    <button type={type}>
      {children}
    </button>
  );
});

describe('Componente Contato', () => {
  beforeEach(() => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ ok: true }),
    });
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  test('deve chamar a API de contato quando o formulário é preenchido corretamente', async () => {
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
      expect(global.fetch).toHaveBeenCalledTimes(1);
    });

    expect(global.fetch).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })
    );

    await waitFor(() => {
      expect(screen.getByText('contato.emailSucesso')).toBeInTheDocument();
    });
  });

  test('não deve enviar email se os campos estiverem vazios', async () => {
    render(<Contato />);

    const submitButton = screen.getByText('contato.botao');
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(global.fetch).not.toHaveBeenCalled();
    });
  });
});
