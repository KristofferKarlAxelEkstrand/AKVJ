---
status: done
assignee: none
priority: high
---

# Task 107: Unify Create/Edit UI — Shared Editor with Add/Remove/Reorder

## Severity: High (Feature — user requested via spec)

## Location
- `mainframe/src/js/ClipEditor.js` (becomes shared editor)
- `mainframe/src/js/ClipFrames.js` (enhance for edit mode)
- `mainframe/src/main.js` (routing, load existing clips)
- `mainframe/src/index.html` (unified editor surface)

## Problem
Currently create (Upload tab) and edit (`<akvj-clip-editor>` metadata form) are separate. Spec requires one shared editor for both.

## Requirements
1. **Same UI for new clip and edit clip**: drop zone, frame list (`<clip-frames>`), staging preview, frame size/scale mode, playback, timing, role, name/unique id
2. **New clip**: empty editor → add images → save creates clip + spritesheet + meta
3. **Edit clip**: load existing frames (from raw assets and/or sprite cells) + meta into same editor → user can add, remove, clear all, reorder frames, change durations, change size/scale, edit meta → save updates clip
4. **Meta-only save OK** when frames are unchanged and at least one frame remains
5. **Reject save with zero frames** — show clear status error, do not write empty clip or strip last frame on disk
6. **Retire split** between Upload-only staging and metadata-only `<akvj-clip-editor>` — fold meta fields into shared editor
7. **Edit load path**: load prior raw frames when present; otherwise extract cells from `sprite.png` using meta `frames`/`framesPerRow`
8. **When loading existing FPS meta into UI**, convert FPS → ms with inverse of shared helper so editor stays in ms

## Verification
- Run `npm run test -w mainframe` to ensure all tests pass
- Run `npm run lint` to ensure no lint errors
- Run `npm run build -w mainframe` to ensure build succeeds

## Constraints
- **Vanilla JS only** — no frameworks
- **KISS** — one editor surface, not two
- **CSS per element** — use SCSS scoped under custom element
- **NPM Protocol**: NEVER run `npm install` yourself.

## Dependencies
- Task 102 (Unique ID Generation) — should be done first
- Task 103 (Accept PNG/JPG/GIF) — should be done first
- Task 104 (Alpha/Scale Modes) — should be done first

## Spec Reference
`.agents/workflows/developer-team/spec/clip-upload-edit-feature.md` §0, §9
