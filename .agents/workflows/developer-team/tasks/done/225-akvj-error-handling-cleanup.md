---
status: done
assignee: akvj-developer
priority: medium
---

# Task 225: Standardize Error Handling and Cleanup Patterns

## Source
Finding report: `.agents/workflows/developer-team/inbox/read/error-handling-cleanup-review.md`

## Affected Files
- `akvj/src/js/core/AdventureKidVideoJockey.js`
- `akvj/src/js/visuals/Renderer.js`
- `akvj/src/js/visuals/LayerManager.js`
- `akvj/src/js/visuals/ClipLoader.js`
- `akvj/src/js/midi-input/Midi.js`

## Description
Error handling and cleanup are consistent overall but could be more robust. Standardize patterns, add more specific messages, validate canvas/context/dimensions before use, and reduce repetitive try-catch blocks.

## Discrete Actions
1. Standardize `console.error` vs `console.warn` usage and error message phrasing.
2. Add guard clauses and early returns for null canvas/context/dimension checks in `Renderer.js`, `LayerManager.js`, and `AdventureKidVideoJockey.js`.
3. Consolidate repetitive cleanup logic in `LayerManager.js`.
4. Improve `ClipLoader.js` error messages with clip ID and path; add retry/back-off for transient failures.
5. Add recovery paths for MIDI access failures and transient network errors.
6. Propagate critical error state to the UI where appropriate.

## Verification
- `npm run lint`
- `npm run test -w akvj`
- `npm run build -w akvj`

## Related Epic
`.agents/workflows/developer-team/epics/project-review.md`
