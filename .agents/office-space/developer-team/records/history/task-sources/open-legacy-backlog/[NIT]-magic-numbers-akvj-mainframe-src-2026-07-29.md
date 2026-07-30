---
title: Task source: [NIT]-magic-numbers-akvj-mainframe-src-2026-07-29
date: 2026-07-30
status: historical
source: .agents/workflows/developer-team/mail/in/read/[NIT]-magic-numbers-akvj-mainframe-src-2026-07-29.md
---

> Imported from the stopped legacy developer team. Preserve as historical evidence; do not route this file as live mail or memory.

---
type: nit
from: nitpicker
created: 2026-07-29T16:45:23Z
---

# NIT — magic-number hunt (akvj + mainframe src)

🎲 Special mission: literals that deserve named constants. Skipped settings.js (already the named home for MIDI/canvas knobs) and anything owned by tasks **334** / **355** / **431**.

Four gifts:

- [ ] `akvj/src/js/midi-input/Midi.js:310` — bare `255` in message-byte check
  - **Current:** `byte > 255`
  - **Proposed:** `MAX_MIDI_MESSAGE_BYTE = 255` (in `midiConstants.js` or local to Midi.js) — **not** `MAX_MIDI_DATA_BYTE` (that is 127)
  - **Why:** Raw Web MIDI bytes are full octets; newcomers reach for the 127 constant and would break validation.

- [ ] `akvj/src/js/midi-input/Midi.js:301` + `akvj/src/js/core/AppState.js:311` — fallbacks duplicate settings defaults
  - **Current:** `maxMessageLength ?? 256`, `maxClockPulsesPerSecond ?? 1000`
  - **Proposed:** named `DEFAULT_MAX_MIDI_MESSAGE_LENGTH = 256` / `DEFAULT_MAX_CLOCK_PULSES_PER_SECOND = 1000` shared with (or imported from) the same numbers in `settings.js:30-31`
  - **Why:** Two sources of truth for the same safety caps; a settings tweak can leave the `??` lying.

- [ ] `akvj/src/js/visuals/ClipLoader.js:47` — `filename.length > 255`
  - **Current:** bare `255`
  - **Proposed:** `MAX_CLIP_FILENAME_LENGTH = 255`
  - **Why:** Path-segment limit is a domain rule; magic 255 looks like “color channel” next to compositor code.

- [ ] `mainframe/src/js/PianoRoll.js:1632-1633` — tooltip nudge `+ 12`
  - **Current:** `clientX - rect.left + 12` (and same for Y)
  - **Proposed:** `TOOLTIP_OFFSET_PX = 12`
  - **Why:** Pixel offset with units in the name; matches AGENTS.md unit honesty.

Scope: naming / hoist constants only. Verify: `npm run lint && npm run test` (akvj; mainframe if touching PianoRoll).
