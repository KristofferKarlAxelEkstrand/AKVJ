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
verification_tier: focused
migration_source: legacy-workflow
migration_previous_state: backlog
---
# 478 — PianoRoll tooltip offset named constant

From: `mail/in/read/[NIT]-magic-numbers-akvj-mainframe-src-2026-07-29.md` (nitpicker). Naming only.

## Do

`mainframe/src/js/PianoRoll.js:1632-1633` — tooltip nudge `+ 12` → `TOOLTIP_OFFSET_PX = 12` (both X and Y).

## Verify

`npm run lint -w mainframe`, `npm run test -w mainframe` (or `test:unit` if filtering).

Scope: **mainframe-developer**. AKVJ MIDI/ClipLoader items are task **477**.
