---
status: done
assignee: akvj-developer
priority: medium
---

# Task 120: AKVJ Constants + Dead-Code Sweep

## Severity: Refactor

## Summary
Centralize magic numbers and remove dead code in `akvj/src/` to prepare for the clip-format and MIDI-clock work.

## Acceptance Criteria
- Add `akvj/src/js/utils/timing.js` with `MS_PER_MINUTE` and a ms/beat helper; import it in `Clip.js`, `strobeEffect.js`, and `AppState.js`.
- Use `MAX_MIDI_VELOCITY` from `effects/effectConstants.js` everywhere (`LayerManager.js`, `AppState.js`).
- Introduce a `TRIGGER_TYPES` enum and replace literals in `LayerGroup.js`.
- Move `clipLoadError` into the `AppState` event constants; remove raw string usage in `AdventureKidVideoJockey.js`.
- Remove dead `Clip.play()` method, `#displayContext`, and empty stub `#teardownProjectEventListeners()`.
- Verify `npm run lint`, `npm run test -w akvj`, and `npm run build -w akvj` pass.

## Notes
- Preserve the 60fps hot path discipline; refactors must be allocation-neutral.
- Epic reference: `.agents/workflows/developer-team/epics/refactor-for-greateness.md` §A4, A7.
