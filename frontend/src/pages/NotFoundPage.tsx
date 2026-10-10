import React from 'react';
import { Link } from 'react-router-dom';

export const NotFoundPage: React.FC = () => {
  return (
    <div className="auth-card" style={{ textAlign: 'center' }} data-testid="not-found-page">
      <div className="auth-header">
        <h1 className="auth-title" style={{ fontSize: '3rem', color: 'var(--primary)' }}>
          404
        </h1>
        <p className="auth-subtitle">Página não encontrada</p>
      </div>
      <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
        O endereço solicitado não existe ou foi movido.
      </p>
      <Link to="/" className="btn btn-primary" style={{ width: 'auto', display: 'inline-flex' }}>
        Voltar para o Início
      </Link>
    </div>
  );
};
