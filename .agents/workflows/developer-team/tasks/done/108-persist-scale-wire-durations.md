---
status: done
assignee: none
priority: medium
---

# Task 108: Persist Scale Mode + Wire Frame Durations on Create/Save

## Severity: Medium (Feature — user requested via spec)

## Location
- `mainframe/src/js/ClipEditor.js`
- `mainframe/src/main.js`
- `mainframe/server/index.js`
- `mainframe/scripts/clips/` (pipeline)

## Problem
Scale mode and frame durations need to be persisted and properly wired through the create/save flow.

## Requirements
1. **Persist scale mode** in meta or alongside raw assets so edit/recompile can reproduce same fit
2. **Wire frame durations on create/save** — `<clip-frames>` duration inputs are in milliseconds; `frameRatesForFrames` is FPS
3. **Use one shared ms↔FPS helper** to convert ms → FPS on save (`fps ≈ 1000 / delayMs`, with sensible fallback when missing or 0)
4. **Use inverse for edit load** — convert FPS → ms when loading existing meta into UI
5. **Do not duplicate conversion logic** — one shared helper for both UI durations and GIF delays

## Verification
- Run `npm run test -w mainframe` to ensure all tests pass
- Run `npm run lint` to ensure no lint errors
- Run `npm run build -w mainframe` to ensure build succeeds

## Constraints
- **Vanilla JS only** — no frameworks
- **KISS** — one shared helper
- **NPM Protocol**: NEVER run `npm install` yourself.

## Dependencies
- Task 104 (Alpha/Scale Modes) — provides scale mode
- Task 105 (Animated GIF Expand) — provides delay→timing conversion
- Task 107 (Unify Create/Edit UI) — provides shared editor

## Spec Reference
`.agents/workflows/developer-team/spec/clip-upload-edit-feature.md` §7, §9
