---
status: done
assignee: mainframe-developer
priority: medium
---

# Task 402: clips handler EDITABLE_META + frameDurationsMs

## Source

Nitpicker `[NIT]-handlers-editable-meta-frameDurationsMs-2026-07-20.md`

## Description

Behaviour fix in `mainframe/server/handlers/clips.js`:

- [x] `EDITABLE_META_FIELDS`: drop deprecated `'loop'`; add `'frameDurationsMs'` (ClipEditor meta PUT already sends it; Set currently strips it)
- [x] Create / frames / recompile body key `frameDurations` → `frameDurationsMs`; update `ClipEditorController.js` POST/PUT frames (~L385, L434)

## Verification

- `npm run lint -w mainframe` / `npm run test -w mainframe` pass
- Meta-only PUT persists `frameDurationsMs`
