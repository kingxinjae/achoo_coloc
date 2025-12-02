import React from 'react';
import './SelectedWordsList.css';

interface SelectedWordsListProps {
  words: string[];
  onReset: () => void;
}

const SelectedWordsList: React.FC<SelectedWordsListProps> = ({ words, onReset }) => {
  if (words.length === 0) {
    return null;
  }

  return (
    <div className="selected-words-list">
      <div className="selected-words-header">
        <h2>선택된 단어</h2>
        <button 
          className="reset-button"
          onClick={onReset}
          aria-label="Reset selected words"
        >
          초기화
        </button>
      </div>
      
      <ul className="selected-words-items">
        {words.map((word, index) => (
          <li key={index} className="selected-word-item">
            <span className="word-number">{index + 1}</span>
            <span className="word-text">{word}</span>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default SelectedWordsList;
