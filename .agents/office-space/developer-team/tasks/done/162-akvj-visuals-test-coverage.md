---
status: done
assignee: akvj-developer
priority: medium
stage: done
verification_status: unverified
last_verified_at: unverified
migration_source: legacy-workflow
migration_imported_at: 2026-07-30
---

# Task 162: akvj `visuals/` Test Coverage Gaps (Test Marshal Sweep 1)

## Source
`.agents/workflows/developer-team/inbox/read/[TEST]-akvj-visuals-coverage.md`
(Test Marshal — read the original for the full per-item checklist; condensed below).

## Summary
Three modules extracted during the earlier refactor wave (`ClipTiming.js`,
`PlaybackController.js`, `ProjectCatalog.js`) have **zero direct unit tests** — only indirect
coverage via `Clip.test.js` / `ClipLoader.test.js`, leaving real logic branches unverified.
`EffectsPipeline.destroy()` is untested. `Clip.test.js` also has an `appState` singleton leak
causing order-dependent test fragility. No product bugs suspected — this is coverage/trust
work, not a bugfix.

## Checklist (highest signal first)

### 1. `PlaybackController.js` — direct unit tests for untested playback modes
`pingpong` (boundary reversal both directions, multi-advance), `random` (range, mock
`Math.random`), `reverse` (start/wrap), `scrub` (position mapping, clamping, no-op outside
scrub mode, `advance()` always true), `finish()`/`clearFinished()`, `playbackMode` getter,
`reset()` on reverse mode. Full case list in the source ticket.

### 2. `ClipTiming.js` — direct unit tests using its injection points
`bpmProvider` / `clockSource` injection, `getFrameInterval()` BPM-sync formula + clamping +
fallback chain (`frameDurationBeats[0]` → `DEFAULT_FRAME_DURATION_BEATS`), FPS-mode fallback,
`isClockDriven` getter, clock-pulse advancement + fallback pulse count, `unsubscribeFromClock()`
behavior (including the try/catch on failed unsubscribe), `advanceFrame()` early return when
clock-driven, `reset()`, `#initBPMSync` throwing on zero/negative `frameDurationBeats`. Full
case list in the source ticket.

### 3. `ProjectCatalog.js` — direct unit tests (nearly all paths untested)
`fetchActiveProjectId()` success/invalid-field/invalid-pattern/fetch-error, `fetchProjectsIndex()`
valid/filtered/fetch-fail/non-array, `buildProjectKeyMapUrl()` / `buildProjectClipsJsonUrl()`
success + throw-on-invalid-id, `setActiveProjectId()`/getter round-trip, `#loadJson`
cache-busting in DEV mode. Full case list in the source ticket.

### 4. `EffectsPipeline.destroy()` — untested
`destroy()` nulls `#scratchBuffer` (next `apply()` reallocates) and `#effectContext`
(subsequent `apply()` doesn't throw).

### 5. `Clip.test.js` — fix `appState` singleton leak (trustworthiness, do this regardless of scope)
Several BPM-sync tests set `appState.bpm = 120` without resetting in `afterEach`; inconsistent
`appState.reset()` calls create order-dependent fragility. Add a proper `afterEach` (scoped to
the BPM sync `describe` block, or top-level for the whole `Clip` suite) that always calls
`appState.reset()`.

### 6. `effectVariant.js` — direct test (low priority)
`getEffectVariant()`: `isVariantA: true` below threshold, `false` at/above threshold (boundary
case included).

## Notes
- Items 1–3 are the highest-signal gaps — real logic in playback/timing that could hide bugs.
  `ClipTiming`'s `bpmProvider`/`clockSource` injection points were built for testability but
  are never exercised directly today.
- Item 5 is a quick, high-value fix — prevents flaky/order-dependent failures regardless of
  what else in this task gets done first.
- Not required for this task, but noted by the Test Marshal as related: a direct
  `ClipLoader.test.js` case for `setupClipsFromProject()` (the live project-switching path)
  would also be valuable — it's covered indirectly via the `ProjectCatalog` gap above.

## Suggested Verification
- `npm run test` — new tests pass, no regressions in existing `Clip.test.js` /
  `ClipLoader.test.js` / `EffectsPipeline.test.js`.
- `npm run lint`

## Files
- `akvj/src/js/visuals/PlaybackController.js` (test target)
- `akvj/src/js/visuals/ClipTiming.js` (test target)
- `akvj/src/js/visuals/ProjectCatalog.js` (test target)
- `akvj/src/js/visuals/effects/EffectsPipeline.js` (test target)
- `akvj/src/js/visuals/effects/effectVariant.js` (test target)
- `akvj/test/Clip.test.js` (leak fix)
- New test files as needed (e.g. `PlaybackController.test.js`, `ClipTiming.test.js`,
  `ProjectCatalog.test.js`)
