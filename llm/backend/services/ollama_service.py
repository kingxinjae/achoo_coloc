import ollama
from typing import List
import logging


logger = logging.getLogger(__name__)


class OllamaService:
    """
    Ollama 기반 문장 생성 서비스
    선택된 단어들을 자연스러운 한국어 문장으로 변환합니다.
    """
    
    def __init__(self, base_url: str = "http://localhost:11434", model: str = "gemma2:2b"):
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
        
        Args:
            words: 문장 생성에 사용할 단어 목록
        
        Returns:
            생성된 프롬프트 문자열
        """
        words_str = ", ".join(words)
        
        prompt = f"""다음 단어들을 사용하여 자연스러운 한국어 문장을 만들어주세요.
단어들: {words_str}

규칙:
1. 모든 단어를 포함해야 합니다
2. 문법적으로 올바른 문장이어야 합니다
3. 자연스럽고 의미있는 문장이어야 합니다
4. 한 문장으로 작성해주세요
5. 문장만 출력하고 다른 설명은 하지 마세요

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
