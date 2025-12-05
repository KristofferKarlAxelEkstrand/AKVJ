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

### 3. Test Your Changes

```bash
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

| File                        | Purpose               |
| --------------------------- | --------------------- |
| `src/js/midi.js`            | Web MIDI API handling |
| `src/js/Renderer.js`        | 60fps canvas loop     |
| `src/js/LayerManager.js`    | Visual layer state    |
| `src/js/AnimationLoader.js` | Sprite loading        |

## Adding Animations

Animations go in `src/public/animations/{channel}/{note}/{velocity}/`:

```
animations/0/60/64/
  ├── meta.json       # Frame count, timing
  ├── frame_0.png     # First frame
  ├── frame_1.png     # Second frame
  └── ...
```

After adding animations:

```bash
npm run generate-animation-json-to-json
```

## Questions?

Open an issue or check existing documentation in:

- `README.md` - Project overview
- `.github/copilot-instructions.md` - Detailed development guide
- `AGENTS.md` - AI agent instructions

## License

By contributing, you agree that your contributions will be licensed under the MIT License.
