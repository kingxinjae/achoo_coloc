import { useRef, useEffect } from 'react';
import type { GazePoint } from '../hooks/useEyeTracking';
import './WordSelectionScreen.css';

interface WordSelectionScreenProps {
  words: string[];
  selectedWords: string[];
  currentSection: number;
  gazePoint: GazePoint | null;
  isLoading: boolean;
  statusMessage: string;
  onGenerateSentence: () => void;
}

const SECTION_COLORS = [
  'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
  'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
  'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
];

export function WordSelectionScreen({
  words,
  selectedWords,
  currentSection,
  gazePoint,
  isLoading,
  statusMessage,
  onGenerateSentence,
}: WordSelectionScreenProps) {
  const sectionRefs = useRef<(HTMLDivElement | null)[]>([]);

  // 선택 애니메이션
  useEffect(() => {
    // 선택된 단어가 추가될 때 애니메이션
  }, [selectedWords]);

  return (
    <div className="word-selection-screen">
      {/* 4분할 단어 영역 */}
      <div className="word-sections">
        {words.map((word, index) => (
          <div
            key={index}
            ref={el => { sectionRefs.current[index] = el; }}
            className={`word-section ${currentSection === index + 1 ? 'highlighted' : ''}`}
            style={{ background: SECTION_COLORS[index] }}
          >
            <span className="section-number">{index + 1}</span>
            <span className="word-text">{word || '로딩중...'}</span>
          </div>
        ))}
      </div>

      {/* 시선 포인트 */}
      {gazePoint && (
        <div 
          className="gaze-point"
          style={{ left: `${gazePoint.x}px`, top: `${gazePoint.y}px` }}
        />
      )}

      {/* 상태 패널 */}
      <div className="status-panel">
        <div className="status-item">
          <span className="status-label">상태:</span>
          <span className="status-value">{statusMessage}</span>
        </div>
        <div className="status-item">
          <span className="status-label">시선 영역:</span>
          <span className="status-value">
            {currentSection > 0 ? `영역 ${currentSection}` : '-'}
          </span>
        </div>
        <div className="status-item">
          <span className="status-label">선택:</span>
          <span className="status-value">왼쪽 눈 윙크</span>
        </div>
      </div>

      {/* 선택된 단어 바 */}
      <div className="selected-words-bar">
        <span className="selected-label">선택된 단어:</span>
        <div className="selected-words-container">
          {selectedWords.map((word, index) => (
            <span key={index} className="selected-word-chip">{word}</span>
          ))}
        </div>
      </div>

      {/* 문장 생성 힌트 */}
      {selectedWords.length >= 1 && (
        <div className="generate-hint">
          오른쪽 눈 윙크로 문장 생성! ({selectedWords.length}개 선택됨)
        </div>
      )}

      {/* 문장 생성 버튼 (수동 조작용) */}
      {selectedWords.length >= 1 && (
        <button 
          className="generate-button"
          onClick={onGenerateSentence}
          disabled={isLoading}
        >
          문장 생성 →
        </button>
      )}

      {/* 로딩 오버레이 */}
      {isLoading && (
        <div className="loading-overlay">
          <div className="loading-spinner" />
          <div className="loading-text">처리 중...</div>
        </div>
      )}
    </div>
  );
}
