---
status: done
assignee: mainframe-developer
priority: medium
---

# Task 143: Mainframe Editor — Pattern Mode + Placement Fields

## Depends On
Task 141 (spec) must be done first — this exposes whatever fields/UI it settles on. Read its
report before starting; this stub is intentionally light since the exact fields are TBD by 141.
**Status: 141 is done** (`tasks/done/141-spec-clip-size-pattern-placement.md`), as is the akvj
render path (Task 142, `tasks/done/142-akvj-pattern-placement-render.md`) and the validator bug
that was blocking `scaleMode: "pattern"` from passing `npm run clips` (Task 157, just shipped).
This is now the last piece to make pattern mode fully usable end-to-end — read 141's report for
the exact field names/shape before wiring the editor UI.

## Source
User request: `.agents/workflows/developer-team/inbox/read/request-clip-size-pattern-placement-whole-pixels.md`
Spec: whatever Task 141 lands in `clip-upload-edit-feature.md` / `feature-edit-clip.md` /
`clip-schema.md`

## Goal
Add editor UI (`ClipEditorController.js`) for the new `pattern` mode and placement fields
decided in Task 141, following existing conventions (e.g. how `scaleMode`/`role` are exposed
today, Task 116/117's extended-fields pattern). Validate shape in
`mainframe/scripts/clips/lib/validate/meta.js` per Task 141's field decisions.

## Files (confirm against 141's actual design before editing)
- `mainframe/src/js/ClipEditorController.js`
- `mainframe/src/index.html`
- `mainframe/scripts/clips/lib/validate/meta.js`
- `mainframe/shared/clipSchema.js`
