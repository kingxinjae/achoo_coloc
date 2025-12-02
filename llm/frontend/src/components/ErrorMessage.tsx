import React from 'react';
import './ErrorMessage.css';
import { ErrorType } from '../types/api';

interface ErrorMessageProps {
  message: string;
  errorType?: ErrorType;
  onRetry?: () => void;
  onDismiss: () => void;
}

const ErrorMessage: React.FC<ErrorMessageProps> = ({ 
  message, 
  errorType,
  onRetry, 
  onDismiss 
}) => {
  const getErrorIcon = () => {
    switch (errorType) {
      case ErrorType.NETWORK_ERROR:
        return '🌐';
      case ErrorType.FAISS_ERROR:
        return '🔍';
      case ErrorType.OLLAMA_ERROR:
        return '🤖';
      case ErrorType.TTS_ERROR:
        return '🔊';
      default:
        return '⚠️';
    }
  };

  return (
    <div className={`error-message error-${errorType || 'default'}`}>
      <div className="error-content">
        <span className="error-icon">{getErrorIcon()}</span>
        <span className="error-text">{message}</span>
      </div>
      <div className="error-actions">
        {onRetry && (
          <button 
            className="error-retry-button"
            onClick={onRetry}
            aria-label="재시도"
          >
            🔄 재시도
          </button>
        )}
        <button 
          className="error-dismiss-button"
          onClick={onDismiss}
          aria-label="닫기"
        >
          ✕
        </button>
      </div>
    </div>
  );
};

export default ErrorMessage;
