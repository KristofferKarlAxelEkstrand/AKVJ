---
title: Task source: [NIT]-midi-device-chooser-terminology-drift
date: 2026-07-30
status: historical
source: .agents/workflows/developer-team/mail/in/read/[NIT]-midi-device-chooser-terminology-drift.md
---

> Imported from the stopped legacy developer team. Preserve as historical evidence; do not route this file as live mail or memory.

---
type: nit
from: nitpicker
created: 2026-07-30T00:00:00Z
---

# Terminology drift: "unchecked" vs "enabled" in Midi.js

New device-chooser code (`akvj/src/js/midi-input/Midi.js`) names the persisted
disabled-device set "unchecked" while the rest of the class — the public API,
`AppState`, and `MidiSettingsOverlay.js` — talks entirely in `enabled`/`disabled`
terms (`setDeviceEnabled`, `#isDeviceEnabled`, `device.enabled`,
`checkbox.checked` → `.setDeviceEnabled(id, checked)`). A reader has to learn
that "unchecked" means "disabled" with no cue in the name itself.

One concept, one term — rename to match the `enabled`/`disabled` vocabulary
already used everywhere else in the same file:

- [ ] `akvj/src/js/midi-input/Midi.js:7` — const `UNCHECKED_DEVICES_STORAGE_KEY` → `DISABLED_DEVICE_IDS_STORAGE_KEY` (keep the stored string value `'akvj.midi.uncheckedDeviceIds'` as-is for localStorage back-compat, only rename the identifier)
- [ ] `akvj/src/js/midi-input/Midi.js:17` — field `#uncheckedDeviceIds` → `#disabledDeviceIds`
- [ ] `akvj/src/js/midi-input/Midi.js:30,199` — method `#loadUncheckedDeviceIds` → `#loadDisabledDeviceIds`
- [ ] `akvj/src/js/midi-input/Midi.js:224` — method `#persistUncheckedDeviceIds` → `#persistDisabledDeviceIds`
- [ ] `akvj/src/js/midi-input/Midi.js:219,231` — warn strings "unchecked device ids" → "disabled device ids"
- [ ] `akvj/src/js/midi-input/Midi.js:265` — JSDoc "persisted as the unchecked set" → "persisted as the disabled set"

Rest of the file (touch points at lines 215, 220, 239, 276, 278) follow from the
field rename above.
