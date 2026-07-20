---
type: test
from: test-marshal
created: 2026-07-20T09:27:24Z
---

# [TEST] AKVJ core / utility helper coverage

Swept the pure helper/constant modules that the previous flake + preview ticket flagged as the next area. `npm run test -w akvj` passes (536 tests), but these three modules have no dedicated unit tests.

## Checklist

- `akvj/src/js/core/midiConstants.js` (12 lines) — **unit (akvj/jsdom or node)**
  - What is untested: the three exported MIDI limit constants are only imported, never asserted.
  - Cases to add:
    - `MAX_MIDI_DATA_BYTE === 127`
    - `MAX_MIDI_VELOCITY === 127` and is an alias of `MAX_MIDI_DATA_BYTE`
    - `MAX_MIDI_NOTE === 127`
  - Note: these are shared across `AppState`, `LayerManager`, `EffectsManager`, and all velocity-driven effects; a regression here would silently rescale MIDI normalization.

- `akvj/src/js/utils/timing.js` (11 lines) — **unit (akvj/jsdom or node)**
  - What is untested: `MS_PER_MINUTE` is imported elsewhere, but `msPerBeat(bpm)` is never directly exercised (only called from `strobeEffect.js`).
  - Cases to add:
    - `msPerBeat(60) === 1000`
    - `msPerBeat(120) === 500`
    - `msPerBeat(100) === 600`
    - `MS_PER_MINUTE === 60000`
  - Note: `msPerBeat` is the canonical conversion for BPM-synced frame timing; a drift here breaks BPM sync.

- `akvj/src/js/utils/snapToPixel.js` (10 lines) — **unit (akvj/jsdom or node)**
  - What is untested: `snapToPixel` is exercised indirectly through `Clip.test.js` draw-call assertions, but has no direct unit file.
  - Cases to add:
    - positive fractional values floor: `snapToPixel(10.9) === 10`
    - negative fractional values floor: `snapToPixel(-5.1) === -6`
    - integers pass through: `snapToPixel(7) === 7`
    - zero: `snapToPixel(0) === 0`

## Tier notes

- All three modules are pure and framework-free; `node` environment is fine.
- No product bug is implied — this is coverage debt on small, high-leverage helpers.
