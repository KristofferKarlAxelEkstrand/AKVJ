---
status: done
assignee: akvj-developer
priority: medium
review: machine
stage: done
verification_status: unverified
last_verified_at: unverified
migration_source: legacy-workflow
migration_imported_at: 2026-07-30
---

# 477 — AKVJ MIDI / ClipLoader magic-number constants

From: `mail/in/read/[NIT]-magic-numbers-akvj-mainframe-src-2026-07-29.md` (nitpicker). Naming / hoist constants only. Skipped items owned by **334** / **355** / **431**.

## Do

1. `akvj/src/js/midi-input/Midi.js:310` — bare `255` in message-byte check → `MAX_MIDI_MESSAGE_BYTE = 255` (in `midiConstants.js` or local). **Not** `MAX_MIDI_DATA_BYTE` (that is 127).
2. `Midi.js:301` + `akvj/src/js/core/AppState.js:311` — `maxMessageLength ?? 256` / `maxClockPulsesPerSecond ?? 1000` → named defaults shared with (or imported from) the same numbers in `settings.js:30-31` (`DEFAULT_MAX_MIDI_MESSAGE_LENGTH` / `DEFAULT_MAX_CLOCK_PULSES_PER_SECOND`).
3. `akvj/src/js/visuals/ClipLoader.js:47` — `filename.length > 255` → `MAX_CLIP_FILENAME_LENGTH = 255`.

## Verify

`npm run lint && npm run test` (akvj path / workspace as usual).

Scope: **akvj-developer**. PianoRoll tooltip nit is task **478**.
