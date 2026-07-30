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

# 439 — akvj/src/js/core naming honesty

From: `[NIT]-akvj-core-naming-honesty-2026-07-20i.md` (nitpicker). Rename only.

## Checklist

1. `AdventureKidVideoJockey.js:50,84` — `#setupMIDIEventListeners` / `#setupProjectEventListeners` → `#subscribeMidiEventListeners` / `#subscribeProjectEventListeners`.
2. `AdventureKidVideoJockey.js:266` — log `Failed to set up clips` → `Failed to load clips`.
3. `AppState.js:486,494,502` (+ callers in AdventureKidVideoJockey, Midi.js, tests) — `error` / `warn` / `info` → `showError` / `showWarning` / `showInfo`.
4. `settings.js:73-76` — `layerGroupA_CC` / `layerGroupB_CC` / `layerGroupC_CC` / `mixer_CC` → `layerGroupACc` / `layerGroupBCc` / `layerGroupCCc` / `mixerCc`.
5. `midiConstants.js:12` — `MAX_MIDI_NOTE = 127` → `MAX_MIDI_NOTE = MAX_MIDI_DATA_BYTE`.

## Verify

`npm run lint -w akvj`, `npm run test -w akvj`.
