---
status: done
assignee: mainframe-developer
priority: medium
---

# Task 115: Edit Clip — Sprite Cell Extraction + Duration Hydrate

## Severity: Feature

## Summary
Harden the load path so older clips that only have `sprite.png` + `meta.json` (no `.raw-assets/`) can still be opened. Extract each cell from the spritesheet and hydrate per-frame durations from `frameRatesForFrames`, with a status indicator showing the load source.

## Acceptance Criteria
- Preferred load source order: raw assets first, then spritesheet cells.
- If no raw assets, load `sprite.png` (default `meta.png`) and split it into frames using `frames`, `framesPerRow`, and cell size (`frameWidth`/`frameHeight` when set; otherwise derive from sheet dimensions).
- Each extracted cell becomes one editable PNG frame with alpha preserved.
- Convert `frameRatesForFrames` (FPS) to milliseconds for `<clip-frames>` using the shared ms↔FPS helper.
- Expose load source in status (`Loaded N frames from sprite` / `from raw`) so authors know which source is being edited.
- Add/update tests for sprite-only load, raw-preferred load, and duration hydrate.
- Verify with `npm run lint`, `npm run test -w mainframe`, and `npm run build -w mainframe`.

## Notes
- Builds on Task 114 (URL-driven hydrate).
- Alpha preservation follows the upload spec rules.
