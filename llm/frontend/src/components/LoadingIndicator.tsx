import React from 'react';
import './LoadingIndicator.css';

interface LoadingIndicatorProps {
  message?: string;
  size?: 'small' | 'medium' | 'large';
  inline?: boolean;
}

const LoadingIndicator: React.FC<LoadingIndicatorProps> = ({ 
  message = '로딩 중...', 
  size = 'medium',
  inline = false
}) => {
  return (
    <div className={`loading-indicator ${inline ? 'inline' : ''} size-${size}`}>
      <div className="spinner"></div>
      {message && <span className="loading-message">{message}</span>}
    </div>
  );
};

export default LoadingIndicator;
