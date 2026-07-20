# [NIT] AKVJ core unit-honesty sweep

Area: `akvj/src/js/core/` re-check (`AppState.js`, `midiConstants.js`)

## Findings

### 1. `AppState.js` `#processClockPulse` `interval` is missing the `Ms` unit suffix
- **File**: `akvj/src/js/core/AppState.js` (line 331)
- **Current**: `const interval = timestamp - this.#lastClockTimestamp;`
- **Proposed**: `const intervalMs = timestamp - this.#lastClockTimestamp;`
- **Rationale**: `timestamp` comes from `performance.now()` and is in milliseconds, so `interval` is a millisecond duration. The very next line `if (interval < 1)` reads as 1 unit-less until the reader recalls the unit. `intervalMs` matches the codebase convention (`durationsMs`, `frameDurationsMs`, `FALLBACK_MS`).

### 2. `AppState.js` `#calculateBPMFromClock` sums and averages are missing `Ms` suffix
- **File**: `akvj/src/js/core/AppState.js` (lines 347–351)
- **Current**:
  ```js
  let total = 0;
  for (const interval of this.#recentPulseIntervals) {
      total += interval;
  }
  const avgInterval = total / this.#recentPulseIntervals.length;
  ```
- **Proposed**:
  ```js
  let totalMs = 0;
  for (const intervalMs of this.#recentPulseIntervals) {
      totalMs += intervalMs;
  }
  const avgIntervalMs = totalMs / this.#recentPulseIntervals.length;
  ```
- **Rationale**: `this.#recentPulseIntervals` stores millisecond intervals; `total` and `avgInterval` are therefore in milliseconds. The honest names reinforce that `msPerBeat = avgIntervalMs * ppqn` is a ms-to-ms multiplication, and they mirror the unit naming already used for `durationsMs` elsewhere.

### 3. `AppState.js` `#shouldProcessClockPulse` uses a bare `1000` for the rate-limit window
- **File**: `akvj/src/js/core/AppState.js` (line 283)
- **Current**: `const windowSizeMs = 1000; // 1 second window`
- **Proposed**:
  - Add `const MS_PER_SECOND = 1000;` at the top of `AppState.js` (near `MS_PER_MINUTE` import).
  - Use `const windowSizeMs = MS_PER_SECOND;`
- **Rationale**: `code-standards.md` asks for magic numbers to be extracted into named constants. The comment `// 1 second window` is a strong signal that `1000` should be `MS_PER_SECOND`. `ClipTiming.js` and `timingConversion.js` already define the same constant locally, so this keeps the file consistent with that pattern.

## Celebrations

- `MIN_CLOCK_INTERVALS_FOR_BPM` is a wonderful threshold name — it tells you exactly why `6` matters without needing a comment.
- `midiConstants.js` is a crisp, focused single source of truth for MIDI limits (`MAX_MIDI_DATA_BYTE`, `MAX_MIDI_VELOCITY`, `MAX_MIDI_NOTE`).
- The split between `#shouldProcessClockPulse` and `#processClockPulse` makes the rate-limiting boundary obvious at a glance.
