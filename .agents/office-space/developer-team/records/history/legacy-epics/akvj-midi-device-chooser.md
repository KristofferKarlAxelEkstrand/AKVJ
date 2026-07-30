# AKVJ MIDI device chooser + recent-event readout

**Status (2026-07-29): Complete.** Tasks **457**, **458**, **460**, **461** all QA/machine-approved and archived. **Overseer:** update Near-zero UI bullets in `goal.md` / `aesthetics.md` for the summonable MIDI settings pane (`T`).

| Task | Scope | Status |
| --- | --- | --- |
| **457** | Engine: `Midi.js` + AppState device fields / enable API | done |
| **458** | Overlay UI + `main.js` wire-up + auto-hide | done |
| **460** | `noteOrController` rename | done |
| **461** | Keyboard guards (T + Fullscreen Space) | done |

## Source

Human brief in `mail/out/question-akvj-midi-device-chooser-last-events.md` (2026-07-20). Overseer exploration same day. Decisions locked 2026-07-29 (`mail/in/read/[FEATURE]-akvj-midi-device-chooser-decisions-locked.md`).

## Problem

Live setup today always listens to **every** connected Web MIDI input (`Midi.js` connects all ports up to `maxMidiDevices`). There is no way to mute a noisy controller or confirm which device+channel is live without opening the **D** debug overlay (BPM/dev diagnostics — wrong tool for performance setup).

## Recommended shape

Dedicated light-DOM overlay, **not** inside `DebugOverlay.js`.

| Piece | Path / role |
| --- | --- |
| Pane | New `akvj/src/js/utils/MidiSettingsOverlay.js` (or `MidiMonitor.js`) — custom element or class matching `DebugOverlay` / `Fullscreen` lifecycle |
| Wire-up | `akvj/src/main.js` next to midi / fullscreen / debug |
| Engine | Extend `Midi.js`: list `{id, name}`, enable/disable per id, hot-plug refreshes the list, filter in `#handleMIDIMessage` via `message.target?.id` |
| Events | Enrich AppState MIDI channel events with `deviceId` / `deviceName` (today they only carry channel/note/velocity) so the readout can key on `(device, channel)` without peeking into Midi internals |

Hide = remove from DOM (no leftover chrome). Stay open while pointer is over the pane or while clicking inside; hide after **10s** mouse-away or **30s** idle (human brief).

## Locked decisions (human 2026-07-29)

Approved all four Overseer recommendations in `mail/out/question-akvj-midi-device-chooser-last-events.md`:

1. **Shortcut** — Plain **`T` toggle** (same pattern as `D`), not hold-`T`+double-click. `Fullscreen.js` owns document `dblclick`; hold-T+dblclick would fight it.
2. **Persistence** — Persist **unchecked** device ids in `localStorage`, fail-open: missing/empty store or no matching ids → all inputs enabled.
3. **Readout** — One line per `(device, channel)`: device name, channel (1–16 display), event type, note or CC number, velocity/value. Newest only; no scrollback.
4. **Home** — Dedicated overlay (`MidiSettingsOverlay` / `MidiMonitor`), **not** inside `DebugOverlay`.

**Also (implementation detail, not overridden):** ignore the shortcut when focus is in `INPUT` / `TEXTAREA` / contenteditable (same guard as `DebugOverlay`).

## Spec impact (after ship)

`goal.md` / `aesthetics.md` Near-zero UI exception list gains this summonable pane. Overseer corrects those facts when the feature lands — do not pre-approve intent in `spec/`.

## Out of scope

- Mainframe MIDI tooling
- Changing channel→layer routing
- Full MIDI message history / SysEx dump
