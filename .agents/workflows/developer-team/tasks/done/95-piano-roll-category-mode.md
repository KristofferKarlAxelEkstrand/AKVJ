---
status: done
assignee: none
priority: low
---

# Task 95: Piano Roll Category Mode — Single-Key Clip View

## Severity: Low (Feature — user requested)

## Location
- `mainframe/src/js/PianoRoll.js` (extend)
- `mainframe/src/styles.css` (styling)

## Problem
The user wants a category mode: select one key and view its clips in a read-focused layout (no full edit chrome).

## Requirements
1. **Category mode**: Select one key to view its clips
2. **Read-focused**: No edit chrome — just display clips assigned to the selected key
3. **Simple navigation**: Click a key to see its clips, click again or click back to return

## Scope
- Extend `PianoRoll` with category mode
- Add single-key selection interaction
- Display clips for selected key in a read-only view
- Style minimally
- Add tests

## Verification
- Run `npm run test -w mainframe` to ensure all tests pass
- Run `npm run lint` to ensure no lint errors

## Constraints
- **Vanilla JS only** — no frameworks
- **KISS** — simple read-only view
- **NPM Protocol**: NEVER run `npm install` yourself.

## Dependencies
- Task 93 (Unified Piano Roll) — must be completed first
