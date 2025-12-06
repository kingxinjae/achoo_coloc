# ESC (Eye Speaker Console)

시선 추적 기반 단어 선택 → 문장 생성 → TTS 시스템

## 개요

마우스 없이 **눈으로만** 단어를 선택하고, AI가 자연스러운 문장을 생성하여 음성으로 읽어주는 시스템입니다.

## 주요 기능

- **시선 추적**: MediaPipe Face Mesh 기반 실시간 시선 추적
- **윙크 인식**: 왼쪽 눈 윙크(선택), 오른쪽 눈 윙크(생성)
- **AI 문장 생성**: Ollama (gemma3:4b) 기반 자연스러운 한국어 문장
- **TTS**: gTTS 기반 음성 합성
- **단어 추천**: FAISS 기반 연관 단어 추천

## 시스템 요구사항

- Python 3.10+
- Node.js 18+
- Ollama (gemma3:4b 모델)
- 웹캠
- Docker (선택)

## 빠른 시작

### 로컬 실행

```bash
# 1. Ollama 실행 (별도 터미널)
ollama run gemma3:4b

# 2. 백엔드 실행
cd backend
pip install -r requirements.txt
py -m uvicorn main:app --reload --port 8000

# 3. 프론트엔드 실행 (별도 터미널)
cd frontend
npm install
npm run dev
```

브라우저에서 http://localhost:5173 접속

### Docker 실행

```bash
docker-compose up --build
```

브라우저에서 http://localhost 접속

## 프로젝트 구조

```
llm/
├── backend/              # FastAPI 백엔드
│   ├── main.py
│   ├── services/         # FAISS, Ollama, TTS 서비스
│   ├── routers/          # API 라우터
│   └── data/             # 단어 데이터
│
├── frontend/             # React 프론트엔드
│   ├── src/
│   │   ├── components/   # UI 컴포넌트
│   │   ├── hooks/        # 시선 추적 훅
│   │   └── services/     # API 클라이언트
│   └── index.html
│
├── docker-compose.yml
└── README.md
```

## API 엔드포인트

| 메서드 | 경로 | 설명 |
|--------|------|------|
| GET | /api/initial-words | 초기 4개 단어 |
| POST | /api/recommend | 단어 추천 |
| POST | /api/recommend-diverse | 다양한 단어 추천 |
| POST | /api/generate | 문장 생성 |
| POST | /api/tts | 텍스트 → 음성 |

API 문서: http://localhost:8000/docs

## 사용법

1. "시작하기" 클릭
2. 12포인트 캘리브레이션 (점 응시)
3. 시선으로 4개 단어 영역 중 선택
4. **왼쪽 눈 윙크** → 단어 선택
5. **오른쪽 눈 윙크** → 문장 생성 + 음성 재생

# 프로젝트에서 사용한 오픈소스:

## 백엔드 (Python)

FastAPI - 웹 프레임워크
Uvicorn - ASGI 서버
FAISS (faiss-cpu) - 벡터 유사도 검색
Sentence Transformers - 텍스트 임베딩
Ollama - 로컬 LLM 실행 (gemma3:4b 모델)
gTTS (Google Text-to-Speech) - 음성 합성
Pydantic - 데이터 검증

## 프론트엔드 (JavaScript/TypeScript)

React - UI 라이브러리
Vite - 빌드 도구
TypeScript - 타입 시스템
Axios - HTTP 클라이언트
MediaPipe Face Mesh - 얼굴/시선 추적 (Google)

## 인프라

Docker - 컨테이너화
Nginx - 웹 서버/리버스 프록시
Node.js - JavaScript 런타임

## 라이선스

MIT
