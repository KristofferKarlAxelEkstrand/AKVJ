# AKVJ - AI Agent Instructions

This file is the single source of truth for AI coding agents working with the AKVJ (Adventure Kid Video Jockey) codebase. It is agent-agnostic and applies to all AI tools (Copilot, Claude, Cursor, Windsurf, etc.).

## Agent Quick-Start

When assigned a task for this repository:

1. **Read this entire file** before starting work
2. **Check if in a container**: Look for `REMOTE_CONTAINERS` env var or `.devcontainer/` — see the "Development Container" section below for container-specific limitations
3. **Install dependencies**: `npm install` (takes ~13 seconds, never cancel)
4. **Make minimal changes**: Focus on surgical, precise modifications
5. **Validate frequently**: Run `npm run lint && npm run test && npm run build` after changes
6. **Test in Chrome/Chromium**: Web MIDI API requires Chrome/Chromium browser (not available inside container — use port forwarding to host browser)

### Task Suitability

**Well-suited:**

- Bug fixes in MIDI handling, canvas rendering, or clip loading
- Performance optimizations for real-time rendering
- Code refactoring while maintaining vanilla JavaScript architecture
- Documentation updates and code comments
- Adding/improving unit tests

**Requires careful review:**

- Changes to core rendering loop (60fps requirement)
- MIDI event processing (low latency critical)
- Memory management and cleanup logic

**Not recommended:**

- Introducing frameworks or libraries (vanilla JS only)
- Major architectural changes without human oversight
- Modifying pixel-perfect rendering logic without testing

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
- **Memory efficiency** - Properly clean up clip resources

### Architecture Rules

- **Vanilla JS only** - Do not introduce frameworks
- **ES6+ modules** - Use import/export syntax
- **Chrome/Chromium only** - Web MIDI API dependency

## Key Files

npm workspaces: `akvj/` (live VJ engine), `mainframe/` (set tooling), `midi-mcp/` (MIDI spec MCP server for agents), shared `clips/` at repo root.

| File                                          | Purpose                                                     |
| --------------------------------------------- | ----------------------------------------------------------- |
| `akvj/src/js/core/AdventureKidVideoJockey.js` | Main VJ component (custom element)                          |
| `akvj/src/js/midi-input/Midi.js`              | Web MIDI API with hot-plug support                          |
| `akvj/src/js/visuals/Renderer.js`             | 60fps canvas rendering with layer group compositing         |
| `akvj/src/js/visuals/LayerManager.js`         | Coordinates layer groups, mask, and effects                 |
| `akvj/src/js/visuals/LayerGroup.js`           | Clip slots per layer group (A, B, C)                        |
| `akvj/src/js/visuals/ClipLoader.js`           | Sprite and metadata loading                                 |
| `akvj/src/js/visuals/Clip.js`                 | Clip playback (FPS or BPM sync)                             |
| `akvj/src/js/visuals/MaskManager.js`          | B&W bitmask for Layer Group A and Layer Group B crossfading |
| `akvj/src/js/visuals/EffectsManager.js`       | Visual effects (split, mirror, glitch)                      |
| `akvj/src/js/core/AppState.js`                | Event-based state management (EventTarget)                  |
| `akvj/src/js/core/settings.js`                | Centralized configuration (canvas, MIDI, FX)                |
| `akvj/src/js/utils/Fullscreen.js`             | Fullscreen toggle (enter/space/dblclick)                    |
| `akvj/src/js/utils/DebugOverlay.js`           | Debug overlay (press 'D' to toggle)                         |
| `akvj/src/js/utils/velocitySelection.js`      | Velocity-based clip selection utilities                     |

## Common Commands

```bash
npm run akvj             # Start akvj VJ engine (localhost:5173)
npm run build            # Production build (<1 second)
npm run build:full       # Rebuild clips + production build
npm run preview          # Preview production build (localhost:4173)
npm run test             # Run unit tests with Vitest
npm run lint             # Check code quality
npm run lint:fix         # Auto-fix lint issues
npm run format:prettier  # Format JS/JSON/Markdown
npm run format:stylelint # Format & lint CSS
npm run clips            # Full clip pipeline (validate, optimize, generate, copy)
npm run clips:watch      # Watch mode for clip changes
npm run clips:clean      # Remove cache and generated output
npm run clips:new        # Scaffold new clip (requires clipId arg)
npm run mainframe        # Mainframe UI + API (localhost:5174 / 8787)
npm run midi:extract     # Rebuild the MIDI spec knowledge base (midi-mcp/data/)
```

## MIDI Mapping

### Channel → Layer Group Assignment

Channels shown as displayed in DAWs (1-16). `set-mapping.json` uses DAW channels; ClipLoader converts to code channels 0–15 when building the runtime clip tree. Channel → layer routing in `settings.js` is unchanged.

| Channels | Layer Group          | Function                                                        |
| -------- | -------------------- | --------------------------------------------------------------- |
| 1-4      | Layer Group A        | Primary clip deck                                               |
| 5        | Mixer                | B&W bitmask for Layer Group A and Layer Group B crossfading     |
| 6-9      | Layer Group B        | Secondary clip deck                                             |
| 10       | Mixed output effects | Effects applied to mixed Layer Group A and Layer Group B output |
| 11-12    | Layer Group C        | Overlay layer (logos)                                           |
| 13       | Global effects       | Effects on entire output                                        |
| 14-16    | Reserved             | Ignored                                                         |

### Note/Velocity

- **Note (0-127)** → Clip selection
- **Velocity (0-127)** → Velocity variant/intensity

## Clip Metadata

Key fields in `meta.json`:

| Field                 | Type         | Description                                                                         |
| --------------------- | ------------ | ----------------------------------------------------------------------------------- |
| `png`                 | string       | Sprite sheet filename                                                               |
| `numberOfFrames`      | number       | Total frames                                                                        |
| `framesPerRow`        | number       | Frames per row in sprite sheet                                                      |
| `playback`            | string       | Playback mode (`once`, `loop`, `pingpong`, `random`, `reverse`, `shuffle`, `scrub`) |
| `retrigger`           | boolean      | Restart on re-trigger                                                               |
| `frameRatesForFrames` | object       | FPS per frame index                                                                 |
| `frameDurationBeats`  | number/array | BPM-synced timing (beats per frame)                                                 |
| `bitDepth`            | number       | For masks: 1, 2, 4, or 8                                                            |
| `role`                | string       | Optional; `"bitmask"` for mixer masks                                               |

## Clip Structure

Source clips live in repo-root flat `clips/{clipId}/` (build pipeline copies to `akvj/src/public/clips/`). MIDI placement is in `clips/set-mapping.json` (DAW channels 1–16).

```
clips/{clipId}/
  ├── meta.json       # Clip metadata (optional role: "bitmask")
  └── sprite.png      # Sprite sheet
clips/set-mapping.json
```

## Code Conventions

### JavaScript Style

- **Private fields**: `#fieldName` for all internal state
- **Private methods**: `#methodName()` for internal logic
- **Modern syntax**: `for...of`, `?.`, `??`, `??=`, `.at(-1)`, `flatMap()`
- **Timing**: Use `performance.now()` for clip timing, not `Date.now()`
- **Bound handlers**: Cache bound methods for event listeners (e.g., `#boundHandleMIDIMessage`)
- **Named constants**: Extract magic numbers to descriptive constants
- **Use `const` over `let`** where possible
- **Keep functions small and focused**
- **Document complex logic** with comments
- **JSDoc** for public methods with `@param` and `@returns`

### Naming and Separation Standards

- **File naming**: Files whose main export is a class are PascalCase (e.g. `Renderer.js`, `Compositor.js`, `Pipeline.js`); all other modules are lowercase (e.g. `settings.js`, `velocitySelection.js`, `validate.js`). This applies to `src/` and `scripts/` alike.
- Prefer explicit, domain-based names over vague ones. Use `layerGroup`, `effectsManager`, `compositor`, and `midiAccess` instead of `data`, `state`, or `thing`.
- Keep each private helper focused on one responsibility. If a method grows beyond roughly 15 lines or mixes concerns, extract a smaller helper rather than adding more conditionals.
- Route cross-module behavior through clear interfaces. Prefer `AppState` events and manager methods over direct property access across unrelated modules.
- Use constants for repeated string values and event names so the intent remains obvious and names are centralized.

### Design Patterns

- **Custom Elements**: `<adventure-kid-video-jockey>` with proper lifecycle (`connectedCallback`, `disconnectedCallback`)
- **Private Class Fields**: Use `#fieldName` for encapsulation
- **Event-Based Communication**: `AppState` extends `EventTarget` for loose coupling
- **Unsubscribe Pattern**: `subscribe()` returns unsubscribe function for cleanup
- **Cached Active Clips**: `LayerGroup` caches sorted active clips with a dirty flag

### Error Handling

- Individual try-catch blocks in cleanup methods with specific error messages
- Guard clauses for null/undefined checks (early returns)
- Log errors with context (e.g., include URL that failed)
- Wrap dev-only `console.log` in `import.meta.env.DEV` check

### HMR Support

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

## Build Scripts

| File                                                | Purpose                                                           |
| --------------------------------------------------- | ----------------------------------------------------------------- |
| `mainframe/scripts/clips/index.js`                  | CLI entry point (args, help, watch mode)                          |
| `mainframe/scripts/clips/Pipeline.js`               | Pipeline class (validate, optimize, generate, copy)               |
| `mainframe/scripts/clips/new.js`                    | Scaffold new clip meta.json                                       |
| `mainframe/scripts/clips/spritesheet.js`            | Sprite sheet utilities                                            |
| `mainframe/scripts/clips/lib/validate.js`           | Re-export shim for `lib/validate/`                                |
| `mainframe/scripts/clips/lib/validate/index.js`     | Validation scan loop and per-clip checks                          |
| `mainframe/scripts/clips/lib/validate/meta.js`      | Metadata field validation                                         |
| `mainframe/scripts/clips/lib/validate/image.js`     | Image dimension validation (sharp)                                |
| `mainframe/scripts/clips/lib/validate/structure.js` | Folder/file structure helpers                                     |
| `mainframe/scripts/clips/lib/validateMapping.js`    | Validate set-mapping.json vs clip bucket                          |
| `mainframe/scripts/clips/lib/optimize.js`           | PNG optimization with sharp                                       |
| `mainframe/scripts/clips/lib/generate.js`           | Generate flat clips.json by clipId                                |
| `mainframe/scripts/clips/lib/copy.js`               | Sync to public folder                                             |
| `mainframe/scripts/clips/lib/hash.js`               | File hashing for cache invalidation                               |
| `mainframe/server/index.js`                         | Local mainframe API (clips/mapping/upload; runs pipeline via CLI) |

## Test Structure

| Test File                        | Coverage                         |
| -------------------------------- | -------------------------------- |
| `test/Clip.test.js`              | Frame timing, BPM sync, disposal |
| `test/ClipLoader.test.js`        | Image loading, path sanitization |
| `test/Renderer.test.js`          | Canvas compositing, effects      |
| `test/Renderer.strobe.test.js`   | Strobe effect timing             |
| `test/velocitySelection.test.js` | Velocity-based clip selection    |
| `test/LayerManager.test.js`      | Layer group coordination         |
| `test/integration.test.js`       | Full MIDI to visual pipeline     |
| `test/AppState.test.js`          | Event dispatching                |
| `test/midi.test.js`              | MIDI message handling            |
| `test/validate-extended.test.js` | Clip metadata validation         |
| `test/generate.test.js`          | clips.json generation            |
| `test/Pipeline.test.js`          | Build pipeline                   |
| `test/new.test.js`               | Clip scaffolding                 |
| `test/optimize-bitDepth.test.js` | Bit depth optimization           |
| `test/validateMapping.test.js`   | Set-mapping validation           |
| `test/visual/canvas.test.js`     | Visual regression (browser mode) |

### Visual Regression Tests

Visual tests run in **real Chromium** via Vitest browser mode with `@vitest/browser-playwright`, using the native `toMatchScreenshot` assertion (built-in pixelmatch comparison).

- **Config**: `vitest.visual.config.js` (separate from jsdom `vitest.config.js`)
- **Run**: `npm run test:visual`
- **Update references**: `npm run test:visual:update`
- **Reference screenshots**: `test/visual/__screenshots__/` (committed to git, ~7KB total)
- **Diff images**: `test/visual/__diffs__/` (gitignored, generated on failure)
- **Mock visuals**: `test/visual/helpers/visualTestHelpers.js` provides deterministic canvas drawing utilities, mock clips, and a mock `LayerManager`

Tests cover all 4 mask bit depths (1/2/4/8-bit), all 6 effect types (color, mirror, split, offset, glitch, strobe), effect stacking, layer group passthrough, and edge cases. Deterministic rendering is ensured by mocking `Math.random` for glitch and using controlled pixel patterns.

## Agent Skills

Reusable skills live in `.agents/skills/` following the [Agent Skills](https://agentskills.io) open standard. Symlinks bridge to `.claude/skills/` and `.cursor/skills/` for tool compatibility.

| Skill                  | Location                               | Purpose                                           |
| ---------------------- | -------------------------------------- | ------------------------------------------------- |
| `agent-agnostic-setup` | `.agents/skills/agent-agnostic-setup/` | Sets up and audits agent-agnostic repo config     |
| `midi-protocol`        | `.agents/skills/midi-protocol/`        | MIDI protocol and Web MIDI API expertise for AKVJ |

Run `.agents/scripts/link-skills.sh` after adding or removing skills to sync symlinks.

## MIDI Spec MCP Server (`midi-mcp/`)

A stdio MCP server exposing the MIDI 1.0 / MIDI 2.0 / Web MIDI specifications to AI agents. Wired up via `.vscode/mcp.json` (VS Code/Copilot) and root `.mcp.json` (Claude Code); works in the dev container. See [midi-mcp/README.md](midi-mcp/README.md).

- Tools: `search_spec_data` (protocol/tier filters, page-anchored results), `read_spec_doc` (page-range reads), `list_spec_docs`, `fetch_online_resource`.
- The extracted corpus `midi-mcp/data/` is generated by `npm run midi:extract` and **committed** — never hand-edit it; curated content lives in `midi-mcp/reference/`.
- Raw source PDFs in `.midi-raw-data/` are local-only (gitignored).
- **Never use `console.log` in midi-mcp server code** — stdout is the JSON-RPC stream; use `console.error`.

## Security & Boundaries

- **Never hand-edit `akvj/src/public/clips/`** — it's fully generated by `npm run clips` from source files in `clips/` and will be silently overwritten on the next build.
- **Never commit `.env` files or MIDI-device-specific local config.**
- Commit conventions and the PR workflow live in [CONTRIBUTING.md](CONTRIBUTING.md) — don't duplicate them here.

## Validation Checklist

After making changes, always verify:

1. `npm run lint` - No errors
2. `npm run test` - All unit tests pass (jsdom)
3. `npm run test:visual` - All visual regression tests pass (Chromium)
4. `npm run build` - Builds successfully
5. Browser console - No errors, "JSON for clips loaded" message
6. Manual test in Chrome/Chromium

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
npm run akvj
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

- Black canvas or clips not loading
    - Confirm `akvj/src/public/clips/clips.json` exists and was generated: `npm run clips`.
    - Look for the console message: "JSON for clips loaded".
    - Verify the build step was successful and static assets are present.

- MIDI input not triggering visuals
    - Check browser console for `WebMIDI supported` and connected input logs at boot.
    - Ensure your device reports MIDI Note On/Off events (inspect input messages via the browser DevTools console or a MIDI monitor).
    - If using a virtual MIDI device, ensure system-level drivers and routing are configured properly.

- Performance issues / dropped frames
    - Confirm you are not running CPU-heavy work in the render loop. Keep 60fps by profiling canvas draw operations.
    - Monitor memory usage and remove unused clips via `LayerManager` to reduce memory churn.

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

If you still have trouble, check the docs in `docs/`, review browser console logs, and create an issue with relevant logs and reproduction steps.

## Development Container (Docker / DevContainer)

This project includes a `.devcontainer/devcontainer.json` for use with VS Code Dev Containers, GitHub Codespaces, and other container-based dev environments. AI agents must understand what works, what doesn't, and how to work effectively inside the container.

### What Works in the Container

- **All code editing, linting, and formatting** — ESLint, Prettier, Stylelint run natively
- **Unit tests** — Vitest with jsdom environment runs fully in-container
- **Production builds** — `npm run build` and `npm run build:full` work (sharp has prebuilt binaries for linux-x64)
- **Clip pipeline** — `npm run clips` (validate, optimize, generate, copy) works fully
- **Git operations** — Commit, branch, push (see Git push troubleshooting above for token issues)
- **HMR / file watching** — Vite polling is auto-enabled via env var detection in `vite.config.js`

### What Does NOT Work in the Container

- **Web MIDI API** — No MIDI hardware access from inside a container. The `navigator.requestMIDIAccess` call will fail. MIDI-dependent features cannot be tested in-container.
- **Browser-based visual testing** — No Chrome/Chromium is installed in the base image. The dev server runs but cannot be opened in a browser inside the container. Use port forwarding to access from the host browser.
- **Canvas rendering verification** — While jsdom provides a `canvas` stub for unit tests, it does not render pixels. Visual regression tests requiring a real browser must run on the host or in CI.
- **GPU acceleration** — No GPU access. Canvas 2D rendering uses software rasterization only.

### Container-Specific Configuration

#### File Watching (HMR)

`vite.config.js` automatically enables polling when container environment variables are detected:

```javascript
usePolling: !!(process.env.REMOTE_CONTAINERS || process.env.CODESPACES || process.env.GITPOD_WORKSPACE_ID);
```

The `devcontainer.json` sets `REMOTE_CONTAINERS=true` via `containerEnv` as a safety net. If HMR is not working:

1. Verify `REMOTE_CONTAINERS` is set: `echo $REMOTE_CONTAINERS`
2. Check that polling is active in Vite output
3. As a fallback, set `CHOKIDAR_USEPOLLING=true` manually before starting the dev server
4. On macOS/Windows Docker hosts, inotify events don't propagate through bind mounts — polling is required

#### Port Forwarding

The container forwards two ports:

| Port | Purpose        | Auto-Forward Behavior       |
| ---- | -------------- | --------------------------- |
| 5173 | akvj Vite      | Opens browser automatically |
| 4173 | akvj preview   | Notifies on start           |
| 5174 | mainframe Vite | Notifies on start           |
| 8787 | mainframe API  | Silent                      |

Access the akvj dev server from the host at `http://localhost:5173`. Mainframe: `http://localhost:5174`.

#### Lifecycle Commands

- **`postCreateCommand`**: Runs `npm install` automatically after container creation
- **`postStartCommand`**: Validates clip metadata on each start (non-blocking)

#### Resource Requirements

The container requests minimum **4 CPUs** and **8 GB RAM** (akvj + mainframe + sharp). The `sharp` image processing library (used in the clip pipeline) is CPU-intensive during PNG optimization. If builds are slow, increase the resource allocation.

### Best Practices for AI Agents in the Container

1. **Never assume MIDI works** — When testing, use the fake MIDI utilities in `test/utils/fake-midi.js` rather than expecting real hardware
2. **Run validation commands, not browser tests** — Use `npm run lint && npm run test && npm run build` to validate changes. Do not attempt to launch a browser.
3. **Use `npm run clips` for clip changes** — The full pipeline (validate, optimize, generate, copy) works in-container
4. **Be patient with `npm install`** — The first install takes ~13 seconds. `sharp` downloads prebuilt binaries; no native compilation needed.
5. **Check env vars before debugging file watching** — If HMR seems broken, first check `echo $REMOTE_CONTAINERS` and verify polling is enabled
6. **Node version** — The container uses Node 22 (via `javascript-node:4-22-bookworm`). CI uses Node 20. Code must be compatible with both.
7. **Don't install Chrome in the container** — It adds significant image size. Instead, use port forwarding to test from the host browser.
8. **Use `concurrently` output** — `npm run akvj` runs both Vite and the clip watcher concurrently. Check both output streams for errors.

### Container vs Host Development

| Task                     | Container   | Host                      |
| ------------------------ | ----------- | ------------------------- |
| Code editing             | ✅          | ✅                        |
| Lint / format            | ✅          | ✅                        |
| Unit tests               | ✅          | ✅                        |
| Build                    | ✅          | ✅                        |
| Clip pipeline            | ✅          | ✅                        |
| MIDI testing             | ❌          | ✅ (Chrome + MIDI device) |
| Visual / browser testing | ❌          | ✅ (Chrome required)      |
| Performance profiling    | ⚠️ (no GPU) | ✅                        |

### Troubleshooting Container Issues

- **Dev server not accessible from host**
    - Verify port forwarding: `forwardPorts` should include `5173` in `devcontainer.json`
    - Check that Vite is listening on `0.0.0.0` (default) or `localhost` inside the container
    - If using Docker Compose, ensure ports are mapped in `docker-compose.yml`

- **HMR not detecting file changes**
    - Verify `REMOTE_CONTAINERS` env var is set: `echo $REMOTE_CONTAINERS`
    - Check Vite config polling detection in `vite.config.js`
    - Fallback: `CHOKIDAR_USEPOLLING=true npm run akvj`
    - On WSL2: keep the repo inside the Linux filesystem, not on a Windows mount

- **`sharp` errors during clip pipeline**
    - Ensure sufficient memory (minimum 8 GB)
    - `sharp` uses prebuilt binaries for linux-x64; if missing, run `npm rebuild sharp`

- **`npm install` fails or is slow**
    - The container image includes npm cache; first install is ~13 seconds
    - If network issues occur, retry — the devcontainer image may need to download packages
    - Never cancel `npm install` mid-way; it can corrupt `node_modules`

- **Git push 403 errors**
    - See the "Git push / GITHUB_TOKEN issues" section above
    - Common in Codespaces and dev containers with restricted tokens
