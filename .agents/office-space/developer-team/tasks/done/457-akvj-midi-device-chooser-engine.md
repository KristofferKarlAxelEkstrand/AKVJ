---
status: done
assignee: akvj-developer
priority: high
epic: akvj-midi-device-chooser
stage: done
verification_status: unverified
last_verified_at: unverified
migration_source: legacy-workflow
migration_imported_at: 2026-07-30
---

# 457 — MIDI device chooser engine (Midi + AppState)

Epic: `epics/todo/akvj-midi-device-chooser.md`. Human locked decisions 2026-07-29. **akvj/** only. No approved product spec yet — follow the epic.

## Do

1. **`Midi.js`**
   - Public list API returning `{ id, name, enabled }` (not names-only).
   - Per-device enable/disable by id; filter muted devices in `#handleMIDIMessage` via `message.target?.id`.
   - Hot-plug refreshes the list; notify listeners (extend `midiConnectionChanged` or add a dedicated event) so UI can re-render.
   - Persistence: store **unchecked** device ids in `localStorage`; fail-open (missing/empty store or no matching ids → all enabled). Keep connecting up to `maxMidiDevices`.

2. **`AppState.js`**
   - Enrich channel MIDI event details (`midiNoteOn` / `midiNoteOff` / `midiControlChange`) with `deviceId` / `deviceName` so the overlay can key readout on `(device, channel)` without peeking into Midi.

3. **Tests** — extend `akvj/test/midi.test.js` / `AppState` coverage using `akvj/test/utils/fakeMidi.js`. Cover filter, persistence fail-open, and device fields on events.

## Locked (do not re-litigate)

- Persistence = unchecked ids, fail-open.
- Device identity on events required for task **458** readout.

## Out of scope

Overlay UI (task **458**). Spec edits (`goal.md` / `aesthetics.md` → Overseer after ship).

## Verify

`npm run lint -w akvj`, `npm run test -w akvj`.

Scope: **akvj-developer**.
