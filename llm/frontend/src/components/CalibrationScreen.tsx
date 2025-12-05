import { useEffect, useState } from 'react';
import { CALIBRATION_POINTS } from '../hooks/useEyeTracking';
import './CalibrationScreen.css';

interface CalibrationScreenProps {
  currentIndex: number;
  totalPoints: number;
  onComplete?: () => void;
}

export function CalibrationScreen({ 
  currentIndex, 
  totalPoints
}: CalibrationScreenProps) {
  const [pointPosition, setPointPosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    if (currentIndex < CALIBRATION_POINTS.length) {
      const point = CALIBRATION_POINTS[currentIndex];
      setPointPosition({
        x: point.x * window.innerWidth,
        y: point.y * window.innerHeight
      });
    }
  }, [currentIndex]);

  return (
    <div className="calibration-screen">
      <div className="calibration-overlay">
        <div className="calibration-info">
          <h2>👁️ 캘리브레이션</h2>
          <p>초록색 점을 응시해주세요</p>
          <div className="calibration-progress">
            <div 
              className="calibration-progress-bar"
              style={{ width: `${(currentIndex / totalPoints) * 100}%` }}
            />
          </div>
          <span className="calibration-count">{currentIndex + 1} / {totalPoints}</span>
        </div>
      </div>
      
      {currentIndex < CALIBRATION_POINTS.length && (
        <div 
          className="calibration-point"
          style={{ 
            left: `${pointPosition.x}px`, 
            top: `${pointPosition.y}px` 
          }}
        />
      )}
    </div>
  );
}
