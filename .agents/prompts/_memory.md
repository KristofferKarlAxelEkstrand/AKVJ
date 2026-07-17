# AKVJ Master Memory

This file serves as the active memory bank for AI agents working on the AKVJ repository.
**Always read this file before beginning a task, and update it when you discover new insights.**

## 1. Architectural Decisions
- The VJ engine strictly uses Vanilla JS/CSS. No frameworks.
- `mainframe/server/index.js` uses a route table (`EXACT_ROUTES` map) for exact-path HTTP routing, with a fallback for pattern-matched routes (e.g., `/api/clips/:clipId/sprite`).
- `validate.js` shim (`scripts/clips/lib/validate.js`) only re-exports `validate`. Other exports (`getSubfolders`, `getFilesWithExtension`) are imported directly from `validate/index.js`.

## 2. Active Context & In-Progress Work
- Master workflow (all 4 phases) completed: Cognitive Simplification, Domain Consistency, Cruft Elimination, Validation & Pipeline. All passing.
- **Latest audit (2026-07-16, run 13):** Full re-audit. No new issues found. 298 tests pass, build succeeds, zero lint/format errors. Codebase is pristine.
- **This run changes (Phase 1):**
  - `AdventureKidVideoJockey.js`: Trimmed redundant "Set up MIDI event listeners" prefix from comment — method name already says what; kept "why" parenthetical ("Safe to register even when visuals are disabled").
- **Previous run (run 9) changes (Phase 2-3):**
  - `CONTRIBUTING.md`: Fixed stale "Adding Clips" section — references to old nested `clips/{channel}/{note}/{velocity}/` structure replaced with flat `clips/{clipId}/` + `set-mapping.json` documentation. Added `npm run clips:new` scaffolding instructions. Fixed stale `midi.js` → `Midi.js` in Key Files table. Fixed reference to non-existent `.vscode/extensions.json`. Added Stylelint to `editor.codeActionsOnSave` description.
  - `docs/how-to-program-midi.md`: Fixed 3 stale references to old nested clip folder structure (`clips/0/60/100/`, `src/public/clips/{channel}/{note}/{velocity}/`). Fixed broken doc links (`../.technical-docs/` → `./`). Updated file location reference to flat `clips/{clipId}/` structure.
- **Previous run (run 8) changes (Phase 1):**
  - `main.js`: Removed 4 redundant "what" comments ("Import styles", "Import elements", "Enable fullscreen functionality", "Enable debug overlay") — import statements and instantiation are self-explanatory. Kept "why" comments (side-effect note, keyboard shortcut, HMR cleanup).
  - `velocitySelection.js`: Removed redundant "Find the highest velocity threshold..." comment — duplicates the JSDoc above it.
- **Previous run (run 7) changes (Phase 2-3):**
  - `scripts/clips/index.js`: Fixed stale `[anim]` log label → `[clips]` in watch mode event handler (domain consistency — this is the clip pipeline watcher, not an animation watcher).
  - `validate/index.js`: Renamed `path` property → `clipId` in `ValidationResult` and error objects — `path` shadowed the imported `path` module and was semantically wrong (it's a clip identifier, not a file path). Updated JSDoc typedef.
  - `optimize.js`: Updated consumer `clip.path` → `clip.clipId`. Fixed misleading JSDoc (`OptimizeResult.path` described as "Clip path" → "Source file path").
  - `validateMapping.js`: Updated consumer `clip.path` → `clip.clipId`. Updated JSDoc. Note: `validateMapping.js` error objects still use `path` for file locations (e.g., `'set-mapping.json'`, `'set-mapping.json[0]'`) — this is correct as they are file paths, not clip IDs.
  - `Pipeline.js`: Updated `#logValidationErrors()` to destructure both `clipId` and `path` with `clipId ?? path` fallback, since clip validation errors use `clipId` and mapping validation errors use `path`.
  - `validateMapping.test.js`: Updated all test mocks from `{ path: '...' }` → `{ clipId: '...' }`.
  - `mainframe/server/paths.js`: Removed unused `VJ_SERVER_DIR` export — never imported anywhere.
  - `mainframe/server/index.js`: Renamed `readClipEntries()` → `readClipDirectories()` — function returns raw directory entries, not clip entries.
  - `spritesheet.js`: Fixed stale help text referencing old nested clip path structure (`./clips/0/3/0`) → flat clipId structure (`./clips/neon-skull`).
- **Previous run (run 6) changes:** Phase 1: deleted 9 redundant "what" comments across 6 files. Phases 2-3: no changes needed.
- **Previous run (run 5) changes (Phase 1-3):**
  - `AppState.js`: Replaced `#calculateBPMFromClock()` `.reduce()` with a `for...of` loop — previous run claimed this was done but the code still had `.reduce()` with an inline arrow function allocating on every MIDI clock pulse (24×/beat). Now actually fixed.
  - `ClipPreview.js`: Cached `#cachedFrameDimensions` and `#cachedFrameRateEntries` at sprite load time — eliminates per-frame `Object.entries().map().sort()` and object allocation in the `#animate()` RAF loop. Caches cleared in `destroy()`.
  - `Compositor.js`: Hoisted `#getBitDepthParams()` call out of per-pixel loop in `#mixPixels()` — divisor/maxLevel now computed once per frame and passed directly to `#mixMultiBit()`, eliminating up to 32,400 object allocations per frame.
  - `DebugOverlay.js`: Hoisted `NOTE_NAMES` array to module-level constant — avoids per-call array allocation in `#formatNote()`.
- **Previous run changes:**
  - `LayerGroup.js`: Eliminated per-frame `filter()` allocation in `getActiveClips()` — now uses `#hasFinishedClip()` and rebuilds/cleans up only when clips change or finish.
  - `LayerManager.js`: Replaced `(...args)` handler wrappers with explicit `(channel, note, velocity)` parameters to avoid per-event `arguments` array allocation.
  - `strobeEffect.js`: Replaced `calculateStrobePhase()` object return with `isStrobeActive()` boolean, eliminating a per-frame object allocation when the strobe effect is active.
  - `effectConstants.js` + `EffectsManager.js`: Added `MAX_MIDI_NOTE` constant and used it for note range validation, replacing the semantically wrong `MAX_MIDI_VELOCITY`.
  - `AppState.js`: Renamed `MAX_MIDI_VALUE` → `MAX_MIDI_CC_VALUE` for domain clarity.
- **Previous run changes:**
  - `Renderer.js`: Pre-allocated `#layerReferences` object to eliminate per-frame GC allocation. Renamed vague `refs` → `layerReferences`. Fixed `#buildEffectRenderContext(settings)` parameter shadowing imported `settings` — now uses `this.#settings` directly.
  - `Compositor.js`: Pre-allocated `#pixelBuffers` object to eliminate per-frame GC allocation in `#mixWithMask`.
  - `EffectsManager.js`: Added `#cachedMixedOutputEffects` and `#cachedGlobalEffects` fields with lazy cache invalidation via `#invalidateCache(channel)` — eliminates per-frame array spread + sort in `getActiveMixedOutputEffects()`/`getActiveGlobalEffects()`.
- **Vitest worker timeout**: Forks pool times out in dev container (all 24 test files fail to start workers). Fixed by setting `pool: 'vmThreads'`, `testTimeout: 30000`, and `fileParallelism: false` in `vitest.config.js`. `npm run test` now passes all 298 tests reliably. Some individual tests (pipeline, validate-extended) take several seconds due to container overhead.

## 3. Known Bugs & Gotchas
- jsdom fails when fetch() is called with relative URLs, mock it instead.
- `generate.js` imports from `./validate/index.js` directly (not the `validate.js` shim). If the shim is modified, verify `generate.js` still works.

## 4. Future Targets (TODOs)
- `ClipPreview.js` (renamed from `preview.js`) still auto-instantiates on load — no `export` statement. Known coverage gap.
- Visual regression tests require Chromium — skip in headless dev containers.

## 5. Testing Insights & Gotchas

### Settings Structure (Critical for Test Authors)
- Effect parameters live at `settings.effectParams` (NOT `settings.effects`). This is a common gotcha when writing effect unit tests.
- Key `effectParams` fields: `effectVariantThreshold` (8), `glitchMaxDisplacement` (20), `glitchPixelProbability` (0.1), `posterizeBaseLevels` (8), `posterizeIntensityScale` (6), `splitMin` (2), `splitMax` (8).
- Effect ranges live at `settings.effectRanges` with min/max per type: split(0-15), mirror(16-31), offset(32-47), color(48-63), glitch(64-79), strobe(80-95), reserved(96-127).

### Test Utility Patterns
- `installMockCanvas()` from `test/utils/rendererFixture.js` replaces `document.createElement` for canvas tags. Returns `{ createdCanvases, restore }`.
- `createMockCanvasContext()` provides `getImageData`, `putImageData`, `createImageData`, `fillRect`, `drawImage` mocks.
- `installRAFMocks()` / `restoreRAFMocks()` mock `requestAnimationFrame` / `cancelAnimationFrame`.
- `waitForEvent(target, eventName)` from `test/utils/waitForEvent.js` returns a promise for the next dispatch of an event.
- `withSettings(override, callback)` from `test/utils/withSettings.js` temporarily overrides settings.
- `createMockClip(id)` pattern: `{ id, play: vi.fn(), renderToContext: vi.fn(), stop: vi.fn(), reset: vi.fn(), dispose: vi.fn(), isFinished: false }`.

### jsdom Gotchas Discovered
1. **`installMockCanvas()` returns plain objects, not DOM Nodes** - `appendChild()` in jsdom throws `TypeError: parameter 1 is not of type 'Node'`. For custom elements that call `this.appendChild(canvas)`, use `originalCreateElement('canvas')` to get a real DOM element, then override `getContext` on it.
2. **`fetch()` with relative URLs fails in jsdom** - `Invalid URL` error for paths like `/clips/clips.json?t=...`. This is expected; tests should verify error handling paths rather than mocking fetch.
3. **Private fields are not accessible from tests** - `#layerManager`, `#renderer` etc. cannot be accessed via `element.layerManager`. Test behavior indirectly via event dispatch and assertions on side effects.

### AppState API for Test Authors
- **BPM setter**: `appState.bpm = 140` (triggers `bpmChanged` event with source `'manual'`). Note: setting BPM to the default value (120) does NOT fire a change event because the value is unchanged.
- **MIDI connection**: `appState.midiConnected = true/false` (triggers `midiConnectionChanged` event).
- **Dispatch methods**: `dispatchMIDINoteOn(channel, note, velocity)`, `dispatchMIDINoteOff(channel, note)`, `dispatchMIDIControlChange(channel, controller, value)`, `dispatchMIDIClock(timestamp)`, `dispatchMIDIStart()`, `dispatchMIDIContinue()`, `dispatchMIDIStop()`, `dispatchVideoJockeyReady()`.
- **There is no `dispatchBPM()` method** - use the `bpm` setter or `dispatchMIDIClock()` for clock-synced BPM.

### EffectsPipeline Testing Notes
- **colorEffect always returns `true`** - even with velocity 0, it still modifies pixels. Use **strobeEffect with velocity 0** to test the "no modification" path (returns `false`).
- **Custom constructor params must include full `effectRanges`** - effects access `effectContext.effectRanges.color.min` etc. Partial ranges cause `TypeError: Cannot read properties of undefined`. Spread from `settings.effectRanges` when customizing.
- **`requiresNote` flag**: Effects with `requiresNote: true` (color, mirror, split, offset) are skipped when `effect.note` is not a number. Effects without the flag (strobe, glitch) still apply.
- **glitchEffect uses `Math.random()`** - must mock with `vi.spyOn(Math, 'random').mockReturnValue(value)` for deterministic tests. The glitch trigger condition is `Math.random() < intensity * glitchPixelProbability` (default threshold = 0.1). Use `0.05` to trigger glitches, `0.5` to avoid them. **`Math.random() = 0` DOES trigger** because `0 < 0.1` is true.
- **glitchEffect velocity 0 returns `false`** - intensity is 0, so `0 < 0 * 0.1 = 0` is false. No pixels are glitched.
- **`ClipPreview.js` is not importable** - it has no `export` statement and auto-instantiates on load. Cannot be unit-tested with Vitest without refactoring the source. This is a known coverage gap.

### Testing Blind Spots to Watch For
1. **Effect modules** were only tested indirectly via Renderer. Direct unit tests with small (4x2) pixel arrays are much faster and more precise for pixel-level assertions.
2. **Lifecycle methods** (clear, destroy) are often untested but critical for memory management. Always test idempotency (calling destroy twice).
3. **Edge cases in MIDI routing**: wrong channel, NaN note, velocity=0, out-of-range notes. These are easy to miss but important for robustness.
4. **Cache invalidation**: LayerGroup caches active clips. Tests must verify the cache is invalidated after noteOn/noteOff and that finished clips are cleaned up.
5. **Math precision in offset effects**: `Math.floor(intensity * dimension)` can produce unexpected values. Always compute the expected value programmatically rather than guessing.
