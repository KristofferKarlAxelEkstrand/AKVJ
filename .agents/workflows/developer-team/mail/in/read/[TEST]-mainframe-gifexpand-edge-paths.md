---
type: test
from: test-marshal
created: 2026-07-20T15:20:50Z
---

# [TEST] gifExpand — delay / corrupt edge paths

Area: `mainframe/server/gifExpand.js`  
Special mission: error/edge paths (timer wake)

Unit file `gifExpand.test.js` has **2 happy paths** (static still, 2-frame animated with delays `[100,250]`). HTTP `POST /api/expand-gif` covers empty body / bad payload / `expandGifBuffer` throw → 400. Direct unit still misses delay-normalization edges inside `expandGifBuffer`.

## Checklist

- [ ] **`mainframe/test/gifExpand.test.js`** — tier: **unit**
  - **Static still duration:** assert `durationsMs[0] === fpsToMs(12)` (today only checks length)
  - **Corrupt buffer:** `expandGifBuffer(Buffer.from('not-a-gif'))` rejects (HTTP already covers handler; unit locks the pure function)
  - **Zero page delay → fallback:** animated GIF (or sharp mock) where a page delay is `0` → that slot uses `fpsToMs(12)` (`gifExpand.js` ~L31)
  - **Scalar `meta.delay`:** all pages get the same ms value (`normalizeGifDelays` non-array branch)
  - **Short delay array pads:** e.g. `pages=3` with `delay=[100]` → `[100,100,100]` (pad with `list.at(-1)`)

`normalizeGifDelays` is module-private — exercise via real GIF fixtures or a narrow `sharp` metadata mock; do not export just for tests unless a developer chooses to.

## Already covered (skip)

- HTTP expand-gif 400 paths in `server.test.js`
- Happy animated `[100,250]` and static still shape
