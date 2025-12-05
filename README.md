# AKVJ - Adventure Kid Video Jockey

A real-time VJ (Video Jockey) application for live visual performances, built with vanilla JavaScript, Web MIDI API, and HTML5 Canvas. AKVJ delivers pixel-perfect 240x135 graphics at 60fps with low-latency MIDI response, making it ideal for live music performances and interactive visual art.

## Core Concept

AKVJ transforms MIDI input into layered visual animations using a sophisticated channel-note-velocity mapping system:

- **MIDI Channel (0-15)**: Determines visual layer depth (0 = background, 15 = foreground)
- **MIDI Note (0-127)**: Selects specific animation within a channel
- **MIDI Velocity (0-127)**: Chooses velocity layer variant for dynamic expression

Each MIDI note triggers frame-based sprite animations that blend in real-time, creating complex visual compositions perfect for live performance.

## Table of Contents

- [Core Concept](#core-concept)
- [Architecture](#architecture)
- [Technology Stack](#technology-stack)
- [Browser Requirements](#browser-requirements)
- [Installation](#installation)
- [Development](#development)
- [Animation System](#animation-system)
- [File Structure](#file-structure)
- [Build & Scripts](#build--scripts)
- [Performance](#performance)
- [Contributing](#contributing)
- [License](#license)

## Architecture

AKVJ uses a modular, component-based architecture built with vanilla JavaScript:

### Core Components

- **`<adventure-kid-video-jockey>`**: Custom HTML element serving as the main application component
- **LayerManager**: Manages visual layers and animation state based on MIDI input
- **Renderer**: Handles the 60fps canvas rendering loop using requestAnimationFrame
- **AnimationLoader**: Loads PNG sprites and JSON metadata from the animation system
- **AnimationLayer**: Manages individual sprite animation playback and frame timing
- **MIDI Handler**: Processes Web MIDI API events and maps them to visual layers

### Data Flow

1. **MIDI Input** → Web MIDI API captures note on/off events
2. **Event Processing** → MIDI handler extracts channel, note, and velocity
3. **Layer Management** → LayerManager activates/deactivates animation layers
4. **Frame Rendering** → Renderer draws all active layers to 240x135 canvas at 60fps

## Technology Stack

- **Vite**: Build tool and development server
- **Vanilla JavaScript**: ES6+ modules, no frameworks
- **Web MIDI API**: Real-time MIDI input processing
- **HTML5 Canvas**: Pixel-perfect 2D rendering
- **PNG Sprites**: Frame-based animation assets
- **JSON Metadata**: Animation configuration and timing data

## Browser Requirements

**Chrome or Chromium-based browsers are required** for Web MIDI API support. Other browsers (Firefox, Safari) do not fully support the Web MIDI API and will not function properly.

## Animation System

AKVJ uses a sophisticated animation system based on PNG sprite sheets and JSON metadata, organized by MIDI channel, note, and velocity layers.

### Directory Structure

```
src/public/animations/
├── {channel}/          # MIDI channel (0-15)
│   ├── {note}/         # MIDI note (0-127)
│   │   ├── {velocity}/ # Velocity layer (0-127)
│   │   │   ├── sprite.png  # PNG sprite sheet
│   │   │   └── meta.json   # Animation metadata
```

### Animation Metadata (JSON)

Each animation folder contains a JSON file with the following structure:

```json
{
	"numberOfFrames": 64,
	"framesPerRow": 8,
	"loop": true,
	"retrigger": true,
	"frameRatesForFrames": {
		"0": 2,
		"32": 4
	}
}
```

### Properties

- **`numberOfFrames`**: Total frames in the sprite sheet
- **`framesPerRow`**: Frames per horizontal row in the sprite sheet
- **`loop`**: Whether animation loops continuously
- **`retrigger`**: Whether animation restarts when note is retriggered
- **`frameRatesForFrames`**: Custom frame rates for specific frames (frames per second)

### Velocity Layers

Each note can contain multiple velocity layers for dynamic expression:

```
| Velocity Range | Layer | Use Case |
|----------------|-------|----------|
| 1-63          | 0     | Soft touch |
| 64-127        | 6     | Hard hit |
```

The system automatically selects the appropriate velocity layer based on MIDI input velocity.

### Building Animation Index

```bash
npm run generate-animation-json-to-json
```

This command scans the animation directory structure and builds `src/public/animations/animations.json`, which contains the master index of all available animations.

## Installation

### Prerequisites

- **Node.js** (any recent version - tested with Node 18+)
- **Chrome or Chromium browser** (required for Web MIDI API)
- **MIDI device** (optional, for full functionality testing)

### Setup

```bash
npm install
```

Installation takes approximately 13 seconds and installs all development dependencies including Vite, Prettier, and Stylelint.

## Development

### Start Development Server

```bash
npm run dev
```

This starts the Vite development server at `http://localhost:5173/`. Open this URL in Chrome or Chromium to access the application.

### Expected Behavior

- **Initial Load**: Black canvas appears (this is the expected initial state)
- **Console Message**: "JSON for animations loaded" indicates successful setup
- **MIDI Detection**: Check browser console for Web MIDI API availability messages

### Development Workflow

1. **Code Changes**: Vite provides hot module reloading for instant updates
2. **Format Code**: `npm run format:prettier && npm run format:stylelint`
3. **Build Test**: `npm run build` to verify production build
4. **Preview**: `npm run preview` to test production build locally

## File Structure

```
AKVJ/
├── src/
│   ├── main.js                     # Application entry point
│   ├── index.html                  # Main HTML template
│   ├── css/                        # Stylesheets
│   ├── js/                         # Core JavaScript modules
│   │   ├── adventure-kid-video-jockey.js  # Main VJ component
│   │   ├── midi.js                 # Web MIDI API integration
│   │   ├── LayerManager.js         # Visual layer management
│   │   ├── Renderer.js             # Canvas rendering loop
│   │   ├── AnimationLoader.js      # Sprite and metadata loading
│   │   ├── AnimationLayer.js       # Individual animation playback
│   │   ├── settings.js             # Configuration constants
│   │   ├── app-state.js            # Global state management
│   │   └── fullscreen.js           # Fullscreen functionality
│   └── public/
│       └── animations/             # Animation assets
│           ├── {channel}/          # MIDI channels (0-15)
│           │   └── {note}/         # MIDI notes (0-127)
│           │       └── {velocity}/ # Velocity layers
│           └── animations.json     # Generated animation index
├── generateAnimationsJson.js       # Animation index builder
├── vite.config.js                 # Vite build configuration
└── package.json                   # Dependencies and scripts
```

## Build & Scripts

### Core Commands

```bash
npm run dev                              # Start development server
npm run build                            # Build for production
npm run preview                          # Preview production build
```

### Code Quality

```bash
npm run lint                             # Lint JavaScript with ESLint
npm run lint:fix                         # Lint and auto-fix issues
npm run format:prettier                  # Format JS/JSON/Markdown
npm run format:stylelint                 # Format and fix CSS
```

### Animation Management

```bash
npm run generate-animation-json-to-json  # Build animation index
npm run watch:animations                 # Watch for animation changes
```

### Dependency Management

```bash
npm run fix                              # Update all dependencies (CAUTION: Modifies package.json and package-lock.json, may introduce breaking changes)
```

## Performance

AKVJ is optimized for real-time visual performance:

- **60fps rendering** using requestAnimationFrame
- **240x135 pixel canvas** for retro pixel-perfect graphics
- **Low-latency MIDI response** (typically under 20ms)
- **No image smoothing** for sharp pixel art rendering
- **Modular architecture** for efficient resource management
- **Optimized sprite loading** with preloaded animation assets

## Contributing

### Adding New Animations

1. **Create directory structure**: `src/public/animations/{channel}/{note}/{velocity}/`
2. **Add PNG sprite sheet**: Frame-based animation with consistent frame size
3. **Add JSON metadata**: Define frames, timing, and behavior properties
4. **Rebuild index**: Run `npm run generate-animation-json-to-json`
5. **Test**: Use the development server to test your animations

### Code Contributions

1. **Follow the modular architecture**: Keep components focused and separated
2. **Maintain performance**: Ensure changes don't impact 60fps rendering
3. **Format code**: Run `npm run format:prettier && npm run format:stylelint`
4. **Test in Chrome**: Verify Web MIDI API compatibility
5. **Document changes**: Update README if adding new features

### Browser Testing

Always test changes in Chrome or Chromium as AKVJ requires Web MIDI API support that other browsers lack.

## License

This project is released under a dual-license model. The source code and the animation assets are governed by separate licenses.

### Source Code

All source code in this repository (including .js, .html, .css, and .md files) is licensed under the **MIT License**. See the [LICENSE-CODE.md](LICENSE-CODE.md) file for more details.

### Animation Assets

All animation assets (including all .png and .json files located in the `src/public/animations/` directory) are **proprietary and All Rights Reserved**. These assets are included for demonstration purposes only. See the [LICENSE-ASSETS.md](src/public/animations/LICENSE-ASSETS.md) file for the full terms.
