---
status: backlog
assignee: none
priority: medium
---

# Task 349: AKVJ core / utility helper coverage

## Source

Test Marshal `[TEST]-akvj-core-helpers-coverage.md`

## Description

Add unit tests for three small, high-leverage pure helper modules that currently have no dedicated test files:

### `akvj/src/js/core/midiConstants.js`

- `MAX_MIDI_DATA_BYTE === 127`
- `MAX_MIDI_VELOCITY === 127` and is an alias of `MAX_MIDI_DATA_BYTE`
- `MAX_MIDI_NOTE === 127`

### `akvj/src/js/utils/timing.js`

- `MS_PER_MINUTE === 60000`
- `msPerBeat(60) === 1000`
- `msPerBeat(120) === 500`
- `msPerBeat(100) === 600`

### `akvj/src/js/utils/snapToPixel.js`

- `snapToPixel(10.9) === 10`
- `snapToPixel(-5.1) === -6`
- `snapToPixel(7) === 7`
- `snapToPixel(0) === 0`

## Notes

- All three modules are pure and framework-free; `node` environment is fine.
- No product bug is implied — this is coverage debt.

## Verification

- `npm run test -w akvj` passes with the new cases included.
- `npm run lint -w akvj` passes.
- `npm run build -w akvj` passes.
