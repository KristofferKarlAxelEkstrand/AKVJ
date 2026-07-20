---
type: test
from: test-marshal
created: 2026-07-20T14:29:15Z
---

# [TEST] PianoRoll — `layerGroup` / `role` filter mask gaps

Area: `mainframe/src/js/PianoRoll.js` (`#regionMatchesFilter`, `#applyFilterMask`)

Filter chrome exists and is partially tested (`clipId` summary, `triggerType` region dim, `showOnlyPopulated` key dim). **`layerGroup` and `role` never exercise the mask.** Control presence alone (`querySelector('.piano-roll-filter-layer-group')`) does not prove `#regionMatchesFilter`.

`layerGroup` matches against `channelLayerGroup(this.#channel)` (DAW channel → A/Mixer/B/…), not clip meta.

## Checklist

- [ ] **`mainframe/test/PianoRoll.test.js`** — tier: **unit**
  - `filters = { layerGroup: 'B' }` with `channel = 1` (layer A) and a mapped note → all `.velocity-region` get `is-filtered-out`; key `is-dimmed` when no match
  - Same mapping with `filters = { layerGroup: 'A' }` → regions not filtered out
  - Summary text includes `layer: A` (or `layer: B`) when that filter is set
  - `filters = { role: 'bitmask' }` with two clips (role bitmask vs plain) on one note’s velocity bands → non-matching region `is-filtered-out`, matching region not (mirror of existing `triggerType` test ~867)

## Skip

- Task 367 select≡filter KeyBed/stale select tests
- Task 371 e2e/visual piano-roll mount
- Task 372 `mainframeState.pianorollFilters` (ClipList only uses clipId/triggerType/role — no layerGroup there)
- Goal-spec Fullscreen Enter/Space/dblclick — already covered in `Fullscreen.test.js`
