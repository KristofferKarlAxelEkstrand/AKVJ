---
status: in-progress
assignee: akvj-developer
priority: medium
---

# Task 310: AKVJ visuals scrub position coverage gaps

## Source

Test Marshal sweep: `.agents/workflows/developer-team/mail/in/[TEST]-akvj-visuals-scrub-coverage.md`

## Description

Add unit tests for the `scrub` playback mode chain from `Clip.setScrubPosition` through `LayerGroup` and `LayerManager` CC handling.

## Findings and actions

### 1. `Clip.setScrubPosition`

**File:** `akvj/src/js/visuals/Clip.js` (lines 288–290)

**Action:**
- Create a `Clip` with `playback: 'scrub'`.
- Call `clip.setScrubPosition(0.5)` and assert `clip.currentFrame` maps to the expected frame index.
- Test clamping: `setScrubPosition(-0.1)` → frame 0; `setScrubPosition(1.1)` → last frame.

### 2. `LayerGroup.setScrubPosition`

**File:** `akvj/src/js/visuals/LayerGroup.js` (lines 226–232)

**Action:**
- Create a `LayerGroup` with mixed active clips (`scrub` and `loop`).
- Call `layerGroup.setScrubPosition(0.5)`.
- Assert the scrub clip's `setScrubPosition` was called with `0.5` and the loop clip was not touched.

### 3. `LayerManager` scrub CC handling

**File:** `akvj/src/js/visuals/LayerManager.js` (lines 74–84)

**Action:**
- Mock or spy on `LayerGroup`/`MaskManager` `setScrubPosition`.
- Call `layerManager.handleControlChange(16, 64)` (CC 16, value 64 → normalized 0.5).
- Assert `layerGroupA.setScrubPosition(0.5)` was called and other layer groups/mask manager were not.
- Repeat for CCs 17, 18, 19.

## Affected files

- `akvj/test/Clip.test.js`
- `akvj/test/LayerGroup.test.js`
- `akvj/test/LayerManager.test.js`

## Verification

- `npm run lint -w akvj` passes.
- `npm run test -w akvj` passes.
- `npm run build -w akvj` passes.

## Notes

- Unit tier only. No source changes intended.
