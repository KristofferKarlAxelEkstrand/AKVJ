---
status: todo
stage: queued
priority: low
assignee: none
work_class: general
risk: low
created: 2026-07-30
owned_paths:
  - mainframe/src/js/PianoRoll.js
  - mainframe/src/js/PianoKey.js
  - mainframe/test/PianoRoll.test.js
verification_tier: focused
migration_source: legacy-workflow
migration_previous_state: backlog
---
# 455 — PianoRoll / PianoKey / filter-state naming honesty

From: `[NIT]-mainframe-pianoroll-naming-honesty-2026-07-29.md` (nitpicker). Naming only — no behaviour change.

## Do

1. `PianoRoll.js` — private `#clips` → `#loadedClips` (keep public `clips` getter/setter). Sites: field ~133, setter ~298, getter ~305, finds ~1556/1592.
2. `PianoKey.js:216-217` — drop dead dual class toggle: keep `has-regions`, delete the identical `has-bands` toggle (SCSS/tests already use `has-regions`).
3. `mainframeState.js` / `ClipList.js` / `AkvjMainframe.js` (+ tests) — `pianorollFilters` → `pianoRollFilters` (and `hasPianoRollFilters`, event `pianoRollFiltersChanged`). Leave DOM `pianoroll:*` namespace alone.
4. `PianoKey.js` + `pianoRollMappingEdit.js` — velocity band `{ start, end }` → `{ startVelocity, endVelocity }` (+ dragState `lowerStartVelocity` / `upperEndVelocity`); JSDoc that `endVelocity` is exclusive (UI shows `end - 1`).

## Verify

`npm run lint -w mainframe`, `npm run test -w mainframe`.

Scope: **mainframe-developer**.
