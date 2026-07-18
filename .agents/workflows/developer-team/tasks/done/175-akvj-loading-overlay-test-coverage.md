---
status: done
assignee: akvj-developer
priority: medium
---

# Task 175: Add Test Coverage for AkvjLoadingOverlay.js

## Source
`.agents/workflows/developer-team/inbox/[TEST]-akvj-src-spotcheck-coverage.md`
(Test Marshal Sweep 8 — 1 gap found: AkvjLoadingOverlay.js has zero coverage).

## Scope

`akvj/src/js/ui/AkvjLoadingOverlay.js` (75 lines) — custom element subscribing to 3 AppState events, managing loading bar visibility. No test file exists.

Cases to add:
- `connectedCallback()` renders progress bar DOM and subscribes to `EVENT_PROJECT_LOAD_START`, `EVENT_PROJECT_LOAD_COMPLETE`, `EVENT_PROJECT_LOAD_ERROR`
- `#show()` on `EVENT_PROJECT_LOAD_START` — sets `visible` attribute, resets progress fill width to `0%`
- `#hide()` on `EVENT_PROJECT_LOAD_COMPLETE` — removes `visible` attribute
- `#hide()` on `EVENT_PROJECT_LOAD_ERROR` — removes `visible` attribute
- `isVisible` getter returns correct state after show/hide
- `disconnectedCallback()` unsubscribes from all events and clears DOM
- After disconnect, dispatching `EVENT_PROJECT_LOAD_START` does NOT set `visible`

## Verification
- `npm run test -w akvj`
- `npm run lint`

## Files
- `akvj/test/AkvjLoadingOverlay.test.js` (new)
- `akvj/src/js/ui/AkvjLoadingOverlay.js` (reference)
