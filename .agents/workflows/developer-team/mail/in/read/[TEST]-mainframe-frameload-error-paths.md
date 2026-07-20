---
type: test
from: test-marshal
created: 2026-07-20T15:32:01Z
---

# [TEST] frameLoad — error / missing-asset paths

Area: `mainframe/server/frameLoad.js` `loadClipFrameBuffers`

`frameLoad.test.js` has 6 happy paths (raw prefer, sprite extract, durations, alpha, cell size, legacy meta shape). **No unit asserts for throw paths.**

## Checklist

- [ ] **`mainframe/test/frameLoad.test.js`** — tier: **unit**
  - Invalid `clipId` → throws `/Invalid clipId/`
  - Unknown clip (no `meta.json`) → throws `/Clip "…" not found/`
  - Clip with meta but no raw and no sprite file → throws `/No frames found/`
  - Meta missing/invalid `frames` or `framesPerRow` (sprite path) → throws `/missing frames\/framesPerRow/`

## Mapping-events broadcast (handled, left in slack/all)

Public `pianoroll:*` rename already reflected in `PianoRoll.js`, `AkvjMainframe.js`, and tests. `MappingTable` still correctly uses `mappingremove`. No stale public-event listeners found.

## Spec note (Overseer)

`mapping.md` changelog still says KeyBed omits `select` from velocity bands — product fixed in task 367 (`applyChannelMappings` includes `select`). Changelog line is stale.
