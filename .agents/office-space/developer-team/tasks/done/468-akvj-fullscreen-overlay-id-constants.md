---
status: done
assignee: akvj-developer
priority: low
review: machine
stage: done
verification_status: unverified
last_verified_at: unverified
migration_source: legacy-workflow
migration_imported_at: 2026-07-30
---

# 468 — Fullscreen overlay DOM id constants

From: `[NIT]-fullscreen-overlay-id-constants-2026-07-29.md` (nitpicker). Naming only.

## Do

1. Export `MIDI_SETTINGS_OVERLAY_ELEMENT_ID` from `MidiSettingsOverlay.js`; use in overlay + `Fullscreen.js` getElementById.
2. Export `DEBUG_OVERLAY_ELEMENT_ID` from `DebugOverlay.js`; use in debug overlay + `Fullscreen.js`.

## Verify

`npm run lint -w akvj`, `npm run test -w akvj`.

Scope: **akvj-developer**. Prefer after **465**.
