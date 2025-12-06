import './StartScreen.css';

interface StartScreenProps {
  onStart: () => void;
  isLoading?: boolean;
}

export function StartScreen({ onStart, isLoading }: StartScreenProps) {
  return (
    <div className="start-screen">
      {/* 통통 튀는 배경 도형들 */}
      <div className="floating-shapes">
        <div className="shape shape-1"></div>
        <div className="shape shape-2"></div>
        <div className="shape shape-3"></div>
        <div className="shape shape-4"></div>
        <div className="shape shape-5"></div>
        <div className="shape shape-6"></div>
        <div className="shape shape-7"></div>
        <div className="shape shape-8"></div>
        <div className="shape shape-9"></div>
        <div className="shape shape-10"></div>
      </div>

      <div className="logo-container">
        <span className="logo-text">ESC</span>
        <span className="logo-subtitle">Eye Speaker Console</span>
      </div>
      
      <p className="start-subtitle">시선으로 단어를 선택하고, 문장을 만들어 음성으로 전달하세요</p>
      
      <div className="start-instructions">
        <div className="instruction-item">
          <span className="instruction-number">1</span>
          <span>시선으로 단어 영역 선택</span>
        </div>
        <div className="instruction-item">
          <span className="instruction-number">2</span>
          <span>왼쪽 눈 윙크로 단어 선택</span>
        </div>
        <div className="instruction-item">
          <span className="instruction-number">3</span>
          <span>오른쪽 눈 윙크로 문장 생성</span>
        </div>
      </div>

      <button 
        className="start-btn" 
        onClick={onStart}
        disabled={isLoading}
      >
        {isLoading ? '초기화 중...' : '시작하기'}
      </button>
    </div>
  );
}
