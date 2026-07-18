---
status: done
assignee: akvj-developer
priority: low
---

# Task 196: akvj visuals/ — Naming Re-check (ClipTiming, Compositor, Clip)

## Preempted
Parked 2026-07-18 for high-priority Task 200 (MIDI Start clock phase). Re-assign after 200.

## Source
`.agents/workflows/developer-team/inbox/read/[NIT]-visuals-recheck-naming-sweep-2026-07-18.md`
(The Nitpicker — small rename/comment fixes after a visuals re-sweep.)

## Scope
Three private/local naming + JSDoc fixes. No public API change required.

## Checklist

1. **`akvj/src/js/visuals/ClipTiming.js` — `reset()` JSDoc**
   - Current: `Reset timing state (lastTime, pulseCount).`
   - Fix: `Reset timing state (lastTimestamp, pulseCount).` (or drop the parenthetical)
   - Field is already `#lastTimestamp`; comment still says `lastTime`.

2. **`akvj/src/js/visuals/Compositor.js` — `alpha` → `blendFactor` (or `mixRatio`)**
   - In `#mixMultiBit` / `#blendPixel`: the value is a 0–1 mask-derived blend weight for RGB,
     not the alpha channel (alpha uses `Math.max` on channel 3). Rename locals/params accordingly.

3. **`akvj/src/js/visuals/Clip.js` — `#drawToContext` sprite indices**
   - `posX` / `posY` → `frameColumn` / `frameRow` (sprite-sheet grid indices, not canvas draw
     positions; `sourceX`/`sourceY` already hold pixel coords).

## Files
- `akvj/src/js/visuals/ClipTiming.js`
- `akvj/src/js/visuals/Compositor.js`
- `akvj/src/js/visuals/Clip.js`
- Update any tests that assert the old local names if they exist.

## Verification
`npm run lint && npm run test && npm run build`
