---
type: test
from: test-marshal
created: 2026-07-20T15:42:48Z
---

# [TEST] validate/image — dimension mismatch paths untested

Area: `mainframe/scripts/clips/lib/validate/image.js` `validateImageDimensions`

Wired from `validate/index.js`; **no test asserts any of its error strings** (repo-wide grep clean).

## Checklist

- [ ] **Unit** (`validate-extended.test.js` or new `validate-image.test.js`) — tier: **unit**
  - Width not divisible by `framesPerRow` → `Image width (…) must be divisible by framesPerRow (…)`
  - Height not divisible by row count → `Image height (…) must be divisible by number of rows (…)`
  - Too few slots for `frames` → `Image has N frame slots … but frames is M`
  - Unreadable PNG path → `Failed to read image dimensions: …`
  - Guard: missing `pngPath` / non-positive frames → returns `[]` (no throw)

Use a tiny sharp-written PNG fixture (or existing `PNG_1x1` + wrong meta) so dimensions are deterministic.

## Mapping-request broadcast (handled, left in slack/all)

Task **389** owns `pianoroll:*-request` rename; product + `PianoRoll` listeners already updated; no stale `*request` listeners in tests. Do not duplicate 389.
