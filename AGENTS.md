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

| File                                     | Purpose                            |
| ---------------------------------------- | ---------------------------------- |
| `src/js/core/AdventureKidVideoJockey.js` | Main VJ component (custom element) |
| `src/js/midi.js`                         | Web MIDI API with hot-plug support |
| `src/js/visuals/Renderer.js`             | 60fps canvas rendering loop        |
| `src/js/visuals/LayerManager.js`         | Visual layer state management      |
| `src/js/visuals/AnimationLoader.js`      | Sprite and metadata loading        |
| `src/js/visuals/AnimationLayer.js`       | Individual animation playback      |

## Common Commands

```bash
npm run dev          # Start development server (localhost:5173)
npm run build        # Production build (<1 second)
npm run lint         # Check code quality
npm run lint:fix     # Auto-fix lint issues
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
