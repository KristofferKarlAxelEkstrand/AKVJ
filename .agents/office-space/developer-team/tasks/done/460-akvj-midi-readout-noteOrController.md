---
status: done
assignee: akvj-developer
priority: low
review: machine
epic: akvj-midi-device-chooser
stage: done
verification_status: unverified
last_verified_at: unverified
migration_source: legacy-workflow
migration_imported_at: 2026-07-30
---

# 460 — MidiReadoutEntry.number → noteOrController

From: `[NIT]-akvj-midi-settings-readout-number-2026-07-29.md` (nitpicker). Naming only.

## Do

In `akvj/src/js/utils/MidiSettingsOverlay.js`: rename typedef field `number` → `noteOrController` (or split into optional `note` / `controller`). Update `#recordEvent` (~311–346) and `#formatReadoutLine` (~274), plus any tests asserting the property.

## Verify

`npm run lint -w akvj`, `npm run test -w akvj`.

Scope: **akvj-developer**. Prefer after **458** lands (same file).
