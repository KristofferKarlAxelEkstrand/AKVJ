---
status: done
assignee: mainframe-developer
priority: medium
---

# Task 126: AKVJ Effects DRY + MIDI Routing + Event-Driven Loading Overlay

## Severity: Refactor

## Summary
Dry out effect variant logic, unify MIDI routing, and replace imperative loading-overlay calls with event-driven subscriptions.

## Acceptance Criteria
- Extract `getEffectVariant(note, range, threshold)` and use it across `colorEffect`, `mirrorEffect`, `splitEffect`, and `offsetEffect`.
- Migrate `mirrorEffect.js` to `pixelUtils.transformCopy` instead of hand-rolled pixel loops.
- Share BPM/beat timing via `utils/timing.js` in `strobeEffect.js`.
- Unify MIDI CC scrub routing: move the `AppState` subscription out of `LayerManager.js` into the same routing path as note events (likely `AdventureKidVideoJockey.js`).
- Make `LoadingOverlay` subscribe to `PROJECT_LOAD_*` events instead of being driven imperatively; remove cosmetic-only `setProgress` imperative usage.
- Move `DebugOverlay` inline CSS to a CSS file.
- Verify `npm run lint`, `npm run test -w akvj`, and `npm run build -w akvj` pass.

## Notes
- Keep the 60fps hot path allocation-free.
- Epic reference: `.agents/workflows/developer-team/epics/refactor-for-greateness.md` §A5, A6, A7.
