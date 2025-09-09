# GitHub Copilot Instructions for AKVJ

## Project Overview

AKVJ (Adventure Kid Video Jockey) is a real-time VJ application focused on pixel and 8-bit graphics. This is a performance-oriented web application that responds to MIDI input to trigger visual animations and effects for live video mixing.

## Technology Stack

- **Frontend**: Vanilla JavaScript with custom HTML elements
- **Graphics**: HTML5 Canvas for real-time rendering
- **Input**: Web MIDI API for MIDI controller integration
- **Assets**: PNG sprite sheets for frame-based animations
- **Build Tool**: Vite for development and production builds
- **Styling**: CSS with Stylelint for linting
- **Formatting**: Prettier for code formatting

## Core Concepts

### MIDI Integration
- Application listens to MIDI notes from all connected inputs
- **Channel Numbers** (0-15): Each MIDI channel corresponds to a visual layer, with channel 0 being the background layer
- **Note Numbers** (0-127): Each note triggers a specific animation
- **Velocity** (1-127): Controls which velocity layer of an animation plays

### Animation System
- Animations are PNG sprite sheets with accompanying JSON metadata
- Each animation can have up to 13 **velocity layers** for different intensity levels
- Velocity layers use `minVelocity` thresholds to determine which animation variant plays
- Animations support looping, custom frame rates, and multiple frames per row

### Velocity Layer Structure
```javascript
{
  "velocityLayers": [
    {
      "minVelocity": 0,        // Threshold for this layer (0-12)
      "numberOfFrames": 64,    // Total frames in sprite sheet
      "framesPerRow": 8,       // Sprite sheet layout
      "loop": true,            // Whether animation loops
      "src": "sprite.png",     // PNG sprite sheet path
      "frameRatesForFrames": { // Custom frame timing
        "0": 2                 // Frame 0 plays for 2 ticks
      }
    }
  ]
}
```

## Code Architecture

### File Structure
- `src/main.js` - Application entry point, imports and initializes modules
- `src/js/midi.js` - Web MIDI API integration and note handling
- `src/js/adventure-kid-video-jockey.js` - Main VJ component and canvas rendering
- `src/js/app-state.js` - Application state management
- `src/js/settings.js` - Configuration and settings
- `src/js/fullscreen.js` - Fullscreen functionality for live performance
- `src/css/` - Styling and visual themes
- `src/public/animations/` - Animation assets and metadata

### Development Patterns

#### Custom Elements
- Use vanilla JavaScript custom elements for UI components
- Follow the pattern: `class ComponentName extends HTMLElement`
- Register elements with `customElements.define()`

#### Canvas Rendering
- Use HTML5 Canvas API for all visual rendering
- Implement frame-based animation systems
- Layer management for multiple MIDI channels

#### MIDI Event Handling
- All MIDI events should be processed asynchronously
- Use channel numbers for layer management (0 = background)
- Map note numbers to animation indices
- Use velocity for animation intensity/variant selection

#### Animation Management
- Animations should be preloaded and cached
- Use sprite sheet rendering for performance
- Implement frame timing and looping logic
- Support dynamic loading of animation metadata

## Coding Guidelines

### JavaScript Style
- Use ES6+ modules and imports
- Prefer `const` and `let` over `var`
- Use async/await for asynchronous operations
- Follow camelCase naming convention
- Add JSDoc comments for complex functions

### Performance Considerations
- Optimize canvas rendering operations
- Preload and cache animation assets
- Use requestAnimationFrame for smooth animations
- Minimize DOM manipulations during performance

### MIDI Programming
- Always check for Web MIDI API support
- Handle MIDI device connect/disconnect events
- Process MIDI messages efficiently in real-time
- Support multiple simultaneous MIDI inputs

### Animation Development
- Create reusable animation classes
- Support configurable frame rates and timing
- Implement proper memory management for assets
- Design animations for live performance use

## Common Patterns

### MIDI Note Processing
```javascript
// Example MIDI note handling pattern
function handleMidiNote(channel, note, velocity) {
  const layer = channel; // Channel maps to visual layer
  const animationIndex = note; // Note maps to animation
  const intensityLayer = calculateVelocityLayer(velocity);
  
  triggerAnimation(layer, animationIndex, intensityLayer);
}
```

### Animation Rendering
```javascript
// Example animation frame rendering
function renderFrame(animation, frameIndex, canvas, context) {
  const frameData = animation.getFrame(frameIndex);
  context.drawImage(
    frameData.sprite,
    frameData.x, frameData.y,
    frameData.width, frameData.height,
    canvas.x, canvas.y,
    frameData.width, frameData.height
  );
}
```

## Development Commands

- `npm run dev` - Start Vite development server
- `npm run build` - Build for production
- `npm run format:prettier` - Format code with Prettier
- `npm run format:stylelint` - Lint and fix CSS
- `npm run generate-animation-json-to-json` - Generate animation metadata

## Context for AI Assistance

When providing suggestions:
- Prioritize real-time performance and low latency
- Consider live performance scenarios and stability
- Suggest MIDI-compatible implementations
- Focus on canvas optimization techniques
- Recommend pixel-art and retro aesthetic approaches
- Ensure compatibility with Web MIDI API standards
- Consider animation loading and memory management
- Think about VJ workflow and usability during live performance

## Browser Compatibility

- Target modern browsers with Web MIDI API support
- Focus on Chrome/Chromium-based browsers for best MIDI support
- Ensure Canvas performance on various hardware configurations
- Test with multiple MIDI devices and controllers