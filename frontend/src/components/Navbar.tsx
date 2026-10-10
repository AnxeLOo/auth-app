import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export const Navbar: React.FC = () => {
  const { user, isAuthenticated, logout } = useAuth();

  return (
    <header className="navbar">
      <div className="container navbar-container">
        <Link to={isAuthenticated ? '/dashboard' : '/login'} className="nav-brand">
          <span className="nav-logo-icon">🔒</span>
          <span>AuthApp</span>
        </Link>

        <div className="nav-actions">
          {isAuthenticated && user ? (
            <>
              <div className="user-badge" data-testid="user-nav-badge">
                <span className="user-avatar-circle">{user.name.charAt(0).toUpperCase()}</span>
                <span>{user.name.split(' ')[0]}</span>
              </div>
              <button
                type="button"
                onClick={logout}
                className="btn btn-outline btn-sm btn-danger-outline"
                data-testid="logout-button"
              >
                Sair
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="btn btn-outline btn-sm" data-testid="nav-login-link">
                Entrar
              </Link>
              <Link to="/register" className="btn btn-primary btn-sm" data-testid="nav-register-link">
                Cadastrar
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
};
