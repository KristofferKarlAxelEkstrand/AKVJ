---
status: done
assignee: mainframe-developer
priority: medium
review: machine
---

# Task 375: PianoRoll `layerGroup` / `role` filter mask tests

## Source

Test Marshal `[TEST]-mainframe-pianoroll-layer-role-filters.md`

## Description

Filter chrome partly tested; `layerGroup` and `role` never exercise `#regionMatchesFilter` / `#applyFilterMask`. Test-only — no product source changes.

## Checklist

- [ ] `mainframe/test/PianoRoll.test.js` — `layerGroup: 'B'` on channel 1 (A) dims regions/key; `layerGroup: 'A'` does not
- [ ] Summary text includes `layer: A`/`layer: B` when set
- [ ] `role: 'bitmask'` filters non-matching velocity regions (mirror existing `triggerType` test)

## Skip

- 367 select≡filter, 371 e2e/visual, 372 pianorollFilters state

## Verification

- `npm run test -w mainframe` passes
- `npm run lint -w mainframe` passes
