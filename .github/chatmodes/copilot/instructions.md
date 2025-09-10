# Copilot Instructions for AKVJ

## Project Overview

AKVJ is a real-time VJ application for pixel graphics. Web app that responds to MIDI input to trigger visual animations for live video mixing.

## Technology Stack

- **Frontend**: Vanilla JavaScript with custom HTML elements
- **Graphics**: HTML5 Canvas for real-time rendering
- **Input**: Web MIDI API for MIDI controller integration
- **Assets**: PNG sprite sheets for frame-based animations
- **Build**: Vite for development and production builds
- **Styling**: CSS with Stylelint
- **Formatting**: Prettier

## Core Concepts

### MIDI Integration

- Listens to MIDI notes from all connected inputs
- **Channels**: Internally 0-15, displayed as 1-16. Each channel = visual layer, channel 0 = background
- **Notes** (0-127): Each note triggers specific animation
- **Velocity** (1-127): Controls which velocity layer plays

### Animation System

- PNG sprite sheets with JSON metadata
- Up to 13 velocity layers for different intensity levels
- Velocity layers use `minVelocity` thresholds
- MIDI velocity (0-127) divided into ranges: 0-9, 10-19, 20-29, 30-39, 40-49, 50-59, 60-69, 70-79, 80-89, 90-99, 100-109, 110-119, 120-127
- Support looping, custom frame rates, multiple frames per row

### Velocity Layer Structure

```javascript
{
  "velocityLayers": [
    {
      "minVelocity": 0,        // MIDI velocity threshold for this layer (0-127)
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

## File Structure

- `src/main.js` - Entry point, imports and initializes modules
- `src/js/midi.js` - Web MIDI API integration and note handling
- `src/js/adventure-kid-video-jockey.js` - Main VJ component and canvas rendering
- `src/js/app-state.js` - Application state management
- `src/js/settings.js` - Configuration and settings
- `src/js/fullscreen.js` - Fullscreen functionality
- `src/css/` - Styling and themes
- `src/public/animations/` - Animation assets and metadata

## Development Patterns

### Custom Elements

- Vanilla JavaScript custom elements for UI
- Pattern: `class ComponentName extends HTMLElement`
- Register with `customElements.define()`

### Canvas Rendering

- HTML5 Canvas API for all visual rendering
- Frame-based animation systems
- Layer management for MIDI channels

### MIDI Event Handling

- Process MIDI events asynchronously
- Channel numbers for layer management (0-15 internally, 1-16 in UI)
- Map note numbers to animation indices
- Use velocity for animation intensity with threshold-based layer selection

### Animation Management

- Preload and cache animations
- Sprite sheet rendering for performance
- Frame timing and looping logic
- Dynamic loading of animation metadata

## Coding Guidelines

### JavaScript Style

- ES6+ modules and imports
- Prefer `const` and `let` over `var`
- Use async/await for asynchronous operations
- camelCase naming convention
- JSDoc comments for complex functions

### Performance

- Optimize canvas rendering operations
- Preload and cache animation assets
- Use requestAnimationFrame for smooth animations
- Minimize DOM manipulations during performance

### MIDI Programming

- Check for Web MIDI API support
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
function handleMidiNote(channel, note, velocity) {
	const layer = channel; // Channel maps to visual layer (0-15 internally, 1-16 in UI)
	const animationIndex = note; // Note maps to animation (0-127)

	// Find velocity layer based on thresholds
	const velocityLayer = findVelocityLayer(velocity);

	triggerAnimation(layer, animationIndex, velocityLayer);
}

function findVelocityLayer(velocity) {
	// Ranges: 0-9, 10-19, 20-29, etc. up to 120-127
	return Math.floor(velocity / 10);
}
```

### Animation Rendering

```javascript
function renderFrame(animation, frameIndex, canvas, context) {
	const frameData = animation.getFrame(frameIndex);
	context.drawImage(frameData.sprite, frameData.x, frameData.y, frameData.width, frameData.height, canvas.x, canvas.y, frameData.width, frameData.height);
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
- Ensure Web MIDI API compatibility
- Consider animation loading and memory management
- Think about VJ workflow and usability during live performance

## Browser Compatibility

- Target modern browsers with Web MIDI API support
- Focus on Chrome/Chromium-based browsers for best MIDI support
- Ensure Canvas performance on various hardware configurations
- Test with multiple MIDI devices and controllers

## Communication Style

Be direct and concise. Avoid decorative language, emoticons, and unnecessary words. Keep responses short and to the point. Follow KISS principle.
