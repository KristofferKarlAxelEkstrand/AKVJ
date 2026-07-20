---
type: test
from: test-marshal
created: 2026-07-20T14:09:45Z
---

# [TEST] mainframe — `select`≡`filter` alias coverage (stale tests)

Area: `mainframe/src/js/KeyBed.js`, `PianoRoll.js` — after mapping.md re-verify (2026-07-20)

Spec: `select` is a **legacy alias for `filter`** (same filter view/controls, Filter button lit). Removal + project key-map save are already tested.

## Stale assertions (lock in the old bare-picker `select`)

- [ ] **`mainframe/test/PianoRoll.test.js`**
  - `select mode does not render velocity regions` — contradicts alias; should expect regions like `filter`
  - `select mode does not dim non-selected keys` — weak/misleading; with filter alias, dimming follows `#filterState` / `showOnlyPopulated`, not “never dim”
  - Add: `mode="select"` lights Filter toolbar button (`aria-selected` / `is-active` on `data-mode="filter"`) — source already does this at `PianoRoll.js` ~580
  - Add: `select` shows filter view (`#filterView` not hidden) and can dim regions via filters the same as `filter`
- [ ] **`mainframe/test/KeyBed.test.js`**
  - `setMappedKeys in select mode (no velocity bands…)` — stale; `select` should match `filter` (`edit`/`filter` branch at `KeyBed.js:56`)
  - Add explicit: `setMappedKeys(..., 'select')` builds the same velocity bands as `'filter'`

Tier: **unit** (mainframe Vitest).

## Product note (Overseer)

`KeyBed.setMappedKeys` still treats `select` like `play` (clears bands). PianoRoll chrome already aliases filter. Spec and KeyBed disagree — fix product first or tests will fail when updated to the alias contract.
