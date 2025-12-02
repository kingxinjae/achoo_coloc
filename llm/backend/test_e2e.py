"""
통합 및 엔드투엔드 테스트
전체 시스템의 통합 동작을 검증합니다.
"""
import sys
import time
import requests
from io import BytesIO


class Colors:
    """터미널 색상 코드"""
    GREEN = '\033[92m'
    RED = '\033[91m'
    YELLOW = '\033[93m'
    BLUE = '\033[94m'
    END = '\033[0m'


def print_header(text):
    """헤더 출력"""
    print(f"\n{Colors.BLUE}{'=' * 60}{Colors.END}")
    print(f"{Colors.BLUE}{text}{Colors.END}")
    print(f"{Colors.BLUE}{'=' * 60}{Colors.END}")


def print_success(text):
    """성공 메시지 출력"""
    print(f"{Colors.GREEN}✓ {text}{Colors.END}")


def print_error(text):
    """에러 메시지 출력"""
    print(f"{Colors.RED}✗ {text}{Colors.END}")


def print_warning(text):
    """경고 메시지 출력"""
    print(f"{Colors.YELLOW}⚠ {text}{Colors.END}")


def print_info(text):
    """정보 메시지 출력"""
    print(f"  {text}")


class E2ETestRunner:
    """엔드투엔드 테스트 러너"""
    
    def __init__(self, backend_url="http://localhost:8000", ollama_url="http://localhost:11434"):
        self.backend_url = backend_url
        self.ollama_url = ollama_url
        self.test_results = []
    
    def run_test(self, test_name, test_func):
        """개별 테스트 실행"""
        print(f"\n{test_name}...")
        try:
            test_func()
            print_success(f"{test_name} 통과")
            self.test_results.append((test_name, True, None))
            return True
        except AssertionError as e:
            print_error(f"{test_name} 실패: {e}")
            self.test_results.append((test_name, False, str(e)))
            return False
        except Exception as e:
            print_error(f"{test_name} 오류: {e}")
            self.test_results.append((test_name, False, str(e)))
            return False
    
    def test_backend_server(self):
        """백엔드 서버 실행 확인"""
        print_info(f"백엔드 URL: {self.backend_url}")
        response = requests.get(f"{self.backend_url}/health", timeout=5)
        assert response.status_code == 200, f"예상: 200, 실제: {response.status_code}"
        data = response.json()
        assert data["status"] == "healthy", f"서버 상태가 healthy가 아님: {data}"
        print_info(f"응답: {data}")
    
    def test_ollama_service(self):
        """Ollama 서비스 연결 확인"""
        print_info(f"Ollama URL: {self.ollama_url}")
        try:
            response = requests.get(f"{self.ollama_url}/api/tags", timeout=5)
            assert response.status_code == 200, f"Ollama 서비스 응답 실패: {response.status_code}"
            data = response.json()
            print_info(f"사용 가능한 모델: {[m['name'] for m in data.get('models', [])]}")
            
            # gemma2:2b 모델 확인
            models = [m['name'] for m in data.get('models', [])]
            if 'gemma2:2b' not in models:
                print_warning("gemma2:2b 모델이 설치되지 않았습니다. 'ollama pull gemma2:2b' 실행 필요")
        except requests.exceptions.ConnectionError:
            raise AssertionError("Ollama 서비스에 연결할 수 없습니다. localhost:11434에서 실행 중인지 확인하세요.")
    
    def test_initial_words(self):
        """초기 단어 로드 테스트"""
        response = requests.get(f"{self.backend_url}/api/initial-words", timeout=5)
        assert response.status_code == 200, f"예상: 200, 실제: {response.status_code}"
        
        data = response.json()
        assert "words" in data, "응답에 'words' 필드가 없음"
        assert isinstance(data["words"], list), "words가 리스트가 아님"
        assert len(data["words"]) == 4, f"예상: 4개 단어, 실제: {len(data['words'])}개"
        
        print_info(f"초기 단어: {data['words']}")
    
    def test_word_recommendation(self):
        """단어 추천 테스트"""
        request_data = {
            "word": "안녕",
            "context": []
        }
        
        response = requests.post(
            f"{self.backend_url}/api/recommend",
            json=request_data,
            timeout=5
        )
        assert response.status_code == 200, f"예상: 200, 실제: {response.status_code}"
        
        data = response.json()
        assert "recommendations" in data, "응답에 'recommendations' 필드가 없음"
        assert isinstance(data["recommendations"], list), "recommendations가 리스트가 아님"
        assert len(data["recommendations"]) == 4, f"예상: 4개 추천, 실제: {len(data['recommendations'])}개"
        
        print_info(f"'안녕' 추천 단어: {data['recommendations']}")
    
    def test_sentence_generation(self):
        """문장 생성 테스트"""
        request_data = {
            "words": ["안녕", "하세요", "친구"]
        }
        
        response = requests.post(
            f"{self.backend_url}/api/generate",
            json=request_data,
            timeout=30  # Ollama 응답 대기
        )
        
        if response.status_code == 503:
            print_warning("Ollama 서비스가 응답하지 않습니다. 서비스 실행 상태를 확인하세요.")
            raise AssertionError("Ollama 서비스 연결 실패")
        
        assert response.status_code == 200, f"예상: 200, 실제: {response.status_code}"
        
        data = response.json()
        assert "sentence" in data, "응답에 'sentence' 필드가 없음"
        assert isinstance(data["sentence"], str), "sentence가 문자열이 아님"
        assert len(data["sentence"]) > 0, "생성된 문장이 비어있음"
        
        print_info(f"생성된 문장: {data['sentence']}")
        return data["sentence"]
    
    def test_tts_generation(self, text="안녕하세요"):
        """TTS 음성 생성 테스트"""
        request_data = {
            "text": text
        }
        
        response = requests.post(
            f"{self.backend_url}/api/tts",
            json=request_data,
            timeout=30  # TTS 생성 대기
        )
        
        if response.status_code == 500:
            print_warning("TTS 모델 로드 실패. 첫 실행 시 모델 다운로드에 시간이 걸릴 수 있습니다.")
            raise AssertionError("TTS 생성 실패")
        
        assert response.status_code == 200, f"예상: 200, 실제: {response.status_code}"
        assert response.headers["content-type"] == "audio/wav", f"예상: audio/wav, 실제: {response.headers['content-type']}"
        
        audio_data = response.content
        assert len(audio_data) > 0, "오디오 데이터가 비어있음"
        
        print_info(f"오디오 크기: {len(audio_data)} bytes")
        print_info(f"텍스트: '{text}'")
    
    def test_full_flow(self):
        """전체 플로우 통합 테스트"""
        print_info("1단계: 초기 단어 로드")
        response = requests.get(f"{self.backend_url}/api/initial-words", timeout=5)
        assert response.status_code == 200
        initial_words = response.json()["words"]
        print_info(f"  초기 단어: {initial_words}")
        
        print_info("2단계: 첫 번째 단어 선택 및 추천")
        selected_word = initial_words[0]
        response = requests.post(
            f"{self.backend_url}/api/recommend",
            json={"word": selected_word, "context": []},
            timeout=5
        )
        assert response.status_code == 200
        recommended_words = response.json()["recommendations"]
        print_info(f"  선택: '{selected_word}' → 추천: {recommended_words}")
        
        print_info("3단계: 두 번째 단어 선택 및 추천")
        selected_word_2 = recommended_words[0]
        response = requests.post(
            f"{self.backend_url}/api/recommend",
            json={"word": selected_word_2, "context": [selected_word]},
            timeout=5
        )
        assert response.status_code == 200
        recommended_words_2 = response.json()["recommendations"]
        print_info(f"  선택: '{selected_word_2}' → 추천: {recommended_words_2}")
        
        print_info("4단계: 문장 생성")
        selected_words = [selected_word, selected_word_2, recommended_words_2[0]]
        response = requests.post(
            f"{self.backend_url}/api/generate",
            json={"words": selected_words},
            timeout=30
        )
        
        if response.status_code == 503:
            print_warning("  Ollama 서비스 연결 실패 - 문장 생성 건너뜀")
            return
        
        assert response.status_code == 200
        sentence = response.json()["sentence"]
        print_info(f"  단어: {selected_words}")
        print_info(f"  문장: '{sentence}'")
        
        print_info("5단계: TTS 음성 생성")
        response = requests.post(
            f"{self.backend_url}/api/tts",
            json={"text": sentence},
            timeout=30
        )
        
        if response.status_code == 500:
            print_warning("  TTS 생성 실패 - 음성 생성 건너뜀")
            return
        
        assert response.status_code == 200
        audio_size = len(response.content)
        print_info(f"  오디오 생성 완료: {audio_size} bytes")
    
    def test_error_scenarios(self):
        """에러 시나리오 테스트"""
        print_info("시나리오 1: 빈 단어 목록으로 문장 생성")
        response = requests.post(
            f"{self.backend_url}/api/generate",
            json={"words": []},
            timeout=5
        )
        assert response.status_code == 400, f"예상: 400, 실제: {response.status_code}"
        print_info(f"  올바른 에러 응답: {response.json()}")
        
        print_info("시나리오 2: 잘못된 요청 데이터")
        response = requests.post(
            f"{self.backend_url}/api/recommend",
            json={"invalid_field": "test"},
            timeout=5
        )
        assert response.status_code == 422, f"예상: 422, 실제: {response.status_code}"
        print_info(f"  올바른 검증 에러: {response.json()}")
        
        print_info("시나리오 3: 빈 텍스트로 TTS 요청")
        response = requests.post(
            f"{self.backend_url}/api/tts",
            json={"text": ""},
            timeout=5
        )
        assert response.status_code in [400, 500], f"에러 응답 예상, 실제: {response.status_code}"
        print_info(f"  올바른 에러 응답: {response.json()}")
    
    def run_all_tests(self):
        """모든 테스트 실행"""
        print_header("통합 및 엔드투엔드 테스트 시작")
        
        # 1. 백엔드 서버 확인
        if not self.run_test("1. 백엔드 서버 실행 확인", self.test_backend_server):
            print_error("\n백엔드 서버가 실행되지 않았습니다.")
            print_info("다음 명령으로 서버를 시작하세요:")
            print_info("  cd backend")
            print_info("  uvicorn main:app --reload --port 8000")
            return False
        
        # 2. Ollama 서비스 확인
        self.run_test("2. Ollama 서비스 연결 확인", self.test_ollama_service)
        
        # 3. 초기 단어 로드
        self.run_test("3. 초기 단어 로드", self.test_initial_words)
        
        # 4. 단어 추천
        self.run_test("4. 단어 추천 (FAISS)", self.test_word_recommendation)
        
        # 5. 문장 생성
        self.run_test("5. 문장 생성 (Ollama)", self.test_sentence_generation)
        
        # 6. TTS 생성
        self.run_test("6. TTS 음성 생성", lambda: self.test_tts_generation("안녕하세요"))
        
        # 7. 전체 플로우
        self.run_test("7. 전체 플로우 통합 테스트", self.test_full_flow)
        
        # 8. 에러 시나리오
        self.run_test("8. 에러 시나리오 테스트", self.test_error_scenarios)
        
        # 결과 요약
        self.print_summary()
        
        return all(result[1] for result in self.test_results)
    
    def print_summary(self):
        """테스트 결과 요약 출력"""
        print_header("테스트 결과 요약")
        
        passed = sum(1 for _, result, _ in self.test_results if result)
        failed = len(self.test_results) - passed
        
        for test_name, result, error in self.test_results:
            if result:
                print_success(test_name)
            else:
                print_error(f"{test_name}: {error}")
        
        print(f"\n{Colors.BLUE}{'=' * 60}{Colors.END}")
        print(f"총 테스트: {len(self.test_results)}")
        print(f"{Colors.GREEN}통과: {passed}{Colors.END}")
        print(f"{Colors.RED}실패: {failed}{Colors.END}")
        
        if failed == 0:
            print(f"\n{Colors.GREEN}✅ 모든 테스트 통과!{Colors.END}")
        else:
            print(f"\n{Colors.RED}⚠️  {failed}개 테스트 실패{Colors.END}")
        
        print(f"{Colors.BLUE}{'=' * 60}{Colors.END}")


def main():
    """메인 함수"""
    runner = E2ETestRunner()
    success = runner.run_all_tests()
    
    if not success:
        print_info("\n실행 가이드:")
        print_info("1. 백엔드 서버: cd backend && uvicorn main:app --reload --port 8000")
        print_info("2. Ollama 서비스: ollama serve (별도 터미널)")
        print_info("3. Ollama 모델: ollama pull gemma2:2b")
        print_info("4. 프론트엔드: cd frontend && npm run dev")
    
    sys.exit(0 if success else 1)


if __name__ == "__main__":
    main()
