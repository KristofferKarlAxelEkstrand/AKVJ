---
status: todo
stage: queued
priority: medium
assignee: none
work_class: general
risk: low
created: 2026-07-30
owned_paths:
  - mainframe/test/ClipEditorController.test.js
verification_tier: focused
migration_source: legacy-workflow
migration_previous_state: backlog
---
# 506 — ClipEditorController trigger / retrigger DOM ↔ save unit tests

From: `[TEST]-mainframe-clipeditor-trigger-fields.md` (test-marshal).

## Gap

`editorMeta` / server already cover `retrigger` / `triggerType` / `triggerGroup`. Controller hydrate + save paths are untested.

## Checklist

1. Hydrate meta `{ retrigger: false, triggerType: 'latch', triggerGroup: 'masks' }` → checkbox / select / group match.
2. Meta-only PUT after hydrate with field changes → body has matching three fields (`null` group when cleared).
3. Create POST with non-default extended fields → POST/meta carries them.
4. Fixture: add latch + one-shot options on `#clip-editor-trigger-type`.

## Files

- `mainframe/test/ClipEditorController.test.js` (+ fixture HTML if colocated)
- Touch product source only if fixture/options require it — prefer tests only.

## Out of scope

- Pure `editorMeta` / server PUT (already tested)
- **500** dead UI (`#clip-editor-frame-duration-beats`)
- **503** PianoRoll keyboard/batch

## Verify

`npm run test -w mainframe -- test/ClipEditorController.test.js` (or full mainframe suite).

Scope: **mainframe-developer**.
