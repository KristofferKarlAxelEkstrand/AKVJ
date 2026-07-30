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

# 458 — MIDI device chooser overlay + wire-up

Epic: `epics/todo/akvj-midi-device-chooser.md`. **Depends on task 457** (engine APIs + device fields on AppState events). **akvj/** only.

## Do

1. New light-DOM overlay (`akvj/src/js/utils/MidiSettingsOverlay.js` or `MidiMonitor.js`) — mirror `DebugOverlay.js` lifecycle; **do not** fold into DebugOverlay.
2. Wire in `akvj/src/main.js` next to midi / fullscreen / debug; HMR dispose cleanup.
3. **Shortcut:** plain **`T` toggle** (same pattern as `D`). Ignore when focus is in `INPUT` / `TEXTAREA` / contenteditable.
4. UI: checkbox list of connected inputs (enable/disable via Midi API from 457); persist unchecked ids (fail-open already in engine).
5. **Readout:** one line per `(device, channel)` — device name, channel 1–16, event type, note/CC, velocity/value. Newest only; no scrollback. Subscribe to AppState MIDI events (device fields from 457).
6. Auto-hide: remove from DOM when hidden. Stay open while pointer over pane or clicking inside; hide after **10s** mouse-away or **30s** idle.
7. Tests for toggle / ignore-in-input / auto-hide timers as practical with jsdom.

## Locked (do not re-litigate)

Shortcut T, persistence unchecked/fail-open, readout newest-per-(device,channel), dedicated overlay.

## Out of scope

Engine work (457). Spec Near-zero UI updates (Overseer after ship). Mainframe MIDI tooling.

## Verify

`npm run lint -w akvj`, `npm run test -w akvj`.

Scope: **akvj-developer**.
