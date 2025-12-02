# 🎯 Advanced Eye Tracking System

A real-time eye tracking system using MediaPipe Face Mesh and TensorFlow.js for web browsers. This system provides high-precision gaze tracking with advanced calibration and real-time performance monitoring.

![Eye Tracking Demo](https://img.shields.io/badge/Status-Active-brightgreen)
![License](https://img.shields.io/badge/License-MIT-blue)
![JavaScript](https://img.shields.io/badge/JavaScript-ES6+-yellow)
![MediaPipe](https://img.shields.io/badge/MediaPipe-Face%20Mesh-orange)

## ✨ Features

### 🎯 High-Precision Eye Tracking
- **468 facial landmarks** detection using MediaPipe Face Mesh
- **Iris tracking** with 5-point precision per eye
- **Real-time gaze coordinates** with sub-pixel accuracy
- **60 FPS performance** with GPU acceleration

### 📐 Advanced Calibration System
- **13-point calibration** for enhanced accuracy
- **Personalized eye characteristics** learning
- **Automatic validation** with accuracy measurement
- **Fullscreen calibration** for optimal precision

### 👁️ Comprehensive Eye Analysis
- **Individual eye status** monitoring (open/closed)
- **Blink detection** and tracking
- **Iris center tracking** for both eyes
- **Eye openness measurement**

### 🔄 Head Pose Compensation
- **3D head pose estimation** (Pitch, Yaw, Roll)
- **Movement compensation** algorithms
- **Distance variation** handling
- **Real-time pose correction**

### 📊 Performance Monitoring
- **Real-time accuracy** calculation
- **Visual accuracy meter** with gradient display
- **System status** monitoring
- **Performance metrics** tracking

## 🚀 Quick Start

### Prerequisites
- Modern web browser (Chrome 90+, Firefox 88+, Safari 14+, Edge 90+)
- Webcam access
- Good lighting conditions

### Installation
1. Clone the repository:
```bash
git clone https://github.com/yourusername/advanced-eye-tracking.git
cd advanced-eye-tracking
```

2. Open `index.html` in your web browser
3. Allow camera access when prompted

### Usage
1. **🚀 Start Camera**: Click to initialize webcam
2. **🖥️ Fullscreen**: Enter fullscreen mode for better accuracy
3. **🎯 Calibrate**: Follow the 13-point calibration process
4. **👁️ Toggle Gaze**: Show/hide gaze point on screen
5. **🔄 Reset**: Reset the system to initial state

## 🛠️ Technical Stack

### Core Technologies
- **MediaPipe Face Mesh**: Advanced facial landmark detection
- **TensorFlow.js**: Machine learning inference
- **WebRTC**: Real-time camera stream processing
- **Canvas API**: Real-time visualization
- **WebGL**: GPU-accelerated computations

### Key Algorithms
- **Gaze Vector Calculation**: Iris position relative to eye boundaries
- **Smoothing Filters**: Moving average with history-based noise reduction
- **Calibration Mapping**: Personalized screen coordinate transformation
- **Head Pose Estimation**: 3D rotation matrix calculation

## 📈 Performance Optimization

### Real-time Processing
- **Frame Rate**: 60 FPS target
- **Latency**: <50ms processing time
- **Memory Usage**: Efficient circular buffer management
- **CPU Usage**: Optimized landmark processing

### Accuracy Enhancement
- **Multi-point Filtering**: 10-frame history smoothing
- **Outlier Detection**: Statistical anomaly removal
- **Adaptive Calibration**: Dynamic accuracy adjustment
- **Environmental Compensation**: Lighting and distance adaptation

## 🎨 UI/UX Features

### Modern Design
- **Gradient Backgrounds**: Beautiful visual aesthetics
- **Glassmorphism**: Backdrop blur effects
- **Responsive Layout**: Mobile and desktop friendly
- **Smooth Animations**: CSS transitions and transforms

### User Experience
- **Intuitive Controls**: Clear button labeling with emojis
- **Real-time Feedback**: Live status updates
- **Visual Indicators**: Color-coded accuracy meters
- **Accessibility**: Keyboard navigation support

## 🔧 Configuration

### Calibration Settings
```javascript
// Calibration points (13-point system)
this.calibrationPoints = [
    // Top row (5 points)
    { x: 0.1, y: 0.05 }, { x: 0.3, y: 0.05 }, { x: 0.5, y: 0.05 }, 
    { x: 0.7, y: 0.05 }, { x: 0.9, y: 0.05 },
    // Middle row (3 points)
    { x: 0.1, y: 0.5 }, { x: 0.5, y: 0.5 }, { x: 0.9, y: 0.5 },
    // Bottom row (5 points)
    { x: 0.1, y: 0.95 }, { x: 0.3, y: 0.95 }, { x: 0.5, y: 0.95 }, 
    { x: 0.7, y: 0.95 }, { x: 0.9, y: 0.95 }
];
```

### Tracking Parameters
```javascript
// MediaPipe Face Mesh settings
this.faceMesh.setOptions({
    maxNumFaces: 1,
    refineLandmarks: true,
    minDetectionConfidence: 0.5,
    minTrackingConfidence: 0.5
});
```

## 🔒 Privacy & Security

### Data Protection
- **Local Processing**: All data processed in browser
- **No Server Communication**: Zero data transmission
- **Automatic Cleanup**: Data cleared on page refresh
- **User Consent**: Camera access requires permission

### Browser Security
- **HTTPS Required**: Secure context for camera access
- **Same-Origin Policy**: Prevents unauthorized access
- **Content Security Policy**: XSS protection
- **Permissions API**: Granular access control

## 📱 Browser Compatibility

| Browser | Version | Status | Notes |
|---------|---------|--------|-------|
| Chrome | 90+ | ✅ Full Support | Recommended |
| Firefox | 88+ | ✅ Full Support | Good performance |
| Safari | 14+ | ✅ Full Support | iOS 14.3+ |
| Edge | 90+ | ✅ Full Support | Chromium-based |

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guidelines](CONTRIBUTING.md) for details.

### Development Setup
1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Make your changes
4. Test thoroughly
5. Submit a pull request

### Code Style
- Use ES6+ features
- Follow JSDoc commenting
- Maintain consistent formatting
- Add unit tests for new features

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Google MediaPipe Team** for the Face Mesh model
- **TensorFlow.js Team** for the ML framework
- **Web Standards Community** for WebRTC APIs
- **Open Source Contributors** worldwide

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/yourusername/advanced-eye-tracking/issues)
- **Discussions**: [GitHub Discussions](https://github.com/yourusername/advanced-eye-tracking/discussions)
- **Email**: your.email@example.com

---

**Made with ❤️ for the open source community**