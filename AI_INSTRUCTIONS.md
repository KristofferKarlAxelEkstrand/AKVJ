# AI Instructions for AKVJ - Adventure Kid Video Jockey

## Project Overview

AKVJ is a real-time VJ (Video Jockey) application designed for live visual performance using pixel art and 8-bit aesthetics. It's a web-based application that responds to MIDI controller input to trigger visual animations for live video mixing and performance.

**Core Purpose**: Enable VJs to perform live visual sets by mapping MIDI controller input directly to layered visual animations with real-time performance optimization.

**Technology Stack**:

- **Frontend**: Vanilla JavaScript with custom HTML elements (no frameworks)
- **Graphics**: HTML5 Canvas API for real-time rendering
- **Input**: Web MIDI API for MIDI controller integration
- **Assets**: PNG sprite sheets for frame-based animations
- **Build System**: Vite for development and production builds
- **Code Quality**: Prettier for formatting, Stylelint for CSS
- **Target Browsers**: Modern browsers with Web MIDI API support (primarily Chrome/Chromium)

## Core MIDI-to-Visual Mapping Logic

### Channel → Layer Mapping

- **MIDI Channels 1-16** (displayed in UI) map to **Canvas Layers 0-15** (internal indexing)
- **Channel 0 (internal) = Background layer** (furthest back)
- **Higher channels = Foreground layers** (closer to viewer)
- Each channel represents an independent visual layer that can display animations simultaneously

### Note → Animation Mapping

- **MIDI Notes 0-127** map directly to animation indices
- Each note triggers a unique animation on its corresponding channel layer
- Notes can be triggered simultaneously across different channels
- **Note On**: Starts/triggers the animation
- **Note Off**: Stops the animation and clears it from the layer

### Velocity → Animation Variation

- **MIDI Velocity 1-127** determines which velocity layer animation plays
- Up to **13 velocity layers** per note for different intensity/variation levels
- Velocity layers use `minVelocity` thresholds to create ranges:
    - Layer 0: velocities 1-10 (minVelocity: 0)
    - Layer 1: velocities 10-20 (minVelocity: 10)
    - Layer 2: velocities 20-30 (minVelocity: 20)
    - ...and so on up to velocity 127
- Higher velocity = more intense/dramatic animation variation

### Pipeline Flow

```
MIDI Controller → Web MIDI API → Channel/Note/Velocity → Animation Selection → Canvas Layer → Real-time Rendering
```

## Animation System Architecture

### Sprite Sheet Structure

- **PNG files**: Contain frame-based animations in grid layout
- **JSON metadata**: Defines animation properties and behavior
- **Frame organization**: Multiple frames arranged in rows (configurable frames per row)
- **Memory optimization**: Preloaded and cached for real-time performance

### Animation Metadata Format

```json
{
	"velocityLayers": [
		{
			"minVelocity": 0, // Velocity threshold (0-127)
			"numberOfFrames": 64, // Total frames in sprite sheet
			"framesPerRow": 8, // Grid layout (8 frames per row)
			"loop": true, // Whether animation repeats
			"src": "sprite.png", // PNG sprite sheet filename
			"frameRatesForFrames": {
				// Custom timing per frame
				"0": 2, // Frame 0 displays for 2 render ticks
				"32": 4 // Frame 32 displays for 4 render ticks
			}
		}
	]
}
```

### File Organization

```
src/public/animations/
├── {channel}/              # MIDI channel (0-15)
│   ├── {note}/            # MIDI note (0-127)
│   │   ├── {velocity}/    # Velocity layer (0-12)
│   │   │   ├── sprite.png # Animation frames
│   │   │   └── meta.json  # Animation metadata
```

### Rendering Pipeline

1. **Animation Loading**: Async load PNG + JSON metadata
2. **Canvas Setup**: 240x135 resolution, pixel-perfect rendering
3. **Frame Calculation**: Based on timing and current animation state
4. **Sprite Rendering**: Extract frame from sprite sheet to canvas
5. **Layer Compositing**: Multiple channels rendered in order (0=back, 15=front)

## File Structure & Key Components

### Core Application Files

- **`src/main.js`** - Application entry point, module initialization
- **`src/index.html`** - Main HTML template
- **`src/js/adventure-kid-video-jockey.js`** - Main VJ component (custom element)
- **`src/js/midi.js`** - Web MIDI API integration and event handling
- **`src/js/app-state.js`** - Global application state management
- **`src/js/settings.js`** - Configuration constants and settings
- **`src/js/fullscreen.js`** - Fullscreen functionality for live performance

### Styling & Assets

- **`src/css/`** - Stylesheets and visual themes
- **`src/public/animations/`** - Animation assets and metadata
- **`generateAnimationsJson.js`** - Build script for animation metadata

### Build & Development

- **`vite.config.js`** - Vite build configuration
- **`package.json`** - Dependencies and build scripts
- **`.prettierrc`** - Code formatting configuration
- **`.stylelintrc`** - CSS linting configuration

## Performance Priorities & Constraints

### Critical Performance Requirements

1. **Real-time Responsiveness**: MIDI input to visual output must be < 20ms
2. **60 FPS Rendering**: Smooth animation playback during live performance
3. **Memory Efficiency**: Preload and cache animations without memory leaks
4. **CPU Optimization**: Minimize canvas operations and DOM manipulations
5. **Live Performance Stability**: No frame drops or glitches during shows

### Canvas Optimization Rules

- Use `requestAnimationFrame` for all animation loops
- Disable image smoothing for pixel-perfect rendering
- Minimize `drawImage` calls per frame
- Preload all animation sprites before performance
- Use efficient sprite sheet extraction techniques

### MIDI Processing Constraints

- Process MIDI messages asynchronously but immediately
- Support multiple simultaneous MIDI inputs
- Handle device connect/disconnect gracefully
- Buffer and batch MIDI events if necessary for performance

## Development Rules & Best Practices

### Code Architecture

- **No Frameworks**: Use vanilla JavaScript and custom elements only
- **ES6+ Modules**: Use modern JavaScript with imports/exports
- **Custom Elements**: Follow `class Component extends HTMLElement` pattern
- **Functional Programming**: Prefer pure functions where possible
- **Event-Driven**: Use event listeners for MIDI and user interactions

### JavaScript Guidelines

- Use `const` and `let`, never `var`
- Prefer `async/await` over Promises for readability
- Use camelCase naming convention consistently
- Add JSDoc comments for complex functions
- Handle errors gracefully, especially for MIDI and canvas operations

### Performance Guidelines

- Cache DOM references, don't query repeatedly
- Use Web Workers for heavy computations if needed
- Implement proper memory cleanup (remove event listeners, clear references)
- Profile canvas rendering performance regularly
- Optimize critical path: MIDI → Animation → Render

### Browser Compatibility

- Target modern browsers with Web MIDI API support
- Primary focus: Chrome/Chromium (best MIDI support)
- Test with various hardware configurations
- Ensure graceful degradation when MIDI unavailable

## AI Agent Guidelines & Example Prompts

### When Suggesting Features

**Good Prompts**:

- "Add a new velocity layer animation with smooth transitions"
- "Implement MIDI CC control for animation speed"
- "Create a visual preset system for quick performance setup"
- "Add animation blend modes for layer mixing"

**Avoid**:

- Suggestions that require external frameworks
- Features that could impact real-time performance
- Complex UI changes that distract from live performance

### When Fixing Bugs

**Focus Areas**:

- MIDI message handling and timing issues
- Canvas rendering performance problems
- Animation loading and memory management
- Cross-browser compatibility issues

**Example Debug Prompts**:

- "MIDI note off events not clearing animations properly"
- "Canvas rendering slowing down after 10 minutes of use"
- "Animation sprites not loading in correct velocity layers"

### When Refactoring Code

**Priorities**:

1. Maintain real-time performance
2. Keep vanilla JavaScript architecture
3. Improve code readability without adding complexity
4. Enhance error handling and edge cases
5. Optimize canvas and MIDI operations

**Good Refactoring Examples**:

- Extract animation loading logic into reusable functions
- Improve MIDI event processing efficiency
- Optimize canvas rendering pipeline
- Simplify velocity layer selection algorithm

### Code Review Guidelines

- Verify no performance regressions in MIDI→render pipeline
- Ensure pixel-perfect rendering maintained
- Check memory usage and cleanup
- Validate MIDI device compatibility
- Test with actual hardware controllers

## Browser Compatibility & Requirements

### Minimum Requirements

- **Web MIDI API support** (Chrome 43+, Edge 79+)
- **HTML5 Canvas with 2D context**
- **ES6+ JavaScript support**
- **RequestAnimationFrame API**
- **Modern CSS Grid/Flexbox**

### Recommended Environment

- **Chrome/Chromium 90+** for optimal MIDI performance
- **Hardware acceleration enabled** for smooth canvas rendering
- **Multiple MIDI devices supported** simultaneously
- **Fullscreen API support** for live performance mode

### Fallback Behavior

- Graceful degradation when MIDI unavailable
- Console warnings for unsupported features
- Alternative input methods for testing without MIDI

## Common Patterns & Examples

### MIDI Event Processing

```javascript
handleMIDIMessage(message) {
  const [status, data1, data2] = message.data;
  const command = status >> 4;        // Extract command type
  const channel = status & 0xf;       // Extract channel (0-15)
  const note = data1;                 // Note number (0-127)
  const velocity = data2;             // Velocity (0-127)

  switch (command) {
    case 9:  // Note On
      if (velocity > 0) {
        this.noteOn(channel, note, velocity);
      } else {
        this.noteOff(channel, note);   // Velocity 0 = Note Off
      }
      break;
    case 8:  // Note Off
      this.noteOff(channel, note);
      break;
  }
}
```

### Animation Layer Management

```javascript
noteOn(channel, note, velocity) {
  // Find appropriate velocity layer based on thresholds
  const velocityLayer = this.findVelocityLayer(velocity, this.animations[channel][note]);

  // Initialize channel layer if needed
  if (!this.canvasLayers[channel]) {
    this.canvasLayers[channel] = [];
  }

  // Assign animation to canvas layer
  this.canvasLayers[channel][note] = this.animations[channel][note][velocityLayer];
}
```

### Canvas Rendering Loop

```javascript
loop = () => {
	// Clear canvas
	this.canvas2dContext.fillRect(0, 0, 240, 135);

	// Render all active layers (channel 0 = background)
	this.canvasLayers.forEach(layer => {
		layer.forEach(note => {
			if (note) {
				note.play(); // Render current frame
			}
		});
	});

	requestAnimationFrame(this.loop);
};
```

### Animation Loading Pattern

```javascript
async loadAnimation(channel, note, velocityLayer) {
  const sprite = await this.loadImage(`/animations/${channel}/${note}/${velocityLayer}/sprite.png`);
  const metadata = await this.loadJSON(`/animations/${channel}/${note}/${velocityLayer}/meta.json`);

  return new AnimationLayer({
    canvas2dContext: this.canvas2dContext,
    image: sprite,
    ...metadata
  });
}
```

## Development Commands

### Build & Development

```bash
npm run dev                              # Start Vite development server
npm run build                            # Build for production
npm run preview                          # Preview production build
```

### Code Quality

```bash
npm run format:prettier                  # Format JavaScript/JSON/Markdown
npm run format:stylelint                 # Format and lint CSS
```

### Animation Management

```bash
npm run generate-animation-json-to-json  # Generate animation metadata
npm run watch:animations                 # Watch for animation changes
```

## Troubleshooting & Debugging

### Common Issues

1. **MIDI not detected**: Check browser MIDI permissions and device connections
2. **Performance drops**: Profile canvas operations and animation loading
3. **Animation not triggering**: Verify velocity layer thresholds and metadata
4. **Memory leaks**: Check for proper cleanup of event listeners and references

### Debug Tools

- Browser DevTools Performance tab for canvas profiling
- Web MIDI API console logs for device detection
- Canvas context inspection for rendering issues
- Memory tab for leak detection during extended use

### Performance Monitoring

- Monitor frame rate during live performance
- Track memory usage over time
- Profile MIDI message processing latency
- Test with multiple concurrent animations

---

This documentation is designed to help AI assistants, GitHub Copilot, and human developers understand the AKVJ architecture and contribute effectively while maintaining the project's real-time performance requirements and live performance focus.
