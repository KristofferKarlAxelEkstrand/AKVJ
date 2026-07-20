---
status: done
assignee: mainframe-developer
priority: medium
---

# Task 272: Pianoroll modes — Phase 1 infrastructure

## Epic

Part of `.agents/workflows/developer-team/epics/todo/piano-roll-modes.md`.

## Description

Begin implementation of the unified pianoroll custom element with three switchable modes (Edit, Filter, Play/Preview). This task covers Phase 1 (infrastructure) and Phase 2 (Edit Mode MVP) as outlined in the epic.

## Phase 1 — Infrastructure

- Add mode selector buttons (Edit / Filter / Play) positioned to the left of the channel picker in `PianoRoll.js`.
- Implement a mode state machine (private `#mode` field, `set mode(mode)` / `get mode()`, `attributeChangedCallback` for `mode`).
- Wire mode changes to view toggling (show/hide Edit/Filter/Play containers).
- Add CSS for active mode styling in `PianoRoll.scss`.
- Dispatch a `pianoroll:mode-changed` custom event with `{ detail: { mode } }`.

## Phase 2 — Edit Mode MVP

- Render a grid of notes × velocity in the Edit view.
- Implement click-to-place clip logic (map a clip to a note/velocity cell for the current channel).
- Show hover tooltip with clip metadata (clipId, name, triggerType) where applicable.
- Provide visual feedback for hover, selection, and invalid placements.
- Right-click to delete a clip placement from a cell.

## Affected files

- `mainframe/src/js/PianoRoll.js`
- `mainframe/src/scss/PianoRoll.scss`
- `mainframe/src/index.html` (if markup outside the component needs updating)
- `mainframe/test/PianoRoll.test.js` (add/update tests for mode switching and edit interactions)
- `mainframe/src/js/mainframeState.js` (if mode state is shared)

## Verification

1. `npm run lint` passes.
2. `npm run test -w mainframe` passes.
3. `npm run build -w mainframe` passes.
4. The `/key-map` page shows the mode selector and Edit mode grid with click-to-place behavior.

## Notes

- Keep the existing `<piano-roll>` API (channel, channel-select, mappings, keyclick, etc.) stable; add mode-aware behavior on top.
- Use DOM grid initially; canvas optimization is a later phase.
- Filter and Play modes are out of scope for this task.
