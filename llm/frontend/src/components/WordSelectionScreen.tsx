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
  prevPageWords: string[] | null;
  nextPageWords: string[] | null;
  currentPage: number;
  totalPages: number;
  isSpeaking?: boolean;
  speakingSentence?: string;
}

// 밝은 테마 - 각 섹션 파스텔 톤
const SECTION_COLORS = [
  'rgba(255, 254, 245, 0.8)',
  'rgba(255, 252, 240, 0.8)',
  'rgba(245, 255, 250, 0.8)',
  'rgba(240, 255, 254, 0.8)',
];

export function WordSelectionScreen({
  words,
  selectedWords,
  currentSection,
  gazePoint,
  isLoading,
  statusMessage,
  onGenerateSentence,
  prevPageWords,
  nextPageWords,
  currentPage,
  totalPages,
  isSpeaking = false,
  speakingSentence = '',
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
            {/* 이전 페이지 단어 (단어 바로 위) */}
            {prevPageWords && (
              <span className="preview-word prev">{prevPageWords[index]}</span>
            )}
            
            <span className="word-text">{word || '...'}</span>
            
            {/* 다음 페이지 단어 (단어 바로 아래) */}
            {nextPageWords && (
              <span className="preview-word next">{nextPageWords[index]}</span>
            )}
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
          <span className="status-label">페이지:</span>
          <span className="status-value">{currentPage} / {totalPages}</span>
        </div>
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

      {/* 말하는 캐릭터 */}
      {isSpeaking && (
        <div className="speaking-character">
          <div className="speech-bubble">
            {speakingSentence}
          </div>
          <div className="character-body">
            <div className="character-eye left"></div>
            <div className="character-eye right"></div>
            <div className="character-mouth"></div>
            <div className="sound-waves">
              <div className="sound-wave"></div>
              <div className="sound-wave"></div>
              <div className="sound-wave"></div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
