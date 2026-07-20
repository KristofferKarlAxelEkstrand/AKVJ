---
status: done
assignee: mainframe-developer
priority: medium
---

# Task 273: Implement `<piano-roll>` filter mode (Phase 3)

## Epic

Part of `.agents/workflows/developer-team/epics/todo/piano-roll-modes.md`.

## Description

Add a reusable Filter mode to the unified `<piano-roll>` custom element. Filter mode lets users narrow visible clip placements by criteria such as clipId, layer group, trigger type, and role, dimming or hiding non-matching cells.

## Requirements

- Add a Filter view container in `PianoRoll.js` with filter controls (dropdowns, toggles, clear button).
- Implement filter state management (private `#filterState`, getters/setters, reset).
- Wire filter changes to the grid visibility mask (hide/dim non-matching cells).
- Dispatch a `pianoroll:filter-changed` custom event with `{ detail: { filters } }`.
- Provide an active filter summary bar.
- Keep filter state client-side (persistence to `localStorage` optional).

## Affected files

- `mainframe/src/js/PianoRoll.js`
- `mainframe/src/scss/PianoRoll.scss`
- `mainframe/test/PianoRoll.test.js` (add filter mode tests)

## Verification

1. `npm run lint` passes.
2. `npm run test -w mainframe` passes.
3. `npm run build -w mainframe` passes.
4. Filter mode hides/dims non-matching cells.
5. Mode selector can switch to Filter and back without losing channel/mapping state.

## Notes

- Coordinate with Task 272 (Phase 1 infrastructure / Edit mode). Extend the existing mode-state scaffolding rather than duplicating it.
- Filter mode must be reusable on both `/key-map` and `/library` pages.
- Do not implement the library page integration here; that is Task 274.
