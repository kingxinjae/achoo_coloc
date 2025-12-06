/**
 * MediaPipe Face Mesh 기반 시선 추적 훅
 */
import { useRef, useState, useCallback, useEffect } from 'react';

// MediaPipe 타입 선언
declare global {
  interface Window {
    FaceMesh: any;
    Camera: any;
  }
}

interface GazePoint {
  x: number;
  y: number;
}

interface CalibrationPoint {
  x: number;
  y: number;
}

interface EyeTrackingState {
  isInitialized: boolean;
  isCalibrating: boolean;
  isTracking: boolean;
  currentCalibrationIndex: number;
  totalCalibrationPoints: number;
  gazePoint: GazePoint | null;
  currentSection: number; // 1-4
  error: string | null;
}

interface UseEyeTrackingReturn extends EyeTrackingState {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  startCamera: () => Promise<void>;
  startCalibration: () => void;
  onLeftWink: (() => void) | null;
  onRightWink: (() => void) | null;
  setWinkHandlers: (left: () => void, right: () => void) => void;
}

// 눈 랜드마크 인덱스
const LEFT_EYE_INDICES = [33, 7, 163, 144, 145, 153, 154, 155, 133, 173, 157, 158, 159, 160, 161, 246];
const RIGHT_EYE_INDICES = [362, 382, 381, 380, 374, 373, 390, 249, 263, 466, 388, 387, 386, 385, 384, 398];
const LEFT_IRIS_INDICES = [468, 469, 470, 471, 472];
const RIGHT_IRIS_INDICES = [473, 474, 475, 476, 477];

// 12포인트 캘리브레이션 (3x4)
const CALIBRATION_POINTS: CalibrationPoint[] = [
  { x: 0.2, y: 0.15 }, { x: 0.4, y: 0.15 }, { x: 0.6, y: 0.15 }, { x: 0.8, y: 0.15 },
  { x: 0.2, y: 0.5 }, { x: 0.4, y: 0.5 }, { x: 0.6, y: 0.5 }, { x: 0.8, y: 0.5 },
  { x: 0.2, y: 0.85 }, { x: 0.4, y: 0.85 }, { x: 0.6, y: 0.85 }, { x: 0.8, y: 0.85 }
];

export function useEyeTracking(): UseEyeTrackingReturn {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  const faceMeshRef = useRef<any>(null);
  const cameraRef = useRef<any>(null);
  const calibrationDataRef = useRef<any[]>([]);
  const gazeHistoryRef = useRef<GazePoint[]>([]);
  const lastLandmarksRef = useRef<any>(null);
  
  // 윙크 감지 상태
  const leftEyeClosedStartRef = useRef(0);
  const rightEyeClosedStartRef = useRef(0);
  const lastLeftWinkTimeRef = useRef(0);
  const lastRightWinkTimeRef = useRef(0);
  
  // 윙크 핸들러
  const leftWinkHandlerRef = useRef<(() => void) | null>(null);
  const rightWinkHandlerRef = useRef<(() => void) | null>(null);

  const [state, setState] = useState<EyeTrackingState>({
    isInitialized: false,
    isCalibrating: false,
    isTracking: false,
    currentCalibrationIndex: 0,
    totalCalibrationPoints: CALIBRATION_POINTS.length,
    gazePoint: null,
    currentSection: 0,
    error: null,
  });

  const setWinkHandlers = useCallback((left: () => void, right: () => void) => {
    leftWinkHandlerRef.current = left;
    rightWinkHandlerRef.current = right;
  }, []);

  const getEyeOpenRatio = useCallback((landmarks: any, eyeIndices: number[]) => {
    let minY = 1, maxY = 0, minX = 1, maxX = 0;
    for (const idx of eyeIndices) {
      const point = landmarks[idx];
      minY = Math.min(minY, point.y);
      maxY = Math.max(maxY, point.y);
      minX = Math.min(minX, point.x);
      maxX = Math.max(maxX, point.x);
    }
    const verticalDistance = maxY - minY;
    const horizontalDistance = maxX - minX;
    if (horizontalDistance === 0) return 0;
    return verticalDistance / horizontalDistance;
  }, []);

  const getIrisCenter = useCallback((landmarks: any, irisIndices: number[]) => {
    let sumX = 0, sumY = 0;
    for (const idx of irisIndices) {
      sumX += landmarks[idx].x;
      sumY += landmarks[idx].y;
    }
    return {
      x: sumX / irisIndices.length,
      y: sumY / irisIndices.length
    };
  }, []);

  const getEyeBounds = useCallback((landmarks: any, eyeIndices: number[]) => {
    let minX = 1, maxX = 0;
    for (const idx of eyeIndices) {
      const point = landmarks[idx];
      minX = Math.min(minX, point.x);
      maxX = Math.max(maxX, point.x);
    }
    return {
      centerX: (minX + maxX) / 2,
      width: maxX - minX
    };
  }, []);

  const calculateGaze = useCallback((landmarks: any): GazePoint | null => {
    if (calibrationDataRef.current.length < 9) return null;

    const leftIrisCenter = getIrisCenter(landmarks, LEFT_IRIS_INDICES);
    const rightIrisCenter = getIrisCenter(landmarks, RIGHT_IRIS_INDICES);
    const leftEyeBounds = getEyeBounds(landmarks, LEFT_EYE_INDICES);
    const rightEyeBounds = getEyeBounds(landmarks, RIGHT_EYE_INDICES);

    // X축만 계산 (좌우 움직임만 추적)
    const leftGazeX = (leftIrisCenter.x - leftEyeBounds.centerX) / leftEyeBounds.width;
    const rightGazeX = (rightIrisCenter.x - rightEyeBounds.centerX) / rightEyeBounds.width;
    const avgGazeX = (leftGazeX + rightGazeX) / 2;

    const screenWidth = window.innerWidth;
    // 감도 조절 (8 → 6으로 낮춤)
    const x = screenWidth * (0.5 - avgGazeX * 6);

    return {
      x: Math.max(0, Math.min(screenWidth, x)),
      y: window.innerHeight / 2  // Y축 고정 (좌우만 추적)
    };
  }, [getIrisCenter, getEyeBounds]);

  const getScreenSection = useCallback((x: number): number => {
    const screenWidth = window.innerWidth;
    const sectionWidth = screenWidth / 4;
    if (x < sectionWidth) return 1;
    if (x < sectionWidth * 2) return 2;
    if (x < sectionWidth * 3) return 3;
    return 4;
  }, []);

  const updateEyeStatus = useCallback((landmarks: any) => {
    const leftRatio = getEyeOpenRatio(landmarks, LEFT_EYE_INDICES);
    const rightRatio = getEyeOpenRatio(landmarks, RIGHT_EYE_INDICES);
    const currentTime = Date.now();

    const leftClosed = leftRatio <= 0.2;
    const rightClosed = rightRatio <= 0.2;

    // 양쪽 다 감으면 무시
    if (leftClosed && rightClosed) {
      leftEyeClosedStartRef.current = 0;
      rightEyeClosedStartRef.current = 0;
      return;
    }

    const EYE_CLOSED_THRESHOLD = 500; // 0.5초
    const EYE_COOLDOWN = 1500; // 1.5초

    // MediaPipe의 rightEye = 사용자의 왼쪽 눈 (미러링)
    if (rightClosed && !leftClosed) {
      if (rightEyeClosedStartRef.current === 0) {
        rightEyeClosedStartRef.current = currentTime;
      }
      const closedDuration = currentTime - rightEyeClosedStartRef.current;
      const timeSinceLastWink = currentTime - lastLeftWinkTimeRef.current;

      if (closedDuration >= EYE_CLOSED_THRESHOLD && timeSinceLastWink >= EYE_COOLDOWN) {
        lastLeftWinkTimeRef.current = currentTime;
        leftWinkHandlerRef.current?.();
      }
      leftEyeClosedStartRef.current = 0;
    }
    // 오른쪽 눈만 감음 (사용자 기준)
    else if (leftClosed && !rightClosed) {
      if (leftEyeClosedStartRef.current === 0) {
        leftEyeClosedStartRef.current = currentTime;
      }
      const closedDuration = currentTime - leftEyeClosedStartRef.current;
      const timeSinceLastWink = currentTime - lastRightWinkTimeRef.current;

      if (closedDuration >= EYE_CLOSED_THRESHOLD && timeSinceLastWink >= EYE_COOLDOWN) {
        lastRightWinkTimeRef.current = currentTime;
        rightWinkHandlerRef.current?.();
      }
      rightEyeClosedStartRef.current = 0;
    }
    else {
      leftEyeClosedStartRef.current = 0;
      rightEyeClosedStartRef.current = 0;
    }
  }, [getEyeOpenRatio]);

  const onFaceMeshResults = useCallback((results: any) => {
    if (!canvasRef.current) return;
    
    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) return;

    canvasRef.current.width = videoRef.current?.videoWidth || 640;
    canvasRef.current.height = videoRef.current?.videoHeight || 480;
    ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);

    if (results.multiFaceLandmarks && results.multiFaceLandmarks.length > 0) {
      const landmarks = results.multiFaceLandmarks[0];
      lastLandmarksRef.current = landmarks;

      // 홍채 그리기
      ctx.fillStyle = '#00ff00';
      for (const idx of [...LEFT_IRIS_INDICES, ...RIGHT_IRIS_INDICES]) {
        const point = landmarks[idx];
        const x = point.x * canvasRef.current.width;
        const y = point.y * canvasRef.current.height;
        ctx.beginPath();
        ctx.arc(x, y, 2, 0, 2 * Math.PI);
        ctx.fill();
      }

      // 윙크 감지
      updateEyeStatus(landmarks);

      // 시선 추적 (캘리브레이션 완료 후)
      setState(prev => {
        if (prev.isTracking && !prev.isCalibrating) {
          const gazePoint = calculateGaze(landmarks);
          if (gazePoint) {
            gazeHistoryRef.current.push(gazePoint);
            // 히스토리 크기 증가 (10 → 20) - 더 부드러운 움직임
            if (gazeHistoryRef.current.length > 20) {
              gazeHistoryRef.current.shift();
            }
            
            // 가중 평균 적용 (최근 값에 더 높은 가중치)
            let weightedSum = 0;
            let weightSum = 0;
            gazeHistoryRef.current.forEach((p, i) => {
              const weight = i + 1; // 최근 값일수록 높은 가중치
              weightedSum += p.x * weight;
              weightSum += weight;
            });
            const avgX = weightedSum / weightSum;
            
            // 이전 위치와 보간 (lerp) - 더 느린 움직임
            const prevX = prev.gazePoint?.x ?? avgX;
            const smoothFactor = 0.15; // 낮을수록 더 느림 (0.3 → 0.15)
            const smoothedX = prevX + (avgX - prevX) * smoothFactor;
            
            const smoothedGaze = { x: smoothedX, y: window.innerHeight / 2 };
            const section = getScreenSection(smoothedX);
            
            return { ...prev, gazePoint: smoothedGaze, currentSection: section };
          }
        }
        return prev;
      });
    }
  }, [updateEyeStatus, calculateGaze, getScreenSection]);

  const startCamera = useCallback(async () => {
    try {
      // videoRef가 마운트될 때까지 대기
      if (!videoRef.current) {
        // 100ms 후 재시도
        await new Promise(resolve => setTimeout(resolve, 100));
        if (!videoRef.current) {
          throw new Error('비디오 요소를 찾을 수 없습니다. 페이지를 새로고침해주세요.');
        }
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480, facingMode: 'user' }
      });
      
      videoRef.current.srcObject = stream;
      
      // 비디오가 로드될 때까지 대기
      await new Promise<void>((resolve) => {
        if (videoRef.current) {
          videoRef.current.onloadedmetadata = () => resolve();
        }
      });

      // MediaPipe Face Mesh 초기화
      const FaceMesh = window.FaceMesh;
      const Camera = window.Camera;

      if (!FaceMesh || !Camera) {
        throw new Error('MediaPipe 라이브러리가 로드되지 않았습니다.');
      }

      faceMeshRef.current = new FaceMesh({
        locateFile: (file: string) => `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`
      });

      faceMeshRef.current.setOptions({
        maxNumFaces: 1,
        refineLandmarks: true,
        minDetectionConfidence: 0.5,
        minTrackingConfidence: 0.5
      });

      faceMeshRef.current.onResults(onFaceMeshResults);

      cameraRef.current = new Camera(videoRef.current, {
        onFrame: async () => {
          if (faceMeshRef.current && videoRef.current) {
            await faceMeshRef.current.send({ image: videoRef.current });
          }
        },
        width: 640,
        height: 480
      });

      await cameraRef.current.start();
      
      setState(prev => ({ ...prev, isInitialized: true, error: null }));
    } catch (error) {
      console.error('카메라 초기화 오류:', error);
      setState(prev => ({ ...prev, error: '카메라 접근에 실패했습니다.' }));
    }
  }, [onFaceMeshResults]);

  const startCalibration = useCallback(() => {
    calibrationDataRef.current = [];
    setState(prev => ({
      ...prev,
      isCalibrating: true,
      isTracking: false,
      currentCalibrationIndex: 0
    }));
  }, []);

  // 캘리브레이션 포인트 진행
  useEffect(() => {
    if (!state.isCalibrating) return;

    if (state.currentCalibrationIndex >= CALIBRATION_POINTS.length) {
      // 캘리브레이션 완료
      setState(prev => ({
        ...prev,
        isCalibrating: false,
        isTracking: true
      }));
      return;
    }

    // 2초 후 데이터 수집
    const collectTimer = setTimeout(() => {
      if (lastLandmarksRef.current) {
        calibrationDataRef.current.push({
          screenPoint: CALIBRATION_POINTS[state.currentCalibrationIndex],
          landmarks: lastLandmarksRef.current
        });
      }
    }, 2000);

    // 2.5초 후 다음 포인트
    const nextTimer = setTimeout(() => {
      setState(prev => ({
        ...prev,
        currentCalibrationIndex: prev.currentCalibrationIndex + 1
      }));
    }, 2500);

    return () => {
      clearTimeout(collectTimer);
      clearTimeout(nextTimer);
    };
  }, [state.isCalibrating, state.currentCalibrationIndex]);

  return {
    ...state,
    videoRef,
    canvasRef,
    startCamera,
    startCalibration,
    onLeftWink: leftWinkHandlerRef.current,
    onRightWink: rightWinkHandlerRef.current,
    setWinkHandlers,
  };
}

export { CALIBRATION_POINTS };
export type { GazePoint, CalibrationPoint };
