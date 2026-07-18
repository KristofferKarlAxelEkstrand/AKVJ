# [TEST] akvj/src/js/ spot-check — AkvjLoadingOverlay zero coverage, all prior gaps confirmed resolved

**From:** Test Marshal  
**Area:** `akvj/src/js/` (sweep 8)  
**Date:** 2026-07-18  
**Tier:** unit

## Summary

Spot-check of all 36 source modules in `akvj/src/js/` against 26 test files. Found one
genuine gap: `AkvjLoadingOverlay.js` has zero test coverage (no dedicated test, no indirect
coverage). All other modules are either directly tested or well-covered indirectly through
integration tests. Several trivial utility modules (`snapToPixel.js`, `timing.js`) are
exercised indirectly and don't warrant dedicated tests.

## Checklist

### 1. AkvjLoadingOverlay.js — zero test coverage (medium priority)

**File:** `akvj/src/js/ui/AkvjLoadingOverlay.js` (75 lines)  
**Existing tests:** None — not referenced in any test file  
**Tier:** Unit (jsdom)

This custom element subscribes to 3 AppState events and manages loading bar visibility.
None of its behavior is tested:

Cases to add:
- [ ] `connectedCallback()` renders progress bar DOM and subscribes to
      `EVENT_PROJECT_LOAD_START`, `EVENT_PROJECT_LOAD_COMPLETE`, `EVENT_PROJECT_LOAD_ERROR`
- [ ] `#show()` on `EVENT_PROJECT_LOAD_START` — sets `visible` attribute, resets progress
      fill width to `0%`
- [ ] `#hide()` on `EVENT_PROJECT_LOAD_COMPLETE` — removes `visible` attribute
- [ ] `#hide()` on `EVENT_PROJECT_LOAD_ERROR` — removes `visible` attribute
- [ ] `isVisible` getter returns correct state after show/hide
- [ ] `disconnectedCallback()` unsubscribes from all events and clears DOM
- [ ] After disconnect, dispatching `EVENT_PROJECT_LOAD_START` does NOT set `visible`

## Modules confirmed well-covered (no action needed)

- `snapToPixel.js` (11 lines) — trivial `Math.floor()` wrapper, indirectly tested via
  `Clip.test.js` scaleMode/placement assertions
- `timing.js` (12 lines) — `MS_PER_MINUTE` used in `ClipTiming.test.js`, `AppState.test.js`;
  `msPerBeat()` used in `AppState.js` and `strobeEffect.js` (both tested)
- `clipDrawRect.js` (138 lines) — `computeDrawRect`, `drawStretch`, `drawScaled`,
  `drawPattern` all indirectly tested via `Clip.test.js` scaleMode tests (stretch, fit,
  cover, none, pattern, placement)
- `UserMessage.js` (94 lines) — indirectly tested via `UserMessages.test.js`: role
  attributes, text rendering, OK dismiss, Esc dismiss, stacking
- `effects/index.js` — imported by `EffectsPipeline.js`, tested via
  `EffectsPipeline.test.js` and `effects.test.js`
- All effect modules (`colorEffect`, `glitchEffect`, `mirrorEffect`, `offsetEffect`,
  `splitEffect`, `strobeEffect`, `pixelUtils`, `effectConstants`) — covered in
  `effects.test.js`
- All other modules — have dedicated test files (confirmed in sweep 6)

## Notes for Team Lead

- The `akvj/src/js/` module tree is in excellent shape — 35 of 36 modules have either
  dedicated tests or strong indirect coverage.
- The single gap (`AkvjLoadingOverlay.js`) is a self-contained 75-line custom element
  that would be straightforward to test.
- No product bugs suspected.
