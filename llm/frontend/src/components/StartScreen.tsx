import './StartScreen.css';

interface StartScreenProps {
  onStart: () => void;
  isLoading?: boolean;
}

export function StartScreen({ onStart, isLoading }: StartScreenProps) {
  return (
    <div className="start-screen">
      <h1 className="start-title">👁️ Eye Word TTS</h1>
      <p className="start-subtitle">시선으로 단어를 선택하고, 문장을 만들어 음성으로 들어보세요</p>
      
      <div className="start-instructions">
        <div className="instruction-item">
          <span className="instruction-icon">👀</span>
          <span>시선으로 단어 영역 선택</span>
        </div>
        <div className="instruction-item">
          <span className="instruction-icon">😉</span>
          <span>왼쪽 눈 윙크 → 단어 선택</span>
        </div>
        <div className="instruction-item">
          <span className="instruction-icon">😜</span>
          <span>오른쪽 눈 윙크 → 문장 생성</span>
        </div>
      </div>

      <button 
        className="start-btn" 
        onClick={onStart}
        disabled={isLoading}
      >
        {isLoading ? '초기화 중...' : '카메라 시작 →'}
      </button>
    </div>
  );
}
