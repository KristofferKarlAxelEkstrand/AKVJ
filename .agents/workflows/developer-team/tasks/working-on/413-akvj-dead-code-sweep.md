---
status: in-progress
assignee: akvj-developer
priority: medium
---

# 413 — Dead-code sweep: akvj

Epic: `.agents/workflows/developer-team/epics/todo/refactor-for-greatness-2.md` (task S3).

Confirm each item is genuinely unreferenced before deleting — grep for the name across
`akvj/src/` and `akvj/test/` and say what you found. Task 408 is the precedent: an event with no
`src/` subscriber turned out to be a public signal the test suite depends on. If something looks
deliberate rather than dead, leave it and say so.

## Remove

- `displayContext` parameter/field threaded through `ClipLoader` and `Clip` — never read
- `PlaybackController.finish()` and `clearFinished()` — no callers
- `settings.mergeProjectSettings()` — exported, unused
- `MaskManager.handlesChannel()` — test-only; the real routing is inlined in `LayerManager`.
  If deleting it leaves a routing behaviour with no coverage, move the test to cover
  `LayerManager` instead of deleting outright.

## Consolidate

- `CLIP_ID_PATTERN` + `PROJECT_ID_PATTERN` → one `SAFE_ID_PATTERN` (verify the two regexes are
  actually identical first; if they differ, report the difference rather than merging)
- `'scrub'`-style bare literals → `PLAYBACK_MODES.SCRUB` (task 404 added the frozen enum)
- `effectParams` is declared in two places — single source
- `DEFAULT_FRAME_WIDTH` / `DEFAULT_FRAME_HEIGHT` — one canonical definition; check both
  `akvj/src/js/core/settings.js` and `akvj/src/js/visuals/clipMetadata.js`

## Verify

- `npm run lint` — no unused imports
- `npm run test && npm run test:visual && npm run build`
- No behaviour change; render loop and MIDI path untouched.
