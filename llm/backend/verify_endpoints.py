"""
FastAPI 엔드포인트 구현 검증 스크립트
실제 실행 없이 코드 구조를 검증합니다.
"""
import ast
import os


def check_file_exists(filepath):
    """파일 존재 여부 확인"""
    exists = os.path.exists(filepath)
    status = "✓" if exists else "✗"
    print(f"{status} {filepath}")
    return exists


def check_pydantic_models():
    """Pydantic 모델 정의 확인"""
    print("\n=== 1. Pydantic 모델 정의 확인 ===")
    
    filepath = "models/schemas.py"
    if not check_file_exists(filepath):
        return False
    
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    required_models = [
        "RecommendRequest",
        "RecommendResponse",
        "GenerateRequest",
        "GenerateResponse",
        "TTSRequest",
        "InitialWordsResponse"
    ]
    
    all_found = True
    for model in required_models:
        if f"class {model}" in content:
            print(f"  ✓ {model} 정의됨")
        else:
            print(f"  ✗ {model} 누락")
            all_found = False
    
    return all_found


def check_endpoint(filepath, endpoint_name, method, path):
    """특정 엔드포인트 구현 확인"""
    if not os.path.exists(filepath):
        print(f"  ✗ {endpoint_name}: 파일 없음 ({filepath})")
        return False
    
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # 데코레이터 패턴 확인
    decorator = f'@router.{method.lower()}("{path}"'
    
    if decorator in content:
        print(f"  ✓ {endpoint_name}: {method} {path}")
        return True
    else:
        print(f"  ✗ {endpoint_name}: {method} {path} 누락")
        return False


def check_all_endpoints():
    """모든 엔드포인트 확인"""
    print("\n=== 2. API 엔드포인트 구현 확인 ===")
    
    endpoints = [
        ("routers/words.py", "GET /api/initial-words", "get", "/initial-words"),
        ("routers/words.py", "POST /api/recommend", "post", "/recommend"),
        ("routers/generate.py", "POST /api/generate", "post", "/generate"),
        ("routers/tts.py", "POST /api/tts", "post", "/tts"),
    ]
    
    all_found = True
    for filepath, name, method, path in endpoints:
        if not check_endpoint(filepath, name, method, path):
            all_found = False
    
    return all_found


def check_error_handling():
    """에러 핸들링 미들웨어 확인"""
    print("\n=== 3. 에러 핸들링 미들웨어 확인 ===")
    
    filepath = "main.py"
    if not check_file_exists(filepath):
        return False
    
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    checks = [
        ("전역 예외 핸들러", "@app.exception_handler(Exception)"),
        ("검증 예외 핸들러", "@app.exception_handler(RequestValidationError)"),
        ("CORS 미들웨어", "CORSMiddleware"),
    ]
    
    all_found = True
    for name, pattern in checks:
        if pattern in content:
            print(f"  ✓ {name} 구현됨")
        else:
            print(f"  ✗ {name} 누락")
            all_found = False
    
    return all_found


def check_streaming_response():
    """StreamingResponse 구현 확인"""
    print("\n=== 4. StreamingResponse 구현 확인 ===")
    
    filepath = "routers/tts.py"
    if not os.path.exists(filepath):
        print(f"  ✗ 파일 없음: {filepath}")
        return False
    
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    if "StreamingResponse" in content:
        print(f"  ✓ StreamingResponse 사용됨")
        return True
    else:
        print(f"  ✗ StreamingResponse 누락")
        return False


def check_router_registration():
    """라우터 등록 확인"""
    print("\n=== 5. 라우터 등록 확인 ===")
    
    filepath = "main.py"
    if not os.path.exists(filepath):
        return False
    
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    routers = ["words", "generate", "tts"]
    
    all_found = True
    for router in routers:
        if f"app.include_router({router}.router" in content:
            print(f"  ✓ {router} 라우터 등록됨")
        else:
            print(f"  ✗ {router} 라우터 누락")
            all_found = False
    
    return all_found


def main():
    """메인 검증 함수"""
    print("=" * 60)
    print("FastAPI 엔드포인트 구현 검증")
    print("=" * 60)
    
    # 작업 디렉토리를 backend로 변경
    if os.path.basename(os.getcwd()) != "backend":
        if os.path.exists("backend"):
            os.chdir("backend")
    
    results = []
    
    # 1. Pydantic 모델 확인
    results.append(("Pydantic 모델", check_pydantic_models()))
    
    # 2. 엔드포인트 확인
    results.append(("API 엔드포인트", check_all_endpoints()))
    
    # 3. 에러 핸들링 확인
    results.append(("에러 핸들링", check_error_handling()))
    
    # 4. StreamingResponse 확인
    results.append(("StreamingResponse", check_streaming_response()))
    
    # 5. 라우터 등록 확인
    results.append(("라우터 등록", check_router_registration()))
    
    # 결과 요약
    print("\n" + "=" * 60)
    print("검증 결과 요약")
    print("=" * 60)
    
    all_passed = True
    for name, passed in results:
        status = "✓ 통과" if passed else "✗ 실패"
        print(f"{status}: {name}")
        if not passed:
            all_passed = False
    
    print("\n" + "=" * 60)
    if all_passed:
        print("✅ 모든 검증 통과! Task 5 구현 완료")
    else:
        print("⚠️  일부 검증 실패")
    print("=" * 60)
    
    return all_passed


if __name__ == "__main__":
    success = main()
    exit(0 if success else 1)
