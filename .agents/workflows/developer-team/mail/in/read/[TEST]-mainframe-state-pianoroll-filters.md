---
type: test
from: test-marshal
created: 2026-07-20T14:15:53Z
---

# [TEST] mainframeState — `pianorollFilters` untested

Area: `mainframe/src/js/mainframeState.js`

Filter mode on the library roll writes through `mainframeState.pianorollFilters` → `EVENT_PIANOROLL_FILTERS_CHANGED` → `ClipList`. ClipList filtering and AkvjMainframe wiring are tested; the **state module itself** never covers this field (unlike search/role/sort/channel).

## Checklist

- [ ] **`mainframe/test/mainframeState.test.js`** — tier: **unit**
  - Import `EVENT_PIANOROLL_FILTERS_CHANGED`
  - Default: `pianorollFilters` is `{}` on create
  - Setter dispatches once with `{ filters: next }` on change
  - Same object shape again (JSON-equal) does **not** re-dispatch
  - Non-object / null / undefined coerce to `{}` and dispatch when previous was non-empty
  - `reset()` clears `pianorollFilters` to `{}` (extend existing reset test; still no events)

## Already covered (skip)

- `ClipList.test.js` — applying filters to the list
- `AkvjMainframe.test.js` — `pianoroll:filter-changed` → state → clip list
- Task 367 / select≡filter KeyBed work (orthogonal)
