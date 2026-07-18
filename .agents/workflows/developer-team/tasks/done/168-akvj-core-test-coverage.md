---
status: done
assignee: akvj-developer
priority: high
---

# Task 168: AppState + AdventureKidVideoJockey Test Coverage (Test Marshal Sweep 2)

## Source
`.agents/workflows/developer-team/inbox/[TEST]-akvj-core-coverage.md`
(Test Marshal — coverage gaps in `akvj/src/js/core/`).

## Related
- Epic `refactor-for-greateness-2.md` §T1 (dedicated tests for ClipTiming / PlaybackController / ProjectCatalog)
- Epic §A2-5 #1 (missing `AppState.test.js` — additive finding from Task 150 audit)
- Task 162 (akvj visuals test coverage — separate sweep)

## Scope

### 1. AppState.js — dedicated unit test file (HIGH PRIORITY)
**File:** `akvj/src/js/core/AppState.js`
**Existing tests:** Indirect only via `UserMessages.test.js`, `midi.test.js`, `Clip.test.js`

Create `akvj/test/AppState.test.js` with cases for:
- `bpm` setter: clamps to min/max, sets source to `'manual'`, dispatches `bpmChanged`, no dispatch when unchanged
- `bpmSource` getter: returns initial `'default'`
- `dispatchMIDIControlChange`: matching channel+CC converts to BPM (source `'cc'`); non-matching only dispatches `midiControlChange`; when `bpmSource === 'clock'`, CC does NOT change BPM
- `#convertCCToBPM`: CC=0 → min, CC=127 → max, CC=63 → midpoint
- `dispatchMIDIClock`: first pulse sets `#lastClockTime` only; 6+ pulses calculate BPM (source `'clock'`); interval < 1ms ignored; dispatches `midiClock` event
- `#calculateBPMFromClock`: correct formula `(MS_PER_MINUTE / avgInterval * PPQN)`
- `#resetClockTimeout`: after timeout, source falls back to `'default'` + dispatches `bpmSourceChanged`; stale timeout invalidated by `reset()` (generation check)
- `dispatchMIDIStart/Continue/Stop`: correct state resets and event dispatches
- `dispatchProjectSelection(note)`: dispatches `projectSwitch` with `{ note }`
- `dispatchProjectLoadComplete(projectId)`: sets `projectSwitching` false, dispatches `projectLoadComplete`
- `dispatchProjectLoadError(projectId, errorMessage)`: sets `projectSwitching` false, dispatches `projectLoadError`
- `midiConnected` / `clipsLoaded` / `activeProjectId` setters: only dispatch when value changes
- `projectSwitching` setter: dispatches `projectLoadStart` when true, not when false
- `subscribe()`: returns unsubscribe function that removes listener
- `reset()`: restores all defaults, clears timeout, increments generation
- Skip `showUserMessage` (already tested in `UserMessages.test.js`)

### 2. AdventureKidVideoJockey.js — project switching path (MEDIUM)
**File:** `akvj/src/js/core/AdventureKidVideoJockey.js`

Cases to add to `akvj/test/AdventureKidVideoJockey.test.js`:
- `#handleProjectSwitch` with `{ projectId }`: calls `#switchProject`
- `#handleProjectSwitch` with `{ note }`: resolves from projects index, then switches
- `#handleProjectSwitch` when `#isSwitchingProject` is true: no-op
- `#handleProjectSwitch` when projectId equals current: no-op
- `#handleProjectSwitch` when resolved projectId is null/empty: no-op
- `#resolveProjectIdFromNote`: fetches+caches projects index; returns null on fetch failure or out-of-bounds
- `#switchProject`: freezes renderer, shows loading, loads clips, swaps, unfreezes, dispatches `projectLoadComplete`
- `#switchProject` error path: unfreezes, dispatches `projectLoadError`, shows user message
- `#setupProjectEventListeners`: subscribes to `projectSwitch`
- `handleControlChange` routing: CC events reach `layerManager.handleControlChange`
- `#setupClips` error path: dispatches `clipLoadError`, sets `clipsLoaded` false

### 3. Fix flaky `setTimeout` sleeps in existing tests (MEDIUM)
**File:** `akvj/test/AdventureKidVideoJockey.test.js`

Replace `await new Promise(resolve => setTimeout(resolve, 100))` with event-based waits:
- Use `waitForEvent(appState, 'videoJockeyReady')` or similar
- For `disconnectedCallback` test: await ready event before calling `disconnectedCallback`

## Verification
- `npm run test -w akvj` — all new and existing tests pass
- `npm run lint`

## Files
- `akvj/test/AppState.test.js` (new)
- `akvj/test/AdventureKidVideoJockey.test.js` (existing — add cases + fix flaky waits)
- `akvj/src/js/core/AppState.js` (reference only — no changes expected)
- `akvj/src/js/core/AdventureKidVideoJockey.js` (reference only — no changes expected)
