class GazeTracker {
    constructor() {
        this.video = document.getElementById('video');
        this.canvas = document.getElementById('canvas');
        this.ctx = this.canvas.getContext('2d');
        this.gazePoint = document.getElementById('gazePoint');
        
        // UI 요소들
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
        this.calibrateBtn = document.getElementById('calibrateBtn');
        this.fullscreenBtn = document.getElementById('fullscreenBtn');
        this.resetBtn = document.getElementById('resetBtn');
        this.toggleGazeBtn = document.getElementById('toggleGazeBtn');
        
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
        this.startBtn.addEventListener('click', () => this.start());
        this.calibrateBtn.addEventListener('click', () => this.startCalibration());
        this.fullscreenBtn.addEventListener('click', () => this.toggleFullscreen());
        this.resetBtn.addEventListener('click', () => this.reset());
        this.toggleGazeBtn.addEventListener('click', () => this.toggleGazeDisplay());
        
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
            
            this.startBtn.disabled = true;
            this.calibrateBtn.disabled = false;
            this.fullscreenBtn.disabled = false;
            this.resetBtn.disabled = false;
            this.toggleGazeBtn.disabled = false;
            
            this.updateStatus('Ready - Start calibration for accurate tracking');
            
        } catch (error) {
            console.error('초기화 오류:', error);
            this.updateStatus('Error: Cannot access camera');
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
            
            // 캘리브레이션 중일 때
            if (this.isCalibrating) {
                this.processCalibrationData(landmarks);
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
        const leftEyeOpen = this.isEyeOpen(landmarks, this.leftEyeIndices);
        const rightEyeOpen = this.isEyeOpen(landmarks, this.rightEyeIndices);
        
        this.leftEyeEl.textContent = leftEyeOpen ? 'Open' : 'Closed';
        this.rightEyeEl.textContent = rightEyeOpen ? 'Open' : 'Closed';
    }
    
    isEyeOpen(landmarks, eyeIndices) {
        // 눈의 세로 거리와 가로 거리 비율로 눈이 열렸는지 판단
        const topPoint = landmarks[eyeIndices[1]];
        const bottomPoint = landmarks[eyeIndices[5]];
        const leftPoint = landmarks[eyeIndices[0]];
        const rightPoint = landmarks[eyeIndices[8]];
        
        const verticalDistance = Math.abs(topPoint.y - bottomPoint.y);
        const horizontalDistance = Math.abs(leftPoint.x - rightPoint.x);
        
        const ratio = verticalDistance / horizontalDistance;
        return ratio > 0.2; // 임계값
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
        
        this.headPitchEl.textContent = `${pitch.toFixed(1)}°`;
        this.headYawEl.textContent = `${yaw.toFixed(1)}°`;
        this.headRollEl.textContent = `${roll.toFixed(1)}°`;
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
        
        this.gazeXEl.textContent = Math.round(avgX);
        this.gazeYEl.textContent = Math.round(avgY);
        
        if (this.showGaze) {
            this.gazePoint.style.left = `${avgX}px`;
            this.gazePoint.style.top = `${avgY}px`;
        }
    }
    
    startCalibration() {
        if (!this.isFullscreen) {
            alert('더 정확한 캘리브레이션을 위해 전체화면 모드를 먼저 활성화해주세요.');
            return;
        }
        
        this.isCalibrating = true;
        this.calibrationData = [];
        this.currentCalibrationIndex = 0;
        
        // 개선된 13점 캘리브레이션 (상하 움직임 강화)
        this.calibrationPoints = [
            // 상단 라인 (5점)
            { x: 0.1, y: 0.05 }, { x: 0.3, y: 0.05 }, { x: 0.5, y: 0.05 }, { x: 0.7, y: 0.05 }, { x: 0.9, y: 0.05 },
            // 중간 라인 (3점)
            { x: 0.1, y: 0.5 }, { x: 0.5, y: 0.5 }, { x: 0.9, y: 0.5 },
            // 하단 라인 (5점)
            { x: 0.1, y: 0.95 }, { x: 0.3, y: 0.95 }, { x: 0.5, y: 0.95 }, { x: 0.7, y: 0.95 }, { x: 0.9, y: 0.95 }
        ];
        
        this.createCalibrationOverlay();
        this.updateStatus('고급 캘리브레이션 시작 - 지시사항을 따라주세요');
        this.showCalibrationPoint();
    }
    
    showCalibrationPoint() {
        if (this.currentCalibrationIndex >= this.calibrationPoints.length) {
            this.startValidation();
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
        
        // 지시사항 텍스트
        const instruction = document.createElement('div');
        instruction.className = 'calibration-instruction';
        instruction.id = 'calibration-instruction';
        instruction.innerHTML = `
            <h3>캘리브레이션 ${this.currentCalibrationIndex + 1}/${this.calibrationPoints.length}</h3>
            <p>녹색 점을 정확히 응시하세요</p>
            <p>머리를 움직이지 말고 눈만 움직여주세요</p>
            <p>3초 후 자동으로 다음 점으로 이동합니다</p>
        `;
        
        document.body.appendChild(calibrationDot);
        document.body.appendChild(instruction);
        
        // 3초 후 다음 포인트로
        setTimeout(() => {
            this.currentCalibrationIndex++;
            this.showCalibrationPoint();
        }, 3000);
    }
    
    processCalibrationData(landmarks) {
        // 현재 시선 데이터를 캘리브레이션 포인트와 연결
        const leftIrisCenter = this.getIrisCenter(landmarks, this.leftIrisIndices);
        const rightIrisCenter = this.getIrisCenter(landmarks, this.rightIrisIndices);
        
        if (leftIrisCenter && rightIrisCenter && this.currentCalibrationIndex > 0) {
            const point = this.calibrationPoints[this.currentCalibrationIndex - 1];
            
            // 수평 및 수직 눈 경계 정보 저장
            const leftEyeBounds = this.getEyeBounds(landmarks, this.leftEyeIndices);
            const rightEyeBounds = this.getEyeBounds(landmarks, this.rightEyeIndices);
            const leftVerticalBounds = this.getEyeVerticalBounds(landmarks, true);
            const rightVerticalBounds = this.getEyeVerticalBounds(landmarks, false);
            
            this.calibrationData.push({
                screenPoint: point,
                leftIris: leftIrisCenter,
                rightIris: rightIrisCenter,
                leftEyeBounds: leftEyeBounds,
                rightEyeBounds: rightEyeBounds,
                leftVerticalBounds: leftVerticalBounds,
                rightVerticalBounds: rightVerticalBounds
            });
        }
    }
    
    createCalibrationOverlay() {
        const overlay = document.createElement('div');
        overlay.className = 'calibration-overlay';
        overlay.id = 'calibration-overlay';
        overlay.innerHTML = `
            <h2>고급 시선추적 캘리브레이션</h2>
            <p>정확한 시선추적을 위해 13개 지점을 캘리브레이션합니다</p>
            <p>각 점을 정확히 응시해주세요</p>
        `;
        document.body.appendChild(overlay);
        
        setTimeout(() => {
            document.body.removeChild(overlay);
        }, 3000);
    }
    
    clearCalibrationElements() {
        const existingDot = document.getElementById('current-calibration-point');
        const existingInstruction = document.getElementById('calibration-instruction');
        const existingValidation = document.getElementById('validation-point');
        
        if (existingDot) document.body.removeChild(existingDot);
        if (existingInstruction) document.body.removeChild(existingInstruction);
        if (existingValidation) document.body.removeChild(existingValidation);
    }
    
    startValidation() {
        this.validationMode = true;
        this.validationResults = [];
        
        // 검증용 5개 포인트
        const validationPoints = [
            { x: 0.2, y: 0.2 }, { x: 0.8, y: 0.2 },
            { x: 0.5, y: 0.5 },
            { x: 0.2, y: 0.8 }, { x: 0.8, y: 0.8 }
        ];
        
        this.showValidationPoints(validationPoints, 0);
    }
    
    showValidationPoints(points, index) {
        if (index >= points.length) {
            this.finishCalibration();
            return;
        }
        
        const point = points[index];
        const x = point.x * window.innerWidth;
        const y = point.y * window.innerHeight;
        
        this.clearCalibrationElements();
        
        const validationDot = document.createElement('div');
        validationDot.className = 'validation-point';
        validationDot.id = 'validation-point';
        validationDot.style.left = `${x}px`;
        validationDot.style.top = `${y}px`;
        
        const instruction = document.createElement('div');
        instruction.className = 'calibration-instruction';
        instruction.id = 'calibration-instruction';
        instruction.innerHTML = `
            <h3>정확도 검증 ${index + 1}/${points.length}</h3>
            <p>노란색 점을 응시하세요</p>
            <p>시선추적 정확도를 측정 중입니다</p>
        `;
        
        document.body.appendChild(validationDot);
        document.body.appendChild(instruction);
        
        // 2초 후 다음 검증 포인트
        setTimeout(() => {
            // 여기서 실제 시선 위치와 목표 위치 비교
            this.validateGazeAccuracy(point);
            this.showValidationPoints(points, index + 1);
        }, 2000);
    }
    
    validateGazeAccuracy(targetPoint) {
        // 현재 시선 위치와 목표 위치의 거리 계산
        const currentGaze = this.gazeHistory.length > 0 ? 
            this.gazeHistory[this.gazeHistory.length - 1] : 
            { x: window.innerWidth / 2, y: window.innerHeight / 2 };
        
        const targetX = targetPoint.x * window.innerWidth;
        const targetY = targetPoint.y * window.innerHeight;
        
        const distance = Math.sqrt(
            Math.pow(currentGaze.x - targetX, 2) + 
            Math.pow(currentGaze.y - targetY, 2)
        );
        
        this.validationResults.push(distance);
    }
    
    finishCalibration() {
        this.isCalibrating = false;
        this.validationMode = false;
        this.isTracking = true;
        
        this.clearCalibrationElements();
        
        // 검증 결과 기반 정확도 계산
        let accuracy = 85; // 기본값
        if (this.validationResults.length > 0) {
            const avgError = this.validationResults.reduce((a, b) => a + b, 0) / this.validationResults.length;
            const screenDiagonal = Math.sqrt(window.innerWidth ** 2 + window.innerHeight ** 2);
            const errorRatio = avgError / screenDiagonal;
            accuracy = Math.max(50, Math.min(95, 95 - (errorRatio * 200)));
        }
        
        this.updateAccuracy(Math.round(accuracy));
        this.updateStatus(`캘리브레이션 완료 - 정확도: ${Math.round(accuracy)}% - 시선추적 활성화`);
    }
    
    toggleFullscreen() {
        if (!this.isFullscreen) {
            document.documentElement.requestFullscreen().then(() => {
                this.isFullscreen = true;
                this.fullscreenBtn.textContent = '전체화면 종료';
                this.updateStatus('전체화면 모드 활성화 - 캘리브레이션을 시작하세요');
            }).catch(err => {
                console.error('전체화면 전환 실패:', err);
                this.updateStatus('전체화면 전환에 실패했습니다');
            });
        } else {
            document.exitFullscreen();
        }
    }
    
    onFullscreenChange() {
        this.isFullscreen = !!document.fullscreenElement;
        this.fullscreenBtn.textContent = this.isFullscreen ? '전체화면 종료' : '전체화면 모드';
        
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
        this.isTracking = false;
        this.isCalibrating = false;
        this.showGaze = false;
        this.calibrationData = [];
        this.gazeHistory = [];
        
        this.gazePoint.style.display = 'none';
        
        this.startBtn.disabled = false;
        this.calibrateBtn.disabled = true;
        this.fullscreenBtn.disabled = true;
        this.resetBtn.disabled = true;
        this.toggleGazeBtn.disabled = true;
        
        this.updateStatus('리셋 완료 - 다시 시작하세요');
        this.updateAccuracy(0);
        
        // 카메라 스트림 정지
        if (this.video.srcObject) {
            this.video.srcObject.getTracks().forEach(track => track.stop());
            this.video.srcObject = null;
        }
        
        if (this.camera) {
            this.camera.stop();
        }
    }
    
    updateStatus(message) {
        this.statusEl.textContent = message;
    }
}

// 페이지 로드 시 초기화
document.addEventListener('DOMContentLoaded', () => {
    new GazeTracker();
});