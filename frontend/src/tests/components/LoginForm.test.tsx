import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import { LoginPage } from '../../pages/LoginPage';
import { AuthContext, AuthContextType } from '../../context/AuthContext';

const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

describe('LoginForm Unit Tests', () => {
  const mockLogin = jest.fn();
  const mockLogout = jest.fn();
  const mockRegister = jest.fn();
  const mockRefreshUser = jest.fn();

  const defaultAuthContext: AuthContextType = {
    user: null,
    token: null,
    sessionId: null,
    isAuthenticated: false,
    isLoading: false,
    login: mockLogin,
    register: mockRegister,
    logout: mockLogout,
    refreshUser: mockRefreshUser,
  };

  const renderComponent = (contextOverrides: Partial<AuthContextType> = {}) => {
    return render(
      <BrowserRouter>
        <AuthContext.Provider value={{ ...defaultAuthContext, ...contextOverrides }}>
          <LoginPage />
        </AuthContext.Provider>
      </BrowserRouter>
    );
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renderiza os campos de entrada, botão de submissão e link para cadastro', () => {
    renderComponent();

    expect(screen.getByTestId('input-email')).toBeInTheDocument();
    expect(screen.getByTestId('input-password')).toBeInTheDocument();
    expect(screen.getByTestId('submit-login-button')).toBeInTheDocument();
    expect(screen.getByTestId('register-link')).toBeInTheDocument();
  });

  test('valida campos obrigatórios quando enviado em branco', async () => {
    const user = userEvent.setup();
    renderComponent();

    await user.click(screen.getByTestId('submit-login-button'));

    expect(await screen.findByTestId('email-error')).toHaveTextContent('O e-mail é obrigatório');
    expect(await screen.findByTestId('password-error')).toHaveTextContent('A senha é obrigatória');
    expect(mockLogin).not.toHaveBeenCalled();
  });

  test('valida formato inválido de e-mail', async () => {
    const user = userEvent.setup();
    renderComponent();

    await user.type(screen.getByTestId('input-email'), 'emailinvalido');
    await user.type(screen.getByTestId('input-password'), 'senha123');
    await user.click(screen.getByTestId('submit-login-button'));

    expect(await screen.findByTestId('email-error')).toHaveTextContent('Formato de e-mail inválido');
    expect(mockLogin).not.toHaveBeenCalled();
  });

  test('permite alternar visibilidade da senha entre texto e oculto', async () => {
    const user = userEvent.setup();
    renderComponent();

    const passwordInput = screen.getByTestId('input-password');
    expect(passwordInput).toHaveAttribute('type', 'password');

    const toggleBtn = screen.getByRole('button', { name: /exibir senha/i });
    await user.click(toggleBtn);
    expect(passwordInput).toHaveAttribute('type', 'text');

    await user.click(screen.getByRole('button', { name: /ocultar senha/i }));
    expect(passwordInput).toHaveAttribute('type', 'password');
  });

  test('chama a função de login com os dados corretos e redireciona em caso de sucesso', async () => {
    mockLogin.mockResolvedValueOnce(undefined);
    const user = userEvent.setup();
    renderComponent();

    await user.type(screen.getByTestId('input-email'), 'usuario@exemplo.com');
    await user.type(screen.getByTestId('input-password'), 'SenhaForte123');
    await user.click(screen.getByTestId('submit-login-button'));

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith({
        email: 'usuario@exemplo.com',
        password: 'SenhaForte123',
      });
    });
    expect(mockNavigate).toHaveBeenCalledWith('/dashboard', { replace: true });
  });

  test('exibe mensagem de erro na interface quando a autenticação falha', async () => {
    mockLogin.mockRejectedValueOnce(new Error('Credenciais inválidas'));
    const user = userEvent.setup();
    renderComponent();

    await user.type(screen.getByTestId('input-email'), 'usuario@exemplo.com');
    await user.type(screen.getByTestId('input-password'), 'senhaErrada');
    await user.click(screen.getByTestId('submit-login-button'));

    const alert = await screen.findByTestId('login-error-alert');
    expect(alert).toHaveTextContent('Credenciais inválidas');
  });
});
