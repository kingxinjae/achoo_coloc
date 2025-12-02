import io
import logging

try:
    from gtts import gTTS
    GTTS_AVAILABLE = True
except ImportError:
    GTTS_AVAILABLE = False
    gTTS = None

logger = logging.getLogger(__name__)


class TTSService:
    def __init__(self, lang: str = 'ko'):
        self.lang = lang
        if GTTS_AVAILABLE:
            logger.info(f'gTTS initialized with language: {self.lang}')
        else:
            logger.warning('gTTS library not available')
    
    def text_to_speech(self, text: str) -> bytes:
        if not text or not text.strip():
            raise ValueError('텍스트가 비어있습니다.')
        
        if not GTTS_AVAILABLE:
            raise Exception('gTTS가 설치되지 않았습니다.')
        
        try:
            logger.info(f'Generating speech: {text[:50]}...')
            
            tts = gTTS(text=text, lang=self.lang, slow=False)
            buffer = io.BytesIO()
            tts.write_to_fp(buffer)
            buffer.seek(0)
            audio_data = buffer.read()
            
            logger.info(f'Speech generated: {len(audio_data)} bytes')
            return audio_data
            
        except Exception as e:
            logger.error(f'TTS error: {e}')
            raise Exception(f'음성 생성 실패: {str(e)}')
    
    def text_to_speech_stream(self, text: str):
        audio_data = self.text_to_speech(text)
        chunk_size = 1024 * 64
        audio_stream = io.BytesIO(audio_data)
        
        while True:
            chunk = audio_stream.read(chunk_size)
            if not chunk:
                break
            yield chunk
    
    def check_model_availability(self) -> bool:
        return GTTS_AVAILABLE
    
    def get_model_info(self) -> dict:
        return {
            'model': 'Google TTS (gTTS)',
            'lang': self.lang,
            'is_loaded': GTTS_AVAILABLE,
        }
