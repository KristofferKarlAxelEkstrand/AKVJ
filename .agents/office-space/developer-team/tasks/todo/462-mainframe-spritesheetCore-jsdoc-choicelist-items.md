---
status: todo
stage: queued
priority: low
assignee: none
work_class: general
risk: low
created: 2026-07-30
owned_paths:
  - mainframe/shared/spritesheetCore.js
  - mainframe/src/js/ChoiceList.js
verification_tier: focused
migration_source: legacy-workflow
migration_previous_state: backlog
---
# 462 — spritesheetCore JSDoc + ChoiceList #choiceItems

From: `[NIT]-spritesheetCore-jsdoc-choicelist-items-2026-07-29.md` (nitpicker). Naming/JSDoc only. Do **not** redo task **432** spritesheetCore renames.

## Do

1. `mainframe/shared/spritesheetCore.js` (~274,295,367) — JSDoc `[maxFramesPerRow=16]` → reference `DEFAULT_FRAMES_PER_ROW`.
2. `mainframe/src/js/ChoiceList.js` — `#items()` → `#choiceItems()` (calls ~94,101,126).

## Verify

`npm run lint -w mainframe`, `npm run test -w mainframe`.

Scope: **mainframe-developer**.
