---
status: done
assignee: none
priority: medium
---

# Task 94: Piano Roll Edit Mode — In-Key Velocity-Band Clip Display

## Severity: Medium (Feature — user requested)

## Location
- `mainframe/src/js/PianoRoll.js` (extend)
- `mainframe/src/js/PianoKey.js` (extend)
- `mainframe/src/styles.css` (styling)

## Problem
The user wants edit mode to show clips inside keys, stacked by velocity bands. Each key can hold multiple clips ordered by velocity (e.g. clip A = 0–50, clip B = 50–127). Lower velocity sits further down. Proportion of the key ≈ velocity range.

## Requirements
1. **Edit mode**: Change mapping (which MIDI key/note), velocity, and related clip assignment
2. **In-key clip display**: Clips stacked inside keys, ordered by velocity bands
3. **Velocity proportion**: Lower velocity clips sit further down, proportion of key ≈ velocity range
4. **Editable fields**: Start with key + velocity. Expect more fields later — design for extensibility
5. **Simple layout**: Keep it clean and intuitive

## Scope
- Extend `PianoRoll` edit mode with velocity-band clip display
- Extend `PianoKey` to render clips inside the key element
- Add click-to-edit interaction for clip assignment
- Style velocity bands proportionally
- Add tests

## Verification
- Run `npm run test -w mainframe` to ensure all tests pass
- Run `npm run lint` to ensure no lint errors

## Constraints
- **Vanilla JS only** — no frameworks
- **KISS** — simple stacked display
- **NPM Protocol**: NEVER run `npm install` yourself.

## Dependencies
- Task 93 (Unified Piano Roll) — must be completed first
