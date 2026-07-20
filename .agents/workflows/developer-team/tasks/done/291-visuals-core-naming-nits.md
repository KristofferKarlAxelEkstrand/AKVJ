---
status: done
assignee: akvj-developer
priority: medium
---

# Task 291: AKVJ visuals core clip modules naming nits

## Description

Non-behavioral naming cleanup in `akvj/src/js/visuals/` core clip modules to make boolean names and duration units more explicit.

## Findings

### 1. Boolean variable named like a verb: `continues`
- **Files**: `akvj/src/js/visuals/Clip.js` (lines 142, 152, 156), `akvj/src/js/visuals/ClipTiming.js` (line 368)
- **Current**: `const continues = ...` / `if (!continues)`
- **Proposed**: `const playbackContinues = ...` / `if (!playbackContinues)`
- **Rationale**: `continues` reads like a predicate method or imperative command, not a boolean result. `playbackContinues` makes the intent and type obvious.

### 2. Missing units on ms durations in `ClipTiming.js`
- **File**: `akvj/src/js/visuals/ClipTiming.js`
- **Current**:
  - `let elapsed = timestamp - this.#lastTimestamp;`
  - `const interval = this.getFrameInterval(this.#currentFrameIndex);`
  - `let total = 0;`
- **Proposed**:
  - `let elapsedMs = ...`
  - `const intervalMs = ...`
  - `let totalMs = 0;`
- **Rationale**: These are durations in milliseconds. Adding `Ms` matches the codebase's unit-honesty convention (e.g. `frameDurationsMs`, `durationMs`).

## Affected files

- `akvj/src/js/visuals/Clip.js`
- `akvj/src/js/visuals/ClipTiming.js`

## Verification

1. `npm run lint` passes.
2. `npm run test` passes.
3. No runtime behavior changes.

## Notes

- This is a naming/readability cleanup only; do not change timing logic.
