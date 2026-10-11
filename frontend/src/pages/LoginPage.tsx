import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { getErrorMessage } from '../services/api';
import { Alert } from '../components/Alert';
import { Spinner } from '../components/Spinner';

export const LoginPage: React.FC = () => {
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [apiError, setApiError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const from = (location.state as { from?: { pathname: string } })?.from?.pathname || '/dashboard';

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const validateForm = (): boolean => {
    const newErrors: { email?: string; password?: string } = {};

    if (!email.trim()) {
      newErrors.email = 'O e-mail é obrigatório';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      newErrors.email = 'Formato de e-mail inválido';
    }

    if (!password) {
      newErrors.password = 'A senha é obrigatória';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setApiError(null);

    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      await login({ email: email.trim(), password });
      navigate(from, { replace: true });
    } catch (err) {
      setApiError(getErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="auth-card" data-testid="login-card">
      <div className="auth-header">
        <h1 className="auth-title">Bem-vindo de volta</h1>
        <p className="auth-subtitle">Informe suas credenciais para acessar sua conta</p>
      </div>

      <div className="demo-credentials-banner" data-testid="demo-credentials-banner">
        <div className="demo-credentials-header">
          <span>💡 <strong>Acesso Demonstração (Seed)</strong></span>
          <button
            type="button"
            className="btn-demo-autofill"
            onClick={() => {
              setEmail('user@example.com');
              setPassword('Password123!');
              if (errors.email || errors.password) {
                setErrors({});
              }
            }}
            data-testid="autofill-demo-btn"
          >
            Preencher
          </button>
        </div>
        <div className="demo-credentials-body">
          <span>E-mail: <code>user@example.com</code></span>
          <span>Senha: <code>Password123!</code></span>
        </div>
      </div>

      <Alert type="error" message={apiError || ''} testId="login-error-alert" />

      <form onSubmit={handleSubmit} noValidate data-testid="login-form">
        <div className="form-group">
          <label htmlFor="email" className="form-label">
            E-mail
          </label>
          <div className="input-wrapper">
            <input
              id="email"
              type="email"
              name="email"
              autoComplete="email"
              placeholder="seu.email@exemplo.com"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (errors.email) setErrors((prev) => ({ ...prev, email: undefined }));
              }}
              className={`form-input ${errors.email ? 'input-error' : ''}`}
              data-testid="input-email"
              disabled={isSubmitting}
            />
          </div>
          {errors.email && (
            <p className="field-error" data-testid="email-error">
              {errors.email}
            </p>
          )}
        </div>

        <div className="form-group">
          <label htmlFor="password" className="form-label">
            Senha
          </label>
          <div className="input-wrapper">
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              name="password"
              autoComplete="current-password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (errors.password) setErrors((prev) => ({ ...prev, password: undefined }));
              }}
              className={`form-input ${errors.password ? 'input-error' : ''}`}
              data-testid="input-password"
              disabled={isSubmitting}
            />
            <button
              type="button"
              className="toggle-password-btn"
              onClick={() => setShowPassword(!showPassword)}
              aria-label={showPassword ? 'Ocultar senha' : 'Exibir senha'}
              tabIndex={-1}
            >
              {showPassword ? 'Ocultar' : 'Exibir'}
            </button>
          </div>
          {errors.password && (
            <p className="field-error" data-testid="password-error">
              {errors.password}
            </p>
          )}
        </div>

        <button
          type="submit"
          className="btn btn-primary"
          disabled={isSubmitting}
          data-testid="submit-login-button"
        >
          {isSubmitting ? (
            <>
              <Spinner size="sm" />
              <span>Autenticando...</span>
            </>
          ) : (
            'Entrar na conta'
          )}
        </button>
      </form>

      <div className="auth-footer">
        <span>Não tem uma conta?</span>
        <Link to="/register" className="auth-link" data-testid="register-link">
          Cadastre-se agora
        </Link>
      </div>
    </div>
  );
};
