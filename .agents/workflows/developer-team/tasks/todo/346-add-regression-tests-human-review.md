---
status: backlog
assignee: none
priority: medium
---

# Task 346: Add regression tests for human review findings

## Source

Test Marshal `[TEST]-human-review-coverage-gaps-2026-07-20.md`

## Description

The human review of `akvj` and `mainframe` flagged product bugs that are not guarded by tests. Add the following regression tests as the related product tasks are implemented:

- `akvj/test/Compositor.test.js`: no mask + both layer groups active; assert mixed output contains pixels from both A and B (or that `drawImage` is called for both canvases). Related: Task 338.
- `akvj/test/ClipLoader.test.js`: a key-map that references the same `clipId` on multiple notes/velocities constructs/decodes the `Image` only once per unique clip. Related: Task 339.
- `akvj/test/MaskManager.test.js` + `akvj/test/Midi.test.js`: `MaskManager` and `Midi` accept injected `settings`/`appState` so `withSettings.js` can override mixer channel and MIDI limits. Related: Task 340.
- `mainframe/test/server.test.js`: `DELETE /api/clips/:clipId` removes the clip directory **and** prunes the clip from `key-map.json`; later `PUT /api/mapping` still succeeds. Related: Task 341.
- `mainframe/test/server.test.js`: `PUT /api/clips/:clipId` rejects invalid value shapes (e.g. `{"frames":"banana"}`) with 400 and does not mutate `meta.json`. Related: Task 342.
- `mainframe/test/server.test.js` or `mainframe/test/httpUtils.test.js`: a POST/PUT body larger than `MAX_BODY_BYTES` returns 413 and does not crash the server. Related: Task 344.

## Verification

- All newly added tests pass
- `npm run lint` passes
- `npm run test` passes
- `npm run build` passes
