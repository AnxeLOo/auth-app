import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { ProtectedRoute } from '../../components/ProtectedRoute';
import { AuthContext, AuthContextType } from '../../context/AuthContext';

describe('ProtectedRoute Unit Tests', () => {
  const mockContext: AuthContextType = {
    user: null,
    token: null,
    sessionId: null,
    isAuthenticated: false,
    isLoading: false,
    login: jest.fn(),
    register: jest.fn(),
    logout: jest.fn(),
    refreshUser: jest.fn(),
  };

  const renderWithRouter = (
    contextOverrides: Partial<AuthContextType>,
    initialEntry = '/dashboard'
  ) => {
    return render(
      <AuthContext.Provider value={{ ...mockContext, ...contextOverrides }}>
        <MemoryRouter initialEntries={[initialEntry]}>
          <Routes>
            <Route path="/login" element={<div data-testid="login-page-mock">Login Screen</div>} />
            <Route element={<ProtectedRoute />}>
              <Route
                path="/dashboard"
                element={<div data-testid="protected-content">Dashboard Protegido</div>}
              />
            </Route>
          </Routes>
        </MemoryRouter>
      </AuthContext.Provider>
    );
  };

  test('renderiza indicador de carregamento enquanto valida o estado de autenticação', () => {
    renderWithRouter({ isLoading: true, isAuthenticated: false });

    expect(screen.getByTestId('route-loading')).toBeInTheDocument();
    expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();
    expect(screen.queryByTestId('login-page-mock')).not.toBeInTheDocument();
  });

  test('redireciona usuário não autenticado para a página de login', () => {
    renderWithRouter({ isLoading: false, isAuthenticated: false });

    expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();
    expect(screen.getByTestId('login-page-mock')).toBeInTheDocument();
  });

  test('renderiza o conteúdo da rota protegida quando o usuário está autenticado', () => {
    renderWithRouter({
      isLoading: false,
      isAuthenticated: true,
      user: {
        id: '123',
        name: 'Usuário Teste',
        email: 'teste@exemplo.com',
        createdAt: '2026-10-10T00:00:00.000Z',
      },
    });

    expect(screen.getByTestId('protected-content')).toBeInTheDocument();
    expect(screen.queryByTestId('login-page-mock')).not.toBeInTheDocument();
  });
});
