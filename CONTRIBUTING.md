# Contributing to AKVJ

Thank you for your interest in contributing to AKVJ! This document provides guidelines and information for contributors.

## Code of Conduct

Be respectful and constructive. We welcome contributors of all skill levels.

## Getting Started

### Prerequisites

- Node.js 18+
- Chrome or Chromium browser (Web MIDI API requirement)
- MIDI device (optional, for testing)

### Setup

```bash
git clone https://github.com/KristofferKarlAxelEkstrand/AKVJ.git
cd AKVJ
npm install
npm run dev
```

## Development Workflow

### 1. Create a Branch

```bash
git checkout -b feature/your-feature-name
# or
git checkout -b fix/your-bug-fix
```

### 2. Make Changes

- Follow the existing code style (vanilla JavaScript, ES6+ modules)
- Keep functions small and focused
- Add comments for complex logic

### Editor & Formatting

We recommend using VS Code with the recommended extensions to automatically format and lint code on save. The project includes `.vscode/settings.json` and `.vscode/extensions.json` which configure:

- `editor.formatOnSave` with Prettier as default formatter
- `editor.codeActionsOnSave` enabled to allow ESLint auto-fix on save
- A `pre-commit` Husky hook that runs `lint-staged` to auto-format and lint staged files

Recommended extensions (already suggested in `.vscode/extensions.json`):

- `esbenp.prettier-vscode` (Prettier)
- `dbaeumer.vscode-eslint` (ESLint)

#### Install recommended extensions

To install the recommended extensions locally for this workspace, open the Extensions pane in VS Code and search for each one; OR run the following commands on machines with the VS Code `code` CLI installed:

```bash
code --install-extension esbenp.prettier-vscode
code --install-extension dbaeumer.vscode-eslint
```

If you prefer to enable these settings globally rather than per-workspace, open **Preferences › Settings**, use the JSON editor, and add the following global settings:

```json
{
    "editor.formatOnSave": true,
    "editor.defaultFormatter": "esbenp.prettier-vscode",
    "editor.codeActionsOnSave": {
        "source.fixAll": true,
        "source.fixAll.eslint": true
    }
}
```

### 3. Test Your Changes

```bash
npm run test          # Run unit tests
npm run lint          # Check code quality
npm run build         # Verify build works
npm run dev           # Test in browser
```

**Manual testing checklist:**

- [ ] Application loads with black canvas
- [ ] Console shows "JSON for animations loaded"
- [ ] 60fps rendering is maintained
- [ ] MIDI input works (if applicable)

### 4. Commit

Pre-commit hooks will automatically run ESLint and Prettier on staged files.

```bash
git add .
git commit -m "feat: add your feature description"
```

Use conventional commit messages:

- `feat:` - New feature
- `fix:` - Bug fix
- `docs:` - Documentation changes
- `refactor:` - Code refactoring
- `perf:` - Performance improvement
- `chore:` - Maintenance tasks

### 5. Submit a Pull Request

Push your branch and open a PR against `main`.

## Architecture Guidelines

### Performance Requirements

- **60fps rendering** - Never block the render loop
- **<20ms MIDI latency** - Keep input-to-visual response instant
- **Memory efficiency** - Clean up resources properly

### Code Constraints

- **Vanilla JavaScript only** - No frameworks
- **ES6+ modules** - Use `import`/`export`
- **Chrome/Chromium only** - Web MIDI API dependency

### Key Files

| File                                | Purpose                              |
| ----------------------------------- | ------------------------------------ |
| `src/js/midi-input/midi.js`         | Web MIDI API handling                |
| `src/js/visuals/Renderer.js`        | 60fps canvas loop with compositing   |
| `src/js/visuals/LayerManager.js`    | Coordinates all layer groups         |
| `src/js/visuals/LayerGroup.js`      | Animation slots per layer            |
| `src/js/visuals/AnimationLoader.js` | Sprite loading with concurrency      |
| `src/js/visuals/AnimationLayer.js`  | Animation playback (FPS or BPM sync) |
| `src/js/visuals/MaskManager.js`     | A/B layer crossfade masks            |
| `src/js/visuals/EffectsManager.js`  | Visual effects                       |
| `src/js/core/AppState.js`           | Event-based state management         |

## Adding Animations

Animations go in `animations/{channel}/{note}/{velocity}/` (source folder, not `src/public/`):

> **Note:** Source folder names use 1-16 (matching DAWs). The build pipeline converts to 0-15 for code.

```
animations/0/60/0/
  ├── meta.json       # Animation metadata
  └── sprite.png      # Sprite sheet with all frames
```

This example is for DAW Channel 1, Note 60, Velocity layer 0.

After adding animations:

```bash
npm run animations
```

Notes on velocity layer behavior:

- When creating velocity variants for a note, remember the runtime mapping selects the highest configured velocity layer that is <= incoming MIDI velocity. If an input is lower than the lowest configured velocity, the note will not activate any layer (the event is ignored). If you want the system to always select the closest or lowest velocity layer, update `LayerManager.#findVelocityLayer`.

## Questions?

Open an issue or check existing documentation in:

- `README.md` - Project overview
- `.github/copilot-instructions.md` - Detailed development guide
- `AGENTS.md` - AI agent instructions

## License

By contributing, you agree that your contributions will be licensed under the MIT License.
