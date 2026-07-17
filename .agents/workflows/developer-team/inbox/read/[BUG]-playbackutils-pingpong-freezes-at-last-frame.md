# [BUG] Pingpong Playback Mode Permanently Freezes at the Last Frame (mainframe preview players)

## Issue Description
`mainframe/src/js/playbackUtils.js`'s `advanceFrame()` — the shared frame-advancement logic used by both `ClipList.js`'s clip preview player and `StagingPreview.js`'s asset-ingestion preview (Task 56 extracted this into a shared module) — has a math bug in its `pingpong` case that makes pingpong mode play forward once and then **freeze permanently at the last frame**, never bouncing back:

```javascript
case 'pingpong': {
	const cycle = currentFrame + 1;
	const phase = cycle % (frameCount * 2);
	return { frame: phase < frameCount ? phase : frameCount * 2 - phase - 1, finished: false };
}
```

This is a deterministic, 100%-reproducible bug, not an edge case. Algebraically: whenever `currentFrame === frameCount - 1` (the last frame), `cycle = frameCount`, `phase = frameCount % (2 * frameCount) = frameCount`, which fails the `phase < frameCount` check, so it takes the else branch: `frame = frameCount * 2 - frameCount - 1 = frameCount - 1` — i.e. **the same value as `currentFrame`**. This holds for every `frameCount`, so once pingpong playback reaches the last frame, every subsequent call returns that same frame again, forever. I traced this by hand for `frameCount = 4` (0→1→2→3→3→3→3...) and `frameCount = 3` (0→1→2→2→2...) to confirm it's not specific to one clip size.

Root cause: the formula treats `currentFrame` as if it were a monotonically increasing step counter (valid only while ascending), but once real pingpong behavior needs to *descend*, `currentFrame` no longer equals the step count, and the modulo arithmetic can't recover the missing direction information from a single `currentFrame` value alone — a given middle frame is visited once ascending and once descending, and there's no way to tell which from `currentFrame` in isolation.

This is exactly the kind of bug that dedicated pingpong test coverage should have caught — worth double-checking whether Task 62's new `playbackUtils`/`StagingPreview` tests exercise pingpong past the midpoint, or only check the first frame or two.

**Not present in the live engine**: `akvj/src/js/visuals/Clip.js` implements pingpong correctly using a separate `#pingpongDirection` flag (`+1`/`-1`) that flips on reaching either boundary (lines 367-374) — it doesn't have this bug. Only the mainframe-side shared `advanceFrame()` (and therefore both mainframe preview players) is affected.

## How to Fix
`advanceFrame()` is currently fully stateless (pure function of `currentFrame` + mode), which works fine for `loop`/`reverse`/`random`/`once`, but pingpong fundamentally needs direction state — the same reason `shuffle` mode already needed a `ShuffleState` object passed in. Recommend the same pattern: add a small stateful helper (e.g. a `PingpongState` class holding a direction flag, mirroring `ShuffleState`'s shape) that `StagingPreview.js`/`ClipList.js` create once per preview session and pass into `advanceFrame()`, similar to how `shuffleState` is already threaded through. Inside, flip direction when hitting either `0` or `frameCount - 1`, matching `Clip.js`'s existing correct logic (`akvj/src/js/visuals/Clip.js:367-374`) as the reference implementation instead of the other way around.

## Key Files
- `mainframe/src/js/playbackUtils.js` (`advanceFrame`, `pingpong` case — the bug)
- `akvj/src/js/visuals/Clip.js` (lines 367-374 — the correct reference implementation to mirror)
- `mainframe/src/js/StagingPreview.js`, `mainframe/src/js/ClipList.js` (both consumers, both affected, both need the new state object threaded through)

## Dependencies
- None. Distinct from Task 56 (which was about *missing* modes, not broken math in an implemented one) and Task 63 (shuffle-identical-to-random, a different mode).
