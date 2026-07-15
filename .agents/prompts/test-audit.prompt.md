# AKVJ Test Audit & Fortification

Execute an exhaustive audit to discover and eliminate testing gaps in the codebase:

- **1. Baseline**: Run `npm run test` and `npm run test:visual`. Fix any immediately failing tests or underlying code.
- **2. Gap Analysis**: Audit `src/` and `scripts/` to identify untested critical paths, complex logic, or missing edge cases.
- **3. Test Generation**: Write new Vitest unit tests and visual regression tests to achieve full coverage on the identified gaps. Refactor existing flaky tests.
- **4. Code Resolution**: If new tests expose bugs, you MUST fix the underlying codebase. Ensure `npm run build` and `npm run clips` succeed afterwards.
- **5. Self-Evolution**: If you discover a new blind spot, missing test strategy, or configuration issue during this audit, you MUST permanently document it by updating this file (`\AKVJ\.agents\prompts\test-audit.prompt.md`).

## Insights from 2025-07-15 Audit

### Test Commands
- `npm run test` — Unit tests (Vitest + jsdom), excludes `test/visual/**`
- `npm run test:visual` — Visual regression tests (Playwright + chromium), uses `vitest.visual.config.js`
- `npm run test:visual:update` — Update visual regression screenshots
- Always run `npm run lint` after writing tests — ESLint catches unused imports and duplicate object keys.

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

### Coverage Gaps Filled
- **Compositor.test.js**: Direct unit tests for 1/2/4/8-bit mask mixing, no-mask fallback, empty groups, alpha channel max, finished mask clip, destroy idempotency.
- **EffectsManager.test.js**: velocity-0-as-noteOff, wrong-channel returns, noteOff for non-current note, sorting, clear/destroy, reserved notes, independence of mixed/global channels.
- **MaskManager.test.js**: bitDepth default (1), wrong channel, clip without reset method, same-clip retrigger, clear/destroy idempotency.
- **LayerGroup.test.js**: Cache invalidation, finished clip cleanup from Map, sorting by channel+note, hasActiveClips with finished clips, clearClips/destroy lifecycle.
- **effects.test.js**: Direct unit tests for colorEffect (invert/posterize), mirrorEffect (horizontal/vertical), offsetEffect (wrap-around math), splitEffect, strobeEffect (velocity thresholds), glitchEffect (random mock, velocity-0 no-op, alpha preservation, scratch buffer), transformCopy (scratch buffer allocation).
- **AppState.test.js**: BPM-from-CC, wrong channel/CC rejection, bpm clamping, bpmSource getter, MIDI start/stop/continue events, subscribe/unsubscribe, no-event-on-unchanged-value.

### Testing Blind Spots to Watch For
1. **Effect modules** were only tested indirectly via Renderer. Direct unit tests with small (4×2) pixel arrays are much faster and more precise for pixel-level assertions.
2. **Lifecycle methods** (clear, destroy) are often untested but critical for memory management. Always test idempotency (calling destroy twice).
3. **Edge cases in MIDI routing**: wrong channel, NaN note, velocity=0, out-of-range notes. These are easy to miss but important for robustness.
4. **Cache invalidation**: LayerGroup caches active clips. Tests must verify the cache is invalidated after noteOn/noteOff and that finished clips are cleaned up.
5. **Math precision in offset effects**: `Math.floor(intensity * dimension)` can produce unexpected values. Always compute the expected value programmatically rather than guessing.

## Insights from 2025-07-15 Second Audit Round

### New Test Files Created
- **Fullscreen.test.js** (9 tests): setup/destroy lifecycle, keydown Enter/Space toggle, repeat-key suppression, unrelated key ignore, dblclick toggle, fullscreen exit when already fullscreen, destroy idempotency.
- **DebugOverlay.test.js** (14 tests): setup appends element + registers keydown, destroy removes listeners + is idempotent, "d"/"D" keydown toggles visibility, input/textarea guard, unrelated key ignore, all 5 appState subscriptions verified, BPM display update, MIDI status display, note-on/off/CC log entries, MAX_LOG_ENTRIES cap, note name formatting (C4/A4/C-1).
- **EffectsPipeline.test.js** (11 tests): empty/null activeEffects no-op, valid effect calls getImageData+putImageData, unknown effect type skipped, requiresNote with non-number note skipped, scratch buffer allocation/reuse, no-modification path (strobe velocity=0), multiple effects in order, default bpmMin/bpmDefault, effectContext reuse across calls, custom constructor params.
- **AdventureKidVideoJockey.test.js** (10 tests): custom element registration, canvas dimensions from settings, midiNoteOn/midiNoteOff subscription, MIDI event routing, disconnectedCallback listener teardown, destroy idempotency, videoJockeyReady event dispatch, no-canvas-context graceful fallback, cleanup after async setup.

### Expanded Test Files
- **LayerManager.test.js**: Added reserved channel tests (13/14/15 ignored), multi-channel routing (Layer Group B ch5-8, Layer Group C ch10-11, MaskManager ch4, EffectsManager ch9/ch12), noteOff routing for Layer Group B and EffectsManager, all 5 getter tests, clearClips for Layer Group B/C/MaskManager/EffectsManager. (5 → 23 tests)

### jsdom Gotchas Discovered
1. **`installMockCanvas()` returns plain objects, not DOM Nodes** — `appendChild()` in jsdom throws `TypeError: parameter 1 is not of type 'Node'`. For custom elements that call `this.appendChild(canvas)`, use `originalCreateElement('canvas')` to get a real DOM element, then override `getContext` on it.
2. **`fetch()` with relative URLs fails in jsdom** — `Invalid URL` error for paths like `/clips/clips.json?t=...`. This is expected; tests should verify error handling paths rather than mocking fetch.
3. **Private fields are not accessible from tests** — `#layerManager`, `#renderer` etc. cannot be accessed via `element.layerManager`. Test behavior indirectly via event dispatch and assertions on side effects.

### AppState API for Test Authors
- **BPM setter**: `appState.bpm = 140` (triggers `bpmChanged` event with source `'manual'`). Note: setting BPM to the default value (120) does NOT fire a change event because the value is unchanged.
- **MIDI connection**: `appState.midiConnected = true/false` (triggers `midiConnectionChanged` event).
- **Dispatch methods**: `dispatchMIDINoteOn(channel, note, velocity)`, `dispatchMIDINoteOff(channel, note)`, `dispatchMIDIControlChange(channel, controller, value)`, `dispatchMIDIClock(timestamp)`, `dispatchMIDIStart()`, `dispatchMIDIContinue()`, `dispatchMIDIStop()`, `dispatchVideoJockeyReady()`.
- **There is no `dispatchBPM()` method** — use the `bpm` setter or `dispatchMIDIClock()` for clock-synced BPM.

### EffectsPipeline Testing Notes
- **colorEffect always returns `true`** — even with velocity 0, it still modifies pixels. Use **strobeEffect with velocity 0** to test the "no modification" path (returns `false`).
- **Custom constructor params must include full `effectRanges`** — effects access `effectContext.effectRanges.color.min` etc. Partial ranges cause `TypeError: Cannot read properties of undefined`. Spread from `settings.effectRanges` when customizing.
- **`requiresNote` flag**: Effects with `requiresNote: true` (color, mirror, split, offset) are skipped when `effect.note` is not a number. Effects without the flag (strobe, glitch) still apply.
- **glitchEffect uses `Math.random()`** — must mock with `vi.spyOn(Math, 'random').mockReturnValue(value)` for deterministic tests. The glitch trigger condition is `Math.random() < intensity * glitchPixelProbability` (default threshold = 0.1). Use `0.05` to trigger glitches, `0.5` to avoid them. **`Math.random() = 0` DOES trigger** because `0 < 0.1` is true.
- **glitchEffect velocity 0 returns `false`** — intensity is 0, so `0 < 0 * 0.1 = 0` is false. No pixels are glitched.
- **`preview.js` (ClipPreview) is not importable** — it has no `export` statement and auto-instantiates on load (`const clipPreview = new ClipPreview(); clipPreview.setup();`). Cannot be unit-tested with Vitest without refactoring the source. This is a known coverage gap.
