---
status: done
assignee: akvj-developer
priority: medium
---

# Task 121: Split `akvj/src/js/visuals/Clip.js` Responsibilities

## Severity: Refactor

## Summary
Break the ~493-line `Clip.js` god-class into focused units: timing, playback control, and a thin render facade.

## Acceptance Criteria
- Extract `ClipTiming` (FPS/BPM/clock → next-frame interval).
- Extract `PlaybackController` (the seven playback-mode advance switch, scrub, reverse, etc.).
- Keep `Clip` as a thin render facade that delegates to the new helpers.
- Inject BPM/clock into `Clip` (constructor/factory param) instead of reading `appState.bpm` directly; make it testable without global state.
- Make `triggerType` / `triggerGroup` private with accessors to match the `#private` convention.
- Verify `npm run lint`, `npm run test -w akvj`, and `npm run build -w akvj` pass.

## Notes
- Do not change public rendering behavior or per-frame performance.
- Epic reference: `.agents/workflows/developer-team/epics/refactor-for-greateness.md` §A1.
