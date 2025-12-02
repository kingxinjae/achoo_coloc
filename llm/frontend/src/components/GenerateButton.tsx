import React from 'react';
import './GenerateButton.css';

interface GenerateButtonProps {
  onClick: () => void;
  disabled: boolean;
  isLoading: boolean;
}

const GenerateButton: React.FC<GenerateButtonProps> = ({ onClick, disabled, isLoading }) => {
  return (
    <button
      className={`generate-button ${disabled ? 'disabled' : ''} ${isLoading ? 'loading' : ''}`}
      onClick={onClick}
      disabled={disabled || isLoading}
      aria-label="Generate sentence"
    >
      {isLoading ? (
        <>
          <div className="button-spinner"></div>
          <span>생성 중...</span>
        </>
      ) : (
        <span>문장 생성</span>
      )}
    </button>
  );
};

export default GenerateButton;
