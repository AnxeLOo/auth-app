import React from 'react';

interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  testId?: string;
}

export const Spinner: React.FC<SpinnerProps> = ({ size = 'sm', className = '', testId = 'loading-spinner' }) => {
  const sizeClass = size === 'lg' ? 'spinner-lg' : '';
  return <span className={`spinner ${sizeClass} ${className}`.trim()} role="status" aria-label="Carregando" data-testid={testId} />;
};
