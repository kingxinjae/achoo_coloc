class GazeTracker {
    constructor() {
        this.video = document.getElementById('video');
        this.canvas = document.getElementById('canvas');
        this.ctx = this.canvas.getContext('2d');
        this.gazePoint = document.getElementById('gazePoint');
        this.videoSection = document.getElementById('videoSection');
        
        // UI 요소들 (정보 패널 제거로 인해 null 체크 필요)
        this.statusEl = document.getElementById('status');
        this.accuracyFillEl = document.getElementById('accuracyFill');
        this.accuracyTextEl = document.getElementById('accuracyText');
        this.gazeXEl = document.getElementById('gazeX');
        this.gazeYEl = document.getElementById('gazeY');
        this.leftEyeEl = document.getElementById('leftEye');
        this.rightEyeEl = document.getElementById('rightEye');
        this.headPitchEl = document.getElementById('headPitch');
        this.headYawEl = document.getElementById('headYaw');
        this.headRollEl = document.getElementById('headRoll');
        
        // 버튼들
        this.startBtn = document.getElementById('startBtn');
        this.startButtonContainer = document.getElementById('startButtonContainer');
        this.videoSection = document.getElementById('videoSection');
        this.faceGuideBtn = document.getElementById('faceGuideBtn');
        this.calibrateBtn = document.getElementById('calibrateBtn');
        this.toggleGazeBtn = document.getElementById('toggleGazeBtn');
        
        // 눈 상태 표시 요소
        this.eyeStatusPanel = document.getElementById('eyeStatusPanel');
        this.leftEyeStatusEl = document.getElementById('leftEyeStatus');
        this.rightEyeStatusEl = document.getElementById('rightEyeStatus');
        // this.leftEyeRatioEl = document.getElementById('leftEyeRatio');
        // this.rightEyeRatioEl = document.getElementById('rightEyeRatio');
        this.leftEyeStatusConsole = document.getElementById('leftEyeStatusConsole');
        this.rightEyeStatusConsole = document.getElementById('rightEyeStatusConsole');
        this.eyeRatioConsole = document.getElementById('eyeRatioConsole');
        this.consoleEl = document.getElementById('consoleOutput');
        
        // MediaPipe Face Mesh
        this.faceMesh = null;
        this.camera = null;
        
        // 시선추적 상태
        this.isTracking = false;
        this.showGaze = false;
        this.calibrationData = [];
        this.isCalibrating = false;
        this.calibrationPoints = [];
        this.currentCalibrationIndex = 0;
        this.isFullscreen = false;
        this.validationMode = false;
        this.validationResults = [];
        
        // 정확도 향상을 위한 필터링
        this.gazeHistory = [];
        this.maxHistoryLength = 10;
        
        // 최신 랜드마크 저장 (캘리브레이션 데이터 수집용)
        this.lastLandmarks = null;
        
        // 깜박임 감지 관련
        this.lastLeftEyeState = true; // 이전 왼쪽 눈 상태 (true: 열림, false: 감음)
        this.lastRightEyeState = true; // 이전 오른쪽 눈 상태 (true: 열림, false: 감음)
        this.lastLeftBlinkTime = 0; // 마지막 왼쪽 눈 깜박임 시간
        this.lastRightBlinkTime = 0; // 마지막 오른쪽 눈 깜박임 시간
        this.blinkCooldown = 300; // 깜박임 감지 후 쿨다운 (ms)
        
        // 눈 감김 상태 추적 (0.5초 이상 유지되어야 감김으로 인식)
        this.leftEyeClosedStartTime = 0; // 왼쪽 눈 감김 시작 시간
        this.rightEyeClosedStartTime = 0; // 오른쪽 눈 감김 시작 시간
        this.eyeClosedThreshold = 500; // 감김 인식 최소 시간 (ms)
        this.lastLeftEyeDetectedTime = 0; // 왼쪽 눈 감김으로 마지막 인식된 시간
        this.lastRightEyeDetectedTime = 0; // 오른쪽 눈 감김으로 마지막 인식된 시간
        this.eyeDetectedCooldown = 1000; // 감김 인식 후 쿨다운 시간 (ms)
        
        // 눈 랜드마크 인덱스 (MediaPipe Face Mesh) - 상하 움직임 개선을 위해 수정
        this.leftEyeIndices = [33, 7, 163, 144, 145, 153, 154, 155, 133, 173, 157, 158, 159, 160, 161, 246];
        this.rightEyeIndices = [362, 382, 381, 380, 374, 373, 390, 249, 263, 466, 388, 387, 386, 385, 384, 398];
        
        // 상하 움직임을 위한 더 정확한 눈꺼풀 포인트 (개선된 인덱스)
        this.leftEyeVertical = [159, 145, 158, 153]; // 위쪽, 아래쪽, 추가 포인트들
        this.rightEyeVertical = [386, 374, 385, 380]; // 위쪽, 아래쪽, 추가 포인트들
        
        this.leftIrisIndices = [468, 469, 470, 471, 472];
        this.rightIrisIndices = [473, 474, 475, 476, 477];
        
        this.initializeEventListeners();
    }
    
    initializeEventListeners() {
        if (!this.startBtn) {
            console.error('Start button not found!');
            return;
        }
        
        this.startBtn.addEventListener('click', () => {
            console.log('Start button clicked');
            this.start();
        });
        
        if (this.calibrateBtn) {
        this.calibrateBtn.addEventListener('click', () => this.startCalibration());
        }
        if (this.toggleGazeBtn) {
        this.toggleGazeBtn.addEventListener('click', () => this.toggleGazeDisplay());
        }
        
        // 전체화면 변경 이벤트 리스너
        document.addEventListener('fullscreenchange', () => this.onFullscreenChange());
    }
    
    async start() {
        try {
            this.updateStatus('Initializing camera...');
            
            // 카메라 스트림 가져오기
            const stream = await navigator.mediaDevices.getUserMedia({
                video: {
                    width: 640,
                    height: 480,
                    facingMode: 'user'
                }
            });
            
            this.video.srcObject = stream;
            
            // MediaPipe Face Mesh 초기화
            await this.initializeFaceMesh();
            
            // Start 버튼 컨테이너 숨기기
            if (this.startButtonContainer) {
                this.startButtonContainer.classList.add('hidden');
            }
            
            // 비디오 섹션 표시
            if (this.videoSection) {
                this.videoSection.classList.add('active');
            }
            
            // 눈 상태 패널 표시
            if (this.eyeStatusPanel) {
                this.eyeStatusPanel.style.display = 'block';
            }
            
            // 얼굴 고정 영역 표시
            this.showFaceGuideArea();
            
            // 자동으로 전체화면 모드 진입
            try {
                await document.documentElement.requestFullscreen();
                this.isFullscreen = true;
            } catch (err) {
                console.error('전체화면 전환 실패:', err);
            }
            if (this.calibrateBtn) {
            this.calibrateBtn.disabled = false;
                this.calibrateBtn.style.display = 'inline-block';
            }
            if (this.toggleGazeBtn) {
            this.toggleGazeBtn.disabled = false;
                this.toggleGazeBtn.style.display = 'inline-block';
            }
            
            this.updateStatus('Ready - Start calibration for accurate tracking');
            
        } catch (error) {
            console.error('초기화 오류:', error);
            this.updateStatus('Error: Cannot access camera');
            alert('카메라 접근에 실패했습니다. 카메라 권한을 확인해주세요.');
        }
    }
    
    async initializeFaceMesh() {
        this.faceMesh = new FaceMesh({
            locateFile: (file) => {
                return `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`;
            }
        });
        
        this.faceMesh.setOptions({
            maxNumFaces: 1,
            refineLandmarks: true,
            minDetectionConfidence: 0.5,
            minTrackingConfidence: 0.5
        });
        
        this.faceMesh.onResults((results) => this.onFaceMeshResults(results));
        
        this.camera = new Camera(this.video, {
            onFrame: async () => {
                await this.faceMesh.send({ image: this.video });
            },
            width: 640,
            height: 480
        });
        
        await this.camera.start();
    }
    
    onFaceMeshResults(results) {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        if (results.multiFaceLandmarks && results.multiFaceLandmarks.length > 0) {
            const landmarks = results.multiFaceLandmarks[0];
            
            // 얼굴 랜드마크 그리기
            this.drawFaceLandmarks(landmarks);
            
            // 눈 상태 업데이트
            this.updateEyeStatus(landmarks);
            
            // 머리 각도 계산
            this.calculateHeadPose(landmarks);
            
            // 시선 추적
            if (this.isTracking && !this.isCalibrating) {
                const gazePoint = this.calculateGaze(landmarks);
                if (gazePoint) {
                    this.updateGazeDisplay(gazePoint);
                }
            }
            
            // 캘리브레이션 중일 때 최신 랜드마크 저장
            if (this.isCalibrating) {
                this.lastLandmarks = landmarks;
            }
        }
    }
    
    drawFaceLandmarks(landmarks) {
        // 얼굴 윤곽 그리기
        this.ctx.strokeStyle = '#00ff00';
        this.ctx.lineWidth = 1;
        
        // 눈 그리기
        this.drawEye(landmarks, this.leftEyeIndices, '#ff0000');
        this.drawEye(landmarks, this.rightEyeIndices, '#ff0000');
        
        // 홍채 그리기
        this.drawIris(landmarks, this.leftIrisIndices, '#0000ff');
        this.drawIris(landmarks, this.rightIrisIndices, '#0000ff');
    }
    
    drawEye(landmarks, indices, color) {
        this.ctx.strokeStyle = color;
        this.ctx.beginPath();
        
        for (let i = 0; i < indices.length; i++) {
            const point = landmarks[indices[i]];
            const x = point.x * this.canvas.width;
            const y = point.y * this.canvas.height;
            
            if (i === 0) {
                this.ctx.moveTo(x, y);
            } else {
                this.ctx.lineTo(x, y);
            }
        }
        
        this.ctx.closePath();
        this.ctx.stroke();
    }
    
    drawIris(landmarks, indices, color) {
        if (indices.length === 0) return;
        
        this.ctx.fillStyle = color;
        
        for (const index of indices) {
            const point = landmarks[index];
            const x = point.x * this.canvas.width;
            const y = point.y * this.canvas.height;
            
            this.ctx.beginPath();
            this.ctx.arc(x, y, 2, 0, 2 * Math.PI);
            this.ctx.fill();
        }
    }
    
    updateEyeStatus(landmarks) {
        const leftEyeResult = this.getEyeOpenRatio(landmarks, this.leftEyeIndices);
        const rightEyeResult = this.getEyeOpenRatio(landmarks, this.rightEyeIndices);
        
        const currentTime = Date.now();
        
        // 임계값 0.2 기준으로 감김 여부 판단
        const leftEyeRatio = leftEyeResult.ratio;
        const rightEyeRatio = rightEyeResult.ratio;
        const leftEyeBelowThreshold = leftEyeRatio <= 0.2;
        const rightEyeBelowThreshold = rightEyeRatio <= 0.2;
        
        // 양쪽 눈 모두 0.2 이하이면 아무것도 하지 않음
        if (leftEyeBelowThreshold && rightEyeBelowThreshold) {
            // 양쪽 눈 모두 감김 - 리셋하고 continue
            this.leftEyeClosedStartTime = 0;
            this.rightEyeClosedStartTime = 0;
            
            // UI 표시는 양쪽 다 감김으로 표시
            const leftEyeOpenForDisplay = false;
            const rightEyeOpenForDisplay = false;
            let leftEyeOpenForEvent = true; // 이벤트 발생 안 함
            let rightEyeOpenForEvent = true; // 이벤트 발생 안 함
            
            // UI 업데이트 - 좌우 교환 (MediaPipe는 카메라 관점)
            if (this.leftEyeEl) this.leftEyeEl.textContent = 'Closed';
            if (this.rightEyeEl) this.rightEyeEl.textContent = 'Closed';
            
            if (this.leftEyeStatusEl) {
                this.leftEyeStatusEl.textContent = '감김';
                this.leftEyeStatusEl.className = 'eye-status closed';
            }
            if (this.rightEyeStatusEl) {
                this.rightEyeStatusEl.textContent = '감김';
                this.rightEyeStatusEl.className = 'eye-status closed';
            }
            
            // 왼쪽눈 상태 콘솔 업데이트
            if (this.leftEyeStatusConsole) {
                this.leftEyeStatusConsole.textContent = '감김';
                this.leftEyeStatusConsole.style.color = '#ff4444';
            }
            
            // 오른쪽눈 상태 콘솔 업데이트
            if (this.rightEyeStatusConsole) {
                this.rightEyeStatusConsole.textContent = '감김';
                this.rightEyeStatusConsole.style.color = '#ff4444';
            }
            
            // 양쪽 눈의 임계값 콘솔 업데이트
            if (this.eyeRatioConsole) {
                const ratioText = `왼쪽: ${rightEyeRatio.toFixed(4)} | 오른쪽: ${leftEyeRatio.toFixed(4)}`;
                this.eyeRatioConsole.textContent = ratioText;
            }
            
            return; // 이벤트 발생하지 않음
        }
        
        // UI 표시용: 임계값 0.2 이하로 내려가면 즉시 감김으로 표시
        const leftEyeOpenForDisplay = !leftEyeBelowThreshold;
        const rightEyeOpenForDisplay = !rightEyeBelowThreshold;
        
        // 이벤트 발생용: 0.5초 이상 감김 상태가 유지되어야 이벤트 발생
        let leftEyeOpenForEvent = !leftEyeBelowThreshold;
        let rightEyeOpenForEvent = !rightEyeBelowThreshold;
        
        // 왼쪽 눈만 감김 (0.2 이하)
        if (leftEyeBelowThreshold && !rightEyeBelowThreshold) {
            if (this.leftEyeClosedStartTime === 0) {
                this.leftEyeClosedStartTime = currentTime;
            }
            
            const closedDuration = currentTime - this.leftEyeClosedStartTime;
            const timeSinceLastDetection = currentTime - this.lastLeftEyeDetectedTime;
            
            // 0.5초 이상 감김 상태 유지 + 쿨다운 시간(1초) 경과 시에만 이벤트 발생
            if (closedDuration < this.eyeClosedThreshold || timeSinceLastDetection < this.eyeDetectedCooldown) {
                leftEyeOpenForEvent = true; // 아직 열림으로 처리 (이벤트 발생 안 함)
            } else {
                // 감김으로 인식 (0.5초 이상 유지 + 쿨다운 경과) - 이벤트 발생 가능
                this.lastLeftEyeDetectedTime = currentTime;
                leftEyeOpenForEvent = false; // 감김으로 인식 (이벤트 발생 가능)
            }
            this.rightEyeClosedStartTime = 0; // 오른쪽 눈은 열려있으므로 리셋
        }
        // 오른쪽 눈만 감김 (0.2 이하)
        else if (!leftEyeBelowThreshold && rightEyeBelowThreshold) {
            if (this.rightEyeClosedStartTime === 0) {
                this.rightEyeClosedStartTime = currentTime;
            }
            
            const closedDuration = currentTime - this.rightEyeClosedStartTime;
            const timeSinceLastDetection = currentTime - this.lastRightEyeDetectedTime;
            
            // 0.5초 이상 감김 상태 유지 + 쿨다운 시간(1초) 경과 시에만 이벤트 발생
            if (closedDuration < this.eyeClosedThreshold || timeSinceLastDetection < this.eyeDetectedCooldown) {
                rightEyeOpenForEvent = true; // 아직 열림으로 처리 (이벤트 발생 안 함)
            } else {
                // 감김으로 인식 (0.5초 이상 유지 + 쿨다운 경과) - 이벤트 발생 가능
                this.lastRightEyeDetectedTime = currentTime;
                rightEyeOpenForEvent = false; // 감김으로 인식 (이벤트 발생 가능)
            }
            this.leftEyeClosedStartTime = 0; // 왼쪽 눈은 열려있으므로 리셋
        }
        // 양쪽 눈 모두 열림 (0.2 초과)
        else {
            this.leftEyeClosedStartTime = 0; // 리셋
            this.rightEyeClosedStartTime = 0; // 리셋
        }
        
        // UI 표시는 즉시 반영 (임계값 0.2 기준)
        // MediaPipe는 카메라 관점에서 보므로 좌우가 반대임 - UI 표시 시 좌우 교환
        if (this.leftEyeEl) this.leftEyeEl.textContent = rightEyeOpenForDisplay ? 'Open' : 'Closed';
        if (this.rightEyeEl) this.rightEyeEl.textContent = leftEyeOpenForDisplay ? 'Open' : 'Closed';
        
        // 눈 상태 패널 업데이트 (즉시 반영) - 좌우 교환
        if (this.leftEyeStatusEl) {
            this.leftEyeStatusEl.textContent = rightEyeOpenForDisplay ? '뜸' : '감김';
            this.leftEyeStatusEl.className = 'eye-status ' + (rightEyeOpenForDisplay ? 'open' : 'closed');
        }
        if (this.rightEyeStatusEl) {
            this.rightEyeStatusEl.textContent = leftEyeOpenForDisplay ? '뜸' : '감김';
            this.rightEyeStatusEl.className = 'eye-status ' + (leftEyeOpenForDisplay ? 'open' : 'closed');
        }
        
        // 왼쪽눈 상태 콘솔 업데이트
        if (this.leftEyeStatusConsole) {
            this.leftEyeStatusConsole.textContent = rightEyeOpenForDisplay ? '뜸' : '감김';
            this.leftEyeStatusConsole.style.color = rightEyeOpenForDisplay ? '#00ff00' : '#ff4444';
        }
        
        // 오른쪽눈 상태 콘솔 업데이트
        if (this.rightEyeStatusConsole) {
            this.rightEyeStatusConsole.textContent = leftEyeOpenForDisplay ? '뜸' : '감김';
            this.rightEyeStatusConsole.style.color = leftEyeOpenForDisplay ? '#00ff00' : '#ff4444';
        }
        
        // 양쪽 눈의 임계값 콘솔 업데이트
        if (this.eyeRatioConsole) {
            const ratioText = `왼쪽: ${rightEyeResult.ratio.toFixed(4)} | 오른쪽: ${leftEyeResult.ratio.toFixed(4)}`;
            this.eyeRatioConsole.textContent = ratioText;
        }
        
        // 캘리브레이션이 끝난 이후의 화면에서만 윙크 이벤트 처리
        // MediaPipe는 카메라 관점에서 보므로 좌우가 반대임
        // 이벤트 발생은 0.5초 이상 감김 상태가 유지되어야 함
        if (this.camera && this.isTracking && !this.isCalibrating) {
            // 양쪽 눈이 모두 감기면 이벤트 발생하지 않음 (이벤트용 상태 사용)
            const bothEyesClosed = !leftEyeOpenForEvent && !rightEyeOpenForEvent;
            
            if (!bothEyesClosed) {
                // 사용자 입장에서 왼쪽 눈만 감기면 백엔드로 화면 번호 전송
                // MediaPipe의 rightEye = 사용자 입장에서 왼쪽 눈
                if (!rightEyeOpenForEvent && leftEyeOpenForEvent) {
                    this.detectWink(rightEyeOpenForEvent, true, true); // isLeft=true, shouldSendToBackend=true
                }
                // 사용자 입장에서 오른쪽 눈만 감기면 더미 이벤트 (아무것도 안 함)
                // MediaPipe의 leftEye = 사용자 입장에서 오른쪽 눈
                else if (!leftEyeOpenForEvent && rightEyeOpenForEvent) {
                    this.detectWink(leftEyeOpenForEvent, false, false); // isLeft=false, 더미 이벤트
                }
            }
        }
    }
    
    // 윙크 감지 (왼쪽 또는 오른쪽 눈만 감는 경우)
    detectWink(eyeOpen, isLeft, shouldSendToBackend = false) {
        const currentTime = Date.now();
        const lastEyeState = isLeft ? this.lastLeftEyeState : this.lastRightEyeState;
        const lastBlinkTime = isLeft ? this.lastLeftBlinkTime : this.lastRightBlinkTime;
        
        // 눈 상태 변화 감지 (열림 -> 감음)
        // 연속적으로 감은 상태도 감지하도록 개선
        if (!eyeOpen) {
            // 쿨다운 시간 확인
            if (currentTime - lastBlinkTime > this.blinkCooldown) {
                // 이전에 열려있었거나, 연속으로 감은 상태에서도 감지
                if (lastEyeState || currentTime - lastBlinkTime > 500) {
                    // 왼쪽 눈 윙크 시 백엔드로 화면 번호 전송
                    if (shouldSendToBackend && this.gazeHistory.length > 0) {
                        const recentGaze = this.gazeHistory[this.gazeHistory.length - 1];
                        const screenNumber = this.getScreenNumber(recentGaze.x);
                        this.sendScreenNumberToBackend(screenNumber);
                    }
                    // 오른쪽 눈 윙크는 더미 이벤트 (아무것도 하지 않음)
                    
                    // 해당 눈의 깜박임 시간 업데이트
                    if (isLeft) {
                        this.lastLeftBlinkTime = currentTime;
                    } else {
                        this.lastRightBlinkTime = currentTime;
                    }
                }
            }
        }
        
        // 해당 눈의 상태 업데이트
        if (isLeft) {
            this.lastLeftEyeState = eyeOpen;
        } else {
            this.lastRightEyeState = eyeOpen;
        }
    }
    
    // 백엔드로 화면 번호 전송
    async sendScreenNumberToBackend(screenNumber) {
        const timestamp = Date.now();
        const sendData = {
            screenNumber: screenNumber,
            timestamp: timestamp
        };
        
        // 콘솔창에 전송 정보 출력
        if (this.consoleEl) {
            const time = new Date(timestamp).toLocaleTimeString();
            const consoleText = `[${time}] 백엔드 전송: 화면 번호 ${screenNumber}\n${this.consoleEl.textContent}`;
            this.consoleEl.textContent = consoleText;
            
            // 스크롤을 맨 위로 유지
            this.consoleEl.scrollTop = 0;
        }
        
        try {
            // 백엔드 API 엔드포인트 (필요에 따라 수정)
            const backendUrl = 'http://localhost:8000/api/gaze/screen'; // 예시 URL
            
            const response = await fetch(backendUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(sendData)
            });
            
            if (!response.ok) {
                const errorMsg = `백엔드 전송 실패: ${response.statusText}`;
                console.error(errorMsg);
                if (this.consoleEl) {
                    const errorText = `[에러] ${errorMsg}\n${this.consoleEl.textContent}`;
                    this.consoleEl.textContent = errorText;
                    this.consoleEl.scrollTop = 0;
                }
            } else {
                // 성공 메시지도 콘솔에 표시
                if (this.consoleEl) {
                    const successText = `[성공] 백엔드 전송 완료\n${this.consoleEl.textContent}`;
                    this.consoleEl.textContent = successText;
                    this.consoleEl.scrollTop = 0;
                }
            }
        } catch (error) {
            const errorMsg = `백엔드 전송 오류: ${error.message}`;
            console.error(errorMsg);
            if (this.consoleEl) {
                const errorText = `[에러] ${errorMsg}\n${this.consoleEl.textContent}`;
                this.consoleEl.textContent = errorText;
                this.consoleEl.scrollTop = 0;
            }
        }
    }
    
    // 화면 클릭 이벤트 발생
    clickScreen(screenNumber) {
        const screenWidth = window.innerWidth;
        const sectionWidth = screenWidth / 4;
        const screenHeight = window.innerHeight;
        
        // 해당 화면의 중앙 좌표 계산
        const clickX = (screenNumber - 1) * sectionWidth + sectionWidth / 2;
        const clickY = screenHeight / 2;
        
        // 해당 위치의 요소 찾기
        const element = document.elementFromPoint(clickX, clickY);
        
        if (element) {
            // 클릭 이벤트 생성 및 발생
            const clickEvent = new MouseEvent('click', {
                view: window,
                bubbles: true,
                cancelable: true,
                clientX: clickX,
                clientY: clickY
            });
            
            element.dispatchEvent(clickEvent);
            
            // 시각적 피드백 (클릭 위치에 잠깐 표시)
            this.showClickFeedback(clickX, clickY);
        }
    }
    
    // 클릭 피드백 표시
    showClickFeedback(x, y) {
        // 기존 피드백 제거
        const existingFeedback = document.getElementById('click-feedback');
        if (existingFeedback) {
            existingFeedback.remove();
        }
        
        const feedback = document.createElement('div');
        feedback.id = 'click-feedback';
        feedback.style.cssText = `
            position: fixed;
            left: ${x}px;
            top: ${y}px;
            transform: translate(-50%, -50%);
            width: 30px;
            height: 30px;
            border: 3px solid #ff9f22d2;
            border-radius: 50%;
            background: rgba(255, 159, 34, 0.3);
            z-index: 2001;
            pointer-events: none;
            animation: clickPulse 0.5s ease-out;
        `;
        
        // 애니메이션 추가
        const style = document.createElement('style');
        style.textContent = `
            @keyframes clickPulse {
                0% { transform: translate(-50%, -50%) scale(0); opacity: 1; }
                100% { transform: translate(-50%, -50%) scale(2); opacity: 0; }
            }
        `;
        if (!document.getElementById('click-feedback-animation-style')) {
            style.id = 'click-feedback-animation-style';
            document.head.appendChild(style);
        }
        
        document.body.appendChild(feedback);
        
        // 0.5초 후 제거
        setTimeout(() => {
            if (feedback.parentNode) {
                feedback.parentNode.removeChild(feedback);
            }
        }, 500);
    }
    
    // 화면 중앙에 윙크 메시지 표시 (1초)
    showWinkMessage(message) {
        // 기존 표시 제거
        const existingDisplay = document.getElementById('wink-message-display');
        if (existingDisplay) {
            existingDisplay.remove();
        }
        
        // 윙크 메시지 표시 요소 생성
        const display = document.createElement('div');
        display.id = 'wink-message-display';
        display.textContent = message;
        display.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            font-size: 80px;
            font-weight: bold;
            color: rgba(255, 159, 34, 0.95);
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            z-index: 2000;
            text-shadow: 0 0 30px rgba(255, 159, 34, 0.8);
            pointer-events: none;
            animation: fadeInOut 1s ease-in-out;
        `;
        
        // 애니메이션 추가
        const style = document.createElement('style');
        style.textContent = `
            @keyframes fadeInOut {
                0% { opacity: 0; transform: translate(-50%, -50%) scale(0.5); }
                20% { opacity: 1; transform: translate(-50%, -50%) scale(1); }
                80% { opacity: 1; transform: translate(-50%, -50%) scale(1); }
                100% { opacity: 0; transform: translate(-50%, -50%) scale(0.5); }
            }
        `;
        if (!document.getElementById('wink-message-animation-style')) {
            style.id = 'wink-message-animation-style';
            document.head.appendChild(style);
        }
        
        document.body.appendChild(display);
        
        // 1초 후 제거
        setTimeout(() => {
            if (display.parentNode) {
                display.parentNode.removeChild(display);
            }
        }, 1000);
    }
    
    getEyeOpenRatio(landmarks, eyeIndices) {
        // 윗눈꺼풀과 아랫눈꺼풀 사이의 거리를 직접 측정
        // MediaPipe Face Mesh 눈 랜드마크 인덱스 사용
        // 상단 (윗눈꺼풀): 인덱스 159 (왼쪽), 386 (오른쪽)
        // 하단 (아랫눈꺼풀): 인덱스 145 (왼쪽), 374 (오른쪽)
        
        // 눈의 상하좌우 포인트 찾기
        let minY = 1, maxY = 0, minX = 1, maxX = 0;
        
        for (let i = 0; i < eyeIndices.length; i++) {
            const point = landmarks[eyeIndices[i]];
            minY = Math.min(minY, point.y);
            maxY = Math.max(maxY, point.y);
            minX = Math.min(minX, point.x);
            maxX = Math.max(maxX, point.x);
        }
        
        const verticalDistance = maxY - minY;
        const horizontalDistance = maxX - minX;
        
        // 0으로 나누기 방지
        if (horizontalDistance === 0) {
            return { isOpen: false, ratio: 0 };
        }
        
        // 윗눈꺼풀과 아랫눈꺼풀 사이의 거리 비율 계산
        // 세로 거리를 가로 거리로 나눈 비율
        const ratio = verticalDistance / horizontalDistance;
        
        // 눈의 가로 길이에 대한 세로 길이 비율
        // 눈이 열렸을 때는 보통 0.2~0.3, 감았을 때는 0.01~0.2
        // 임계값을 0.2로 설정하여 눈 감김 기준 조정
        // 윗눈꺼풀과 아랫눈꺼풀이 가까워지면 (비율이 작아지면) 감았다고 인식
        // ratio가 0.2보다 크면 열림, 작거나 같으면 감음
        const isOpen = ratio > 0.2;
        
        return { isOpen, ratio };
    }
    
    isEyeOpen(landmarks, eyeIndices) {
        return this.getEyeOpenRatio(landmarks, eyeIndices).isOpen;
    }
    
    calculateHeadPose(landmarks) {
        // 주요 얼굴 포인트들을 사용해 머리 각도 계산
        const nose = landmarks[1];
        const leftEye = landmarks[33];
        const rightEye = landmarks[362];
        const chin = landmarks[175];
        
        // Yaw (좌우 회전)
        const eyeCenter = {
            x: (leftEye.x + rightEye.x) / 2,
            y: (leftEye.y + rightEye.y) / 2
        };
        
        const yaw = Math.atan2(nose.x - eyeCenter.x, 0.5 - eyeCenter.x) * (180 / Math.PI);
        
        // Pitch (상하 회전)
        const pitch = Math.atan2(nose.y - eyeCenter.y, chin.y - eyeCenter.y) * (180 / Math.PI);
        
        // Roll (기울기)
        const roll = Math.atan2(rightEye.y - leftEye.y, rightEye.x - leftEye.x) * (180 / Math.PI);
        
        if (this.headPitchEl) this.headPitchEl.textContent = `${pitch.toFixed(1)}°`;
        if (this.headYawEl) this.headYawEl.textContent = `${yaw.toFixed(1)}°`;
        if (this.headRollEl) this.headRollEl.textContent = `${roll.toFixed(1)}°`;
    }
    
    calculateGaze(landmarks) {
        if (this.calibrationData.length < 9) return null;
        
        // 홍채 중심점 계산
        const leftIrisCenter = this.getIrisCenter(landmarks, this.leftIrisIndices);
        const rightIrisCenter = this.getIrisCenter(landmarks, this.rightIrisIndices);
        
        if (!leftIrisCenter || !rightIrisCenter) return null;
        
        // 수평 움직임을 위한 눈 경계
        const leftEyeBounds = this.getEyeBounds(landmarks, this.leftEyeIndices);
        const rightEyeBounds = this.getEyeBounds(landmarks, this.rightEyeIndices);
        
        // 수직 움직임을 위한 개선된 눈 경계
        const leftVerticalBounds = this.getEyeVerticalBounds(landmarks, true);
        const rightVerticalBounds = this.getEyeVerticalBounds(landmarks, false);
        
        // 머리 각도 정보 가져오기 (상하 보정용)
        const headPitch = this.getHeadPitch(landmarks);
        
        // 정규화된 시선 벡터 계산 - X와 Y를 다르게 처리
        const leftGazeVector = {
            x: (leftIrisCenter.x - leftEyeBounds.centerX) / leftEyeBounds.width,
            y: (leftIrisCenter.y - leftVerticalBounds.center) / leftVerticalBounds.height
        };
        
        const rightGazeVector = {
            x: (rightIrisCenter.x - rightEyeBounds.centerX) / rightEyeBounds.width,
            y: (rightIrisCenter.y - rightVerticalBounds.center) / rightVerticalBounds.height
        };
        
        // 평균 시선 벡터
        let avgGazeVector = {
            x: (leftGazeVector.x + rightGazeVector.x) / 2,
            y: (leftGazeVector.y + rightGazeVector.y) / 2
        };
        
        // 상하 움직임 보정 제거 (원상복구)
        
        // 캘리브레이션 데이터를 사용해 화면 좌표로 변환
        const screenPoint = this.mapGazeToScreen(avgGazeVector);
        
        return screenPoint;
    }
    
    getIrisCenter(landmarks, irisIndices) {
        if (irisIndices.length === 0) return null;
        
        let sumX = 0, sumY = 0;
        for (const index of irisIndices) {
            sumX += landmarks[index].x;
            sumY += landmarks[index].y;
        }
        
        return {
            x: sumX / irisIndices.length,
            y: sumY / irisIndices.length
        };
    }
    
    getEyeCenter(landmarks, eyeIndices) {
        let sumX = 0, sumY = 0;
        for (const index of eyeIndices) {
            sumX += landmarks[index].x;
            sumY += landmarks[index].y;
        }
        
        return {
            x: sumX / eyeIndices.length,
            y: sumY / eyeIndices.length
        };
    }
    
    getEyeBounds(landmarks, eyeIndices) {
        let minX = 1, maxX = 0, minY = 1, maxY = 0;
        
        for (const index of eyeIndices) {
            const point = landmarks[index];
            minX = Math.min(minX, point.x);
            maxX = Math.max(maxX, point.x);
            minY = Math.min(minY, point.y);
            maxY = Math.max(maxY, point.y);
        }
        
        return {
            centerX: (minX + maxX) / 2,
            centerY: (minY + maxY) / 2,
            width: maxX - minX,
            height: Math.max(maxY - minY, 0.01) // 최소값 보장으로 0으로 나누기 방지
        };
    }
    
    // 상하 움직임을 위한 개선된 눈 경계 계산
    getEyeVerticalBounds(landmarks, isLeft) {
        const verticalIndices = isLeft ? this.leftEyeVertical : this.rightEyeVertical;
        
        // 여러 포인트의 평균으로 더 정확한 상하 경계 계산
        let topSum = 0, bottomSum = 0;
        const topPoints = [verticalIndices[0], verticalIndices[2]]; // 위쪽 포인트들
        const bottomPoints = [verticalIndices[1], verticalIndices[3]]; // 아래쪽 포인트들
        
        for (const idx of topPoints) {
            topSum += landmarks[idx].y;
        }
        for (const idx of bottomPoints) {
            bottomSum += landmarks[idx].y;
        }
        
        const avgTop = topSum / topPoints.length;
        const avgBottom = bottomSum / bottomPoints.length;
        
        return {
            top: avgTop,
            bottom: avgBottom,
            center: (avgTop + avgBottom) / 2,
            height: Math.max(Math.abs(avgBottom - avgTop), 0.015) // 최소값 증가
        };
    }
    
    // 머리 각도 계산 (상하 보정용)
    getHeadPitch(landmarks) {
        const nose = landmarks[1];
        const leftEye = landmarks[33];
        const rightEye = landmarks[362];
        const chin = landmarks[175];
        
        const eyeCenter = {
            x: (leftEye.x + rightEye.x) / 2,
            y: (leftEye.y + rightEye.y) / 2
        };
        
        // Pitch (상하 회전) 계산
        const pitch = Math.atan2(nose.y - eyeCenter.y, chin.y - eyeCenter.y) * (180 / Math.PI);
        return pitch;
    }
    
    // 상하 시선 강화 함수
    enhanceVerticalGaze(originalY, headPitch, landmarks) {
        // 눈꺼풀 개방도 계산
        const leftEyeOpenness = this.getEyeOpenness(landmarks, true);
        const rightEyeOpenness = this.getEyeOpenness(landmarks, false);
        const avgEyeOpenness = (leftEyeOpenness + rightEyeOpenness) / 2;
        
        let enhancedY = originalY;
        
        // 1. 머리 각도 기반 보정
        if (headPitch > 5) { // 머리를 아래로 숙였을 때
            enhancedY += 0.3; // 아래쪽 시선으로 강제 보정
        } else if (headPitch < -5) { // 머리를 위로 들었을 때
            enhancedY -= 0.2; // 위쪽 시선으로 보정
        }
        
        // 2. 눈꺼풀 개방도 기반 보정
        if (avgEyeOpenness < 0.15) { // 눈을 많이 감았을 때 (아래를 보는 경우가 많음)
            enhancedY += 0.4; // 아래쪽으로 강제 이동
        } else if (avgEyeOpenness > 0.25) { // 눈을 크게 떴을 때 (위를 보는 경우가 많음)
            enhancedY -= 0.2; // 위쪽으로 이동
        }
        
        // 3. 원본 시선이 아래쪽이면 더욱 강화
        if (originalY > 0.05) {
            enhancedY = originalY * 2.5; // 아래쪽 시선을 2.5배 증폭
        }
        
        // 4. 원본 시선이 위쪽이면 적당히 증폭
        if (originalY < -0.05) {
            enhancedY = originalY * 1.8; // 위쪽 시선을 1.8배 증폭
        }
        
        return enhancedY;
    }
    
    // 눈꺼풀 개방도 계산
    getEyeOpenness(landmarks, isLeft) {
        const verticalIndices = isLeft ? this.leftEyeVertical : this.rightEyeVertical;
        const topPoint = landmarks[verticalIndices[0]];
        const bottomPoint = landmarks[verticalIndices[1]];
        
        // 눈의 세로 거리 계산
        const verticalDistance = Math.abs(bottomPoint.y - topPoint.y);
        
        return verticalDistance;
    }
    
    mapGazeToScreen(gazeVector) {
        const screenWidth = window.innerWidth;
        const screenHeight = window.innerHeight;
        
        // 좌우반전 적용 및 움직임 폭 조정 (원상복구)
        // X축: 좌우반전 + 적당한 스케일링
        const x = screenWidth * (0.5 - gazeVector.x * 8); // 8배로 조정
        
        // Y축: 상하 움직임 (원상복구)
        const y = screenHeight * (0.5 + gazeVector.y * 15); // 시작점 0.5, 15배 확대
        
        return {
            x: Math.max(0, Math.min(screenWidth, x)),
            y: Math.max(0, Math.min(screenHeight, y))
        };
    }
    
    updateGazeDisplay(gazePoint) {
        // 히스토리 기반 스무딩
        this.gazeHistory.push(gazePoint);
        if (this.gazeHistory.length > this.maxHistoryLength) {
            this.gazeHistory.shift();
        }
        
        // 평균 계산
        const avgX = this.gazeHistory.reduce((sum, p) => sum + p.x, 0) / this.gazeHistory.length;
        const avgY = this.gazeHistory.reduce((sum, p) => sum + p.y, 0) / this.gazeHistory.length;
        
        if (this.gazeXEl) this.gazeXEl.textContent = Math.round(avgX);
        if (this.gazeYEl) this.gazeYEl.textContent = Math.round(avgY);
        
        if (this.showGaze) {
            this.gazePoint.style.left = `${avgX}px`;
            this.gazePoint.style.top = `${avgY}px`;
        }
        
        // 캘리브레이션 완료 후 현재 시선 위치 화면 하이라이트
        if (this.isTracking && !this.isCalibrating) {
            const screenNumber = this.getScreenNumber(avgX);
            this.highlightCurrentScreen(screenNumber);
        }
    }
    
    // 시선 위치 기반 화면 번호 계산 (왼쪽부터 1, 2, 3, 4)
    getScreenNumber(x) {
        const screenWidth = window.innerWidth;
        const sectionWidth = screenWidth / 4;
        
        if (x < sectionWidth) return 1;
        else if (x < sectionWidth * 2) return 2;
        else if (x < sectionWidth * 3) return 3;
        else return 4;
    }
    
    // 현재 시선 위치 화면 하이라이트
    highlightCurrentScreen(screenNumber) {
        // 모든 섹션의 하이라이트 제거
        for (let i = 1; i <= 4; i++) {
            const section = document.getElementById(`section-${i}`);
            if (section) {
                section.style.background = 'transparent';
                section.style.transition = 'background 0.3s';
            }
        }
        
        // 현재 시선 위치 화면 하이라이트
        const section = document.getElementById(`section-${screenNumber}`);
        if (section) {
            section.style.background = 'rgba(0, 255, 255, 0.2)';
        }
    }
    
    startCalibration() {
        // Start Camera 버튼에서 이미 전체화면 모드로 전환됨
        // 기존 캘리브레이션 데이터 초기화 (재캘리브레이션 가능)
        this.calibrationData = [];
        this.currentCalibrationIndex = 0;
        this.validationMode = false;
        this.validationResults = [];
        this.isTracking = false;
        
        // 기존 구분선 제거 후 다시 표시
        const dividedOverlay = document.getElementById('divided-screen-overlay');
        if (dividedOverlay) {
            dividedOverlay.remove();
        }
        
        this.isCalibrating = true;
        this.calibrationData = [];
        this.currentCalibrationIndex = 0;
        
        // "얼굴을 움직이지 마세요!" 버튼 표시
        if (this.faceGuideBtn) {
            this.faceGuideBtn.style.display = 'inline-block';
        }
        
        // 캘리브레이션 중 비디오 전체화면 모드
        if (this.video) {
            this.video.classList.add('fullscreen-calibration');
        }
        if (this.canvas) {
            this.canvas.classList.add('fullscreen-calibration');
        }
        
        // 캘리브레이션 시작 시 구분선 표시
        this.showDividedScreen();
        
        // 3행 4열 12점 캘리브레이션
        this.calibrationPoints = [
            // 상단 행 (4점)
            { x: 0.2, y: 0.15 }, { x: 0.4, y: 0.15 }, { x: 0.6, y: 0.15 }, { x: 0.8, y: 0.15 },
            // 중간 행 (4점)
            { x: 0.2, y: 0.5 }, { x: 0.4, y: 0.5 }, { x: 0.6, y: 0.5 }, { x: 0.8, y: 0.5 },
            // 하단 행 (4점)
            { x: 0.2, y: 0.85 }, { x: 0.4, y: 0.85 }, { x: 0.6, y: 0.85 }, { x: 0.8, y: 0.85 }
        ];
        
        // 구분선은 이미 표시되어 있음 (페이지 로드 시 표시됨)
        
        this.updateStatus('고급 캘리브레이션 시작 - 지시사항을 따라주세요');
        this.showCalibrationPoint();
    }
    
    showCalibrationPoint() {
        if (this.currentCalibrationIndex >= this.calibrationPoints.length) {
            this.finishCalibration();
            return;
        }
        
        const point = this.calibrationPoints[this.currentCalibrationIndex];
        const x = point.x * window.innerWidth;
        const y = point.y * window.innerHeight;
        
        // 기존 점과 지시사항 제거
        this.clearCalibrationElements();
        
        // 캘리브레이션 점 생성
        const calibrationDot = document.createElement('div');
        calibrationDot.className = 'calibration-point';
        calibrationDot.id = 'current-calibration-point';
        calibrationDot.style.left = `${x}px`;
        calibrationDot.style.top = `${y}px`;
        
        document.body.appendChild(calibrationDot);
        
        // 2.5초 후 데이터 수집 (마지막에 한 번만)
        setTimeout(() => {
            this.collectCalibrationDataAtPoint();
        }, 2500);
        
        // 3초 후 다음 포인트로
        setTimeout(() => {
            this.currentCalibrationIndex++;
            this.showCalibrationPoint();
        }, 3000);
    }
    
    collectCalibrationDataAtPoint() {
        if (this.lastLandmarks) {
            this.collectCalibrationData(this.lastLandmarks);
        }
    }
    
    collectCalibrationData(landmarks) {
        const leftIrisCenter = this.getIrisCenter(landmarks, this.leftIrisIndices);
        const rightIrisCenter = this.getIrisCenter(landmarks, this.rightIrisIndices);
        
        // 첫 번째 점도 포함 (currentCalibrationIndex >= 0)
        if (leftIrisCenter && rightIrisCenter && this.currentCalibrationIndex >= 0) {
            const point = this.calibrationPoints[this.currentCalibrationIndex];
            
            // 수평 및 수직 눈 경계 정보 저장
            const leftEyeBounds = this.getEyeBounds(landmarks, this.leftEyeIndices);
            const rightEyeBounds = this.getEyeBounds(landmarks, this.rightEyeIndices);
            const leftVerticalBounds = this.getEyeVerticalBounds(landmarks, true);
            const rightVerticalBounds = this.getEyeVerticalBounds(landmarks, false);
            
            // 해당 인덱스의 데이터가 이미 있으면 덮어쓰고, 없으면 추가
            const dataIndex = this.currentCalibrationIndex;
            const calibrationData = {
                screenPoint: point,
                leftIris: leftIrisCenter,
                rightIris: rightIrisCenter,
                leftEyeBounds: leftEyeBounds,
                rightEyeBounds: rightEyeBounds,
                leftVerticalBounds: leftVerticalBounds,
                rightVerticalBounds: rightVerticalBounds
            };
            
            if (this.calibrationData[dataIndex]) {
                this.calibrationData[dataIndex] = calibrationData;
            } else {
                this.calibrationData.push(calibrationData);
            }
        }
    }
    
    clearCalibrationElements() {
        const existingDot = document.getElementById('current-calibration-point');
        
        if (existingDot) document.body.removeChild(existingDot);
    }
    
    finishCalibration() {
        this.isCalibrating = false;
        this.validationMode = false;
        this.isTracking = true;
        
        // "얼굴을 움직이지 마세요!" 버튼 숨기기
        if (this.faceGuideBtn) {
            this.faceGuideBtn.style.display = 'none';
        }
        
        this.clearCalibrationElements();
        
        // 기본 정확도 설정
        const accuracy = 85;
        this.updateAccuracy(accuracy);
        this.updateStatus(`캘리브레이션 완료 - 정확도: ${accuracy}% - 시선추적 활성화`);
        
        // 구분선은 이미 표시되어 있음 (캘리브레이션 시작 시 표시됨)
        
        // 캘리브레이션 버튼 다시 활성화 (재캘리브레이션 가능)
        if (this.calibrateBtn) {
            this.calibrateBtn.disabled = false;
        }
        
        // 시선 추적 버튼 표시
        if (this.toggleGazeBtn) {
            this.toggleGazeBtn.disabled = false;
            this.toggleGazeBtn.style.display = 'inline-block';
        }
    }
    
    // 화면을 가로로 4분할하는 구분선 표시
    showDividedScreen() {
        // 기존 구분선이 있으면 제거
        const existingOverlay = document.getElementById('divided-screen-overlay');
        if (existingOverlay) {
            existingOverlay.remove();
        }
        
        const overlay = document.createElement('div');
        overlay.id = 'divided-screen-overlay';
        overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            pointer-events: none;
            z-index: 100;
            margin: 0;
            padding: 0;
        `;
        
        // 실제 화면 너비 계산 (스크롤바 제외)
        const screenWidth = document.documentElement.clientWidth || window.innerWidth;
        const sectionWidth = screenWidth / 4;
        
        // 4개의 구역 생성
        for (let i = 0; i < 4; i++) {
            const section = document.createElement('div');
            section.id = `section-${i + 1}`;
            const leftPosition = i * sectionWidth;
            section.style.cssText = `
                position: absolute;
                top: 0;
                left: ${leftPosition}px;
                width: ${sectionWidth}px;
                height: 100vh;
                border-right: ${i < 3 ? '2px solid rgba(255, 255, 255, 0.5)' : 'none'};
                box-sizing: border-box;
                margin: 0;
                padding: 0;
            `;
            
            // 구역 번호 표시
            const numberLabel = document.createElement('div');
            numberLabel.textContent = i + 1;
            numberLabel.style.cssText = `
                position: absolute;
                top: 60px;
                left: 50%;
                transform: translateX(-50%);
                font-size: 48px;
                font-weight: bold;
                color: rgba(255, 255, 255, 0.3);
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            `;
            
            section.appendChild(numberLabel);
            overlay.appendChild(section);
        }
        
        document.body.appendChild(overlay);
    }
    
    // 얼굴 고정 가이드 영역 표시 (세로로 긴 타원형 - 사람 머리 모양)
    showFaceGuideArea() {
        // 기존 가이드 영역이 있으면 제거
        const existingGuide = document.getElementById('face-guide-area');
        if (existingGuide) {
            existingGuide.remove();
        }
        
        const guideArea = document.createElement('div');
        guideArea.id = 'face-guide-area';
        guideArea.style.cssText = `
            position: fixed;
            top: 45%;
            left: 50%;
            transform: translate(-50%, -50%);
            width: 380px;
            height: 500px;
            border: 3px dashed rgba(255, 255, 255, 0.6);
            border-radius: 50%;
            pointer-events: none;
            z-index: 99;
            box-shadow: 0 0 30px rgba(255, 255, 255, 0.3);
        `;
        
        // 안내 텍스트
        const guideText = document.createElement('div');
        guideText.textContent = '얼굴을 움직이지마세요!';
        guideText.style.cssText = `
            position: fixed;
            top: calc(45% + 260px);
            left: 50%;
            transform: translateX(-50%);
            color: rgba(255, 255, 255, 0.8);
            font-size: 18px;
            font-weight: bold;
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            text-shadow: 0 2px 10px rgba(0, 0, 0, 0.5);
            pointer-events: none;
            z-index: 99;
            white-space: nowrap;
        `;
        
        document.body.appendChild(guideArea);
        document.body.appendChild(guideText);
    }
    
    onFullscreenChange() {
        this.isFullscreen = !!document.fullscreenElement;
        
        if (!this.isFullscreen) {
            this.updateStatus('전체화면 모드 종료됨');
        }
    }
    
    updateAccuracy(accuracy) {
        this.accuracyFillEl.style.width = `${accuracy}%`;
        this.accuracyTextEl.textContent = `${accuracy}%`;
    }
    
    toggleGazeDisplay() {
        this.showGaze = !this.showGaze;
        this.gazePoint.style.display = this.showGaze ? 'block' : 'none';
        this.toggleGazeBtn.textContent = this.showGaze ? '시선 표시 끄기' : '시선 표시 켜기';
    }
    
    reset() {
        // 캘리브레이션만 초기화
        this.isCalibrating = false;
        this.calibrationData = [];
        this.currentCalibrationIndex = 0;
        this.validationMode = false;
        this.validationResults = [];
        this.isTracking = false;
        
        // 캘리브레이션 관련 UI 요소 제거
        this.clearCalibrationElements();
        
        // 구분선 제거
        const dividedOverlay = document.getElementById('divided-screen-overlay');
        if (dividedOverlay) {
            dividedOverlay.remove();
        }
        
        // 정확도 초기화
        this.updateAccuracy(0);
        this.updateStatus('캘리브레이션이 초기화되었습니다. 다시 캘리브레이션을 시작하세요.');
        
        // 캘리브레이션 버튼 활성화
        if (this.calibrateBtn) {
            this.calibrateBtn.disabled = false;
        }
    }
    
    updateStatus(message) {
        // statusEl이 없어도 에러가 발생하지 않도록 처리
        // 정보 패널이 제거되어 statusEl이 null일 수 있음
        if (this.statusEl) {
        this.statusEl.textContent = message;
        } else {
            // 디버깅용 콘솔 출력 (선택사항)
            console.log('Status:', message);
        }
    }
    
    updateAccuracy(accuracy) {
        if (this.accuracyFillEl) this.accuracyFillEl.style.width = `${accuracy}%`;
        if (this.accuracyTextEl) this.accuracyTextEl.textContent = `${accuracy}%`;
    }
}

// 페이지 로드 시 초기화
document.addEventListener('DOMContentLoaded', () => {
    new GazeTracker();
});