# AKVJ - Adventure Kid Video Jockey

A real-time VJ (Video Jockey) application for live visual performances, built with vanilla JavaScript, Web MIDI API, and HTML5 Canvas. AKVJ delivers pixel-perfect 240x135 graphics at 60fps with low-latency MIDI response, making it ideal for live music performances and interactive visual art.

## Core Concept

AKVJ transforms MIDI input into layer-grouped visual animations using a sophisticated channel-note-velocity mapping system:

- **MIDI Channel (1-16)**: Determines layer group and function:
    - Channels 1-4: Layer Group A (primary clip deck)
    - Channel 5: Mixer (B&W bitmask for Layer Group A and Layer Group B crossfading)
    - Channels 6-9: Layer Group B (secondary clip deck)
    - Channel 10: Mixed output effects (applied to mixed Layer Group A and Layer Group B output)
    - Channels 11-12: Layer Group C (overlay layer for logos, persistent graphics)
    - Channel 13: Global effects (applied to entire output after Layer Group C)
    - Channels 14-16: Reserved
- **MIDI Note (0-127)**: Selects specific animation within a channel
- **MIDI Velocity (0-127)**: Chooses velocity variant for dynamic expression

### Effects System

- **Channel 10 (Mixed output effects)**: Applied to mixed Layer Group A and Layer Group B output
    - Notes 0-15: Split effects
    - Notes 16-31: Mirror effects
    - Notes 32-47: Offset effects
    - Notes 48-63: Color effects (invert, posterize)
    - Notes 64-79: Glitch effects
    - Notes 80-95: Strobe effects

    - Strobe behavior: velocities control strobe intensity and pulse rate. Velocities 1–9 trigger a full-frame white‑out flash; velocities 10–19 → 1 pulse/beat, 20–29 → 2 pulses/beat, … up to 120–127 → 12 pulses/beat. Strobe is **BPM‑synced and deterministic**, and the duty cycle varies slightly within each 10‑velocity bucket for musical variation (approx. 25–50% duty).

- **Channel 13 (Global effects)**: Same effects applied to entire output after Layer Group C

Velocity controls effect intensity (1-127).

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
- **LayerManager**: Manages visual layer groups and animation state based on MIDI input
- **Renderer**: Handles the 60fps canvas rendering loop using requestAnimationFrame
- **AnimationLoader**: Loads PNG sprites and JSON metadata from the animation system
- **AnimationClip**: Manages individual sprite animation playback and frame timing
- **MIDI Handler**: Processes Web MIDI API events and maps them to visual layer groups

### Data Flow

1. **MIDI Input** → Web MIDI API captures note on/off events
2. **Event Processing** → MIDI handler extracts channel, note, and velocity
3. **Layer Group Management** → LayerManager activates/deactivates animation clips
4. **Frame Rendering** → Renderer draws all active clips to 240x135 canvas at 60fps

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

AKVJ uses a sophisticated animation system based on PNG sprite sheets and JSON metadata, organized by MIDI channel, note, and velocity variants.

### Directory Structure

> **Note:** Source folder names use 1-16 (matching DAW channel display). The build pipeline automatically converts to 0-15 for code.

```
animations/                 # Source animation assets (editable, version controlled)
├── {channel}/              # Channel folder (1-16, matching DAW display)
│   ├── {note}/             # MIDI note (0-127)
│   │   ├── {velocity}/     # Velocity variant (0-127)
│   │   │   ├── sprite.png  # PNG sprite sheet (source)
│   │   │   └── meta.json   # Animation metadata

.cache/animations/          # Optimized assets (generated, git-ignored)
├── {channel}/{note}/{velocity}/
│   ├── sprite.png          # Optimized PNG
│   └── sprite.png.hash     # Source file hash for change detection
└── animations.json         # Generated animation index

src/public/animations/      # Final build output (generated, git-ignored)
└── [Same structure as .cache/animations/]
```

The animation pipeline automatically:

- Validates source animations in `animations/`
- Optimizes PNGs and caches them in `.cache/animations/`
- Generates `animations.json` metadata index
- Copies optimized assets to `src/public/animations/` for the application

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
- **`frameDurationBeats`**: BPM-synced timing - beats per frame (number or array)
- **`bitDepth`**: For mask animations - controls crossfade levels (1, 2, 4, or 8)

### BPM Sync

Animations can sync to tempo using `frameDurationBeats`:

```json
{
    "frameDurationBeats": 0.5
}
```

This plays each frame for half a beat (250ms at 120 BPM). When MIDI clock is active, animations lock to the clock pulses (24 PPQN) for tight synchronization. The PPQN value (default 24) is configurable via `settings.midi.ppqn`.

### Velocity Variants

Each note can contain multiple velocity variants for dynamic expression:

```
| Velocity Range | Variant | Use Case |
|----------------|---------|----------|
| 1-63          | 0       | Soft touch |
| 64-127        | 6       | Hard hit |
```

The system automatically selects the appropriate velocity variant based on MIDI input velocity.

Velocity selection rules

- The highest defined velocity variant that does not exceed the MIDI input velocity will be chosen (e.g., if variants are defined at 40 and 80, an input velocity of 60 will select 40).
- If the input velocity is lower than the lowest defined velocity variant, the note will be ignored (no variant is activated).
- To change this behavior (for example, to always fallback to the lowest variant), modify `findVelocityThreshold` in `src/js/utils/velocitySelection.js`.

### Building Animation Index

```bash
npm run animations
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
│   │   ├── core/AdventureKidVideoJockey.js  # Main VJ component
│   │   ├── midi-input/midi.js     # Web MIDI API integration
│   │   ├── visuals/LayerManager.js  # Visual layer management
│   │   ├── visuals/Renderer.js      # Canvas rendering loop
│   │   ├── visuals/AnimationLoader.js      # Sprite and metadata loading
│   │   ├── visuals/AnimationClip.js        # Individual animation playback
│   │   ├── visuals/MaskManager.js          # Layer Group A and Layer Group B crossfade masks
│   │   ├── visuals/EffectsManager.js       # Visual effects
│   │   ├── core/settings.js             # Configuration constants
│   │   ├── core/AppState.js            # Global state management
│   │   ├── utils/Fullscreen.js         # Fullscreen functionality
│   │   ├── utils/DebugOverlay.js       # Debug overlay
│   │   └── utils/velocitySelection.js  # Velocity-based animation selection
│   └── public/
│       └── animations/             # Animation assets
│           ├── {channel}/          # Channel folders (0-15, auto-converted from source)
│           │   └── {note}/         # MIDI notes (0-127)
│           │       └── {velocity}/ # Velocity variants
│           └── animations.json     # Generated animation index
├── scripts/animations/             # Animation pipeline (validate, optimize, generate)
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

### Git Hooks

This project uses **Husky** and **lint-staged** to automatically run linting and formatting on staged files before each commit. No manual setup required after `npm install`.

### Animation Management

```bash
npm run animations                       # Build animation pipeline (validate, optimize, generate)
npm run animations:watch                 # Watch for animation changes and rebuild
npm run animations:clean                 # Remove cache and generated output
npm run animations:new                   # Create new animation scaffold (requires channel/note/velocity args)
npm run animations:spritesheet           # Generate sprite sheet from frames (requires input/output paths)
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

1. **Create animation scaffold**: Run `npm run animations:new -- {channel} {note} {velocity}`
2. **Add PNG sprite sheet**: Place frame-based animation in the created directory
3. **Update metadata**: Edit the generated `meta.json` with correct frame count and timing
4. **Rebuild pipeline**: Run `npm run animations` to validate, optimize, and generate the animation index
5. **Test**: Use the development server to test your animations

Alternatively, if you have individual frame files:

1. **Generate sprite sheet**: Run `npm run animations:spritesheet -- ./frames-folder ./animations/{channel}/{note}/{velocity}`
2. **Rebuild pipeline**: Run `npm run animations`

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
