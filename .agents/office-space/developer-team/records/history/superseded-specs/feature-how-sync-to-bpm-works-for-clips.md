---
status: superseded
superseded_by: clip-timing-sync
superseded_on: 2026-07-20
---

> **Superseded.** This was a proposal. Current behaviour lives in `spec/clip-timing-sync.md`.
> Kept only as a record of what was originally intended; do not build from it.

# Feature: How Sync to BPM Works for Clips

## Problem

The current `frameDurationBeats` system assigns a beat duration to **each individual frame**. This distorts the natural frame timing relationships that were designed into the clip via `frameRatesForFrames`. A clip where frame 0 is slow and frame 3 is fast loses its intended rhythm when each frame gets an equal slice of beats.

The sync system should define **how long the entire clip takes to play** in musical terms — not how long each frame takes.

## Proposal

### Core idea: Total duration, not per-frame duration

Sync defines the **total clip length** in beats. The clip's natural frame timing (from `frameRatesForFrames` / FPS) is preserved — it's just **scaled** to fit the musical duration.

```
naturalDuration = sum of all frame intervals at their native FPS
targetDuration  = (totalBeats × 60000) / currentBPM
speedMultiplier = targetDuration / naturalDuration
```

Each frame still plays at its natural relative speed. The whole clip is stretched or compressed as a unit to fit the bar/beat length.

### Example

A 4-frame clip with `frameRatesForFrames: { 0: 1, 1: 2, 2: 1, 3: 4 }`:
- Natural durations: 1000ms, 500ms, 1000ms, 250ms → total 2750ms
- Sync: `1 bar` (4 beats) at 120 BPM → target = 2000ms
- Speed multiplier: 2000 / 2750 ≈ 0.727
- Actual frame durations: ~727ms, ~364ms, ~727ms, ~182ms
- Frame 3 is still 4× faster than frame 0 — the relationship is preserved

### What changes

#### Remove
- `frameDurationBeats` as a per-frame concept (single number or array)
- The current `expandSyncToFrameDurationBeats` logic that distributes beats across frames
- Per-frame `pulsesPerFrame` in clock-driven mode

#### Keep
- `sync: "free"` (default) — clip plays at natural FPS, no BPM sync
- `sync: "beat"` — clip is scaled to fit a musical duration
- `syncLength` presets (`"1/4 beat"` … `"8 bars"`) and `syncBeats` (custom)
- `beatsPerBar` for time-signature support
- `frameRatesForFrames` as the intrinsic per-frame timing

#### Add
- `syncBeats` as the **resolved runtime value** for total clip duration in beats (resolved from `syncLength` presets or set directly as `syncBeats` for custom)
- A **speed multiplier** applied to FPS-based frame advancement
- For MIDI clock: total pulses for the clip = `round(totalBeats × 24)`, and frame progress is mapped proportionally

### How it works in ClipTiming

#### Free mode (no sync)
Unchanged. Frames advance at their natural FPS intervals.

#### Beat mode (time-based, no MIDI clock)
1. Compute `naturalDuration` from `frameRatesForFrames` (sum of `1000 / fps` for all frames, using default frame rate for frames without an explicit FPS entry)
2. Compute `targetDuration = (totalBeats × 60000) / bpm`
3. Compute `speedMultiplier = targetDuration / naturalDuration`
4. In `getFrameInterval(frameIndex)`: return `(1000 / fps) × speedMultiplier`

**Default frame rate handling**: Many clips don't specify `frameRatesForFrames` at all — they default to `{ 0: 1 }` (1 fps). The `naturalDuration` calculation must use the default frame rate (from `#initDefaultFrameRate()`) for any frame without an explicit FPS entry. This is already the behavior in the current `getFrameInterval()` fallback path.

#### Beat mode (MIDI clock active)

**At init time**, precompute a **cumulative frame proportion table** from `frameRatesForFrames`. This is static — it never changes at runtime because `frameRatesForFrames` is clip metadata, not live state:

```js
// Example: 4 frames with frameRatesForFrames { 0: 1, 1: 2, 2: 1, 3: 4 }
// Natural durations: 1000ms, 500ms, 1000ms, 250ms → total 2750ms
// Cumulative proportions:
const cumulativeProportions = [
    0.0,    // frame 0 starts at 0%
    0.364,  // frame 0 ends / frame 1 starts (1000/2750)
    0.545,  // frame 1 ends / frame 2 starts (1500/2750)
    0.909,  // frame 2 ends / frame 3 starts (2500/2750)
    1.0,    // frame 3 ends (2750/2750)
];
```

**At playback time**, BPM is irrelevant — the clock pulses *are* the tempo:

1. Compute `totalPulses = round(totalBeats × 24)` — this is fixed (comes from `syncBeats`, not BPM)
2. On each clock pulse, increment `pulseCount`
3. Compute `progress = pulseCount / totalPulses` — how far through the clip we are (0.0 to 1.0)
4. Look up which **linear frame index** `progress` maps to using `cumulativeProportions`
5. Pass that linear frame index to `PlaybackController`, which maps it to the actual frame based on playback mode

**Important: PlaybackController owns frame mapping, not ClipTiming.**

The cumulative proportion table produces a **linear** frame index (0→N-1). But `PlaybackController` handles all playback modes:
- `loop` / `once`: linear — direct mapping
- `reverse`: `N - 1 - linearIndex`
- `pingpong`: maps linear progress across the forward+backward span (0→N-1→0 is 2N-2 steps)
- `random` / `shuffle`: sync does not apply — these are non-deterministic and ignore beat timing

For `loop` and `once`, when `pulseCount` reaches `totalPulses`:
- `loop`: wrap `pulseCount %= totalPulses`, continue
- `once`: signal finished, stop rendering (show nothing — clip disappears from the layer when playback completes)

For `random` and `shuffle`, beat sync is ignored — these modes advance on their own internal logic (random pick per interval, shuffle pool exhaustion). Sync fields are irrelevant for them.

**Why precompute at init?**
- `frameRatesForFrames` is static metadata — proportions are fixed for the clip's lifetime
- `totalPulses` is derived from `syncBeats` which is also fixed (unless overridden by key-map placement, which creates a new Clip instance)
- The only runtime variable is `pulseCount`, which is just a counter
- No per-frame beat arrays, no per-frame pulse arrays — just one lookup table and one counter

**Architecture change: progress-based vs. step-based advancement**

Currently `ClipTiming` calls `onAdvance()` which calls `PlaybackController.advance()` — a **step-based** model (advance one frame). In clock-driven beat mode, this changes to a **progress-based** model: `ClipTiming` computes a linear progress value (0.0→1.0) from `pulseCount / totalPulses`, maps it to a linear frame index, and passes that to `PlaybackController`. This requires a new method on `PlaybackController` (e.g., `setLinearProgress(progress)`) that maps progress to the correct frame based on playback mode. The existing `advance()` method continues to be used for free mode and time-based beat mode.

### What about `frameDurationBeats` in existing clips?

5 clips currently use `frameDurationBeats` explicitly. All have 64 frames and uniform values. These would be migrated to:

| Clip | Old | New `syncBeats` |
|------|-----|-----|
| `c1-n0-v0` | `frameDurationBeats: 0.5` | `sync: "beat"`, `syncLength: "custom"`, `syncBeats: 32` (0.5 × 64) |
| `c1-n1-v0` | `frameDurationBeats: 0.5` | `sync: "beat"`, `syncLength: "custom"`, `syncBeats: 32` |
| `c1-n2-v0` | `frameDurationBeats: 2` | `sync: "beat"`, `syncLength: "custom"`, `syncBeats: 128` (2 × 64) |
| `c5-n0-v0` | `frameDurationBeats: 0.25` | `sync: "beat"`, `syncLength: "custom"`, `syncBeats: 16` (0.25 × 64) |
| `c6-n0-v0` | `frameDurationBeats: 0.5` | `sync: "beat"`, `syncLength: "custom"`, `syncBeats: 32` |

Since all existing clips have uniform FPS (default 1 fps), `syncBeats = frameDurationBeats × frames` produces identical playback. The migration is mechanical.

### Key-map placement overrides

Per-placement sync overrides in `key-map.json` continue to work. A clip can be `1 bar` in one placement and `2 bars` in another — the clip's intrinsic timing stays the same, only the speed multiplier changes.

### `syncLength` vs `syncBeats` relationship

`syncLength` is the **author-friendly input** (presets like `"1 bar"`, `"1/4 beat"`). `syncBeats` is the **resolved runtime value** (a number). When `syncLength` is a preset, `syncBeats` is computed from it. When `syncLength` is `"custom"`, `syncBeats` is set directly. This is the same relationship as before — just without the per-frame expansion step. `ClipTiming` only consumes `syncBeats` (the number), never `syncLength` (the string).

## Impact

- **`ClipTiming.js`** — rewrite BPM sync mode to use speed multiplier instead of per-frame beats; add progress-based advancement for clock-driven mode
- **`PlaybackController.js`** — add `setLinearProgress(progress)` method for clock-driven beat mode; existing `advance()` unchanged for free/time-based modes
- **`clipMetadata.js`** — remove `frameDurationBeats` resolution/expansion, resolve `syncLength` → `syncBeats` only
- **`meta.json` schema** — remove `frameDurationBeats`, keep `sync` / `syncLength` / `syncBeats`
- **Mainframe validation** — reject `frameDurationBeats` in meta.json (hard error, we're in alpha), validate new sync model
- **Mainframe `syncTiming.js`** — mirror changes from `clipMetadata.js`
- **Tests** — update timing tests to verify speed multiplier behavior; add tests for progress-based clock advancement; update migration tests
- **Existing clips** — migrate 5 clips from `frameDurationBeats` to sync fields

## Resolved questions

1. **~~Non-uniform FPS + MIDI clock~~** — Precompute a cumulative frame proportion table at init from `frameRatesForFrames` (static). Map `pulseCount / totalPulses` to linear frame index via that table. BPM is not needed — clock pulses are the tempo. See the MIDI clock section above for the full design.
2. **~~Scrub playback~~** — Scrub is manual — frame selection comes from external input (MIDI CC, mouse, etc.), not from the timing system. Sync/BPM does not apply. The events drive frame selection directly, so scrub is unaffected by this change.
3. **~~One-shot / momentary~~** — One-shots do not loop. With `sync: "beat"`, the sync duration defines how long the one-time playback takes — the clip plays through once over that duration, then **shows nothing** (clip disappears from the layer when playback completes). Sync is mainly the length of the playback for one-shots.
4. **~~`random` / `shuffle` + sync~~** — Beat sync does not apply to non-deterministic playback modes. `random` picks a random frame per interval; `shuffle` exhausts a shuffled pool. Neither has a meaningful "duration to fit to a bar." Sync fields are ignored for these modes.
5. **~~`pingpong` + clock sync~~** — `PlaybackController.setLinearProgress()` maps 0.0→1.0 progress to the pingpong span (0→N-1→0 = 2N-2 steps). Progress 0.5 = last frame, progress 1.0 = back to frame 0.
6. **~~`reverse` + `once` combo~~** — Plays through once in reverse frame order, then shows nothing (clip disappears from the layer) on completion — identical "once" completion behavior to forward playback. `reverse` only affects frame index mapping (`N - 1 - linearIndex`), never the completion behavior.
7. **~~`pingpong` + `once` combo~~** — Plays through the full pingpong span once (forward then backward), then shows nothing on completion. `pingpong` only affects frame index mapping, completion behavior is unchanged from any other `once` clip.
8. **~~MIDI clock dropout mid-playback~~** — If the MIDI clock stops while a clock-driven clip is mid-playback, switch to time-based mode using the project's fallback BPM. The clip continues playing seamlessly (driven by the internal timer instead of clock pulses) rather than freezing at its current position or resetting/retriggering.
9. **~~Retrigger + clock sync — pulse alignment~~** — On retrigger, `pulseCount` resets to 0 and the clip starts its own independent pulse count from the moment of the trigger, ignoring wherever the global MIDI clock currently is. The clip plays its full `totalPulses` duration from that moment, regardless of the global clock's bar/beat alignment.
10. **~~`syncBeats` smaller than natural clip duration (extreme speed multiplier)~~** — No cap and no warning. If the resulting speed multiplier is extreme (e.g. a 64-second natural-duration clip squeezed into 125ms via `1/4 beat`), let it happen as authored — the user chose that sync length and may be intentionally going for a rapid-flash effect. Capping or warning UI can be revisited later if it turns out to be a real footgun in practice.
11. **~~Layer Group C~~** — No special-casing needed. Every layer group (A, B, C) triggers the same `Clip`/`ClipTiming` class, so the redesigned sync model applies identically regardless of which layer group the clip is placed in.

All resolved — this spec is ready for epic/task breakdown.
