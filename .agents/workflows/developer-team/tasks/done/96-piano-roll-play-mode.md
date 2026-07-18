---
status: done
assignee: none
priority: medium
---

# Task 96: Piano Roll Play Mode — Sticky Keys + Multi-Touch

## Severity: Medium (Feature — user requested)

## Location
- `mainframe/src/js/PianoRoll.js` (extend)
- `mainframe/src/js/PianoKey.js` (extend)
- `mainframe/src/styles.css` (styling)

## Problem
The user wants play mode: mouse and multi-touch to try the mapping. Sticky keys: click = note on, click again = note off.

## Requirements
1. **Play mode**: Mouse and multi-touch to trigger notes
2. **Sticky keys**: Click = note on, click again = note off (toggle behavior)
3. **Multi-touch**: Support simultaneous touches for chord play
4. **Visual feedback**: Show active (pressed) keys clearly

## Scope
- Extend `PianoRoll` with play mode
- Add sticky toggle behavior to `PianoKey`
- Add pointer/touch event handling (multi-touch)
- Add visual feedback for active keys
- Add tests

## Verification
- Run `npm run test -w mainframe` to ensure all tests pass
- Run `npm run lint` to ensure no lint errors

## Constraints
- **Vanilla JS only** — no frameworks
- **KISS** — simple toggle behavior
- **NPM Protocol**: NEVER run `npm install` yourself.

## Dependencies
- Task 93 (Unified Piano Roll) — must be completed first
