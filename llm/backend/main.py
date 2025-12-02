from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from routers import words, generate, tts
import logging
import traceback

# 로깅 설정
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)

logger = logging.getLogger(__name__)

app = FastAPI(
    title="Word Selection TTS API",
    description="API for word selection, sentence generation, and text-to-speech",
    version="1.0.0"
)


# 전역 예외 핸들러
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    """
    모든 예외를 처리하는 전역 핸들러
    """
    logger.error(f"Global exception handler caught: {exc}")
    logger.error(traceback.format_exc())
    
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "detail": "서버 내부 오류가 발생했습니다.",
            "error": str(exc),
            "type": type(exc).__name__
        }
    )


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    """
    요청 검증 오류를 처리하는 핸들러
    """
    logger.warning(f"Validation error: {exc}")
    
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={
            "detail": "요청 데이터 검증에 실패했습니다.",
            "errors": exc.errors()
        }
    )

# CORS 미들웨어 설정
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5173"],  # React 개발 서버
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 라우터 등록
app.include_router(words.router, prefix="/api", tags=["words"])
app.include_router(generate.router, prefix="/api", tags=["generate"])
app.include_router(tts.router, prefix="/api", tags=["tts"])


@app.get("/")
async def root():
    return {"message": "Word Selection TTS API", "status": "running"}


@app.get("/health")
async def health_check():
    return {"status": "healthy"}
