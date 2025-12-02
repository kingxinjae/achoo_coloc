import { useState, useEffect } from 'react';
import './App.css';
import { getInitialWords, recommendWords, generateSentence } from './services/api';

function App() {
  const [words, setWords] = useState<string[]>([]);
  const [selectedWords, setSelectedWords] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    loadInitialWords();
  }, []);

  const loadInitialWords = async () => {
    try {
      setIsLoading(true);
      const initialWords = await getInitialWords();
      setWords(initialWords);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleWordClick = async (clickedWord: string) => {
    try {
      setIsLoading(true);
      
      const newSelectedWords = [...selectedWords, clickedWord];
      setSelectedWords(newSelectedWords);

      const recommendations = await recommendWords(clickedWord, selectedWords);
      setWords(recommendations);
      
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerate = async () => {
    if (selectedWords.length === 0) return;

    try {
      setIsLoading(true);
      
      // 문장 생성
      const sentence = await generateSentence(selectedWords);
      
      // TTS 음성 생성 및 재생
      try {
        const response = await fetch('http://localhost:8000/api/tts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: sentence })
        });
        
        if (response.ok) {
          const audioBlob = await response.blob();
          const audioUrl = URL.createObjectURL(audioBlob);
          const audio = new Audio(audioUrl);
          
          // 음성 재생
          await audio.play();
          
          // 재생 완료 후 정리
          audio.onended = () => {
            URL.revokeObjectURL(audioUrl);
          };
        }
      } catch (ttsErr) {
        console.error('TTS error:', ttsErr);
        // TTS 실패해도 문장은 표시
        alert(sentence);
      }
      
      // 초기화
      setSelectedWords([]);
      await loadInitialWords();
    } catch (err) {
      console.error(err);
      alert('문장 생성에 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="app">
      {/* 진행 버튼 오버레이 */}
      {selectedWords.length > 0 && (
        <button 
          className="generate-overlay-button"
          onClick={handleGenerate}
          disabled={isLoading}
        >
          진행 →
        </button>
      )}

      {/* 4개 단어 영역 */}
      <div className="word-sections">
        {words.map((word, index) => (
          <div
            key={index}
            className={`word-section ${isLoading ? 'disabled' : ''}`}
            onClick={() => !isLoading && handleWordClick(word)}
          >
            <span className="word-text">{word}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default App;
