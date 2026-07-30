---
status: done
assignee: mainframe-developer
priority: medium
stage: done
verification_status: unverified
last_verified_at: unverified
migration_source: legacy-workflow
migration_imported_at: 2026-07-30
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

## Suite gate (from QA / `[BUG]-pianoroll-drop-test-mapping-move-mime.md`)

`PianoKey.#handleDrop` reads `MIME_AKVJ_MAPPING_MOVE` first. Drop-test `getData` mocks must be
MIME-aware (empty for move; clip id for `MIME_AKVJ_CLIP_ID` / `text/plain`) — naive
`getData: () => 'new-clip'` makes move parse fail and the handler return early. Fix these mocks
as part of DnD work so `npm run test -w mainframe` is green before report. Task **426** stays in
backlog until this suite is green.

Verify: `npm run lint -w mainframe`, `npm run test -w mainframe`, `npm run build`.
