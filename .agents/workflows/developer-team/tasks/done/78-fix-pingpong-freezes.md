# Task 78: Fix Pingpong Playback Freezes at Last Frame in playbackUtils

## Severity: Medium (UX bug, 100% reproducible)

## Location
`mainframe/src/js/playbackUtils.js` — `advanceFrame()` pingpong case

## Problem
The pingpong case uses a stateless modulo formula that permanently freezes at the last frame. When `currentFrame === frameCount - 1`, the formula returns the same frame forever. Root cause: pingpong needs direction state, but `advanceFrame()` is stateless.

The live engine (`akvj/src/js/visuals/Clip.js` lines 367-374) handles pingpong correctly using a `#pingpongDirection` flag — only the mainframe shared utility is broken.

## Fix
1. Create a `PingpongState` class (mirroring `ShuffleState` pattern) that holds a direction flag (`+1`/`-1`)
2. Flip direction when hitting either `0` or `frameCount - 1`
3. Thread `pingpongState` through `advanceFrame()` like `shuffleState` already is
4. Update `StagingPreview.js` and `ClipList.js` to create and pass `PingpongState` instances
5. Reference implementation: `akvj/src/js/visuals/Clip.js:367-374`

## Test Coverage Gap
Task 62's pingpong test only checks the bounce pattern for the first few frames — it doesn't verify past the midpoint. Add a test that advances through a full cycle (forward to last frame, backward to first frame, forward again) to catch this regression.

## Verification
- Run `npm run test -w mainframe` to ensure all tests pass
- Run `npm run lint` to ensure no lint errors
- Specifically verify pingpong test covers a full forward-backward-forward cycle

## Key Files
- `mainframe/src/js/playbackUtils.js` (bug + fix)
- `mainframe/src/js/StagingPreview.js` (consumer — needs PingpongState)
- `mainframe/src/js/ClipList.js` (consumer — needs PingpongState)
- `mainframe/test/StagingPreview.test.js` (add full-cycle pingpong test)
- `akvj/src/js/visuals/Clip.js` (reference implementation — do NOT modify)

## Constraints
- Follow `ShuffleState` pattern for the new `PingpongState` class
- Export `PingpongState` from `playbackUtils.js`
- **NPM Protocol**: NEVER run `npm install` yourself. Request via `[NPM-REQUEST]` to Team Lead if needed.

## Dependencies
- Related to Task 56 (shared playback utils) and Task 63 (shuffle fix)
- Found by Overseer
