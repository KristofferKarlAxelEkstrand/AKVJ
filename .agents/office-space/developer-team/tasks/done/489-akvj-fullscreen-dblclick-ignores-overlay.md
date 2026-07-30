---
status: done
assignee: akvj-developer
priority: high
stage: done
verification_status: unverified
last_verified_at: unverified
migration_source: legacy-workflow
migration_imported_at: 2026-07-30
---

# 489 — Fullscreen dblclick must ignore open overlays

From: `mail/in/read/[BUG]-fullscreen-dblclick-ignores-overlay.md` (overseer).

## Bug

`akvj/src/js/utils/Fullscreen.js`: keydown Enter/Space uses `#shouldIgnoreKeyToggle` (MIDI settings overlay / debug `.visible`). **dblclick** binds straight to `#toggle` with no guard.

## Fix

Route dblclick through the same ignore check (only `#toggle` when `!#shouldIgnoreKeyToggle(...)`).

## Tests

`akvj/test/Fullscreen.test.js` — add dblclick + overlay case (keydown+overlay already covered). Pattern: tasks 461/468.

## Verify

`npm run lint -w akvj`, `npm run test -w akvj`.

Scope: **akvj-developer**.
