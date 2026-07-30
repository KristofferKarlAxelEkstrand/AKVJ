---
status: done
assignee: akvj-developer
priority: low
stage: done
verification_status: unverified
last_verified_at: unverified
migration_source: legacy-workflow
migration_imported_at: 2026-07-30
---

# Task 158: akvj Naming & Semantics Sweep — `visuals/` + `core/` + `midi-input/` + `ui/` + `utils/` + `tools/` (19 items)

## Source
Six `[NIT]` batches from the Nitpicker — a full systematic sweep of `akvj/src/js/` (this is the
last batch, covering `main.js` + the dev tool), filed same day and merged here since several
items overlap/cross-reference each other (items 3, 9, 17 are all `#clips` → `#loadedClips`;
items 5, 8, 18 are all timestamp-not-time; items 7, 10, 14, 15, 19 are all the same vague-
`#setup()`/`setup()` pattern, across five different files):
- `.agents/workflows/developer-team/inbox/read/[NIT]-visuals-naming-sweep-2025-07-18.md` (items 1-6)
- `.agents/workflows/developer-team/inbox/read/[NIT]-core-naming-sweep-2025-07-18.md` (items 7-9)
- `.agents/workflows/developer-team/inbox/read/[NIT]-midi-input-naming-sweep-2025-07-18.md` (item 10)
- `.agents/workflows/developer-team/inbox/read/[NIT]-ui-naming-sweep-2025-07-18.md` (items 11-13)
- `.agents/workflows/developer-team/inbox/read/[NIT]-utils-naming-sweep-2025-07-18.md` (items 14-16)
- `.agents/workflows/developer-team/inbox/read/[NIT]-root-and-tools-naming-sweep-2025-07-18.md` (items 17-19)
(moved there after triage — read the originals for full rationale per item).

**Note on `setup()` naming:** items 7, 10, 14, 15, 19 all rename a vague `setup()`/`#setup()`
but each gets a *different* replacement name fitting its own context (`#initializeVisuals()`,
`#initializeMIDIAccess()`, `mount()`, `enable()`, `initialize()`) — do not mechanically apply
one name everywhere; read each item's rationale.

**Heads up:** items 12-13 touch `akvj/src/js/ui/UserMessages.js`, the same file with the
currently-failing tests tracked in Task 163 (`163-fix-usermessages-test-failures.md`). If both
are in flight, land 163 first (or at least diagnose it first) so this rename isn't built on a
misunderstanding of currently-broken behavior — though a pure rename shouldn't itself depend on
the fix.

## Scope
Seventeen mechanical, low-risk field/method renames (no behavior change; three are public
method renames — `mount()`/`enable()`/`initialize()`, items 14-15-19) plus one file rename
(item 11, needs an import-path fix at its one call site) across `akvj/src/js/visuals/`,
`akvj/src/js/core/`, `akvj/src/js/midi-input/`, `akvj/src/js/ui/`, `akvj/src/js/utils/`, and
`akvj/src/tools/clip-preview/`. Update all call sites and any tests that reference the
field/method/file name directly.

1. `PlaybackController.js`: `#lastRandomFrame` → `#lastShuffleFrame` (line 15, refs 147, 164, 179)
   — only used in shuffle mode; name currently implies random mode.
2. `LayerGroup.js`: `#isClipsDirty` → `#isClipCacheDirty` (line 32 + all refs)
   — flag guards `#cachedActiveClips` invalidation, not clip data itself.
3. `LayerGroup.js`: `#clips` → `#loadedClips` (line 23; refs in `setClips`, `noteOn`, `destroy`)
   — too vague next to `#activeClips`.
4. `LayerManager.js`: `#handlers` → `#channelRouteHandlers` (line 43, built by `#buildHandlers()`
   at line 87 → rename to `#buildChannelRouteHandlers()` too)
   — vague in a multi-concern class (layer groups + mask + effects + MIDI routing).
5. `ClipTiming.js`: `#lastTime` → `#lastTimestamp` (line 52; refs in `advanceFrame`, `reset`)
   — ambiguous colloquial reading in a timing module.
6. `ClipTiming.js`: `#unsubscribeClock` → `#unsubscribeFromClock` (line 53)
   — mismatches the `unsubscribeFromClock()` method it stores the return of.
7. `AdventureKidVideoJockey.js`: `#setup()` → `#initializeVisuals()` (line 263, called from
   `connectedCallback` at line 203)
   — orchestrates clips + renderer + readiness signal; reads as a fourth vague `#setup*`
   alongside `#setupMIDIEventListeners()`, `#setupProjectEventListeners()`, `#setupClips()`.
8. `AppState.js`: `#lastClockTime` → `#lastClockTimestamp` (line 52; refs in
   `#processClockPulse`, `dispatchMIDIStart`, `dispatchMIDIStop`, `reset`)
   — stores a `performance.now()` value, not a colloquial "time"; same smell as item 5.
9. `AdventureKidVideoJockey.js`: `#clips` → `#loadedClips` (line 20, referenced throughout)
   — same vague name as item 3 (`LayerGroup.js#clips`); rename both for cross-file consistency
   on the same term.
10. `Midi.js`: `#setup()` → `#initializeMIDIAccess()` (line 28, called from constructor at
    line 21)
    — same vague-`#setup()` smell as item 7; class already has `#setupMIDIInputs()` and
    `#setupStateChangeListener()`, so `#setup` reads as a third setup-thing rather than the
    orchestrator (support check + access request).
11. `akvj/src/js/ui/LoadingOverlay.js` → rename file to `AkvjLoadingOverlay.js` (exported class
    is already `AkvjLoadingOverlay`, line 12/74) — update the import in
    `AdventureKidVideoJockey.js` (line 6: `import LoadingOverlay from '../ui/LoadingOverlay.js'`).
    File ↔ class name should agree per `code-standards.md`.
12. `UserMessages.js`: `#enqueue()` → `#pushMessage()` (line 51)
    — method calls `#items.unshift(...)` (prepend/LIFO), but "enqueue" implies FIFO. Class JSDoc
    explicitly documents "show-all stacking (not a one-at-a-time queue)" — name should match.
13. `UserMessages.js`: `#items` → `#messages` (line 14, referenced throughout)
    — vague container name in a class literally called `UserMessages`; domain name is right there.
14. `DebugOverlay.js`: `setup()` → `mount()` (line 117, public — called from `akvj/src/main.js:19`
    `debugOverlay.setup()`, and throughout `akvj/test/DebugOverlay.test.js`)
    — mounts overlay DOM, adds listener, subscribes to AppState, updates initial display; pairs
    naturally with `destroy()` (unmount).
15. `Fullscreen.js`: `setup()` → `enable()` (line 47, public — called from `akvj/src/main.js:15`
    `fullscreenManager.setup()`, and throughout `akvj/test/Fullscreen.test.js`)
    — no DOM to mount, only attaches `keydown`/`dblclick` listeners; `enable()` fits better than
    `mount()` here and pairs with `destroy()` (disable).
16. `DebugOverlay.js`: `#midiLog` → `#midiLogEntries` (line 37; refs in `#addLogEntry`,
    `#renderLog`, `destroy`)
    — holds an array of entry objects, not a string/DOM node; matches existing
    `MAX_LOG_ENTRIES`/`#addLogEntry` vocabulary in the same class.
17. `akvj/src/tools/clip-preview/ClipPreview.js`: `#clips` → `#loadedClips` (line 16; refs in
    `#loadClips`, `#populateClipIds`, `#loadClip`, `destroy`)
    — same vague-`#clips` pattern as items 3 and 9; holds the parsed `clips.json` catalog.
18. `akvj/src/tools/clip-preview/ClipPreview.js`: `#lastFrameTime` → `#lastFrameTimestamp`
    (line 21; refs in `#onSpriteLoaded`, `#animate`, `#handleVisibilityChange`)
    — same timestamp-not-time pattern as items 5 and 8.
19. `akvj/src/tools/clip-preview/ClipPreview.js`: `setup()` → `initialize()` (line 77, public;
    only call site is line 314 in the same file, module-level bootstrap — no test file exists
    for this dev tool)
    — same vague-`setup()` pattern as items 7, 10, 14, 15; registers listeners + kicks off
    clip loading.

## Constraints
- Pure rename — no behavior/logic changes. Do not touch the "what's clean" section callouts
  (those are praise, not action items) or the "out of lane" `try/catch` note (Overseer's call,
  not this task).
- Grep each field name across `akvj/src/` and `akvj/test/` before renaming to catch every
  reference (including tests that might assert on private state via bracket access, though
  none are expected here).

## Suggested Verification
- `npm run lint`
- `npm run test` — full akvj unit suite (these fields are covered by `LayerGroup.test.js`,
  `LayerManager.test.js`, `Clip.test.js` / `ClipTiming` coverage, `PlaybackController` coverage
  if it exists as its own test file)
- `npm run build`

## Files
- `akvj/src/js/visuals/PlaybackController.js`
- `akvj/src/js/visuals/LayerGroup.js`
- `akvj/src/js/visuals/LayerManager.js`
- `akvj/src/js/visuals/ClipTiming.js`
- `akvj/src/js/core/AdventureKidVideoJockey.js`
- `akvj/src/js/core/AppState.js`
- `akvj/src/js/midi-input/Midi.js`
- `akvj/src/js/ui/LoadingOverlay.js` (rename target)
- `akvj/src/js/ui/UserMessages.js`
- `akvj/src/js/core/AdventureKidVideoJockey.js` (import path update for item 11)
- `akvj/src/js/utils/DebugOverlay.js`
- `akvj/src/js/utils/Fullscreen.js`
- `akvj/src/main.js` (call-site updates for items 14-15)
- `akvj/test/DebugOverlay.test.js` (rename `setup()` → `mount()` calls, item 14)
- `akvj/test/Fullscreen.test.js` (rename `setup()` → `enable()` calls, item 15)
- `akvj/src/tools/clip-preview/ClipPreview.js` (items 17-19; no test file for this dev tool)
