# Eye Word TTS Frontend

시선 추적 기반 단어 선택 TTS 시스템 - React + TypeScript + Vite

## 요구사항

- Node.js 18+
- 웹캠 (시선 추적용)
- 백엔드 서버 (localhost:8000)

## 설치

```bash
npm install
```

## 실행

```bash
npm run dev
```

앱: http://localhost:5173

## 사용법

1. "카메라 시작" 클릭
2. 12포인트 캘리브레이션 완료 (초록색 점 응시)
3. 시선으로 4개 영역 중 하나 선택
4. **왼쪽 눈 윙크 (0.5초)** → 단어 선택
5. **오른쪽 눈 윙크** → 문장 생성 + TTS 재생

## 프로젝트 구조

```
frontend/
├── src/
│   ├── App.tsx              # 메인 앱
│   ├── App.css              # 글로벌 스타일
│   ├── components/
│   │   ├── StartScreen.tsx      # 시작 화면
│   │   ├── CalibrationScreen.tsx # 캘리브레이션
│   │   └── WordSelectionScreen.tsx # 단어 선택
│   ├── hooks/
│   │   └── useEyeTracking.ts    # 시선 추적 훅
│   ├── services/
│   │   └── api.ts               # API 클라이언트
│   └── types/
│       └── api.ts               # 타입 정의
├── index.html
├── package.json
└── vite.config.ts
```

## 기술 스택

- React 18 + TypeScript
- Vite
- MediaPipe Face Mesh (시선 추적)
- Axios (API 통신)
