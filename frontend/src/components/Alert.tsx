import React from 'react';

interface AlertProps {
  type?: 'error' | 'success' | 'warning' | 'info';
  message: string;
  testId?: string;
}

export const Alert: React.FC<AlertProps> = ({ type = 'error', message, testId = 'alert-message' }) => {
  if (!message) return null;

  const iconMap = {
    error: '⚠️',
    success: '✅',
    warning: '⚡',
    info: 'ℹ️',
  };

  return (
    <div className={`alert alert-${type}`} role="alert" data-testid={testId}>
      <span className="alert-icon">{iconMap[type]}</span>
      <span className="alert-text">{message}</span>
    </div>
  );
};
