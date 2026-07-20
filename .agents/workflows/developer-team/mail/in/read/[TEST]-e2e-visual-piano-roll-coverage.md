---
type: test
from: test-marshal
created: 2026-07-20T14:13:59Z
---

# [TEST] e2e/visual — piano-roll mount gaps

Area: `e2e/mainframe.spec.js`, `mainframe/test/visual/mainframe-ui.test.js`

`<piano-roll>` / `<key-bed>` are the primary mapping UX (`#library-piano-roll` filter, `#mapping-piano-roll` edit in `mainframe/src/index.html`). Unit coverage in `PianoRoll.test.js` / `KeyBed.test.js` is strong. E2E and mainframe visual only exercise `akvj-mapping-table` / clip list — the rolls are never asserted.

Task **367** already owns `select`≡`filter` product + unit tests. Do not duplicate that work here.

## Checklist

- [ ] **`e2e/mainframe.spec.js`** — tier: **e2e**
  - Library tab: `#library-piano-roll` visible; contains `key-bed`; default mode is filter (`mode="filter"` or Filter toolbar button `is-active` / `aria-selected`)
  - Mapping tab: `#mapping-piano-roll` visible; contains `key-bed`; default mode is edit
  - Optional smoke: switch mapping roll mode via toolbar (`data-mode="filter"`) and assert filter view controls appear (`#filterView` / `.piano-roll-filter-controls` not hidden)
- [ ] **`mainframe/test/visual/mainframe-ui.test.js`** — tier: **visual** (`npm run test:visual -w mainframe`)
  - Screenshot `<piano-roll>` with seeded `mappings` + `clipCatalog` in `mode="edit"` (velocity bands visible)
  - Screenshot same element in `mode="filter"` (filter chrome + dimming optional)
  - Import `PianoRoll.js` / `KeyBed.js` / `PianoKey.js` like existing ClipList/MappingTable tests; commit new refs under `mainframe/test/visual/__screenshots__/`

## Already covered (skip)

- Unit: `PianoRoll.test.js`, `KeyBed.test.js` (incl. Task 367 select-alias cases when they land)
- E2E: mapping table load / headers / add-remove lifecycle
- Visual: ClipList + MappingTable only
