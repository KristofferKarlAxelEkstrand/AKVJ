# AKVJ - Adventure Kid Video Jockey

A real-time VJ (Video Jockey) application for live visual performances, built with vanilla JavaScript, Web MIDI API, and HTML5 Canvas. AKVJ delivers pixel-perfect 240x135 graphics at 60fps with low-latency MIDI response, making it ideal for live music performances and interactive visual art.

## Core Concept

AKVJ transforms MIDI input into layer-grouped visual clips using a sophisticated channel-note-velocity mapping system:

- **MIDI Channel (1-16)**: Determines layer group and function:
    - Channels 1-4: Layer Group A (primary clip deck)
    - Channel 5: Mixer (B&W bitmask for Layer Group A and Layer Group B crossfading)
    - Channels 6-9: Layer Group B (secondary clip deck)
    - Channel 10: Mixed output effects (applied to mixed Layer Group A and Layer Group B output)
    - Channels 11-12: Layer Group C (overlay layer for logos, persistent graphics)
    - Channel 13: Global effects (applied to entire output after Layer Group C)
    - Channels 14-16: Reserved
- **MIDI Note (0-127)**: Selects specific clip within a channel
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

Each MIDI note triggers frame-based sprite clips that blend in real-time, creating complex visual compositions perfect for live performance.

## Table of Contents

- [Core Concept](#core-concept)
- [Architecture](#architecture)
- [Technology Stack](#technology-stack)
- [Browser Requirements](#browser-requirements)
- [Installation](#installation)
- [Development](#development)
- [Clip System](#clip-system)
- [File Structure](#file-structure)
- [Build & Scripts](#build--scripts)
- [Performance](#performance)
- [Contributing](#contributing)
- [License](#license)

## Architecture

AKVJ uses a modular, component-based architecture built with vanilla JavaScript:

### Core Components

- **`<adventure-kid-video-jockey>`**: Custom HTML element serving as the main application component
- **LayerManager**: Manages visual layer groups and clip state based on MIDI input
- **Renderer**: Handles the 60fps canvas rendering loop using requestAnimationFrame
- **ClipLoader**: Loads PNG sprites and JSON metadata from the clip system
- **Clip**: Manages individual sprite clip playback and frame timing
- **MIDI Handler**: Processes Web MIDI API events and maps them to visual layer groups

### Data Flow

1. **MIDI Input** → Web MIDI API captures note on/off events
2. **Event Processing** → MIDI handler extracts channel, note, and velocity
3. **Layer Group Management** → LayerManager activates/deactivates clips
4. **Frame Rendering** → Renderer draws all active clips to 240x135 canvas at 60fps

## Technology Stack

- **Vite**: Build tool and development server
- **Vanilla JavaScript**: ES6+ modules, no frameworks
- **Web MIDI API**: Real-time MIDI input processing
- **HTML5 Canvas**: Pixel-perfect 2D rendering
- **PNG Sprites**: Frame-based clip assets
- **JSON Metadata**: Clip configuration and timing data

## Browser Requirements

**Chrome or Chromium-based browsers are required** for Web MIDI API support. Other browsers (Firefox, Safari) do not fully support the Web MIDI API and will not function properly.

## Clip System

AKVJ uses PNG sprite sheets + JSON metadata. Clips live in a **flat bucket** by `clipId`; MIDI placement is defined in `clips/set-mapping.json` (DAW channels 1–16).

### Directory Structure

```
clips/                           # Shared source bucket (version controlled)
├── {clipId}/                    # e.g. neon-skull or c1-n0-v0
│   ├── sprite.png
│   └── meta.json                # optional role: "bitmask"
├── set-mapping.json             # MIDI → clipId (channel/note/velocity)
└── LICENSE-ASSETS.md

.cache/clips/                    # Optimized assets (generated, git-ignored)
└── {clipId}/…

akvj/src/public/clips/      # Runtime assets for the VJ app (generated)
├── {clipId}/…
├── clips.json                   # Flat catalog keyed by clipId
└── set-mapping.json
```

The clip pipeline (`npm run clips`):

- Validates the flat bucket + `set-mapping.json`
- Optimizes PNGs into `.cache/clips/`
- Generates `clips.json` and copies mapping + assets into `akvj/src/public/clips/`

### Clip Metadata (JSON)

Each clip folder contains a JSON file with the following structure:

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
- **`loop`**: Whether clip loops continuously
- **`retrigger`**: Whether clip restarts when note is retriggered
- **`frameRatesForFrames`**: Custom frame rates for specific frames (frames per second)
- **`frameDurationBeats`**: BPM-synced timing - beats per frame (number or array)
- **`bitDepth`**: For mask clips - controls crossfade levels (1, 2, 4, or 8)

### BPM Sync

Clips can sync to tempo using `frameDurationBeats`:

```json
{
    "frameDurationBeats": 0.5
}
```

This plays each frame for half a beat (250ms at 120 BPM). When MIDI clock is active, clips lock to the clock pulses (24 PPQN) for tight synchronization. The PPQN value (default 24) is configurable via `settings.midi.ppqn`.

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
- To change this behavior (for example, to always fallback to the lowest variant), modify `findVelocityThreshold` in `akvj/src/js/utils/velocitySelection.js`.

### Building Clip Index

```bash
npm run clips
# or validate only:
npm run clips:validate
```

## Installation

### Prerequisites

- **Node.js 20+** (workspaces; CI uses Node 20, Nestable with Node 22)
- **Chrome or Chromium browser** (required for Web MIDI API)
- **MIDI device** (optional, for full functionality testing)

### Setup

```bash
npm install   # installs root + akvj + mainframe workspaces
```

Installation takes ~13 seconds and hoists shared tooling via npm workspaces.

## Maintenance packages

| Package      | Port               | Purpose                                        |
| ------------ | ------------------ | ---------------------------------------------- |
| `akvj/`      | 5173               | Live VJ engine (Vite, Web MIDI, 60fps render)  |
| `mainframe/` | 5174 UI · 8787 API | Clip bucket + set-mapping authoring            |
| `clips/`     | —                  | Shared source clip bucket + `set-mapping.json` |

## Development

### Start the VJ engine

```bash
npm run akvj
```

### Start Mainframe

```bash
npm run mainframe
```

### Expected Behavior

- **Initial Load**: Black canvas appears (this is the expected initial state)
- **Console Message**: "JSON for clips loaded" indicates successful setup
- **MIDI Detection**: Check browser console for Web MIDI API availability messages

### Development Workflow

1. **Code Changes**: Vite provides hot module reloading for instant updates
2. **Format Code**: `npm run format:prettier && npm run format:stylelint`
3. **Build Test**: `npm run build` to verify production build
4. **Preview**: `npm run preview` to test production build locally

## File Structure

```

AKVJ/
├── package.json # npm workspaces root
├── clips/ # Shared clip bucket + set-mapping.json
├── akvj/ # Live VJ engine
│ ├── src/ # Vite app (main.js, js/, public/)
│ ├── scripts/clips/ # Validate / optimize / generate pipeline
│ ├── test/ # Vitest unit + visual tests
│ └── package.json
├── mainframe/ # Set authoring UI + local API
│ ├── src/ # Vanilla Vite UI
│ ├── server/ # Node http/fs API (no Express)
│ └── package.json
├── docs/
└── AGENTS.md

```

## Build & Scripts

### Core Commands

```bash
npm run akvj                           # akvj VJ engine (localhost:5173)
npm run mainframe                      # mainframe UI + API (5174 / 8787)
npm run build                            # Build akvj
npm run build:all                        # clips + akvj + mainframe
npm run preview                          # Preview akvj production build
npm run test:all                         # akvj + mainframe unit tests
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

### Clip Management

```bash
npm run clips                            # Validate, optimize, generate, copy to akvj public
npm run clips:validate                   # Validate bucket + set-mapping only
npm run clips:watch                      # Watch for clip changes and rebuild
npm run clips:clean                      # Remove cache and generated output
npm run clips:new -- neon-skull          # Scaffold clips/{clipId}/meta.json
npm run clips:spritesheet                # Generate sprite sheet from frames
npm run migrate:clips                    # One-shot nested→flat migration (if needed)
```

## Performance

AKVJ is optimized for real-time visual performance:

- **60fps rendering** using requestAnimationFrame
- **240x135 pixel canvas** for retro pixel-perfect graphics
- **Low-latency MIDI response** (typically under 20ms)
- **No image smoothing** for sharp pixel art rendering
- **Modular architecture** for efficient resource management
- **Optimized sprite loading** with preloaded clip assets

## Contributing

### Adding New Clips

1. **Create clip**: `npm run clips:new -- my-clip` (or use Mainframe Upload)
2. **Add `sprite.png`** and update `meta.json` (`numberOfFrames`, `framesPerRow`, timing)
3. **Map MIDI**: edit `clips/set-mapping.json` or use Mainframe Mapping (DAW channels 1–16)
4. **Rebuild**: `npm run clips`
5. **Test**: `npm run akvj` in Chrome and trigger via MIDI

Alternatively, use `npm run mainframe` for upload + mapping + pipeline in one UI.

### Code Contributions

1. **Follow the modular architecture**: Keep components focused and separated
2. **Maintain performance**: Ensure changes don't impact 60fps rendering
3. **Format code**: Run `npm run format:prettier && npm run format:stylelint`
4. **Test in Chrome**: Verify Web MIDI API compatibility
5. **Document changes**: Update README if adding new features

### Browser Testing

Always test changes in Chrome or Chromium as AKVJ requires Web MIDI API support that other browsers lack.

## License

This project is released under a dual-license model. The source code and the clip assets are governed by separate licenses.

### Source Code

All source code in this repository (including .js, .html, .css, and .md files) is licensed under the **MIT License**. See the [LICENSE-CODE.md](LICENSE-CODE.md) file for more details.

### Clip Assets

All clip assets (including all .png and .json files under `clips/` and generated `akvj/src/public/clips/`) are **proprietary and All Rights Reserved**. These assets are included for demonstration purposes only. See [clips/LICENSE-ASSETS.md](clips/LICENSE-ASSETS.md) for the full terms.
