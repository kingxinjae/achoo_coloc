import { useState, useEffect, useCallback, useRef } from 'react';
import { useEyeTracking } from './hooks/useEyeTracking';
import { StartScreen } from './components/StartScreen';
import { CalibrationScreen } from './components/CalibrationScreen';
import { WordSelectionScreen } from './components/WordSelectionScreen';
import { 
  getInitialWords, 
  recommendWords, 
  recommendDiverseWords,
  generateSentence, 
  textToSpeech,
  playAudioBlob 
} from './services/api';
import './App.css';

type AppPhase = 'start' | 'calibration' | 'selection';

// 경계 히스토리 타입
interface BoundaryHistory {
  left: string[] | null;  // 왼쪽 경계 넘어갔을 때 추천된 단어
  right: string[] | null; // 오른쪽 경계 넘어갔을 때 추천된 단어
}

function App() {
  const [phase, setPhase] = useState<AppPhase>('start');
  const [words, setWords] = useState<string[]>(['로딩중...', '로딩중...', '로딩중...', '로딩중...']);
  const [selectedWords, setSelectedWords] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState('초기화 중...');
  
  // 경계 히스토리 관리
  const boundaryHistoryRef = useRef<BoundaryHistory>({ left: null, right: null });
  const lastSectionRef = useRef<number>(0);
  const allSelectedWordsRef = useRef<Set<string>>(new Set());

  const eyeTracking = useEyeTracking();

  // 초기 단어 로드
  const loadInitialWords = useCallback(async () => {
    try {
      setIsLoading(true);
      const initialWords = await getInitialWords();
      setWords(initialWords);
      setStatusMessage('시선 추적 활성화');
      // 경계 히스토리 초기화
      boundaryHistoryRef.current = { left: null, right: null };
    } catch (err) {
      console.error('초기 단어 로드 실패:', err);
      setWords(['안녕', '오늘', '날씨', '좋다']);
      setStatusMessage('기본 단어 사용');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // 단어 선택 처리
  const handleWordSelect = useCallback(async (sectionNumber: number) => {
    if (isLoading || sectionNumber < 1 || sectionNumber > 4) return;

    const wordIndex = sectionNumber - 1;
    const word = words[wordIndex];
    if (!word || word === '로딩중...') return;

    try {
      setIsLoading(true);
      
      // 선택된 단어 추가
      const newSelectedWords = [...selectedWords, word];
      setSelectedWords(newSelectedWords);
      allSelectedWordsRef.current.add(word);
      
      setStatusMessage(`"${word}" 선택됨`);

      // 새로운 추천 단어 로드
      const recommendations = await recommendWords(word, newSelectedWords);
      setWords(recommendations);
      
      // 경계 히스토리 초기화 (새 단어 선택 시)
      boundaryHistoryRef.current = { left: null, right: null };
      
    } catch (err) {
      console.error('단어 추천 실패:', err);
      setStatusMessage('추천 실패');
    } finally {
      setIsLoading(false);
    }
  }, [words, selectedWords, isLoading]);

  // 경계 넘어갈 때 처리
  const handleBoundaryCross = useCallback(async (direction: 'left' | 'right') => {
    if (isLoading) return;

    const history = boundaryHistoryRef.current;
    
    // 이미 해당 방향으로 넘어간 적 있으면 저장된 단어 사용
    if (direction === 'left' && history.left) {
      setWords(history.left);
      setStatusMessage('이전 추천 단어 복원');
      return;
    }
    if (direction === 'right' && history.right) {
      setWords(history.right);
      setStatusMessage('이전 추천 단어 복원');
      return;
    }

    // 새로운 경계 넘어감 - 다양한 단어 추천
    try {
      setIsLoading(true);
      const excludeWords = Array.from(allSelectedWordsRef.current);
      const diverseWords = await recommendDiverseWords(selectedWords, excludeWords);
      
      // 히스토리에 저장
      if (direction === 'left') {
        boundaryHistoryRef.current.left = diverseWords;
      } else {
        boundaryHistoryRef.current.right = diverseWords;
      }
      
      setWords(diverseWords);
      setStatusMessage('새로운 단어 추천');
    } catch (err) {
      console.error('다양한 단어 추천 실패:', err);
    } finally {
      setIsLoading(false);
    }
  }, [selectedWords, isLoading]);

  // 시선 영역 변화 감지 (경계 체크)
  useEffect(() => {
    if (phase !== 'selection' || !eyeTracking.isTracking) return;

    const currentSection = eyeTracking.currentSection;
    const lastSection = lastSectionRef.current;

    // 왼쪽 경계 (영역 1에서 더 왼쪽으로)
    if (lastSection === 1 && eyeTracking.gazePoint && eyeTracking.gazePoint.x < 50) {
      handleBoundaryCross('left');
    }
    // 오른쪽 경계 (영역 4에서 더 오른쪽으로)
    else if (lastSection === 4 && eyeTracking.gazePoint && eyeTracking.gazePoint.x > window.innerWidth - 50) {
      handleBoundaryCross('right');
    }

    lastSectionRef.current = currentSection;
  }, [eyeTracking.currentSection, eyeTracking.gazePoint, eyeTracking.isTracking, phase, handleBoundaryCross]);

  // 문장 생성 처리
  const handleGenerateSentence = useCallback(async () => {
    if (selectedWords.length === 0 || isLoading) return;

    try {
      setIsLoading(true);
      setStatusMessage('문장 생성 중...');

      // 문장 생성
      const sentence = await generateSentence(selectedWords);
      setStatusMessage(`생성: "${sentence}"`);

      // TTS 재생
      try {
        setStatusMessage('음성 생성 중...');
        const audioBlob = await textToSpeech(sentence);
        playAudioBlob(audioBlob);
      } catch (ttsErr) {
        console.error('TTS 오류:', ttsErr);
      }

      // 초기화
      setSelectedWords([]);
      allSelectedWordsRef.current.clear();
      await loadInitialWords();

    } catch (err) {
      console.error('문장 생성 오류:', err);
      setStatusMessage('문장 생성 실패');
    } finally {
      setIsLoading(false);
    }
  }, [selectedWords, isLoading, loadInitialWords]);

  // 왼쪽 윙크 핸들러 (단어 선택)
  const handleLeftWink = useCallback(() => {
    if (phase !== 'selection' || !eyeTracking.isTracking) return;
    handleWordSelect(eyeTracking.currentSection);
  }, [phase, eyeTracking.isTracking, eyeTracking.currentSection, handleWordSelect]);

  // 오른쪽 윙크 핸들러 (문장 생성)
  const handleRightWink = useCallback(() => {
    if (phase !== 'selection' || !eyeTracking.isTracking) return;
    if (selectedWords.length >= 1) {
      handleGenerateSentence();
    }
  }, [phase, eyeTracking.isTracking, selectedWords.length, handleGenerateSentence]);

  // 윙크 핸들러 등록
  useEffect(() => {
    eyeTracking.setWinkHandlers(handleLeftWink, handleRightWink);
  }, [eyeTracking.setWinkHandlers, handleLeftWink, handleRightWink]);

  // 시작 버튼 클릭
  const handleStart = async () => {
    setIsLoading(true);
    
    // 전체화면 시도
    try {
      await document.documentElement.requestFullscreen();
    } catch (e) {
      console.log('전체화면 전환 실패:', e);
    }
    
    // 먼저 phase를 변경해서 video 요소가 렌더링되도록 함
    setPhase('calibration');
    
    // 약간의 지연 후 카메라 시작 (video 요소가 마운트될 시간)
    await new Promise(resolve => setTimeout(resolve, 100));
    
    await eyeTracking.startCamera();
    await loadInitialWords();
    setIsLoading(false);
    
    eyeTracking.startCalibration();
  };

  // 캘리브레이션 완료 감지
  useEffect(() => {
    if (phase === 'calibration' && eyeTracking.isTracking && !eyeTracking.isCalibrating) {
      setPhase('selection');
      setStatusMessage('시선 추적 활성화');
    }
  }, [phase, eyeTracking.isTracking, eyeTracking.isCalibrating]);

  return (
    <div className="app">
      {phase === 'start' && (
        <StartScreen onStart={handleStart} isLoading={isLoading} />
      )}

      {phase === 'calibration' && (
        <CalibrationScreen
          currentIndex={eyeTracking.currentCalibrationIndex}
          totalPoints={eyeTracking.totalCalibrationPoints}
        />
      )}

      {phase === 'selection' && (
        <WordSelectionScreen
          words={words}
          selectedWords={selectedWords}
          currentSection={eyeTracking.currentSection}
          gazePoint={eyeTracking.gazePoint}
          isLoading={isLoading}
          statusMessage={statusMessage}
          onGenerateSentence={handleGenerateSentence}
        />
      )}

      {/* 카메라 미리보기 - App 레벨에서 한 번만 렌더링 (phase가 바뀌어도 유지) */}
      {phase !== 'start' && (
        <div className="global-video-container">
          <video ref={eyeTracking.videoRef} autoPlay muted playsInline />
          <canvas ref={eyeTracking.canvasRef} />
        </div>
      )}
    </div>
  );
}

export default App;
