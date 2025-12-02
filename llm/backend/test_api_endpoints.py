"""
API 엔드포인트 테스트
FastAPI TestClient를 사용하여 모든 엔드포인트를 검증합니다.
"""
from fastapi.testclient import TestClient
from main import app

client = TestClient(app)


def test_root_endpoint():
    """루트 엔드포인트 테스트"""
    response = client.get("/")
    assert response.status_code == 200
    assert response.json()["status"] == "running"


def test_health_check():
    """헬스 체크 엔드포인트 테스트"""
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "healthy"


def test_get_initial_words():
    """초기 단어 조회 엔드포인트 테스트"""
    response = client.get("/api/initial-words")
    assert response.status_code == 200
    
    data = response.json()
    assert "words" in data
    assert isinstance(data["words"], list)
    assert len(data["words"]) == 4


def test_recommend_words():
    """단어 추천 엔드포인트 테스트"""
    request_data = {
        "word": "안녕",
        "context": []
    }
    
    response = client.post("/api/recommend", json=request_data)
    assert response.status_code == 200
    
    data = response.json()
    assert "recommendations" in data
    assert isinstance(data["recommendations"], list)
    assert len(data["recommendations"]) == 4


def test_recommend_words_validation_error():
    """단어 추천 엔드포인트 검증 오류 테스트"""
    # word 필드 누락
    request_data = {
        "context": []
    }
    
    response = client.post("/api/recommend", json=request_data)
    assert response.status_code == 422


def test_generate_sentence():
    """문장 생성 엔드포인트 테스트"""
    request_data = {
        "words": ["안녕", "하세요", "친구"]
    }
    
    response = client.post("/api/generate", json=request_data)
    
    # Ollama가 실행 중이지 않으면 503 에러 예상
    if response.status_code == 503:
        assert "Ollama" in response.json()["detail"]
    else:
        assert response.status_code == 200
        data = response.json()
        assert "sentence" in data
        assert isinstance(data["sentence"], str)
        assert len(data["sentence"]) > 0


def test_generate_sentence_empty_words():
    """빈 단어 목록으로 문장 생성 시 오류 테스트"""
    request_data = {
        "words": []
    }
    
    response = client.post("/api/generate", json=request_data)
    assert response.status_code == 400


def test_tts_endpoint():
    """TTS 엔드포인트 테스트"""
    request_data = {
        "text": "안녕하세요"
    }
    
    response = client.post("/api/tts", json=request_data)
    
    # TTS 모델이 로드되지 않았으면 500 에러 예상
    if response.status_code == 500:
        assert "오류" in response.json()["detail"]
    else:
        assert response.status_code == 200
        assert response.headers["content-type"] == "audio/wav"


def test_tts_empty_text():
    """빈 텍스트로 TTS 요청 시 오류 테스트"""
    request_data = {
        "text": ""
    }
    
    response = client.post("/api/tts", json=request_data)
    assert response.status_code in [400, 500]


if __name__ == "__main__":
    print("Running API endpoint tests...")
    
    print("\n1. Testing root endpoint...")
    test_root_endpoint()
    print("✓ Root endpoint works")
    
    print("\n2. Testing health check...")
    test_health_check()
    print("✓ Health check works")
    
    print("\n3. Testing initial words...")
    test_get_initial_words()
    print("✓ Initial words endpoint works")
    
    print("\n4. Testing word recommendations...")
    test_recommend_words()
    print("✓ Word recommendation endpoint works")
    
    print("\n5. Testing validation error...")
    test_recommend_words_validation_error()
    print("✓ Validation error handling works")
    
    print("\n6. Testing sentence generation...")
    test_generate_sentence()
    print("✓ Sentence generation endpoint works (or Ollama not running)")
    
    print("\n7. Testing empty words validation...")
    test_generate_sentence_empty_words()
    print("✓ Empty words validation works")
    
    print("\n8. Testing TTS endpoint...")
    test_tts_endpoint()
    print("✓ TTS endpoint works (or TTS model not loaded)")
    
    print("\n9. Testing TTS empty text...")
    test_tts_empty_text()
    print("✓ TTS empty text validation works")
    
    print("\n✅ All tests completed!")
