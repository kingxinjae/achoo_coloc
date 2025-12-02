# Contributing to Advanced Eye Tracking System

Thank you for your interest in contributing to the Advanced Eye Tracking System! This document provides guidelines and information for contributors.

## 🤝 How to Contribute

### Reporting Issues
- Use the [GitHub Issues](https://github.com/yourusername/advanced-eye-tracking/issues) page
- Search existing issues before creating a new one
- Provide detailed information about the bug or feature request
- Include browser version, OS, and steps to reproduce

### Submitting Pull Requests
1. Fork the repository
2. Create a new branch: `git checkout -b feature/your-feature-name`
3. Make your changes
4. Test your changes thoroughly
5. Commit with clear messages: `git commit -m "Add: new calibration algorithm"`
6. Push to your fork: `git push origin feature/your-feature-name`
7. Submit a pull request

## 📋 Development Guidelines

### Code Style
- Use ES6+ JavaScript features
- Follow consistent indentation (2 spaces)
- Use meaningful variable and function names
- Add JSDoc comments for functions
- Keep functions small and focused

### Testing
- Test in multiple browsers (Chrome, Firefox, Safari, Edge)
- Verify camera functionality works properly
- Test calibration accuracy
- Check responsive design on different screen sizes

### Performance
- Maintain 60 FPS performance
- Optimize memory usage
- Minimize CPU overhead
- Use GPU acceleration where possible

## 🎯 Areas for Contribution

### High Priority
- [ ] Improved calibration algorithms
- [ ] Better accuracy validation
- [ ] Mobile device optimization
- [ ] Additional language support

### Medium Priority
- [ ] Advanced filtering algorithms
- [ ] Eye fatigue detection
- [ ] Accessibility improvements
- [ ] Documentation enhancements

### Low Priority
- [ ] UI/UX improvements
- [ ] Additional visualization options
- [ ] Export functionality
- [ ] Integration examples

## 🔧 Technical Requirements

### Browser Support
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

### Dependencies
- MediaPipe Face Mesh
- TensorFlow.js
- Modern browser APIs (WebRTC, Canvas, WebGL)

## 📝 Commit Message Format

Use the following format for commit messages:
```
Type: Brief description

Detailed explanation if needed

- Bullet points for multiple changes
- Reference issues with #123
```

### Types
- `Add:` New features
- `Fix:` Bug fixes
- `Update:` Improvements to existing features
- `Remove:` Removing code or features
- `Docs:` Documentation changes
- `Style:` Code formatting changes
- `Refactor:` Code restructuring
- `Test:` Adding or updating tests

## 🚀 Getting Started

### Local Development
1. Clone your fork:
   ```bash
   git clone https://github.com/yourusername/advanced-eye-tracking.git
   cd advanced-eye-tracking
   ```

2. Open `index.html` in your browser or use a local server:
   ```bash
   # Using Python
   python -m http.server 8000
   
   # Using Node.js
   npx serve .
   ```

3. Make your changes and test thoroughly

### Project Structure
```
advanced-eye-tracking/
├── index.html          # Main HTML file
├── gaze-tracker.js     # Core tracking logic
├── README.md           # Project documentation
├── LICENSE             # MIT License
├── CONTRIBUTING.md     # This file
└── requirements.txt    # Python dependencies (optional)
```

## 🐛 Bug Reports

When reporting bugs, please include:
- Browser and version
- Operating system
- Steps to reproduce
- Expected behavior
- Actual behavior
- Screenshots or videos if applicable
- Console error messages

## 💡 Feature Requests

For feature requests, please provide:
- Clear description of the feature
- Use case and benefits
- Possible implementation approach
- Any relevant examples or references

## 📚 Resources

### MediaPipe Documentation
- [Face Mesh Guide](https://google.github.io/mediapipe/solutions/face_mesh.html)
- [JavaScript API](https://google.github.io/mediapipe/getting_started/javascript.html)

### TensorFlow.js
- [Official Documentation](https://www.tensorflow.org/js)
- [API Reference](https://js.tensorflow.org/api/latest/)

### Web APIs
- [WebRTC](https://developer.mozilla.org/en-US/docs/Web/API/WebRTC_API)
- [Canvas API](https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API)
- [Fullscreen API](https://developer.mozilla.org/en-US/docs/Web/API/Fullscreen_API)

## 🏆 Recognition

Contributors will be recognized in:
- README.md contributors section
- Release notes
- Project documentation

## 📞 Questions?

If you have questions about contributing:
- Open a [GitHub Discussion](https://github.com/yourusername/advanced-eye-tracking/discussions)
- Create an issue with the "question" label
- Contact the maintainers directly

Thank you for contributing to the Advanced Eye Tracking System! 🎯