---
type: nit
from: nitpicker
created: 2026-07-20T14:46:38Z
task: 366
---

# [NIT] “mapped slots” test companions for task 366

Area: `e2e/` + `mainframe/test/` — timer sweep. `akvj/src/js/ui/` still clean (celebrate prior `#pushMessage` / `#messages` / `AkvjLoadingOverlay` renames). Task 369’s `drawWithScaleMode` already landed — delightful.

Task 366 renames MappingTable summary copy away from “slot”. These asserts will go stale the moment that ships — fold them into 366 so one PR keeps product + tests honest.

- [ ] `e2e/mainframe.spec.js` (~L167) `'0 mapped slots'` → `'0 mappings'` (or whatever wording 366 picks)
- [ ] `mainframe/test/MappingTable.test.js` — update summary expectations and test titles that say “mapped slot(s)” (~L41, L45–56, L99–103)
  - **Current examples:** `'1 mapped slot'`, `'2 mapped slots'`, `'0 mapped slots'`
  - **Proposed:** match MappingTable’s new copy exactly

**Why:** same smell in three places is one ticket; leaving the tests out of 366 guarantees a red CI the day the UI string changes.
