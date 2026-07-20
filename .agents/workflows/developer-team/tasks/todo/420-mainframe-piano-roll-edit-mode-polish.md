---
status: backlog
assignee: none
priority: medium
---

# 420 — Piano roll Edit mode: undo/redo, batch cell selection, drag-and-drop reorder

Epic: `.agents/workflows/developer-team/epics/todo/piano-roll-modes.md` (Phase 5).

Phase 5 polish for Edit mode:

- **Undo/redo stack** for mapping edits (place / delete / move). Keep it bounded; this is UI state,
  not persisted to key-map.json until the user saves.
- **Batch cell selection** — extend the existing drag-select to support batch operations (delete,
  clear, assign) on the selected set.
- **Drag-and-drop reorder** — move a clip placement across velocity rows or notes by dragging the
  cell.

Scope: `mainframe/` piano-roll custom element and SCSS only.

When done, update the "Not built yet" section of `spec/mapping.md` (currently `draft`) for these
items.

Verify: `npm run lint -w mainframe`, `npm run test -w mainframe`, `npm run build`.
