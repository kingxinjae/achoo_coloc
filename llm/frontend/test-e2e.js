/**
 * 프론트엔드 엔드투엔드 테스트
 * 프론트엔드 개발 서버와 API 통신을 검증합니다.
 */

const BACKEND_URL = 'http://localhost:8000';
const FRONTEND_URL = 'http://localhost:5173';

const colors = {
  green: '\x1b[92m',
  red: '\x1b[91m',
  yellow: '\x1b[93m',
  blue: '\x1b[94m',
  reset: '\x1b[0m'
};

function printHeader(text) {
  console.log(`\n${colors.blue}${'='.repeat(60)}${colors.reset}`);
  console.log(`${colors.blue}${text}${colors.reset}`);
  console.log(`${colors.blue}${'='.repeat(60)}${colors.reset}`);
}

function printSuccess(text) {
  console.log(`${colors.green}✓ ${text}${colors.reset}`);
}

function printError(text) {
  console.log(`${colors.red}✗ ${text}${colors.reset}`);
}

function printWarning(text) {
  console.log(`${colors.yellow}⚠ ${text}${colors.reset}`);
}

function printInfo(text) {
  console.log(`  ${text}`);
}

class FrontendE2ETest {
  constructor() {
    this.testResults = [];
  }

  async runTest(testName, testFunc) {
    console.log(`\n${testName}...`);
    try {
      await testFunc();
      printSuccess(`${testName} 통과`);
      this.testResults.push({ name: testName, passed: true, error: null });
      return true;
    } catch (error) {
      printError(`${testName} 실패: ${error.message}`);
      this.testResults.push({ name: testName, passed: false, error: error.message });
      return false;
    }
  }

  async testFrontendServer() {
    printInfo(`프론트엔드 URL: ${FRONTEND_URL}`);
    
    const response = await fetch(FRONTEND_URL);
    if (!response.ok) {
      throw new Error(`서버 응답 실패: ${response.status}`);
    }
    
    const html = await response.text();
    if (!html.includes('<!DOCTYPE html>') && !html.includes('<!doctype html>')) {
      throw new Error('HTML 문서가 아님');
    }
    
    printInfo('프론트엔드 서버 정상 실행 중');
  }

  async testBackendConnection() {
    printInfo(`백엔드 URL: ${BACKEND_URL}`);
    
    const response = await fetch(`${BACKEND_URL}/health`);
    if (!response.ok) {
      throw new Error(`백엔드 응답 실패: ${response.status}`);
    }
    
    const data = await response.json();
    if (data.status !== 'healthy') {
      throw new Error(`백엔드 상태 이상: ${data.status}`);
    }
    
    printInfo('백엔드 연결 정상');
  }

  async testAPIEndpoints() {
    printInfo('API 엔드포인트 테스트 중...');
    
    // 1. 초기 단어
    const initialWordsRes = await fetch(`${BACKEND_URL}/api/initial-words`);
    if (!initialWordsRes.ok) throw new Error('초기 단어 로드 실패');
    const initialWords = await initialWordsRes.json();
    printInfo(`  초기 단어: ${initialWords.words.join(', ')}`);
    
    // 2. 단어 추천
    const recommendRes = await fetch(`${BACKEND_URL}/api/recommend`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ word: '안녕', context: [] })
    });
    if (!recommendRes.ok) throw new Error('단어 추천 실패');
    const recommendations = await recommendRes.json();
    printInfo(`  추천 단어: ${recommendations.recommendations.join(', ')}`);
    
    printInfo('모든 API 엔드포인트 정상');
  }

  async testCORSConfiguration() {
    printInfo('CORS 설정 확인 중...');
    
    const response = await fetch(`${BACKEND_URL}/api/initial-words`, {
      method: 'GET',
      headers: {
        'Origin': FRONTEND_URL
      }
    });
    
    if (!response.ok) {
      throw new Error('CORS 요청 실패');
    }
    
    const corsHeader = response.headers.get('access-control-allow-origin');
    if (!corsHeader) {
      printWarning('CORS 헤더가 없습니다. 브라우저에서 문제가 발생할 수 있습니다.');
    } else {
      printInfo(`CORS 허용 Origin: ${corsHeader}`);
    }
  }

  async testErrorHandling() {
    printInfo('에러 처리 테스트 중...');
    
    // 잘못된 요청
    const response = await fetch(`${BACKEND_URL}/api/recommend`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ invalid: 'data' })
    });
    
    if (response.status !== 422) {
      throw new Error(`예상: 422, 실제: ${response.status}`);
    }
    
    const error = await response.json();
    printInfo(`  올바른 에러 응답: ${JSON.stringify(error.detail)}`);
  }

  async testBuildFiles() {
    printInfo('빌드 파일 확인 중...');
    
    const fs = require('fs');
    const path = require('path');
    
    const requiredFiles = [
      'package.json',
      'index.html',
      'src/App.tsx',
      'src/services/api.ts',
      'src/components/WordGrid.tsx'
    ];
    
    for (const file of requiredFiles) {
      const filePath = path.join(__dirname, file);
      if (!fs.existsSync(filePath)) {
        throw new Error(`필수 파일 누락: ${file}`);
      }
    }
    
    printInfo('모든 필수 파일 존재');
  }

  async runAllTests() {
    printHeader('프론트엔드 엔드투엔드 테스트 시작');
    
    // 1. 프론트엔드 서버 확인
    const frontendOk = await this.runTest(
      '1. 프론트엔드 서버 실행 확인',
      () => this.testFrontendServer()
    );
    
    if (!frontendOk) {
      printError('\n프론트엔드 서버가 실행되지 않았습니다.');
      printInfo('다음 명령으로 서버를 시작하세요:');
      printInfo('  cd frontend');
      printInfo('  npm run dev');
      this.printSummary();
      return false;
    }
    
    // 2. 백엔드 연결 확인
    await this.runTest(
      '2. 백엔드 연결 확인',
      () => this.testBackendConnection()
    );
    
    // 3. API 엔드포인트 테스트
    await this.runTest(
      '3. API 엔드포인트 테스트',
      () => this.testAPIEndpoints()
    );
    
    // 4. CORS 설정 확인
    await this.runTest(
      '4. CORS 설정 확인',
      () => this.testCORSConfiguration()
    );
    
    // 5. 에러 처리 확인
    await this.runTest(
      '5. 에러 처리 확인',
      () => this.testErrorHandling()
    );
    
    // 6. 빌드 파일 확인
    await this.runTest(
      '6. 빌드 파일 확인',
      () => this.testBuildFiles()
    );
    
    this.printSummary();
    
    return this.testResults.every(r => r.passed);
  }

  printSummary() {
    printHeader('테스트 결과 요약');
    
    const passed = this.testResults.filter(r => r.passed).length;
    const failed = this.testResults.length - passed;
    
    this.testResults.forEach(result => {
      if (result.passed) {
        printSuccess(result.name);
      } else {
        printError(`${result.name}: ${result.error}`);
      }
    });
    
    console.log(`\n${colors.blue}${'='.repeat(60)}${colors.reset}`);
    console.log(`총 테스트: ${this.testResults.length}`);
    console.log(`${colors.green}통과: ${passed}${colors.reset}`);
    console.log(`${colors.red}실패: ${failed}${colors.reset}`);
    
    if (failed === 0) {
      console.log(`\n${colors.green}✅ 모든 테스트 통과!${colors.reset}`);
    } else {
      console.log(`\n${colors.red}⚠️  ${failed}개 테스트 실패${colors.reset}`);
    }
    
    console.log(`${colors.blue}${'='.repeat(60)}${colors.reset}`);
  }
}

async function main() {
  const runner = new FrontendE2ETest();
  const success = await runner.runAllTests();
  
  if (!success) {
    printInfo('\n실행 가이드:');
    printInfo('1. 백엔드: cd backend && uvicorn main:app --reload --port 8000');
    printInfo('2. 프론트엔드: cd frontend && npm run dev');
    printInfo('3. Ollama: ollama serve (별도 터미널)');
  }
  
  process.exit(success ? 0 : 1);
}

main().catch(error => {
  printError(`테스트 실행 오류: ${error.message}`);
  process.exit(1);
});
