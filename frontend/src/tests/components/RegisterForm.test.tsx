import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import { RegisterPage } from '../../pages/RegisterPage';
import { AuthContext, AuthContextType } from '../../context/AuthContext';

const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

describe('RegisterForm Unit Tests', () => {
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

  const renderComponent = () => {
    return render(
      <BrowserRouter>
        <AuthContext.Provider value={defaultAuthContext}>
          <RegisterPage />
        </AuthContext.Provider>
      </BrowserRouter>
    );
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renderiza todos os campos de cadastro, checklist de requisitos e botão de envio', () => {
    renderComponent();

    expect(screen.getByTestId('input-name')).toBeInTheDocument();
    expect(screen.getByTestId('input-email')).toBeInTheDocument();
    expect(screen.getByTestId('input-password')).toBeInTheDocument();
    expect(screen.getByTestId('input-confirm-password')).toBeInTheDocument();
    expect(screen.getByTestId('password-criteria')).toBeInTheDocument();
    expect(screen.getByTestId('submit-register-button')).toBeInTheDocument();
  });

  test('valida campos obrigatórios quando o formulário é enviado vazio', async () => {
    const user = userEvent.setup();
    renderComponent();

    await user.click(screen.getByTestId('submit-register-button'));

    expect(await screen.findByTestId('name-error')).toHaveTextContent('O nome é obrigatório');
    expect(await screen.findByTestId('email-error')).toHaveTextContent('O e-mail é obrigatório');
    expect(await screen.findByTestId('password-error')).toHaveTextContent('A senha é obrigatória');
    expect(await screen.findByTestId('confirm-password-error')).toHaveTextContent(
      'A confirmação de senha é obrigatória'
    );
    expect(mockRegister).not.toHaveBeenCalled();
  });

  test('atualiza dinamicamente os critérios de senha à medida que o usuário digita', async () => {
    const user = userEvent.setup();
    renderComponent();

    const passwordInput = screen.getByTestId('input-password');
    const lengthCrit = screen.getByTestId('criterion-length');
    const upperCrit = screen.getByTestId('criterion-uppercase');
    const lowerCrit = screen.getByTestId('criterion-lowercase');
    const numberCrit = screen.getByTestId('criterion-number');

    expect(lengthCrit).not.toHaveClass('met');
    expect(upperCrit).not.toHaveClass('met');

    // Digita 'a' (minúscula)
    await user.type(passwordInput, 'a');
    expect(lowerCrit).toHaveClass('met');
    expect(upperCrit).not.toHaveClass('met');

    // Digita 'A' (maiúscula)
    await user.type(passwordInput, 'A');
    expect(upperCrit).toHaveClass('met');

    // Digita '1' (número)
    await user.type(passwordInput, '1');
    expect(numberCrit).toHaveClass('met');

    // Completa 8 caracteres
    await user.type(passwordInput, 'bcdef');
    expect(lengthCrit).toHaveClass('met');
  });

  test('valida divergência entre senha e confirmação de senha', async () => {
    const user = userEvent.setup();
    renderComponent();

    await user.type(screen.getByTestId('input-name'), 'Ana Costa');
    await user.type(screen.getByTestId('input-email'), 'ana@exemplo.com');
    await user.type(screen.getByTestId('input-password'), 'SenhaForte1');
    await user.type(screen.getByTestId('input-confirm-password'), 'SenhaDiferente2');
    await user.click(screen.getByTestId('submit-register-button'));

    expect(await screen.findByTestId('confirm-password-error')).toHaveTextContent(
      'As senhas não coincidem'
    );
    expect(mockRegister).not.toHaveBeenCalled();
  });

  test('envia os dados corretos para cadastro e redireciona para a área protegida', async () => {
    mockRegister.mockResolvedValueOnce(undefined);
    const user = userEvent.setup();
    renderComponent();

    await user.type(screen.getByTestId('input-name'), 'Carlos Silva');
    await user.type(screen.getByTestId('input-email'), 'carlos@exemplo.com');
    await user.type(screen.getByTestId('input-password'), 'SenhaForte1');
    await user.type(screen.getByTestId('input-confirm-password'), 'SenhaForte1');
    await user.click(screen.getByTestId('submit-register-button'));

    await waitFor(() => {
      expect(mockRegister).toHaveBeenCalledWith({
        name: 'Carlos Silva',
        email: 'carlos@exemplo.com',
        password: 'SenhaForte1',
      });
    });
    expect(mockNavigate).toHaveBeenCalledWith('/dashboard', { replace: true });
  });

  test('exibe mensagem de erro na interface quando o cadastro é rejeitado', async () => {
    mockRegister.mockRejectedValueOnce(new Error('E-mail já cadastrado'));
    const user = userEvent.setup();
    renderComponent();

    await user.type(screen.getByTestId('input-name'), 'Carlos Silva');
    await user.type(screen.getByTestId('input-email'), 'existente@exemplo.com');
    await user.type(screen.getByTestId('input-password'), 'SenhaForte1');
    await user.type(screen.getByTestId('input-confirm-password'), 'SenhaForte1');
    await user.click(screen.getByTestId('submit-register-button'));

    const alert = await screen.findByTestId('register-error-alert');
    expect(alert).toHaveTextContent('E-mail já cadastrado');
  });
});
