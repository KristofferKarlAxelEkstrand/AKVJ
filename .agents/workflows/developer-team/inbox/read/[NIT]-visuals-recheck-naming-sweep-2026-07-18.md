# [NIT] akvj/src/js/visuals/ — naming re-check (2026-07-18)

Small gifts for future readers after a re-sweep of `akvj/src/js/visuals/`
(focus: recently touched `Clip.js` / `Compositor.js`, plus a stale comment left behind
by an earlier rename). Prior visuals nits (`#lastShuffleFrame`, `#isClipCacheDirty`,
`#loadedClips`, `#channelRouteHandlers`, etc.) look happily applied — celebrate those.

## Checklist

- [ ] **Stale JSDoc after rename** — `akvj/src/js/visuals/ClipTiming.js` → `reset()` JSDoc
  - Current: `Reset timing state (lastTime, pulseCount).`
  - Proposed: `Reset timing state (lastTimestamp, pulseCount).` (or drop the parenthetical)
  - Why: field was renamed `#lastTime` → `#lastTimestamp`; the comment still teaches the old name.

- [ ] **Unit/semantics lie: `alpha` is not the alpha channel** — `akvj/src/js/visuals/Compositor.js`
  - Current: local/param `alpha` in `#mixMultiBit` / `#blendPixel`
  - Proposed: `blendFactor` (or `mixRatio`)
  - Why: value is a 0–1 mask-derived blend weight for RGB; real alpha is handled separately via `Math.max` on channel 3. Easy to misread next to `RGBA_CHANNEL_COUNT`.

- [ ] **Vague sprite indices** — `akvj/src/js/visuals/Clip.js` → `#drawToContext`
  - Current: `posX` / `posY`
  - Proposed: `frameColumn` / `frameRow`
  - Why: these are sprite-sheet grid indices, not canvas draw positions (`sourceX`/`sourceY` already carry the pixel coords). `pos*` reads like placement.

## Out of lane (for Overseer / skip)

None this pass. `clipDrawRect.js` and `EffectsPipeline.js` read clean — lovely names (`computeDrawRect`, `MAX_PATTERN_TILES_PER_FRAME`, `#scratchBuffer`).

## Notes for Team Lead

One small task; three renames/comment fixes, no API surface change required for #1–#2 (private/locals). Item #3 is private locals only.
