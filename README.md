# Delayed Mirror - Progressive Web App

A video feedback application that displays your camera feed with an adjustable delay (10-120 seconds). Perfect for training, practice, and form analysis.

## Features

- **Adjustable Delay**: Vertical slider on the left side (10-120 seconds)
- **Real-time Timer**: Shows current delay setting on screen
- **Pinch to Zoom**: Zoom in/out with two-finger pinch gesture
- **Pan Function**: Drag to move around when zoomed in
- **Double-tap Reset**: Quickly reset zoom to default
- **PWA Support**: Install on home screen, works offline
- **Mobile Optimized**: Full-screen experience on mobile devices

## Use Cases

- Golf swing analysis
- Tennis serve practice
- Dance choreography review
- Speech and presentation practice
- Physical therapy exercises
- Martial arts form training
- Music practice (instrument positioning)

## Installation

### Option 1: Direct Use (Development)

1. Serve the files with any static web server:
   ```bash
   # Using Python
   python -m http.server 8080
   
   # Using Node.js http-server
   npx http-server -p 8080
   
   # Using PHP
   php -S localhost:8080
   ```

2. Open `http://localhost:8080` in your browser

3. For mobile testing, use your computer's local IP address

### Option 2: Deploy to Hosting

Upload all files to any static hosting service:
- GitHub Pages
- Netlify
- Vercel
- Firebase Hosting
- AWS S3 + CloudFront

### Option 3: Install as PWA

1. Open the app in Chrome/Safari on your mobile device
2. For iOS: Tap Share → "Add to Home Screen"
3. For Android: Tap menu → "Add to Home Screen" or "Install"

## File Structure

```
delayed-mirror/
├── index.html          # Main application (HTML, CSS, JS combined)
├── manifest.json       # PWA manifest for installation
├── sw.js              # Service worker for offline support
├── icons/             # App icons for various sizes
│   ├── icon-72.png
│   ├── icon-96.png
│   ├── icon-128.png
│   ├── icon-144.png
│   ├── icon-152.png
│   ├── icon-192.png
│   ├── icon-384.png
│   └── icon-512.png
├── generate-icons-simple.js  # Script to regenerate icons
└── README.md          # This file
```

## Customization Guide

### Adjusting Delay Range

In `index.html`, find the delay slider:
```html
<input 
    type="range" 
    class="delay-slider" 
    id="delaySlider"
    min="10"      <!-- Minimum delay in seconds -->
    max="120"     <!-- Maximum delay in seconds -->
    value="30"    <!-- Initial delay value -->
    step="1"      <!-- Increment amount -->
>
```

### Changing Frame Rate

In the JavaScript section, find:
```javascript
const TARGET_FPS = 15;  // Frames per second
```
- Higher = smoother but more memory
- Lower = choppier but saves memory
- Recommended: 10-30 FPS

### Adjusting Zoom Limits

```javascript
const MIN_ZOOM = 1.0;   // No zoom out below 1x
const MAX_ZOOM = 5.0;   // Maximum 5x zoom
```

### Changing Colors

Modify CSS custom properties at the top of the style section:
```css
:root {
    --color-bg: #0a0a0a;           /* Background */
    --color-accent: #00d4aa;       /* Accent color */
    --color-text: #ffffff;         /* Text color */
}
```

### Switching Camera (Front/Back)

Find the camera constraints in the JavaScript:
```javascript
const constraints = {
    video: {
        facingMode: 'user',  // 'user' = front, 'environment' = back
        // ...
    }
};
```

### Adjusting Slider Width

Change the CSS variable:
```css
:root {
    --slider-width: 48px;  /* Width of the control panel */
}
```

### Timer Display Size

```css
:root {
    --timer-size: 72px;  /* Minimum width of timer box */
}
```

## Technical Details

### How the Delay Works

1. **Frame Capture**: Video frames are captured at TARGET_FPS rate
2. **Circular Buffer**: Frames stored in a buffer of size `FPS × delay_seconds`
3. **Delayed Display**: The oldest frame in the buffer is displayed

### Memory Considerations

Memory usage scales with:
- Video resolution (720p default)
- Frame rate (15 FPS default)
- Delay duration (up to 120 seconds)

For a 720p video at 15 FPS with 120s delay:
- Approximate memory: ~6 GB (raw pixel data)
- Actual usage may be higher due to JavaScript overhead

To reduce memory usage:
1. Lower TARGET_FPS (e.g., 10)
2. Reduce video resolution in constraints
3. Lower maximum delay

### Browser Compatibility

- **Chrome/Edge**: Full support
- **Firefox**: Full support
- **Safari**: Full support (iOS 14.3+)
- **Samsung Internet**: Full support

### Known Limitations

- High memory usage for long delays
- Some devices may throttle in background
- Camera access requires HTTPS (except localhost)

## Troubleshooting

### Camera Not Working

1. Check browser permissions for camera access
2. Ensure you're using HTTPS (or localhost)
3. Try refreshing the page
4. Check if another app is using the camera

### High Memory Usage

1. Reduce delay duration
2. Lower TARGET_FPS in code
3. Close other browser tabs
4. Restart the app periodically

### Choppy Video

1. Reduce delay duration
2. Lower video resolution
3. Close other applications
4. Check device CPU usage

### PWA Not Installing

1. Must be served over HTTPS
2. Service worker must be registered
3. manifest.json must be valid
4. Required icons must exist

## License

MIT License - Feel free to use, modify, and distribute.

## Contributing

Suggestions and improvements welcome! Key areas:
- Memory optimization
- Better icon design
- Additional gesture support
- Recording functionality
