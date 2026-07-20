---
id: clip-timing-sync
title: Clip Timing & Sync
status: draft
owner: human
maintainer: overseer
approved:
verified: 2026-07-20
supersedes: [feature-clip-timing-and-sync, feature-how-sync-to-bpm-works-for-clips]
---

# Clip Timing & Sync

Every clip plays in one of two timing modes. The mode is a clip setting in `meta.json`, and it
can be overridden per placement in `key-map.json`, so the same clip can be free-running in one
slot and beat-locked in another.

Implementation: `akvj/src/js/visuals/ClipTiming.js`, `clipMetadata.js`, `PlaybackController.js`.

## Free mode (default)

`sync: "free"`, or no `sync` field at all. Frames advance on wall-clock time at their own
durations. Nothing musical happens.

Per-frame duration comes from `frameDurationsMs` (milliseconds) when present, otherwise from
`frameRatesForFrames` (FPS, `1000 / fps`). A frame with no entry in either falls back to the
clip's default rate — frame 0's rate, or the first defined rate, or 1 FPS.

## Beat mode

`sync: "beat"` plus a `syncLength`. The clip's **total length** is musical; the relative timing
between its frames is preserved. A clip whose frame 3 runs four times faster than frame 0 keeps
that relationship at every tempo — the whole clip stretches or compresses as one unit.

### Resolving the length

`syncLength` is what the author writes; `syncBeats` is what the engine consumes.
`normalizeClipMetadata()` resolves one to the other at load:

| `syncLength` | Resolves to |
| --- | --- |
| `1/4 beat`, `1/2 beat`, `1 beat`, `2 beats` | 0.25, 0.5, 1, 2 beats |
| `1 bar`, `2 bars`, `4 bars`, `8 bars` | bars × `beatsPerBar` (default 4) |
| `custom` | the author's `syncBeats` value, verbatim |

An unrecognised `syncLength`, or `custom` without a positive `syncBeats`, resolves to `null` —
the clip plays free. `ClipTiming` only ever sees the resolved number.

### Without a MIDI clock

The engine scales every frame by one multiplier:

```
naturalDuration = sum of all frame intervals at their own rates
targetDuration  = (syncBeats × 60000) / bpm
speedMultiplier = targetDuration / naturalDuration
frameInterval   = naturalInterval × speedMultiplier
```

BPM comes from `AppState` — MIDI clock, then BPM CC, then `settings.bpm.default` (**120**). BPM
is clamped to `settings.bpm.min`–`max` (10–522) before use, so the multiplier can never divide by
zero.

There is no cap on the multiplier. A 64-second clip squeezed into a `1/4 beat` is allowed; that
is a rapid-flash effect, not a mistake to protect the author from.

### With a MIDI clock (24 PPQN)

When `bpmSource` is the clock, pulses *are* the tempo and BPM is irrelevant. `ClipTiming`
precomputes a cumulative natural-duration proportion table at construction — static, since frame
timing is metadata — and then:

1. `totalPulses = round(syncBeats × 24)`, at least 1.
2. Each pulse increments `pulseCount`.
3. `rawProgress = pulseCount / totalPulses`.
4. The proportion table maps that to a duration-weighted 0.0–1.0 progress value.
5. `PlaybackController.setLinearProgress(progress)` turns it into a frame index.

**`PlaybackController` owns frame mapping, not `ClipTiming`.** `loop` and `once` map progress
linearly; `reverse` mirrors it; `pingpong` maps across the forward+backward span (progress 0.5 is
the last frame, 1.0 is back at frame 0). `random` and `shuffle` throw if `setLinearProgress()` is
called — beat sync does not apply to non-deterministic modes, and `scrub` takes its frame from
external input, not from timing at all.

At the end of a cycle: `loop` wraps `pulseCount`; `once` finishes and the clip disappears from
its layer group.

### Clock edge cases

- **Retrigger** resets `pulseCount` to 0. The clip runs its own pulse count from the trigger
  moment and ignores where the global clock's bar line is.
- **MIDI Start** resets timing, so residual pulse phase does not survive a DAW restart.
- **Clock dropout** — `AppState` falls back to the previous source after
  `settings.bpm.clockTimeoutMs` (300ms) and the clip continues time-based on the fallback BPM,
  rather than freezing or retriggering.

## Per-placement overrides

A `key-map.json` velocity leaf may carry `sync`, `syncLength`, `syncBeats`, and `beatsPerBar`.
`ClipLoader` shallow-merges them over the clip's meta when it builds that slot's `Clip`, so each
placement gets its own instance with its own resolved length. The clip's intrinsic frame timing
is untouched — only the multiplier changes.

## Authoring in mainframe

The clip editor authors timing in **milliseconds**. The FPS preset buttons (6/12/15/24/25/30) are
a convenience that writes `1000 / fps` into every frame, not a stored property. Imported GIF
delays are milliseconds too. Conversion between ms and FPS goes through the shared helpers
(`akvj/src/js/visuals/timingConversion.js`, `mainframe/shared/frameTiming.js`) — never
reimplemented inline.

`StagingPreview` previews beat-synced clips at 120 BPM, matching the engine's default.

## Not built yet

- **Phrase-level arrangement** (16/32-bar automation) — this is per-clip length, not a timeline.
- **Tempo detection from audio.** BPM comes from MIDI clock, BPM CC, or the default only.

## Changelog

- 2026-07-20 — Written as current truth, merging two conflicting proposal specs. The per-frame
  `frameDurationBeats` model they described is gone: the engine scales total clip length via a
  speed multiplier and the pipeline rejects the old field.
