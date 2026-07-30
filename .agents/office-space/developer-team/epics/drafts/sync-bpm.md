# Sync BPM System Design

## Overview

The AKVJ sync BPM system enables clips to play in perfect musical time, synchronized either to an external MIDI clock source or to an internal fallback BPM defined per project. This system bridges the gap between free-running wall-clock timing and precise musical timing, allowing VJ performances to lock into tempo with other musical gear while maintaining graceful fallback behavior.

## Core Concepts

### Fallback BPM (Project Baseline)

Every project defines a **fallback BPM** in its configuration. This is the baseline tempo that the project starts with when no MIDI clock is present. Key characteristics:

- **Project-level setting**: Defined once per project in the project configuration
- **Default starting point**: When the VJ engine initializes, it uses this BPM immediately
- **Graceful degradation**: If MIDI clock is lost or never present, clips continue using this BPM
- **Consistent timing**: Ensures predictable behavior even without external sync

Example project configuration:
```json
{
  "fallbackBpm": 120,
  "beatsPerBar": 4
}
```

### MIDI Clock Sync

When a MIDI clock source is connected (e.g., from a DAW, drum machine, or sequencer), the system can switch to external sync:

- **Real-time BPM detection**: The system analyzes incoming MIDI clock pulses to calculate the current tempo
- **Immediate transition**: Clips snap immediately to detected MIDI BPM
- **Clock pulse processing**: Each MIDI clock pulse advances the musical timeline
- **Rate limiting**: Prevents CPU exhaustion from clock flooding (max pulses per second)

### Dual Timing Modes

Clips operate in one of two timing modes:

#### 1. Free Mode (Wall-Clock Timing)
- Clips play based on `frameDurationsMs` (FPS per frame)
- Independent of musical timing
- Used for non-musical visual content
- Fallback BPM does not affect playback

#### 2. Beat Sync Mode (Musical Timing)
- Clips play based on total duration in beats, with frame timing calculated from ms per frame
- Synchronized to either MIDI clock or fallback BPM
- Used for rhythmic, musical visual content
- Timing scales with tempo changes

## Sync Behavior

### Startup Sequence

1. **Engine initialization**: Load project configuration, read fallback BPM
2. **Clock state**: Start in "no clock" mode, using fallback BPM
3. **Clip triggering**: New beat-sync clips use fallback BPM for timing
4. **MIDI detection**: If MIDI clock appears, calculate BPM and transition

### MIDI Clock Arrival

When MIDI clock pulses begin arriving:

1. **BPM calculation**: Analyze pulse intervals to determine tempo
2. **Immediate transition**: Snap immediately to detected MIDI BPM
3. **Clip resync**: Active beat-sync clips adjust to new tempo
4. **Clock timeout**: If clock stops, revert to fallback BPM after timeout

### Clock Loss Handling

If MIDI clock is lost (device disconnect, cable unplugged):

1. **Timeout detection**: No pulses received within timeout window
2. **Fallback activation**: Switch back to project's fallback BPM
3. **Clip continuity**: Beat-sync clips continue using fallback BPM
4. **Clock recovery**: If clock returns, recalculate BPM and resync

## Clip Sync Details

### Beat-Sync Clip Timing

For a clip in beat-sync mode:

```javascript
// Clip metadata example
{
  "sync": "beat",
  "syncLength": "1 bar",
  "syncBeats": 4,
  "frameDurationsMs": [125, 125, 125, 125] // 4 frames, each 125ms
}
```

- **Total duration**: 4 beats (1 bar at 4 beats per bar)
- **Frame timing**: Each frame displays for its specified ms duration, scaled by current BPM
- **Tempo scaling**: At 120 BPM, 125ms = 62.5ms per frame; at 60 BPM, 125ms = 125ms per frame

The system calculates frame timing as follows:
1. Total clip duration = `syncBeats` beats
2. For each frame: scaled_duration_ms = frame_duration_ms * (60 / currentBPM)
3. This scales frame timing proportionally with tempo changes

### Project Switch Impact

When switching projects:

1. **New fallback BPM**: Load the new project's fallback BPM
2. **Active clips**: Resync to new project's timing baseline
3. **MIDI clock**: If present, recalculate BPM relative to new project
4. **Smooth transition**: Minimize visual disruption during project switch

## Configuration

### Project-Level Settings

```json
{
  "fallbackBpm": 120,
  "beatsPerBar": 4,
  "midi": {
    "maxClockPulsesPerSecond": 100,
    "clockTimeoutMs": 5000
  }
}
```

- **fallbackBpm**: Baseline tempo when no MIDI clock (required)
- **beatsPerBar**: Time signature numerator for bar calculations (default: 4)
- **maxClockPulsesPerSecond**: Rate limit for MIDI clock processing
- **clockTimeoutMs**: Milliseconds without clock before reverting to fallback

### Clip-Level Settings

**Note**: `frameDurationsMs` already exists in mainframe (`StagingPreview.js`) for per-frame ms durations. This design proposes integrating it into the akvj engine timing system for beat-sync mode.

```json
{
  "sync": "beat",
  "syncLength": "1 bar",
  "syncBeats": 4,
  "beatsPerBar": 4,
  "frameDurationsMs": [8, 8, 8, 8]
}
```

- **sync**: `"free"` or `"beat"` - timing mode
- **syncLength**: Preset duration (`"1/4 beat"` to `"8 bars"`) or `"custom"`
- **syncBeats**: Total musical length in beats (required when `syncLength: "custom"`)
- **beatsPerBar**: Time signature for bar presets (optional, defaults to 4)
- **frameDurationsMs**: Array of ms durations per frame, scaled by current BPM for beat-sync mode

## Implementation Notes

### BPM Calculation Algorithm

The system calculates BPM from MIDI clock pulses using:

1. **Interval tracking**: Record timestamps of recent clock pulses
2. **Smoothing**: Use moving average of intervals to reduce jitter
3. **Minimum samples**: Require minimum pulse intervals before calculating
4. **Rate limiting**: Ignore pulses that exceed maximum frequency

### Clock Pulse Processing

```javascript
dispatchMIDIClock(timestamp) {
  if (!this.#shouldProcessClockPulse(timestamp)) {
    return; // Rate limit exceeded
  }

  this.#resetClockTimeout();
  this.#processClockPulse(timestamp);
  this.#dispatchStateEvent(EVENT_MIDI_CLOCK, { timestamp });
}
```

### Fallback Activation

```javascript
#handleClockTimeout() {
  this.#midiClockActive = false;
  this.#currentBPM = this.#project.fallbackBpm;
  this.#dispatchStateEvent(EVENT_BPM_CHANGE, {
    bpm: this.#currentBPM,
    source: 'fallback'
  });
}
```

## Edge Cases

### Rapid BPM Changes

- **Minimum interval**: Prevent unrealistic BPM values from noisy clock
- **Clip continuity**: Ensure clips don't glitch during tempo changes

### Clock Jitter

- **Interval smoothing**: Use moving average to reduce timing jitter
- **Debounce**: Ignore pulses that arrive too quickly after previous
- **Stability threshold**: Only update BPM when intervals are consistent

### No Clock Ever Present

- **Fallback only**: System operates entirely on project fallback BPM
- **Consistent behavior**: All beat-sync clips use same baseline tempo
- **User control**: Fallback BPM is user-configurable per project

## Future Enhancements

No planned enhancements at this time. The current design provides robust musical timing through fallback BPM and MIDI clock sync without unnecessary complexity.

## Summary

The sync BPM system provides robust musical timing for AKVJ clips through a dual-mode approach:

1. **Fallback BPM** as the reliable baseline per project
2. **MIDI clock sync** for external tempo synchronization
3. **Seamless transitions** between timing sources
4. **Graceful degradation** when clock is lost

This design ensures that VJ performances can lock into musical tempo when desired while maintaining predictable, consistent behavior in all scenarios.
