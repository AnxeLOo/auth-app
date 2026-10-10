import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { Spinner } from '../components/Spinner';
import { Alert } from '../components/Alert';

export const DashboardPage: React.FC = () => {
  const { user, sessionId, refreshUser, logout } = useAuth();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(
    null
  );

  const handleRefresh = async () => {
    setIsRefreshing(true);
    setFeedback(null);
    try {
      await refreshUser();
      setFeedback({ type: 'success', message: 'Dados da sessão atualizados com sucesso via API!' });
    } catch {
      setFeedback({ type: 'error', message: 'Falha ao atualizar dados com o servidor.' });
    } finally {
      setIsRefreshing(false);
    }
  };

  const formattedDate = user?.createdAt
    ? new Date(user.createdAt).toLocaleString('pt-BR', {
        dateStyle: 'long',
        timeStyle: 'short',
      })
    : 'N/A';

  return (
    <div className="dashboard-container" data-testid="dashboard-page">
      <div className="welcome-banner">
        <h1 className="welcome-title">Olá, {user?.name || 'Usuário'}! 👋</h1>
        <p className="welcome-text">
          Você está autenticado em uma área restrita e protegida. Abaixo estão as informações do seu perfil e o status da sua sessão ativa gerenciada via tokens seguros.
        </p>
      </div>

      {feedback && (
        <Alert
          type={feedback.type}
          message={feedback.message}
          testId="dashboard-feedback-alert"
        />
      )}

      <div className="dashboard-grid">
        <div className="info-card" data-testid="user-info-card">
          <h2 className="card-title">👤 Perfil do Usuário</h2>
          <div className="info-list">
            <div className="info-row">
              <span className="info-label">Nome:</span>
              <span className="info-value" data-testid="user-name-display">
                {user?.name}
              </span>
            </div>
            <div className="info-row">
              <span className="info-label">E-mail:</span>
              <span className="info-value" data-testid="user-email-display">
                {user?.email}
              </span>
            </div>
            <div className="info-row">
              <span className="info-label">ID do Usuário:</span>
              <span className="info-value code-pill" data-testid="user-id-display">
                {user?.id}
              </span>
            </div>
            <div className="info-row">
              <span className="info-label">Membro desde:</span>
              <span className="info-value" data-testid="user-created-at-display">
                {formattedDate}
              </span>
            </div>
          </div>
        </div>

        <div className="info-card" data-testid="session-info-card">
          <h2 className="card-title">🔐 Status da Sessão</h2>
          <div className="info-list">
            <div className="info-row">
              <span className="info-label">Estado:</span>
              <span className="status-badge active" data-testid="session-status-badge">
                <span className="pulse-dot"></span>
                Autenticado
              </span>
            </div>
            <div className="info-row">
              <span className="info-label">ID da Sessão:</span>
              <span className="info-value code-pill" data-testid="session-id-display">
                {sessionId || 'Ativa (Redis)'}
              </span>
            </div>
            <div className="info-row">
              <span className="info-label">Mecanismo:</span>
              <span className="info-value">JWT Bearer (HS256)</span>
            </div>
            <div className="info-row">
              <span className="info-label">Armazenamento:</span>
              <span className="info-value">Memória + SessionStorage</span>
            </div>
          </div>
        </div>
      </div>

      <div
        style={{
          display: 'flex',
          gap: '1rem',
          flexWrap: 'wrap',
          justifyContent: 'flex-end',
        }}
      >
        <button
          type="button"
          onClick={handleRefresh}
          className="btn btn-outline"
          disabled={isRefreshing}
          data-testid="refresh-session-button"
        >
          {isRefreshing ? (
            <>
              <Spinner size="sm" />
              <span>Verificando API...</span>
            </>
          ) : (
            '🔄 Validar Sessão (/api/auth/me)'
          )}
        </button>

        <button
          type="button"
          onClick={logout}
          className="btn btn-danger-outline"
          data-testid="dashboard-logout-button"
        >
          Encerrar Sessão
        </button>
      </div>
    </div>
  );
};
