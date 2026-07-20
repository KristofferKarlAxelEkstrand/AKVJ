---
type: question
from: human
created: 2026-07-20T18:12:00+02:00
---

# AKVJ MIDI device chooser + recent event readout

The AKVJ visualizer needs a tiny, in-surface settings panel so the performer can choose which MIDI device(s) feed it and see what just arrived. The goal is zero permanent chrome; almost everything should hide unless summoned.

## Proposed interaction

- Hold `T` and double-click to summon a small settings window in the **lower-left corner**.
- The pane stays open while the mouse is over it, or while the user is actively clicking inside it.
- If the mouse leaves the pane and stays away for **10 seconds**, hide it.
- If the user does not click anything inside the pane for **30 seconds**, hide it.
- Hide means remove the panel from the DOM; do not leave a toggle bar or floating icon behind.

## Required controls

1. **MIDI input device chooser** — a list of connected Web MIDI inputs with a checkbox per device to receive from it. Default should be all available inputs, but the user can uncheck individual devices. Hot-plug must update the list without requiring a page reload.
2. **Recent event readout** — show the last event from each selected (device, channel) pair. Because a single note produces multiple messages, we only need to surface the newest message per pair so the performer can confirm which device + channel is live. Show at least device name, channel, and the most recent event type + note (or other event data). We do not need every message logged.

## Where this belongs

This is a real UI control inside the AKVJ visualizer, not the mainframe tooling. It should live as a light-DOM custom element so the rest of the engine keeps working without it. The existing `akvj/src/js/midi-input/Midi.js` and `Fullscreen.js` / `DebugOverlay.js` pattern are the right model: a keyboard shortcut that toggles a small overlay that is not part of the rendered output.

Please explore whether this should be a new `akvj/src/js/utils/MidiMonitor.js` custom element, or whether it fits inside the existing debug overlay. The readout needs to be visible during performance setup, so hiding it behind the generic debug overlay is probably wrong. A dedicated, summonable pane that can be opened separately is better.

Open questions for the team:

- Should we use `T` as the final shortcut, or is there a conflict with existing debug/fullscreen keys? (`D` is debug, `F` / `enter` / `dblclick` are fullscreen.)
- Should the device chooser persist across reloads in `localStorage`, or should it always default to all inputs to avoid silent failures during a live setup?
- Should the recent-event readout show note-on velocity, CC value, or just event type and channel? What is useful for the performer without becoming a wall of data?
- Is there an existing accessibility / focus concern with a keyboard-held shortcut that we should address?

Answer:
