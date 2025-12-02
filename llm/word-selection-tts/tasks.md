# 구현 계획

 - [x] 1. 백엔드 프로젝트 구조 및 기본 설정





  - FastAPI 프로젝트 초기화 및 디렉토리 구조 생성 (backend/)
  - requirements.txt 작성 (fastapi, uvicorn, faiss-cpu, sentence-transformers, ollama, TTS, pydantic)
  - CORS 미들웨어 설정 및 기본 라우터 구성
  - _요구사항: 1.1, 2.1, 3.2, 4.1_

- [x] 2. FAISS 서비스 구현





  - 한국어 단어 어휘 파일 생성 (vocabulary.txt, 최소 1000개 단어)
  - FAISSService 클래스 구현 (임베딩 모델 로드, 인덱스 구축)
  - recommend_words 메서드 구현 (유사도 기반 단어 추천)
  - 초기 단어 선택 로직 구현
  - _요구사항: 2.1, 2.2, 2.3, 1.4_

- [x] 3. Ollama 서비스 구현




  - OllamaService 클래스 구현 (ollama 클라이언트 초기화)
  - 프롬프트 템플릿 작성 (한국어 문장 생성용)
  - generate_sentence 메서드 구현 (단어 목록 → 문장 생성)
  - 연결 에러 처리 및 타임아웃 설정
  - _요구사항: 3.2, 3.3, 3.4, 6.2_

- [x] 4. TTS 서비스 구현





  - TTSService 클래스 구현 (Coqui TTS 모델 로드)
  - text_to_speech 메서드 구현 (텍스트 → WAV 파일 생성)
  - 임시 파일 관리 및 정리 로직
  - 오디오 스트리밍 응답 구현
  - _요구사항: 4.1, 4.2, 4.3, 6.3_
-

- [x] 5. FastAPI 엔드포인트 구현





  - Pydantic 모델 정의 (Request/Response 스키마)
  - GET /api/initial-words 엔드포인트 구현
  - POST /api/recommend 엔드포인트 구현
  - POST /api/generate 엔드포인트 구현
  - POST /api/tts 엔드포인트 구현 (StreamingResponse)
  - 에러 핸들링 미들웨어 추가
  - _요구사항: 1.1, 2.1, 2.2, 3.2, 3.3, 4.1, 4.2, 6.1, 6.2, 6.3_

- [x] 6. 프론트엔드 프로젝트 초기화





  - React + TypeScript 프로젝트 생성 (Vite 사용)
  - 디렉토리 구조 설정 (components/, services/, types/)
  - Axios 설치 및 API 클라이언트 설정
  - 기본 레이아웃 및 스타일링 설정 (CSS Grid)
  - _요구사항: 1.1_

- [x] 7. TypeScript 타입 및 API 서비스 구현





  - API 응답/요청 타입 정의 (types/api.ts)
  - API 클라이언트 함수 구현 (services/api.ts)
  - 에러 처리 유틸리티 함수
  - _요구사항: 1.1, 2.1, 3.2, 4.1_
-

- [x] 8. WordGrid 컴포넌트 구현




  - 4분할 그리드 레이아웃 구현 (CSS Grid 사용)
  - 단어 표시 및 클릭 이벤트 핸들러
  - 선택 시 시각적 하이라이트 효과
  - 로딩 상태 표시
  - _요구사항: 1.1, 1.2, 1.3_

- [x] 9. SelectedWordsList 컴포넌트 구현





  - 선택된 단어 목록 표시 (순서대로)
  - Reset 버튼 구현
  - 단어 목록 스타일링
  - _요구사항: 1.4, 5.2, 5.3_

- [x] 10. GenerateButton 컴포넌트 구현





  - 우측 상단 배치 (position: fixed 또는 absolute)
  - 버튼 활성화/비활성화 로직 (선택된 단어 유무)
  - 로딩 상태 표시 (스피너)
  - _요구사항: 3.1, 3.5_

- [x] 11. App 컴포넌트 및 상태 관리





  - 전역 상태 관리 (useState 사용)
  - 초기 단어 로드 로직 (useEffect)
  - 단어 선택 핸들러 (FAISS 추천 API 호출)
  - 문장 생성 핸들러 (Ollama API 호출)
  - TTS 재생 핸들러 (오디오 재생)
  - Reset 핸들러
  - _요구사항: 1.1, 1.2, 1.4, 2.1, 2.3, 3.2, 3.4, 4.1, 4.3, 5.2, 5.3_

- [x] 12. 에러 처리 및 사용자 피드백




  - 에러 메시지 표시 컴포넌트
  - 재시도 버튼 구현
  - 로딩 인디케이터 (단어 추천, 문장 생성, TTS)
  - 토스트 알림 또는 모달 (선택사항)
  - _요구사항: 2.3, 4.4, 6.1, 6.2, 6.3, 6.4_

- [x] 13. 통합 및 엔드투엔드 테스트






  - 백엔드 서버 실행 확인 (uvicorn)
  - 프론트엔드 개발 서버 실행 (npm run dev)
  - Ollama 서비스 연결 확인 (localhost:11434)
  - 전체 플로우 테스트 (단어 선택 → 추천 → 생성 → TTS)
  - 에러 시나리오 테스트
  - _요구사항: 모든 요구사항_

- [ ] 14. 문서화 및 실행 가이드
  - README.md 작성 (설치 및 실행 방법)
  - 환경 설정 가이드 (Ollama 설치, 모델 다운로드)
  - API 문서 (FastAPI 자동 생성 문서 활용)
  - _요구사항: 해당 없음_
