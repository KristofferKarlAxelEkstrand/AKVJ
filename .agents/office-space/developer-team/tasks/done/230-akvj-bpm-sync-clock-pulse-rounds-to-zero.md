---
status: done
assignee: akvj-developer
priority: medium
stage: done
verification_status: unverified
last_verified_at: unverified
migration_source: legacy-workflow
migration_imported_at: 2026-07-30
---

# [BUG] BPM-synced clips with short frameDurationBeats round to 0 pulses per frame

## Priority
Medium — clock-driven playback runs at the wrong tempo for clips whose per-frame beat length is smaller than 1/24 beat.

## Affected files
- akvj/src/js/visuals/ClipTiming.js (#initBPMSync, #handleClockPulse)
- akvj/src/js/visuals/clipMetadata.js (expandSyncToFrameDurationBeats)

## Description
ClipTiming.#initBPMSync converts per-frame beat lengths to an integer pulse count using:
```js
this.#pulsesPerFrame = frameDurationBeats.map(beats => Math.round(beats * settings.midi.ppqn));
```

settings.midi.ppqn is 24. For any per-frame beat value smaller than 1 / 24 (~0.0417 beats), Math.round returns 0. #handleClockPulse then advances the frame on every MIDI clock pulse because this.#pulseCount >= 0 is always true.

This means a 64-frame clip authored to play over a 1/4 beat (per-frame beat ≈ 0.0039) will advance every clock pulse and take roughly 2.7 beats to play instead of the authored 0.25 beats. The visual will play far too slowly.

## Suggested fix
Use a floor so each frame requires at least one clock pulse:
```js
this.#pulsesPerFrame = frameDurationBeats.map(beats => Math.max(1, Math.round(beats * settings.midi.ppqn)));
```

A more accurate long-term fix is to replace the integer this.#pulseCount with a fractional beat accumulator (or pulse accumulator) so very short frame durations can be distributed correctly across clock pulses.

## Suggested tests
- ClipTiming.test.js: add a case for frameDurationBeats values below 1 / ppqn and assert that onAdvance is not called more than once per clock pulse (or at least that pulsesPerFrame is never 0).
- Clip.test.js / clipMetadata.test.js: add a BPM-synced clip with many frames over a short beat and verify clock-driven playback timing.
