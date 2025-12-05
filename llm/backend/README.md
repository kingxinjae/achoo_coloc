# Word Selection TTS Backend

FastAPI 백엔드 서버 - 단어 추천, 문장 생성, TTS 기능 제공

## 요구사항

- Python 3.10+
- Ollama (gemma3:4b 모델)

## 설치

```bash
pip install -r requirements.txt
```

## 실행

```bash
# Ollama 먼저 실행 (별도 터미널)
ollama run gemma3:4b

# 백엔드 서버 실행
py -m uvicorn main:app --reload --port 8000
```

서버: http://localhost:8000

## API 문서

- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## API 엔드포인트

| 메서드 | 경로 | 설명 |
|--------|------|------|
| GET | /api/initial-words | 초기 4개 단어 |
| POST | /api/recommend | 단어 추천 |
| POST | /api/recommend-diverse | 다양한 단어 추천 |
| POST | /api/generate | 문장 생성 |
| POST | /api/tts | 텍스트 → 음성 |

## 프로젝트 구조

```
backend/
├── main.py              # FastAPI 앱
├── requirements.txt     # 의존성
├── data/
│   └── vocabulary.txt   # 한국어 단어 목록
├── models/
│   └── schemas.py       # Pydantic 모델
├── routers/
│   ├── words.py         # 단어 추천 API
│   ├── generate.py      # 문장 생성 API
│   └── tts.py           # TTS API
└── services/
    ├── faiss_service.py   # FAISS 단어 추천
    ├── ollama_service.py  # Ollama 문장 생성
    └── tts_service.py     # gTTS 음성 합성
```
