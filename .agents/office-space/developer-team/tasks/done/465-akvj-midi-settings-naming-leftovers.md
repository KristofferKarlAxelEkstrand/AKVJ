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

# 465 — MidiSettingsOverlay naming leftovers

From: `[NIT]-midi-settings-overlay-terminology-2026-07-29.md` (nitpicker). **Code only** — draft-spec “chooser”→“settings” wording is Overseer’s (asked separately).

## Do

1. `akvj/src/main.js` — comment “MIDI device chooser” → “MIDI settings overlay”.
2. `MidiSettingsOverlay.js` — `MidiReadoutEntry.value` → `velocityOrCcValue` (record/format + tests).
3. `MidiSettingsOverlay.js` — `#handleActivity` → `#resetIdleTimerFromPointer` (or bind `#resetIdleTimer` directly).

## Verify

`npm run lint -w akvj`, `npm run test -w akvj`.

Scope: **akvj-developer**.
