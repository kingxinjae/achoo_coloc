"""
통합 테스트 스크립트
전체 시스템의 통합 동작을 검증합니다.
백엔드, 프론트엔드, Ollama 서비스를 모두 확인합니다.
"""
import subprocess
import sys
import time
import requests
import os
from pathlib import Path


class Colors:
    GREEN = '\033[92m'
    RED = '\033[91m'
    YELLOW = '\033[93m'
    BLUE = '\033[94m'
    CYAN = '\033[96m'
    END = '\033[0m'


def print_header(text):
    print(f"\n{Colors.BLUE}{'=' * 70}{Colors.END}")
    print(f"{Colors.BLUE}{text:^70}{Colors.END}")
    print(f"{Colors.BLUE}{'=' * 70}{Colors.END}")


def print_section(text):
    print(f"\n{Colors.CYAN}▶ {text}{Colors.END}")


def print_success(text):
    print(f"{Colors.GREEN}  ✓ {text}{Colors.END}")


def print_error(text):
    print(f"{Colors.RED}  ✗ {text}{Colors.END}")


def print_warning(text):
    print(f"{Colors.YELLOW}  ⚠ {text}{Colors.END}")


def print_info(text):
    print(f"    {text}")


class IntegrationTestRunner:
    def __init__(self):
        self.backend_url = "http://localhost:8000"
        self.frontend_url = "http://localhost:5173"
        self.ollama_url = "http://localhost:11434"
        self.results = {
            'backend': False,
            'frontend': False,
            'ollama': False,
            'api_tests': False,
            'e2e_flow': False
        }
    
    def check_backend_server(self):
        """백엔드 서버 실행 확인"""
        print_section("1. 백엔드 서버 확인")
        
        try:
            response = requests.get(f"{self.backend_url}/health", timeout=3)
            if response.status_code == 200:
                data = response.json()
                if data.get('status') == 'healthy':
                    print_success(f"백엔드 서버 실행 중: {self.backend_url}")
                    print_info(f"응답: {data}")
                    self.results['backend'] = True
                    return True
                else:
                    print_error(f"백엔드 상태 이상: {data}")
                    return False
            else:
                print_error(f"백엔드 응답 오류: {response.status_code}")
                return False
        except requests.exceptions.ConnectionError:
            print_error("백엔드 서버에 연결할 수 없습니다")
            print_warning("다음 명령으로 백엔드를 시작하세요:")
            print_info("cd backend")
            print_info("uvicorn main:app --reload --port 8000")
            return False
        except Exception as e:
            print_error(f"백엔드 확인 중 오류: {e}")
            return False
    
    def check_frontend_server(self):
        """프론트엔드 서버 실행 확인"""
        print_section("2. 프론트엔드 서버 확인")
        
        try:
            response = requests.get(self.frontend_url, timeout=3)
            if response.status_code == 200:
                html = response.text
                if 'html' in html.lower():
                    print_success(f"프론트엔드 서버 실행 중: {self.frontend_url}")
                    self.results['frontend'] = True
                    return True
                else:
                    print_error("프론트엔드 응답이 HTML이 아닙니다")
                    return False
            else:
                print_error(f"프론트엔드 응답 오류: {response.status_code}")
                return False
        except requests.exceptions.ConnectionError:
            print_error("프론트엔드 서버에 연결할 수 없습니다")
            print_warning("다음 명령으로 프론트엔드를 시작하세요:")
            print_info("cd frontend")
            print_info("npm run dev")
            return False
        except Exception as e:
            print_error(f"프론트엔드 확인 중 오류: {e}")
            return False
    
    def check_ollama_service(self):
        """Ollama 서비스 연결 확인"""
        print_section("3. Ollama 서비스 확인")
        
        try:
            response = requests.get(f"{self.ollama_url}/api/tags", timeout=3)
            if response.status_code == 200:
                data = response.json()
                models = [m['name'] for m in data.get('models', [])]
                print_success(f"Ollama 서비스 실행 중: {self.ollama_url}")
                print_info(f"사용 가능한 모델: {models}")
                
                # gemma2:2b, gemma3:4b, mistral:latest 중 하나라도 있으면 OK
                available_models = ['gemma2:2b', 'gemma3:4b', 'mistral:latest']
                found_models = [m for m in models if m in available_models]
                
                if found_models:
                    print_success(f"사용 가능한 모델 발견: {', '.join(found_models)}")
                    self.results['ollama'] = True
                    return True
                else:
                    print_warning("권장 모델이 설치되지 않았습니다")
                    print_info("다음 명령으로 모델을 설치하세요:")
                    print_info("ollama pull gemma2:2b 또는 ollama pull gemma3:4b")
                    return False
            else:
                print_error(f"Ollama 응답 오류: {response.status_code}")
                return False
        except requests.exceptions.ConnectionError:
            print_error("Ollama 서비스에 연결할 수 없습니다")
            print_warning("다음 명령으로 Ollama를 시작하세요:")
            print_info("ollama serve")
            return False
        except Exception as e:
            print_error(f"Ollama 확인 중 오류: {e}")
            return False
    
    def run_api_tests(self):
        """API 엔드포인트 테스트"""
        print_section("4. API 엔드포인트 테스트")
        
        if not self.results['backend']:
            print_warning("백엔드가 실행되지 않아 API 테스트를 건너뜁니다")
            return False
        
        try:
            # 초기 단어
            print_info("초기 단어 로드 테스트...")
            response = requests.get(f"{self.backend_url}/api/initial-words", timeout=5)
            assert response.status_code == 200
            words = response.json()['words']
            print_success(f"초기 단어: {words}")
            
            # 단어 추천
            print_info("단어 추천 테스트...")
            response = requests.post(
                f"{self.backend_url}/api/recommend",
                json={"word": words[0], "context": []},
                timeout=5
            )
            assert response.status_code == 200
            recommendations = response.json()['recommendations']
            print_success(f"추천 단어: {recommendations}")
            
            # 문장 생성 (Ollama 필요)
            print_info("문장 생성 테스트...")
            response = requests.post(
                f"{self.backend_url}/api/generate",
                json={"words": ["안녕", "하세요"]},
                timeout=30
            )
            if response.status_code == 200:
                sentence = response.json()['sentence']
                print_success(f"생성된 문장: {sentence}")
            else:
                print_warning(f"문장 생성 실패: {response.status_code}")
            
            self.results['api_tests'] = True
            return True
            
        except Exception as e:
            print_error(f"API 테스트 실패: {e}")
            return False
    
    def run_e2e_flow(self):
        """엔드투엔드 플로우 테스트"""
        print_section("5. 엔드투엔드 플로우 테스트")
        
        if not self.results['backend']:
            print_warning("백엔드가 실행되지 않아 E2E 테스트를 건너뜁니다")
            return False
        
        try:
            print_info("전체 플로우 시뮬레이션...")
            
            # 1. 초기 단어
            response = requests.get(f"{self.backend_url}/api/initial-words", timeout=5)
            words = response.json()['words']
            print_info(f"1단계: 초기 단어 로드 → {words}")
            
            # 2. 첫 번째 선택
            selected = words[0]
            response = requests.post(
                f"{self.backend_url}/api/recommend",
                json={"word": selected, "context": []},
                timeout=5
            )
            recommendations = response.json()['recommendations']
            print_info(f"2단계: '{selected}' 선택 → 추천: {recommendations}")
            
            # 3. 두 번째 선택
            selected2 = recommendations[0]
            response = requests.post(
                f"{self.backend_url}/api/recommend",
                json={"word": selected2, "context": [selected]},
                timeout=5
            )
            recommendations2 = response.json()['recommendations']
            print_info(f"3단계: '{selected2}' 선택 → 추천: {recommendations2}")
            
            # 4. 문장 생성
            selected_words = [selected, selected2, recommendations2[0]]
            response = requests.post(
                f"{self.backend_url}/api/generate",
                json={"words": selected_words},
                timeout=30
            )
            if response.status_code == 200:
                sentence = response.json()['sentence']
                print_info(f"4단계: 문장 생성 → '{sentence}'")
                
                # 5. TTS (선택사항)
                try:
                    response = requests.post(
                        f"{self.backend_url}/api/tts",
                        json={"text": sentence},
                        timeout=30
                    )
                    if response.status_code == 200:
                        audio_size = len(response.content)
                        print_info(f"5단계: TTS 생성 → {audio_size} bytes")
                    else:
                        print_warning("TTS 생성 실패 (선택 기능)")
                except:
                    print_warning("TTS 기능 사용 불가 (선택 기능)")
                
                print_success("전체 플로우 완료!")
                self.results['e2e_flow'] = True
                return True
            else:
                print_warning(f"문장 생성 실패: {response.status_code}")
            
            return False
            
        except Exception as e:
            print_error(f"E2E 플로우 실패: {e}")
            return False
    
    def check_file_structure(self):
        """파일 구조 확인"""
        print_section("6. 파일 구조 확인")
        
        required_files = {
            'backend': [
                'backend/main.py',
                'backend/requirements.txt',
                'backend/services/faiss_service.py',
                'backend/services/ollama_service.py',
                'backend/services/tts_service.py',
                'backend/routers/words.py',
                'backend/routers/generate.py',
                'backend/routers/tts.py',
                'backend/data/vocabulary.txt'
            ],
            'frontend': [
                'frontend/package.json',
                'frontend/index.html',
                'frontend/src/App.tsx',
                'frontend/src/services/api.ts',
                'frontend/src/components/WordGrid.tsx'
            ]
        }
        
        all_exist = True
        for category, files in required_files.items():
            print_info(f"{category.upper()} 파일:")
            for file in files:
                if Path(file).exists():
                    print_success(f"{file}")
                else:
                    print_error(f"{file} - 누락")
                    all_exist = False
        
        return all_exist
    
    def print_summary(self):
        """결과 요약"""
        print_header("통합 테스트 결과 요약")
        
        total = len(self.results)
        passed = sum(1 for v in self.results.values() if v)
        
        for name, result in self.results.items():
            status = f"{Colors.GREEN}✓{Colors.END}" if result else f"{Colors.RED}✗{Colors.END}"
            print(f"{status} {name.replace('_', ' ').title()}")
        
        print(f"\n{Colors.BLUE}{'=' * 70}{Colors.END}")
        print(f"총 검사 항목: {total}")
        print(f"{Colors.GREEN}통과: {passed}{Colors.END}")
        print(f"{Colors.RED}실패: {total - passed}{Colors.END}")
        
        if passed == total:
            print(f"\n{Colors.GREEN}✅ 모든 통합 테스트 통과!{Colors.END}")
            print(f"{Colors.GREEN}시스템이 정상적으로 작동하고 있습니다.{Colors.END}")
        else:
            print(f"\n{Colors.YELLOW}⚠️  일부 테스트 실패{Colors.END}")
            self.print_troubleshooting()
        
        print(f"{Colors.BLUE}{'=' * 70}{Colors.END}")
    
    def print_troubleshooting(self):
        """문제 해결 가이드"""
        print(f"\n{Colors.CYAN}문제 해결 가이드:{Colors.END}")
        
        if not self.results['backend']:
            print(f"\n{Colors.YELLOW}백엔드 시작:{Colors.END}")
            print("  cd backend")
            print("  pip install -r requirements.txt")
            print("  uvicorn main:app --reload --port 8000")
        
        if not self.results['frontend']:
            print(f"\n{Colors.YELLOW}프론트엔드 시작:{Colors.END}")
            print("  cd frontend")
            print("  npm install")
            print("  npm run dev")
        
        if not self.results['ollama']:
            print(f"\n{Colors.YELLOW}Ollama 설정:{Colors.END}")
            print("  ollama serve")
            print("  ollama pull gemma2:2b")
    
    def run_all(self):
        """모든 테스트 실행"""
        print_header("통합 및 엔드투엔드 테스트")
        
        # 서버 확인
        self.check_backend_server()
        self.check_frontend_server()
        self.check_ollama_service()
        
        # 기능 테스트
        self.run_api_tests()
        self.run_e2e_flow()
        
        # 파일 구조
        self.check_file_structure()
        
        # 결과 출력
        self.print_summary()
        
        return all(self.results.values())


def main():
    runner = IntegrationTestRunner()
    success = runner.run_all()
    sys.exit(0 if success else 1)


if __name__ == "__main__":
    main()
