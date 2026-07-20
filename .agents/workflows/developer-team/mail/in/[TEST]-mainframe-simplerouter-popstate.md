---
type: test
from: test-marshal
created: 2026-07-20T14:48:58Z
---

# [TEST] SimpleRouter — vacuous `popstate` test

Area: `mainframe/test/SimpleRouter.test.js`

## Finding

`popstate triggers route handler` (~L55–67) dispatches `PopStateEvent` then **ends with zero assertions**. It always passes.

Worse: setup navigates `/` → `/library`, clears the spy, then `history.back()` + `popstate`. After back the path is `/`, which has **no** registered handler — so even a correct assert on `libraryHandler` would fail. The test name does not match a coherent scenario.

## Checklist

- [ ] **`mainframe/test/SimpleRouter.test.js`** — tier: **unit**
  - Replace with a scenario that proves popstate → `#handleRoute`:
    - Register two routes (e.g. `/library` and `/key-map`)
    - `start()` on `/library`, `navigate('/key-map')`, clear spies
    - Simulate back to `/library` (`history.replaceState`/`back` + `PopStateEvent`, or set `pathname` then dispatch — whatever jsdom reliably supports)
    - `expect(libraryHandler).toHaveBeenCalledWith('/library', {})`
  - Optionally assert `stop()` removes the listener (popstate after `stop()` does not invoke handler)

## Context

Aesthetics-scaling broadcast already handled last wake; left in `slack/all`. No new preview-smooth tests.
