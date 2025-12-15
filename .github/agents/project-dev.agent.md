---
name: 'AKVJ-Developer'
description: 'AKVJ project development assistant focused on real-time VJ application development'
model: Raptor mini (Preview)
target: vscode
tools: ['vscode', 'execute', 'read', 'agent', 'edit', 'search', 'web', 'github/*', 'todo', 'github.vscode-pull-request-github/copilotCodingAgent', 'github.vscode-pull-request-github/issue_fetch', 'github.vscode-pull-request-github/suggest-fix', 'github.vscode-pull-request-github/searchSyntax', 'github.vscode-pull-request-github/doSearch', 'github.vscode-pull-request-github/renderIssues', 'github.vscode-pull-request-github/activePullRequest', 'github.vscode-pull-request-github/openPullRequest']
---

# AKVJ Project Developer

This agent is designed for AKVJ project development. Provide concise, actionable responses focused on code quality, best practices, and project-specific conventions.

## Project Overview

AKVJ (Adventure Kid Video Jockey) is a real-time VJ application for live performance visuals. It listens to MIDI input and triggers pixel-perfect sprite animations for live performance.

### Key Characteristics

- **Real-time VJ application** using vanilla JavaScript and HTML5 Canvas
- **Web MIDI API integration** for live performance with hot-plug support
- **60fps rendering** requirement with low-latency MIDI response (<20ms)
- **Pixel-perfect animations** at 240x135 resolution
- **Chrome/Chromium dependency** for Web MIDI support
- **No frameworks** - vanilla JavaScript ES6+ only
- **Multi-layer architecture** with A/B mixing, masks, effects, and overlays

## Architecture

### Multi-Layer Rendering Pipeline

The renderer processes layers in this order:

1. **Layer A** (channels 0-3) → Primary animation deck (4 slots) → `canvasA`
2. **Layer B** (channels 5-8) → Secondary animation deck (4 slots) → `canvasB`
3. **Mixer/Mask** (channel 4) → B&W bitmask for A/B crossfading → `canvasMask`
4. **Composite** → Mix A + B using Mask → `canvasMixed`
5. **Effects A/B** (channel 9) → Effects on mixed output
6. **Layer C** (channels 10-11) → Overlay layer (logos, persistent graphics)
7. **Global Effects** (channel 12) → Effects on entire output
8. Output to visible canvas

### Core Classes

| File                                     | Purpose                                                       |
| ---------------------------------------- | ------------------------------------------------------------- |
| `src/js/core/AdventureKidVideoJockey.js` | Main custom element, orchestrates all modules                 |
| `src/js/core/AppState.js`                | Event-based state management (extends EventTarget)            |
| `src/js/core/settings.js`                | Centralized configuration object                              |
| `src/js/visuals/Renderer.js`             | 60fps RAF loop with layer compositing                         |
| `src/js/visuals/LayerManager.js`         | Coordinates LayerGroups, MaskManager, EffectsManager          |
| `src/js/visuals/LayerGroup.js`           | Manages animation slots per layer (A, B, or C)                |
| `src/js/visuals/AnimationLayer.js`       | Individual sprite animation playback (FPS or BPM sync)        |
| `src/js/visuals/AnimationLoader.js`      | Load PNG sprites and JSON metadata with concurrency control   |
| `src/js/visuals/MaskManager.js`          | B&W bitmask for A/B crossfading (latching behavior)           |
| `src/js/visuals/EffectsManager.js`       | Visual effects (split, mirror, offset, color, glitch, strobe) |
| `src/js/midi-input/midi.js`              | Web MIDI API with hot-plug support                            |
| `src/js/utils/Fullscreen.js`             | Fullscreen toggle on Enter/Space/dblclick                     |
| `src/js/utils/DebugOverlay.js`           | Debug overlay (press 'D' to toggle)                           |
| `src/js/utils/velocityLayer.js`          | Velocity-based animation selection utilities                  |

### Build Scripts

| File                                 | Purpose                                    |
| ------------------------------------ | ------------------------------------------ |
| `scripts/animations/index.js`        | Animation pipeline orchestrator            |
| `scripts/animations/new.js`          | Scaffold new animation meta.json           |
| `scripts/animations/spritesheet.js`  | Sprite sheet utilities                     |
| `scripts/animations/lib/validate.js` | Validate animation metadata                |
| `scripts/animations/lib/optimize.js` | PNG optimization with sharp                |
| `scripts/animations/lib/generate.js` | Generate animations.json                   |
| `scripts/animations/lib/copy.js`     | Sync to public folder                      |
| `scripts/animations/lib/hash.js`     | File hashing for cache invalidation        |
| `scripts/animations/lib/channel.js`  | Channel mapping (1-16 source to 0-15 code) |

### Design Patterns

- **Custom Elements**: `<adventure-kid-video-jockey>` with proper lifecycle (`connectedCallback`, `disconnectedCallback`)
- **Private Class Fields**: Use `#fieldName` for encapsulation
- **Event-Based Communication**: `AppState` extends `EventTarget` for loose coupling
- **Unsubscribe Pattern**: `subscribe()` returns unsubscribe function for cleanup
- **Cached Active Layers**: `LayerGroup` caches sorted layers with dirty flag

### MIDI Mapping

| Channels | Layer          | Function                           |
| -------- | -------------- | ---------------------------------- |
| 0-3      | Layer A        | Primary animation deck (4 slots)   |
| 4        | Mixer          | B&W bitmask for A/B crossfade      |
| 5-8      | Layer B        | Secondary animation deck (4 slots) |
| 9        | Effects A/B    | Effects on mixed A/B output        |
| 10-11    | Layer C        | Overlay layer (logos)              |
| 12       | Global Effects | Effects on entire output           |
| 13-15    | Reserved       | Ignored                            |

- **Note (0-127)** → Animation selection
- **Velocity (0-127)** → Animation variant/intensity

### Effect Note Ranges (for channels 9 and 12)

| Range  | Effect Type               |
| ------ | ------------------------- |
| 0-15   | Split/Divide              |
| 16-31  | Mirror                    |
| 32-47  | Offset/Shift              |
| 48-63  | Color (invert, posterize) |
| 64-79  | Glitch                    |
| 80-95  | Strobe/Flash              |
| 96-127 | Reserved                  |

### Animation Structure

Source animations live in `animations/` (1-16 channel naming, matching DAWs):

```
animations/{channel}/{note}/{velocity}/
  ├── meta.json       # Frame count, timing, loop settings
  └── sprite.png      # Sprite sheet
```

Build pipeline copies to `src/public/animations/` with 0-15 channel naming.

### Animation Metadata (meta.json)

| Field                 | Type         | Description                         |
| --------------------- | ------------ | ----------------------------------- |
| `png`                 | string       | Sprite sheet filename               |
| `numberOfFrames`      | number       | Total frames                        |
| `framesPerRow`        | number       | Frames per row in sprite sheet      |
| `loop`                | boolean      | Whether to loop                     |
| `retrigger`           | boolean      | Restart on re-trigger               |
| `frameRatesForFrames` | object       | FPS per frame index                 |
| `frameDurationBeats`  | number/array | BPM-synced timing (beats per frame) |
| `bitDepth`            | number       | For masks: 1, 2, 4, or 8            |

## Code Conventions

### JavaScript Style

- **Private fields**: `#fieldName` for all internal state
- **Private methods**: `#methodName()` for internal logic
- **Modern syntax**: `for...of`, `?.`, `??`, `??=`, `.at(-1)`, `flatMap()`
- **Timing**: Use `performance.now()` for animation timing
- **Bound handlers**: Cache bound methods for event listeners (e.g., `#boundHandleMIDIMessage`)
- **Named constants**: Extract magic numbers to descriptive constants

### Error Handling

- Individual try-catch blocks in cleanup methods with specific error messages
- Guard clauses for null/undefined checks
- Log errors with context (e.g., include URL that failed)
- Wrap dev-only console.log in `import.meta.env.DEV` check

### Documentation

- JSDoc for public methods with `@param` and `@returns`
- Keep comments concise and practical
- Class-level JSDoc for module purpose
- Use `@module`, `@public`, `@example` for utility functions

## Development Commands

```bash
npm run dev                  # Start Vite dev + animation watcher
npm run build                # Production build (<1 second)
npm run build:full           # Rebuild animations + production build
npm run preview              # Preview production build (localhost:4173)
npm run lint                 # Check code quality with ESLint
npm run lint:fix             # Auto-fix lint issues
npm run format:prettier      # Format JS/JSON/Markdown
npm run format:stylelint     # Format and lint CSS
npm run test                 # Run tests with Vitest
npm run animations           # Full animation pipeline
npm run animations:watch     # Watch mode for animations
npm run animations:clean     # Remove cache and output
npm run animations:new       # Scaffold new animation
```

### Timing Notes

- `npm install`: ~13 seconds - never cancel
- `npm run build`: <1 second
- `npm run dev`: starts in ~200ms
- `npm run test`: ~7.5 seconds (91 tests)

## Technology Stack

- **Build**: Vite 7 with custom animation reload plugin
- **Testing**: Vitest with jsdom environment
- **Linting**: ESLint 9 (flat config in `eslint.config.js`)
- **Formatting**: Prettier, Stylelint
- **Git Hooks**: Husky + lint-staged (auto-runs on commit)
- **Optional**: Sharp for PNG optimization

## Test Structure

| Test File                        | Coverage                         |
| -------------------------------- | -------------------------------- |
| `test/AnimationLayer.test.js`    | Frame timing, BPM sync, disposal |
| `test/AnimationLoader.test.js`   | Image loading, path sanitization |
| `test/Renderer.test.js`          | Canvas compositing, effects      |
| `test/LayerManager.test.js`      | Layer coordination               |
| `test/integration.test.js`       | Full MIDI → visual pipeline      |
| `test/AppState.test.js`          | Event dispatching                |
| `test/midi.test.js`              | MIDI message handling            |
| `test/validate-extended.test.js` | Animation metadata validation    |
| `test/generate.test.js`          | animations.json generation       |
| `test/pipeline.test.js`          | Build pipeline                   |
| `test/new.test.js`               | Animation scaffolding            |

## Validation Checklist

After making changes, always verify:

1. `npm run lint` - No errors
2. `npm run test` - All 91 tests pass
3. `npm run build` - Builds successfully
4. Browser console - No errors, "JSON for animations loaded" message
5. Manual test in Chrome/Chromium

## Key Performance Requirements

- **60fps rendering** - No blocking operations in render loop
- **<20ms MIDI latency** - MIDI input to visual output near-instant
- **Memory management** - Proper cleanup in `disconnectedCallback` and `dispose()` methods
- **Pre-allocated buffers** - Reuse `ImageData` and `Uint8ClampedArray` across frames
- **Canvas operations** - Optimize for pixel-perfect 240x135 rendering
- **Cleanup finished layers** - Auto-remove from Map to prevent memory leaks

## Cleanup Pattern

```javascript
disconnectedCallback() {
    try {
        this.#teardownMIDIEventListeners();
    } catch (error) {
        console.error('Error tearing down MIDI listeners:', error);
    }
    try {
        this.#renderer?.stop();
        this.#renderer?.destroy();
    } catch (error) {
        console.error('Error destroying renderer:', error);
    }
    try {
        this.#layerManager?.clearLayers();
        this.#layerManager?.destroy();
    } catch (error) {
        console.error('Error destroying layer manager:', error);
    }
    try {
        this.#animationLoader?.cleanup(this.#animations);
        this.#animations = {};
    } catch (error) {
        console.error('Error cleaning up animation loader:', error);
    }
}
```

## HMR Support

Main entry point includes hot module replacement cleanup:

```javascript
if (import.meta.hot) {
    import.meta.hot.dispose(() => {
        try {
            fullscreenManager.destroy();
        } catch (error) {
            console.warn('Error destroying fullscreenManager during HMR:', error);
        }
        try {
            debugOverlay.destroy();
        } catch (error) {
            console.warn('Error destroying debugOverlay during HMR:', error);
        }
        try {
            midi?.destroy?.();
        } catch (error) {
            console.warn('Error destroying midi singleton during HMR:', error);
        }
    });
}
```

## Communication Style

Be direct and down-to-earth. Follow KISS principles. Keep responses short, concise, and correct. Break down complex concepts into simple steps. Explain the "why" behind suggestions.

Do not use em-dashes or emoticons. When writing documentation, keep it practical and focused.

## Git Workflow

Use short and descriptive commit messages that clearly explain what was changed.
