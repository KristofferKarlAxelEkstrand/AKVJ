# AKVJ - AI Agent Instructions

This file provides instructions for AI coding agents working with the AKVJ (Adventure Kid Video Jockey) codebase.

## Quick Reference

For detailed project guidelines, build commands, and validation steps, see the [Copilot Instructions](.github/copilot-instructions.md).

## Project Overview

AKVJ is a real-time VJ (Video Jockey) application for live performance visuals. It uses:

- **Vanilla JavaScript** - No frameworks, ES6+ modules
- **HTML5 Canvas** - 240x135 pixel-perfect rendering at 60fps
- **Web MIDI API** - Chrome/Chromium required for MIDI support
- **Custom Elements** - `<adventure-kid-video-jockey>` pattern
- **Vite** - Fast development and production builds

## Critical Constraints

### Performance Requirements

- **60fps rendering** - Never introduce blocking operations in the render loop
- **<20ms MIDI latency** - MIDI input to visual output must be near-instant
- **Memory efficiency** - Properly clean up animation resources

### Architecture Rules

- **Vanilla JS only** - Do not introduce frameworks
- **ES6+ modules** - Use import/export syntax
- **Chrome/Chromium only** - Web MIDI API dependency

## Key Files

| File                                     | Purpose                                  |
| ---------------------------------------- | ---------------------------------------- |
| `src/js/core/AdventureKidVideoJockey.js` | Main VJ component (custom element)       |
| `src/js/midi-input/midi.js`              | Web MIDI API with hot-plug support       |
| `src/js/visuals/Renderer.js`             | 60fps canvas rendering loop              |
| `src/js/visuals/LayerManager.js`         | Visual layer state management            |
| `src/js/visuals/AnimationLoader.js`      | Sprite and metadata loading              |
| `src/js/visuals/AnimationLayer.js`       | Individual animation playback            |
| `src/js/utils/Fullscreen.js`             | Fullscreen toggle (enter/space/dblclick) |

## Common Commands

```bash
npm run dev          # Start development server (localhost:5173)
npm run build        # Production build (<1 second)
npm run lint         # Check code quality
npm run lint:fix     # Auto-fix lint issues
npm run format:prettier # Format JS/JSON/Markdown
npm run format:stylelint # Format & lint CSS
npm run generate-animation-json-to-json # Rebuild animation metadata
```

## MIDI Mapping

- **Channel (0-15)** → Layer selection
- **Note (0-127)** → Animation selection
- **Velocity (0-127)** → Animation variant/intensity

## Animation Structure

Animations live in `src/public/animations/` organized as:

```
animations/{channel}/{note}/{velocity}/
  ├── meta.json       # Frame count, timing
  └── *.png           # Sprite frames
```

## Code Style

- Pre-commit hooks run ESLint + Prettier automatically
- Use `const` over `let` where possible
- Keep functions small and focused
- Document complex logic with comments

## Developer workflow

This quick workflow provides a recommended starting point for development and debugging.

1. Install and verify dependencies

```bash
git clone https://github.com/KristofferKarlAxelEkstrand/AKVJ.git
cd AKVJ
npm install
```

2. Start development server (HMR enabled)

```bash
npm run dev
```

3. Lint, format and test before committing

```bash
npm run format:prettier        # format code
npm run lint:fix               # lint and auto-fix
npm run test                   # run unit tests
npm run build                  # ensure build succeeds
```

4. Pre-commit hooks and IDE tooling

- A Husky pre-commit hook runs `lint-staged` to auto-format and lint staged files.
- Workspace VS Code settings enable `editor.formatOnSave` and `editor.codeActionsOnSave` for quick formatting and fixing on save.

## Troubleshooting

Common issues and steps to investigate:

- Web MIDI API not available
    - The Web MIDI API is only supported in Chrome/Chromium. Ensure you run the app in Chrome.
    - Check `navigator.requestMIDIAccess` in the console and ensure you have granted permission.
    - Verify MIDI device is connected. Use `getConnectedDevices()` from the `midi` singleton to list device names.

- Black canvas or animations not loading
    - Confirm `src/public/animations/animations.json` exists and was generated: `npm run generate-animation-json-to-json`.
    - Look for the console message: "JSON for animations loaded".
    - Verify the build step was successful and static assets are present.

- MIDI input not triggering visuals
    - Check browser console for `WebMIDI supported` and connected input logs at boot.
    - Ensure your device reports MIDI Note On/Off events (inspect input messages via the browser DevTools console or a MIDI monitor).
    - If using a virtual MIDI device, ensure system-level drivers and routing are configured properly.

- Performance issues / dropped frames
    - Confirm you are not running CPU-heavy work in the render loop. Keep 60fps by profiling canvas draw operations.
    - Monitor memory usage and remove unused animation layers via `LayerManager` to reduce memory churn.

- Prettier/ESLint failing in CI
    - Locally run `npm run format:prettier` and `npm run lint:fix` to auto-correct style issues.
    - If CI fails on GitHub Action `npx prettier --check .`, run the same locally to get details.

- Dev server port conflicts
    - If port 5173 is in use, Vite may start on 5174. Use `--port` or set the `server.port` in `vite.config.js` to a fixed port.

If you still have trouble, check the docs in `docs/`, review browser console logs and create an issue with relevant logs and reproduction steps.
