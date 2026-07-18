---
status: done
assignee: none
priority: low
---

# Task 97: Piano Roll Multi-Instance + Per-Keyboard Channel Selector

## Severity: Low (Feature — user requested, future-facing)

## Location
- `mainframe/src/js/PianoRoll.js` (extend)
- `mainframe/src/styles.css` (styling)

## Problem
The user wants to support more than one keyboard on a screen later. Each instance needs a MIDI channel choice.

## Requirements
1. **Multi-instance**: Multiple `<piano-roll>` elements on the same page
2. **Per-keyboard channel selector**: Each instance has its own MIDI channel choice
3. **Layout**: Exact multi-keyboard layout can wait — just ensure instances work independently

## Scope
- Ensure `PianoRoll` works correctly with multiple instances
- Add MIDI channel selector property/attribute
- Ensure state is isolated per instance
- Add tests for multi-instance behavior

## Verification
- Run `npm run test -w mainframe` to ensure all tests pass
- Run `npm run lint` to ensure no lint errors

## Constraints
- **Vanilla JS only** — no frameworks
- **KISS** — just ensure isolation and channel selection
- **NPM Protocol**: NEVER run `npm install` yourself.

## Dependencies
- Task 93 (Unified Piano Roll) — must be completed first
- Tasks 94, 95, 96 — modes should be completed first
