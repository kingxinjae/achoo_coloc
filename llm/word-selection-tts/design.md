# 디자인 문서

## 개요

이 애플리케이션은 React 프론트엔드와 FastAPI 백엔드로 구성된 풀스택 웹 애플리케이션입니다. 사용자는 화면의 4분할 그리드에서 단어를 선택하고, FAISS 기반 추천 시스템이 다음 단어를 제안하며, 최종적으로 Ollama LLM이 문장을 생성하고 Coqui TTS가 음성으로 변환합니다.

## 아키텍처

### 시스템 구조

```
┌─────────────────────────────────────────────────────────────┐
│                     React Frontend                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │  Word Grid   │  │ Selected     │  │  Generate    │     │
│  │  Component   │  │ Words List   │  │  Button      │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
└─────────────────────────────────────────────────────────────┘
                            │
                            │ HTTP/REST API
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    FastAPI Backend                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │   FAISS      │  │   Ollama     │  │   Coqui      │     │
│  │   Service    │  │   Client     │  │   TTS        │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
                  ┌──────────────────┐
                  │ Ollama Service   │
                  │ localhost:11434  │
                  │ gemma2:2b model  │
                  └──────────────────┘
```

### 기술 스택

**프론트엔드:**
- React 18+
- TypeScript
- Axios (HTTP 클라이언트)
- CSS Modules 또는 Tailwind CSS

**백엔드:**
- FastAPI
- Python 3.9+
- FAISS (Facebook AI Similarity Search)
- Sentence Transformers (임베딩 생성)
- Ollama Python Client
- Coqui TTS

## 컴포넌트 및 인터페이스

### 프론트엔드 컴포넌트

#### 1. App Component
메인 애플리케이션 컴포넌트로 전체 레이아웃과 상태 관리를 담당합니다.

**상태:**
```typescript
interface AppState {
  selectedWords: string[];
  currentWords: string[];
  generatedSentence: string;
  isLoading: boolean;
  error: string | null;
}
```

#### 2. WordGrid Component
4개의 단어를 그리드 형태로 표시하고 클릭 이벤트를 처리합니다.

**Props:**
```typescript
interface WordGridProps {
  words: string[];
  onWordSelect: (word: string) => void;
  isLoading: boolean;
}
```

#### 3. SelectedWordsList Component
선택된 단어들을 순서대로 표시합니다.

**Props:**
```typescript
interface SelectedWordsListProps {
  words: string[];
  onReset: () => void;
}
```

#### 4. GenerateButton Component
문장 생성을 트리거하는 버튼입니다.

**Props:**
```typescript
interface GenerateButtonProps {
  onClick: () => void;
  disabled: boolean;
  isLoading: boolean;
}
```

### 백엔드 API 엔드포인트

#### 1. POST /api/recommend
선택된 단어를 기반으로 다음 4개의 단어를 추천합니다.

**요청:**
```json
{
  "word": "안녕",
  "context": ["안녕"]
}
```

**응답:**
```json
{
  "recommendations": ["하세요", "친구", "세상", "모두"]
}
```

#### 2. POST /api/generate
선택된 단어들로 문장을 생성합니다.

**요청:**
```json
{
  "words": ["안녕", "하세요", "친구"]
}
```

**응답:**
```json
{
  "sentence": "안녕하세요, 친구 여러분!"
}
```

#### 3. POST /api/tts
텍스트를 음성으로 변환합니다.

**요청:**
```json
{
  "text": "안녕하세요, 친구 여러분!"
}
```

**응답:**
```
Audio file (audio/wav)
```

#### 4. GET /api/initial-words
초기 4개의 시작 단어를 반환합니다.

**응답:**
```json
{
  "words": ["안녕", "오늘", "날씨", "좋다"]
}
```

### 백엔드 서비스 클래스

#### 1. FAISSService
단어 임베딩과 유사도 검색을 담당합니다.

**주요 메서드:**
```python
class FAISSService:
    def __init__(self, model_name: str, vocabulary_file: str):
        """FAISS 인덱스와 임베딩 모델 초기화"""
        
    def build_index(self, words: List[str]) -> None:
        """단어 목록으로 FAISS 인덱스 구축"""
        
    def recommend_words(self, word: str, k: int = 4) -> List[str]:
        """주어진 단어와 유사한 k개의 단어 추천"""
```

#### 2. OllamaService
Ollama API와 통신하여 문장을 생성합니다.

**주요 메서드:**
```python
class OllamaService:
    def __init__(self, base_url: str = "http://localhost:11434"):
        """Ollama 클라이언트 초기화"""
        
    def generate_sentence(self, words: List[str]) -> str:
        """단어 목록으로 자연스러운 문장 생성"""
```

#### 3. TTSService
Coqui TTS를 사용하여 텍스트를 음성으로 변환합니다.

**주요 메서드:**
```python
class TTSService:
    def __init__(self, model_name: str = "tts_models/ko/cv/vits"):
        """TTS 모델 초기화"""
        
    def text_to_speech(self, text: str) -> bytes:
        """텍스트를 음성 데이터로 변환"""
```

## 데이터 모델

### 프론트엔드 타입

```typescript
// API 응답 타입
interface RecommendResponse {
  recommendations: string[];
}

interface GenerateResponse {
  sentence: string;
}

interface InitialWordsResponse {
  words: string[];
}

// 에러 타입
interface APIError {
  detail: string;
}
```

### 백엔드 모델

```python
from pydantic import BaseModel
from typing import List

class RecommendRequest(BaseModel):
    word: str
    context: List[str] = []

class RecommendResponse(BaseModel):
    recommendations: List[str]

class GenerateRequest(BaseModel):
    words: List[str]

class GenerateResponse(BaseModel):
    sentence: str

class TTSRequest(BaseModel):
    text: str

class InitialWordsResponse(BaseModel):
    words: List[str]
```

## 데이터 흐름

### 1. 초기 로드
```
User → Frontend → GET /api/initial-words → Backend
Backend → FAISS Service → 초기 단어 4개 선택
Backend → Frontend → 화면에 표시
```

### 2. 단어 선택 및 추천
```
User clicks word → Frontend updates selectedWords
Frontend → POST /api/recommend → Backend
Backend → FAISS Service → 유사 단어 검색
Backend → Frontend → Word Grid 업데이트
```

### 3. 문장 생성 및 TTS
```
User clicks Generate → Frontend → POST /api/generate
Backend → Ollama Service (localhost:11434)
Ollama → 문장 생성 → Backend
Backend → Frontend → 문장 표시
Frontend → POST /api/tts
Backend → Coqui TTS → 음성 생성
Backend → Frontend → 오디오 재생
```

## FAISS 구현 세부사항

### 임베딩 모델
- **모델**: sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2
- **이유**: 한국어 지원, 빠른 추론 속도, 적절한 임베딩 품질

### 인덱스 구조
- **타입**: IndexFlatL2 (정확한 L2 거리 계산)
- **차원**: 384 (모델 출력 차원)
- **어휘 크기**: 10,000+ 한국어 단어

### 단어 어휘 구축
```python
# 한국어 단어 코퍼스 예시
vocabulary = [
    "안녕", "하세요", "친구", "오늘", "날씨",
    "좋다", "나쁘다", "먹다", "가다", "오다",
    # ... 더 많은 단어들
]
```

## Ollama 통합

### 프롬프트 설계
```python
prompt_template = """
다음 단어들을 사용하여 자연스러운 한국어 문장을 만들어주세요.
단어들: {words}

규칙:
1. 모든 단어를 포함해야 합니다
2. 문법적으로 올바른 문장이어야 합니다
3. 자연스럽고 의미있는 문장이어야 합니다
4. 한 문장으로 작성해주세요

문장:
"""
```

### API 호출
```python
import ollama

response = ollama.generate(
    model='gemma2:2b',
    prompt=prompt,
    options={
        'temperature': 0.7,
        'max_tokens': 100
    }
)
```

## Coqui TTS 설정

### 모델 선택
- **모델**: tts_models/ko/cv/vits (한국어 지원)
- **출력 형식**: WAV, 22050Hz, 16-bit

### 음성 생성
```python
from TTS.api import TTS

tts = TTS(model_name="tts_models/ko/cv/vits")
tts.tts_to_file(
    text="생성된 문장",
    file_path="output.wav"
)
```

## 에러 처리

### 프론트엔드 에러 처리
```typescript
try {
  const response = await api.post('/api/recommend', data);
  // 성공 처리
} catch (error) {
  if (axios.isAxiosError(error)) {
    if (error.response?.status === 500) {
      setError('서버 오류가 발생했습니다.');
    } else if (error.code === 'ECONNREFUSED') {
      setError('서버에 연결할 수 없습니다.');
    }
  }
}
```

### 백엔드 에러 처리
```python
from fastapi import HTTPException

@app.post("/api/recommend")
async def recommend(request: RecommendRequest):
    try:
        recommendations = faiss_service.recommend_words(request.word)
        return RecommendResponse(recommendations=recommendations)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
```

### 에러 타입별 처리
1. **FAISS 에러**: 단어를 찾을 수 없음 → 기본 단어 목록 반환
2. **Ollama 연결 에러**: localhost:11434 접근 불가 → 명확한 에러 메시지
3. **TTS 에러**: 음성 생성 실패 → 텍스트만 표시하고 계속 진행
4. **네트워크 에러**: 재시도 버튼 제공

## 테스트 전략

### 프론트엔드 테스트
1. **단위 테스트**: React 컴포넌트 (Jest + React Testing Library)
   - WordGrid 클릭 이벤트
   - 상태 업데이트 로직
   - 조건부 렌더링

2. **통합 테스트**: API 통신 (MSW - Mock Service Worker)
   - API 호출 및 응답 처리
   - 에러 시나리오

### 백엔드 테스트
1. **단위 테스트**: 서비스 클래스 (pytest)
   - FAISS 추천 로직
   - Ollama 프롬프트 생성
   - TTS 변환

2. **API 테스트**: FastAPI 엔드포인트 (pytest + TestClient)
   - 각 엔드포인트의 요청/응답
   - 에러 핸들링

3. **통합 테스트**: 전체 플로우
   - 단어 선택 → 추천 → 문장 생성 → TTS

## 성능 고려사항

### FAISS 최적화
- 인덱스를 메모리에 캐싱하여 빠른 검색
- 어휘 크기를 적절히 제한 (10,000-50,000 단어)

### Ollama 응답 시간
- 예상 응답 시간: 1-3초
- 타임아웃 설정: 10초
- 로딩 인디케이터로 사용자 경험 개선

### TTS 생성 시간
- 예상 생성 시간: 2-5초
- 비동기 처리로 UI 블로킹 방지
- 오디오 스트리밍 고려 (향후 개선)

## 배포 고려사항

### 개발 환경
- Frontend: `npm run dev` (Vite 또는 Create React App)
- Backend: `uvicorn main:app --reload --port 8000`

### 프로덕션 환경
- Frontend: Nginx로 정적 파일 서빙
- Backend: Gunicorn + Uvicorn workers
- CORS 설정: 프론트엔드 도메인 허용

### 의존성
- Ollama가 localhost:11434에서 실행 중이어야 함
- FAISS 인덱스 파일이 사전에 구축되어 있어야 함
- Coqui TTS 모델이 다운로드되어 있어야 함
