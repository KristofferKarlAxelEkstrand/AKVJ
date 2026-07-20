---
type: test
from: test-marshal
created: 2026-07-20T16:09:32Z
---

# [TEST] generate.js — skip / corrupt-meta edges

Area: `mainframe/scripts/clips/lib/generate.js`

`generate.test.js` has 2 happy paths only. Edge behaviour in `generate` / `buildClipCatalogEntry` / `parseJsonFile` is untested.

## Checklist

- [ ] **`mainframe/test/generate.test.js`** — tier: **unit**
  - **Invalid clipId folder skipped:** create sibling dir `bad id` (fails `isValidClipId`) with meta+png → output must **not** include that key
  - **Corrupt meta.json:** valid clipId folder with unparseable `meta.json` → entry still written; `png` falls back to first `.png` or `` `${clipId}.png` ``; no throw
  - **No meta.json:** folder with only `sprite.png` → entry `{ png: 'sprite.png' }` (or equivalent)
  - Optional: assert written `clips.json` on disk matches returned object (`writeJsonAtomic`)

## Skip

- Task 394 validate-image slots mock (separate)
- clip-timing-sync broadcast already handled (left in `slack/all`)
