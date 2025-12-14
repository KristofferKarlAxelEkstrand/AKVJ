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

| File                                     | Purpose                                       |
| ---------------------------------------- | --------------------------------------------- |
| `src/js/core/AdventureKidVideoJockey.js` | Main VJ component (custom element)            |
| `src/js/midi-input/midi.js`              | Web MIDI API with hot-plug support            |
| `src/js/visuals/Renderer.js`             | 60fps canvas rendering with layer compositing |
| `src/js/visuals/LayerManager.js`         | Coordinates LayerGroups, Mask, Effects        |
| `src/js/visuals/LayerGroup.js`           | Animation slots per layer (A, B, C)           |
| `src/js/visuals/AnimationLoader.js`      | Sprite and metadata loading                   |
| `src/js/visuals/AnimationLayer.js`       | Animation playback (FPS or BPM sync)          |
| `src/js/visuals/MaskManager.js`          | B&W bitmask for A/B crossfading               |
| `src/js/visuals/EffectsManager.js`       | Visual effects (split, mirror, glitch)        |
| `src/js/core/AppState.js`                | Event-based state management (EventTarget)    |
| `src/js/utils/Fullscreen.js`             | Fullscreen toggle (enter/space/dblclick)      |
| `src/js/utils/DebugOverlay.js`           | Debug overlay (press 'D' to toggle)           |

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

### Channel → Layer Assignment

Channels shown as displayed in DAWs (1-16). Source folders use 1-16; the build pipeline converts to 0-15 for code.

| Channels | Layer          | Function                      |
| -------- | -------------- | ----------------------------- |
| 1-4      | A              | Primary animation deck        |
| 5        | Mixer          | B&W bitmask for A/B crossfade |
| 6-9      | B              | Secondary animation deck      |
| 10       | Effects A/B    | Effects on mixed A/B output   |
| 11-12    | C              | Overlay layer (logos)         |
| 13       | Global Effects | Effects on entire output      |
| 14-16    | Reserved       | Ignored                       |

### Note/Velocity

- **Note (0-127)** → Animation selection
- **Velocity (0-127)** → Animation variant/intensity

## Animation Metadata

Key fields in `meta.json`:

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

## Animation Structure

Source animations live in `animations/` (build pipeline copies to `src/public/animations/`):

> **Note:** Source folder names use 1-16 (matching DAWs). The build pipeline converts to 0-15 for code output.

```
animations/{channel}/{note}/{velocity}/
  ├── meta.json       # Animation metadata
  └── sprite.png      # Sprite sheet
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

### Git push / GITHUB_TOKEN issues

If you encounter permission errors when trying to push commits from a dev container or remote environment (e.g., "403: The requested URL returned error: 403"), here are common causes and quick fixes.

- Symptom: `git push` fails with 403/permission denied or the remote rejects the push.
    - Cause: The environment has an exported `GITHUB_TOKEN` or other restricted token that the Git CLI uses with HTTPS remotes, and that token lacks write permission for the repository/branch.

- Quick fixes (Bash):

```bash
# Unset an environment token temporarily for this shell session
unset GITHUB_TOKEN

# Verify remote URL — prefer SSH for pushing if you have an SSH key
git remote -v

# If using SSH, ensure SSH key is loaded and test:
ssh -T git@github.com

# Use GitHub CLI to log in with your user credentials (recommended)
gh auth login

# As a last resort (not recommended for security): push with an HTTPS PAT inline (avoid committing this):
# git push https://<YOUR_PERSONAL_ACCESS_TOKEN>@github.com/OWNER/REPO.git
```

- Other tips:
    - If you use a dev container or CI, the container may have `GITHUB_TOKEN` set by Actions or system configuration. Unset it and re-run push if your local credentials are configured.
    - Use `gh auth login` to set up an authenticated session with the GitHub CLI; this will use the correct token or SSH under the hood.
    - Confirm your GitHub account has write permissions on the repository and branch.
    - If the remote is set using HTTPS but you wish to use SSH, change the remote: `git remote set-url origin git@github.com:OWNER/REPO.git`.

If you still can't push, please capture the exact error and context (remote URL, `git remote -v`, and the output of `ssh -T git@github.com`), then create an issue with those details so a maintainer can assist.

If you still have trouble, check the docs in `docs/`, review browser console logs and create an issue with relevant logs and reproduction steps.
