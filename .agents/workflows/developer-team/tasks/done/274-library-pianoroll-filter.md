---
status: done
assignee: mainframe-developer
priority: medium
---

# Task 274: Mount `<piano-roll>` in filter mode on the library page

## Epic

Part of `.agents/workflows/developer-team/epics/todo/piano-roll-modes.md`.

## Description

On the `/library` page, render the existing `<piano-roll>` element at the bottom of the screen in Filter mode. When the pianoroll filter changes, the `<akvj-clip-list>` above should update to show only clips that match the active filter.

## Requirements

- Add `<piano-roll>` to the library page in `mainframe/src/index.html` (or mount it programmatically from the library page controller).
- Position it at the bottom, matching the `/key-map` layout and sticky behavior.
- Set the pianoroll mode to `filter` on the library page and keep it read-only (no clip editing).
- Listen for `pianoroll:filter-changed` events and propagate the filters to `mainframeState` so the clip list re-renders.
- Ensure the clip list only shows clips matching the active filter criteria.

## Affected files

- `mainframe/src/index.html`
- `mainframe/src/js/AkvjMainframe.js`
- `mainframe/src/js/PianoRoll.js` (if mode attribute wiring is needed)
- `mainframe/src/js/mainframeState.js` (filter state if shared)
- `mainframe/src/scss/PianoRoll.scss` and library page styles
- `mainframe/test/AkvjMainframe.test.js` or `mainframe/test/PianoRoll.test.js`

## Verification

1. `npm run lint` passes.
2. `npm run test -w mainframe` passes.
3. `npm run build -w mainframe` passes.
4. `/library` shows the pianoroll at the bottom in filter mode.
5. Changing pianoroll filters updates the clip list to show only matching clips.

## Notes

- Depends on Task 272 (Phase 1 infrastructure) and Task 273 (Filter mode implementation).
- Keep the layout consistent with `/key-map`.
- The filter UI must be read-only on the library page; do not expose editing affordances.
