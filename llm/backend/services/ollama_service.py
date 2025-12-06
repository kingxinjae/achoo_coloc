import ollama
import os
from typing import List
import logging


logger = logging.getLogger(__name__)

# 환경변수에서 Ollama 호스트 읽기 (도커용)
OLLAMA_HOST = os.getenv("OLLAMA_HOST", "localhost:11434")


class OllamaService:
    """
    Ollama 기반 문장 생성 서비스
    선택된 단어들을 자연스러운 한국어 문장으로 변환합니다.
    """
    
    def __init__(self, base_url: str = f"http://{OLLAMA_HOST}", model: str = "gemma2:2b"):
        """
        Ollama 서비스 초기화
        
        Args:
            base_url: Ollama 서버 URL
            model: 사용할 모델명 (기본값: gemma2:2b)
        """
        self.base_url = base_url
        self.model = model
        self.client = ollama.Client(host=base_url)
        
        logger.info(f"OllamaService initialized with model: {model} at {base_url}")
        
    def _create_prompt(self, words: List[str]) -> str:
        """
        단어 목록으로 프롬프트를 생성합니다.
        자연스러운 문장을 생성하되, 핵심 단어는 반드시 포함하도록 합니다.
        
        Args:
            words: 문장 생성에 사용할 단어 목록
        
        Returns:
            생성된 프롬프트 문자열
        """
        words_str = ", ".join(words)
        
        prompt = f"""다음 단어들을 모두 포함하는 자연스러운 한국어 문장을 만들어주세요.

단어: {words_str}

최우선규칙: 폭력/혐오/불법/보안우회/생물학 등 유해한 콘텐츠를 생성하지 말 것.

규칙:
1. 위의 모든 단어를 반드시 문장에 포함시키세요
2. 자연스럽고 문법적으로 올바른 한국어 문장을 만드세요
3. 조사(은/는/이/가/을/를/에/로 등)를 적절히 추가하세요
4. 필요하면 어미를 변형하세요 (예: 가다 → 갑니다, 좋다 → 좋습니다)
5. 문장만 출력하세요 (따옴표, 설명, 번호 없이)

예시:
- 단어: 나, 오늘, 학교, 가다 → 나는 오늘 학교에 갑니다.
- 단어: 날씨, 좋다, 기분 → 날씨가 좋아서 기분이 좋습니다.
- 단어: 친구, 만나다, 카페 → 친구를 카페에서 만났습니다.

문장:"""
        
        return prompt

    
    def generate_sentence(self, words: List[str], timeout: int = 10) -> str:
        """
        단어 목록으로 자연스러운 문장을 생성합니다.
        
        Args:
            words: 문장 생성에 사용할 단어 목록
            timeout: 요청 타임아웃 (초)
        
        Returns:
            생성된 문장
        
        Raises:
            ConnectionError: Ollama 서버에 연결할 수 없는 경우
            TimeoutError: 요청이 타임아웃된 경우
            ValueError: 단어 목록이 비어있는 경우
            Exception: 기타 생성 오류
        """
        if not words:
            raise ValueError("단어 목록이 비어있습니다.")
        
        try:
            # 프롬프트 생성
            prompt = self._create_prompt(words)
            
            logger.info(f"Generating sentence for words: {words}")
            
            # Ollama API 호출
            response = self.client.generate(
                model=self.model,
                prompt=prompt,
                options={
                    'temperature': 0.7,
                    'max_tokens': 100,
                    'top_p': 0.9,
                },
                stream=False
            )
            
            # 응답에서 문장 추출
            generated_text = response.get('response', '').strip()
            
            if not generated_text:
                raise Exception("생성된 문장이 비어있습니다.")
            
            logger.info(f"Generated sentence: {generated_text}")
            
            return generated_text
            
        except ollama.ResponseError as e:
            logger.error(f"Ollama response error: {e}")
            raise Exception(f"문장 생성 중 오류가 발생했습니다: {str(e)}")
        
        except ollama.RequestError as e:
            logger.error(f"Ollama request error: {e}")
            raise ConnectionError(
                f"Ollama 서버({self.base_url})에 연결할 수 없습니다. "
                "Ollama가 실행 중인지 확인해주세요."
            )
        
        except Exception as e:
            logger.error(f"Unexpected error during sentence generation: {e}")
            raise Exception(f"문장 생성 중 예상치 못한 오류가 발생했습니다: {str(e)}")
    
    def check_connection(self) -> bool:
        """
        Ollama 서버 연결 상태를 확인합니다.
        
        Returns:
            연결 가능 여부
        """
        try:
            # 간단한 요청으로 연결 확인
            self.client.list()
            logger.info("Ollama server connection successful")
            return True
        except Exception as e:
            logger.error(f"Ollama server connection failed: {e}")
            return False
    
    def get_available_models(self) -> List[str]:
        """
        사용 가능한 모델 목록을 반환합니다.
        
        Returns:
            모델명 목록
        """
        try:
            models = self.client.list()
            model_names = [model['name'] for model in models.get('models', [])]
            return model_names
        except Exception as e:
            logger.error(f"Failed to get available models: {e}")
            return []
