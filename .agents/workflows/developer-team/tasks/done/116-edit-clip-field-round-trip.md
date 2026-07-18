---
status: done
assignee: mainframe-developer
priority: medium
---

# Task 116: Edit Clip — Editor Field Round-Trip + Persisted Dimensions

## Severity: Feature

## Summary
Ensure every editor-owned field survives a full round-trip when editing an existing clip. Hydrate values from `meta.json` on load and write `frameWidth`, `frameHeight`, and `scaleMode` back to `meta.json` on save.

## Acceptance Criteria
- Hydrate into the editor on load (read-only clip id in edit mode): `name`, `role`, `playback`, `frameWidth`/`frameHeight` (default 240×135 if absent), `scaleMode` (default `fit` if absent), and `frameRatesForFrames` (FPS → ms).
- Do not require authors to hand-edit `frames` / `framesPerRow` in the UI; derive them from the staged frame list on save.
- On save, stamp `frameWidth`, `frameHeight`, and `scaleMode` into `meta.json` so future re-opens are faithful.
- Reject save with zero frames (same rule as create).
- If only meta/timing changed and frames are unchanged, a meta-only update is acceptable as long as ≥1 frame remains on disk.
- Add/update tests for field hydrate, save overwrite, and zero-frame reject.
- Verify with `npm run lint`, `npm run test -w mainframe`, and `npm run build -w mainframe`.

## Notes
- Depends on Tasks 114 and 115 (load/hydrate).
- Keep FPS on disk and milliseconds in the UI; do not add a parallel ms map to meta.
