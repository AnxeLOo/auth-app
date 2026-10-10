import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { AppContent } from '../../App';
import { AuthProvider } from '../../context/AuthContext';
import { authService } from '../../services/auth.service';
import * as apiModule from '../../services/api';

jest.mock('../../services/auth.service');

describe('Fluxo Integrado de Autenticação (Integration Tests)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    sessionStorage.clear();
    apiModule.clearSessionStorage();
  });

  test('Fluxo completo: Login -> Dashboard com dados do perfil -> Logout seguro', async () => {
    const user = userEvent.setup();

    const mockUserData = {
      id: 'usr-int-1',
      name: 'Bernardo Lima',
      email: 'bernardo@exemplo.com',
      createdAt: '2026-10-10T08:30:00Z',
    };

    (authService.login as jest.Mock).mockResolvedValueOnce({
      user: mockUserData,
      accessToken: 'jwt-access-token-123',
      refreshToken: 'refresh-token-456',
      sessionId: 'sess-789',
      expiresIn: '15m',
    });

    (authService.logout as jest.Mock).mockResolvedValueOnce(undefined);

    render(
      <MemoryRouter initialEntries={['/login']}>
        <AuthProvider>
          <AppContent />
        </AuthProvider>
      </MemoryRouter>
    );

    // 1. Verifica exibição da tela de login
    expect(screen.getByTestId('login-card')).toBeInTheDocument();
    expect(screen.getByTestId('input-email')).toBeInTheDocument();

    // 2. Preenche formulário de login e submete
    await user.type(screen.getByTestId('input-email'), 'bernardo@exemplo.com');
    await user.type(screen.getByTestId('input-password'), 'SenhaForte123');
    await user.click(screen.getByTestId('submit-login-button'));

    // 3. Verifica transição para o Dashboard protegido
    await waitFor(() => {
      expect(screen.getByTestId('dashboard-page')).toBeInTheDocument();
    });

    // 4. Verifica dados do usuário renderizados
    expect(screen.getByTestId('user-name-display')).toHaveTextContent('Bernardo Lima');
    expect(screen.getByTestId('user-email-display')).toHaveTextContent('bernardo@exemplo.com');
    expect(screen.getByTestId('user-id-display')).toHaveTextContent('usr-int-1');
    expect(screen.getByTestId('session-id-display')).toHaveTextContent('sess-789');

    // 5. Aciona o botão de logout no Dashboard
    await user.click(screen.getByTestId('dashboard-logout-button'));

    // 6. Verifica redirecionamento de volta para o login
    await waitFor(() => {
      expect(screen.getByTestId('login-card')).toBeInTheDocument();
    });
    expect(screen.queryByTestId('dashboard-page')).not.toBeInTheDocument();
    expect(authService.logout).toHaveBeenCalledWith({ sessionId: 'sess-789' });
  });

  test('Fluxo completo: Cadastro com validação -> Redirecionamento para área autenticada', async () => {
    const user = userEvent.setup();

    const newUserData = {
      id: 'usr-new-2',
      name: 'Juliana Fernandes',
      email: 'juliana@exemplo.com',
      createdAt: '2026-10-10T12:00:00Z',
    };

    (authService.register as jest.Mock).mockResolvedValueOnce({
      user: newUserData,
      accessToken: 'jwt-register-token',
      refreshToken: 'refresh-register-token',
      sessionId: 'sess-reg-001',
      expiresIn: '15m',
    });

    render(
      <MemoryRouter initialEntries={['/register']}>
        <AuthProvider>
          <AppContent />
        </AuthProvider>
      </MemoryRouter>
    );

    // 1. Verifica tela de cadastro
    expect(screen.getByTestId('register-card')).toBeInTheDocument();

    // 2. Preenche campos
    await user.type(screen.getByTestId('input-name'), 'Juliana Fernandes');
    await user.type(screen.getByTestId('input-email'), 'juliana@exemplo.com');
    await user.type(screen.getByTestId('input-password'), 'SenhaSegura99');
    await user.type(screen.getByTestId('input-confirm-password'), 'SenhaSegura99');

    // 3. Submete
    await user.click(screen.getByTestId('submit-register-button'));

    // 4. Verifica transição direta para Dashboard com sessão estabelecida
    await waitFor(() => {
      expect(screen.getByTestId('dashboard-page')).toBeInTheDocument();
    });

    expect(screen.getByTestId('user-name-display')).toHaveTextContent('Juliana Fernandes');
    expect(screen.getByTestId('user-email-display')).toHaveTextContent('juliana@exemplo.com');
  });
});
