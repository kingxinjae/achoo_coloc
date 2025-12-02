from fastapi import APIRouter, HTTPException
from models.schemas import GenerateRequest, GenerateResponse
from services import OllamaService
import logging

router = APIRouter()
logger = logging.getLogger(__name__)

# Ollama 서비스 인스턴스 (전역)
ollama_service = None


def get_ollama_service() -> OllamaService:
    """Ollama 서비스 인스턴스를 반환합니다."""
    global ollama_service
    if ollama_service is None:
        # 사용 가능한 모델 중 하나를 사용 (gemma3:4b, gemma2:2b, mistral:latest 순서)
        import os
        model = os.getenv("OLLAMA_MODEL", "gemma3:4b")
        ollama_service = OllamaService(model=model)
    return ollama_service


@router.post("/generate", response_model=GenerateResponse)
async def generate_sentence(request: GenerateRequest):
    """
    선택된 단어들로 문장을 생성합니다.
    
    Args:
        request: 단어 목록을 포함한 요청
    
    Returns:
        생성된 문장
    
    Raises:
        HTTPException: 문장 생성 실패 시
    """
    try:
        service = get_ollama_service()
        
        # 단어 목록 검증
        if not request.words:
            raise HTTPException(status_code=400, detail="단어 목록이 비어있습니다.")
        
        # 문장 생성
        sentence = service.generate_sentence(request.words)
        
        return GenerateResponse(sentence=sentence)
        
    except ConnectionError as e:
        logger.error(f"Ollama connection error: {e}")
        raise HTTPException(
            status_code=503,
            detail="Ollama 서버에 연결할 수 없습니다. localhost:11434에서 Ollama가 실행 중인지 확인해주세요."
        )
    
    except ValueError as e:
        logger.error(f"Validation error: {e}")
        raise HTTPException(status_code=400, detail=str(e))
    
    except Exception as e:
        logger.error(f"Sentence generation error: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"문장 생성 중 오류가 발생했습니다: {str(e)}"
        )
