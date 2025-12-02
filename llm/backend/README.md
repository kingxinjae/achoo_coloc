# Word Selection TTS Backend

FastAPI 백엔드 서버 - 단어 선택, 문장 생성, TTS 기능 제공

## 설치

```bash
# 가상환경 생성 (선택사항)
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# 의존성 설치
pip install -r requirements.txt
```

## 실행

```bash
uvicorn main:app --reload --port 8000
```

서버가 http://localhost:8000 에서 실행됩니다.

## API 문서

서버 실행 후 다음 URL에서 자동 생성된 API 문서를 확인할 수 있습니다:
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## 프로젝트 구조

```
backend/
├── main.py              # FastAPI 애플리케이션 진입점
├── requirements.txt     # Python 의존성
├── models/
│   ├── __init__.py
│   └── schemas.py      # Pydantic 모델
├── routers/
│   ├── __init__.py
│   ├── words.py        # 단어 추천 엔드포인트
│   ├── generate.py     # 문장 생성 엔드포인트
│   └── tts.py          # TTS 엔드포인트
└── services/
    └── __init__.py     # 서비스 클래스 (FAISS, Ollama, TTS)
```

## 다음 단계

1. FAISS 서비스 구현
2. Ollama 서비스 구현
3. TTS 서비스 구현
