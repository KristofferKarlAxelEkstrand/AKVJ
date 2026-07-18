---
status: done
assignee: mainframe-developer
priority: high
---

# Task 184: Phase 1 — Rename `category` → `select` Mode

## Epic
`.agents/workflows/developer-team/epics/keybed-for-mapping.md`
Spec: `.agents/workflows/developer-team/spec/feature-keybed-for-mapping.md`

## Scope

Rename the `category` mode to `select` throughout the codebase. Simplify select mode behavior.

### Rename
- `PianoRoll.js` — mode attribute value, mode switching logic
- `PianoKey.js` — mode checks, rendering branches
- `index.html` — mode selector `<option>` value
- `main.js` — any mode references
- Tests — update all references

### Simplify Select Mode
Per spec: "Click a note → the note number is dispatched. That's it. No clip list, no dimming, no read-only view below the roll."
- Remove clip view rendering in select mode
- Remove dimming behavior
- Remove `is-compact` class usage in select mode
- Select mode should just dispatch `keyclick` with the note number

## Verification
- `npm run test -w mainframe`
- `npm run lint`
- `npm run build -w mainframe` (if applicable)

## Files
- `mainframe/src/js/PianoRoll.js`
- `mainframe/src/js/PianoKey.js`
- `mainframe/src/index.html`
- `mainframe/src/main.js`
- `mainframe/test/PianoRoll.test.js` (if exists)
- `mainframe/test/PianoKey.test.js` (if exists)
