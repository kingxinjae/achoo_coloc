from fastapi import APIRouter, HTTPException, Depends
from fastapi.responses import StreamingResponse
from models.schemas import TTSRequest
from services.tts_service import TTSService
import logging


logger = logging.getLogger(__name__)
router = APIRouter()

# TTS 서비스 싱글톤 인스턴스
_tts_service: TTSService = None


def get_tts_service() -> TTSService:
    """
    TTS 서비스 인스턴스를 반환합니다 (의존성 주입용).
    """
    global _tts_service
    if _tts_service is None:
        _tts_service = TTSService()
    return _tts_service


@router.post("/tts")
async def text_to_speech(
    request: TTSRequest,
    tts_service: TTSService = Depends(get_tts_service)
):
    """
    텍스트를 음성으로 변환하여 MP3 파일로 반환합니다.
    
    Args:
        request: TTS 요청 (텍스트 포함)
        tts_service: TTS 서비스 인스턴스
    
    Returns:
        StreamingResponse: MP3 형식의 오디오 스트림
    
    Raises:
        HTTPException: 음성 생성 실패 시
    """
    try:
        logger.info(f"TTS request received for text: {request.text[:50]}...")
        
        # 텍스트를 음성으로 변환 (스트리밍)
        audio_stream = tts_service.text_to_speech_stream(request.text)
        
        # StreamingResponse로 반환 (gTTS는 MP3 형식)
        return StreamingResponse(
            audio_stream,
            media_type="audio/mpeg",
            headers={
                "Content-Disposition": "attachment; filename=speech.mp3"
            }
        )
        
    except ValueError as e:
        logger.error(f"Validation error: {e}")
        raise HTTPException(status_code=400, detail=str(e))
    
    except Exception as e:
        logger.error(f"TTS generation failed: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"음성 생성 중 오류가 발생했습니다: {str(e)}"
        )
