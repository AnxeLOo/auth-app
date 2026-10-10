import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { getErrorMessage } from '../services/api';
import { Alert } from '../components/Alert';
import { Spinner } from '../components/Spinner';

export const RegisterPage: React.FC = () => {
  const { register, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [errors, setErrors] = useState<{
    name?: string;
    email?: string;
    password?: string;
    confirmPassword?: string;
  }>({});
  const [apiError, setApiError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  // Checagens dinâmicas de regras de senha
  const hasMinLength = password.length >= 8;
  const hasUppercase = /[A-Z]/.test(password);
  const hasLowercase = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);

  const validateForm = (): boolean => {
    const newErrors: {
      name?: string;
      email?: string;
      password?: string;
      confirmPassword?: string;
    } = {};

    if (!name.trim()) {
      newErrors.name = 'O nome é obrigatório';
    } else if (name.trim().length < 2) {
      newErrors.name = 'O nome deve ter no mínimo 2 caracteres';
    } else if (name.trim().length > 100) {
      newErrors.name = 'O nome não pode exceder 100 caracteres';
    }

    if (!email.trim()) {
      newErrors.email = 'O e-mail é obrigatório';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      newErrors.email = 'Formato de e-mail inválido';
    }

    if (!password) {
      newErrors.password = 'A senha é obrigatória';
    } else if (!hasMinLength || !hasUppercase || !hasLowercase || !hasNumber) {
      newErrors.password = 'A senha não atende aos requisitos de segurança';
    }

    if (!confirmPassword) {
      newErrors.confirmPassword = 'A confirmação de senha é obrigatória';
    } else if (password !== confirmPassword) {
      newErrors.confirmPassword = 'As senhas não coincidem';
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
      await register({
        name: name.trim(),
        email: email.trim(),
        password,
      });
      navigate('/dashboard', { replace: true });
    } catch (err) {
      setApiError(getErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="auth-card" data-testid="register-card">
      <div className="auth-header">
        <h1 className="auth-title">Crie sua conta</h1>
        <p className="auth-subtitle">Preencha os dados abaixo para começar</p>
      </div>

      <Alert type="error" message={apiError || ''} testId="register-error-alert" />

      <form onSubmit={handleSubmit} noValidate data-testid="register-form">
        <div className="form-group">
          <label htmlFor="name" className="form-label">
            Nome Completo
          </label>
          <div className="input-wrapper">
            <input
              id="name"
              type="text"
              name="name"
              autoComplete="name"
              placeholder="Ex: João da Silva"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (errors.name) setErrors((prev) => ({ ...prev, name: undefined }));
              }}
              className={`form-input ${errors.name ? 'input-error' : ''}`}
              data-testid="input-name"
              disabled={isSubmitting}
            />
          </div>
          {errors.name && (
            <p className="field-error" data-testid="name-error">
              {errors.name}
            </p>
          )}
        </div>

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
              autoComplete="new-password"
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

          {/* Checklist visual de força de senha */}
          <div className="password-criteria" data-testid="password-criteria">
            <div className="criteria-title">A senha deve conter:</div>
            <div className={`criteria-item ${hasMinLength ? 'met' : ''}`} data-testid="criterion-length">
              <span className="criteria-icon">{hasMinLength ? '✓' : '○'}</span>
              <span>Mínimo de 8 caracteres</span>
            </div>
            <div className={`criteria-item ${hasUppercase ? 'met' : ''}`} data-testid="criterion-uppercase">
              <span className="criteria-icon">{hasUppercase ? '✓' : '○'}</span>
              <span>Pelo menos uma letra maiúscula (A-Z)</span>
            </div>
            <div className={`criteria-item ${hasLowercase ? 'met' : ''}`} data-testid="criterion-lowercase">
              <span className="criteria-icon">{hasLowercase ? '✓' : '○'}</span>
              <span>Pelo menos uma letra minúscula (a-z)</span>
            </div>
            <div className={`criteria-item ${hasNumber ? 'met' : ''}`} data-testid="criterion-number">
              <span className="criteria-icon">{hasNumber ? '✓' : '○'}</span>
              <span>Pelo menos um número (0-9)</span>
            </div>
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="confirmPassword" className="form-label">
            Confirmar Senha
          </label>
          <div className="input-wrapper">
            <input
              id="confirmPassword"
              type={showPassword ? 'text' : 'password'}
              name="confirmPassword"
              autoComplete="new-password"
              placeholder="••••••••"
              value={confirmPassword}
              onChange={(e) => {
                setConfirmPassword(e.target.value);
                if (errors.confirmPassword)
                  setErrors((prev) => ({ ...prev, confirmPassword: undefined }));
              }}
              className={`form-input ${errors.confirmPassword ? 'input-error' : ''}`}
              data-testid="input-confirm-password"
              disabled={isSubmitting}
            />
          </div>
          {errors.confirmPassword && (
            <p className="field-error" data-testid="confirm-password-error">
              {errors.confirmPassword}
            </p>
          )}
        </div>

        <button
          type="submit"
          className="btn btn-primary"
          disabled={isSubmitting}
          data-testid="submit-register-button"
        >
          {isSubmitting ? (
            <>
              <Spinner size="sm" />
              <span>Criando conta...</span>
            </>
          ) : (
            'Criar conta'
          )}
        </button>
      </form>

      <div className="auth-footer">
        <span>Já possui uma conta?</span>
        <Link to="/login" className="auth-link" data-testid="login-link">
          Faça login
        </Link>
      </div>
    </div>
  );
};
