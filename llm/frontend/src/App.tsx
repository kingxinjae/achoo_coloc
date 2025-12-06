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
  textToSpeech
} from './services/api';
import './App.css';

type AppPhase = 'start' | 'calibration' | 'selection';

function App() {
  const [phase, setPhase] = useState<AppPhase>('start');
  const [selectedWords, setSelectedWords] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState('초기화 중...');
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [speakingSentence, setSpeakingSentence] = useState('');
  
  // 페이지 스택 관리
  const [pageStack, setPageStack] = useState<string[][]>([['로딩중...', '로딩중...', '로딩중...', '로딩중...']]);
  const [currentPageIndex, setCurrentPageIndex] = useState(0);
  
  // 현재 기준 단어 (확장 시 이 단어 기반 추천)
  const baseWordRef = useRef<string | null>(null);
  const lastSectionRef = useRef<number>(0);
  const allSelectedWordsRef = useRef<Set<string>>(new Set());
  
  // 경계 쿨다운 (연속 트리거 방지)
  const boundaryCooldownRef = useRef<boolean>(false);

  const eyeTracking = useEyeTracking();
  
  // 현재 페이지 단어
  const words = pageStack[currentPageIndex] || ['로딩중...', '로딩중...', '로딩중...', '로딩중...'];
  // 이전 페이지 단어 (위에 표시)
  const prevPageWords = currentPageIndex > 0 ? pageStack[currentPageIndex - 1] : null;
  // 다음 페이지 단어 (아래에 표시)
  const nextPageWords = currentPageIndex < pageStack.length - 1 ? pageStack[currentPageIndex + 1] : null;

  // 초기 단어 로드
  const loadInitialWords = useCallback(async () => {
    try {
      setIsLoading(true);
      const initialWords = await getInitialWords();
      // 페이지 스택 초기화
      setPageStack([initialWords]);
      setCurrentPageIndex(0);
      baseWordRef.current = null;
      setStatusMessage('시선 추적 활성화');
    } catch (err) {
      console.error('초기 단어 로드 실패:', err);
      setPageStack([['안녕', '오늘', '날씨', '좋다']]);
      setCurrentPageIndex(0);
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

      // 새로운 추천 단어 로드 (선택한 단어 기반)
      const recommendations = await recommendWords(word, newSelectedWords);
      
      // 페이지 스택 완전 리셋 - 새로운 1페이지부터 시작
      setPageStack([recommendations]);
      setCurrentPageIndex(0);
      baseWordRef.current = word; // 확장 시 이 단어 기반 추천
      
    } catch (err) {
      console.error('단어 추천 실패:', err);
      setStatusMessage('추천 실패');
    } finally {
      setIsLoading(false);
    }
  }, [words, selectedWords, isLoading]);

  // 왼쪽 경계 처리 (이전 페이지로)
  const handleLeftBoundary = useCallback(() => {
    if (boundaryCooldownRef.current || isLoading) return;
    if (currentPageIndex <= 0) return; // 1페이지면 무시
    
    boundaryCooldownRef.current = true;
    setTimeout(() => { boundaryCooldownRef.current = false; }, 500);
    
    setCurrentPageIndex(prev => prev - 1);
    setStatusMessage(`${currentPageIndex}페이지로 이동`);
  }, [currentPageIndex, isLoading]);

  // 오른쪽 경계 처리 (다음 페이지로)
  const handleRightBoundary = useCallback(async () => {
    if (boundaryCooldownRef.current || isLoading) return;
    
    boundaryCooldownRef.current = true;
    setTimeout(() => { boundaryCooldownRef.current = false; }, 500);
    
    // 이미 다음 페이지가 있으면 그냥 이동
    if (currentPageIndex < pageStack.length - 1) {
      setCurrentPageIndex(prev => prev + 1);
      setStatusMessage(`${currentPageIndex + 2}페이지로 이동`);
      return;
    }

    // 새 페이지 생성 필요
    try {
      setIsLoading(true);
      const excludeWords = Array.from(allSelectedWordsRef.current);
      // 기준 단어가 있으면 그 단어 기반, 없으면 전체 선택 단어 기반
      const baseWord = baseWordRef.current;
      const diverseWords = await recommendDiverseWords(
        baseWord ? [baseWord] : selectedWords, 
        excludeWords
      );
      
      // 새 페이지 추가
      setPageStack(prev => [...prev, diverseWords]);
      setCurrentPageIndex(prev => prev + 1);
      setStatusMessage(`${currentPageIndex + 2}페이지 생성`);
    } catch (err) {
      console.error('다양한 단어 추천 실패:', err);
    } finally {
      setIsLoading(false);
    }
  }, [currentPageIndex, pageStack.length, selectedWords, isLoading]);

  // 시선 영역 변화 감지 (경계 체크)
  useEffect(() => {
    if (phase !== 'selection' || !eyeTracking.isTracking) return;
    if (!eyeTracking.gazePoint) return;

    const gazeX = eyeTracking.gazePoint.x;
    const screenWidth = window.innerWidth;
    const boundaryThreshold = 100; // 경계 감지 범위

    // 왼쪽 경계 (화면 왼쪽 100px 이내)
    if (gazeX < boundaryThreshold) {
      handleLeftBoundary();
    }
    // 오른쪽 경계 (화면 오른쪽 100px 이내)
    else if (gazeX > screenWidth - boundaryThreshold) {
      handleRightBoundary();
    }

    lastSectionRef.current = eyeTracking.currentSection;
  }, [eyeTracking.gazePoint, eyeTracking.currentSection, eyeTracking.isTracking, phase, handleLeftBoundary, handleRightBoundary]);

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
        setSpeakingSentence(sentence);
        setIsSpeaking(true);
        
        // 오디오 재생 및 종료 감지
        const audio = new Audio(URL.createObjectURL(audioBlob));
        audio.onended = () => {
          setIsSpeaking(false);
          setSpeakingSentence('');
        };
        audio.play();
      } catch (ttsErr) {
        console.error('TTS 오류:', ttsErr);
        setIsSpeaking(false);
      }

      // 초기화
      setSelectedWords([]);
      allSelectedWordsRef.current.clear();
      baseWordRef.current = null;
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
          prevPageWords={prevPageWords}
          nextPageWords={nextPageWords}
          currentPage={currentPageIndex + 1}
          totalPages={pageStack.length}
          isSpeaking={isSpeaking}
          speakingSentence={speakingSentence}
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
