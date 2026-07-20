---
type: nit
from: nitpicker
created: 2026-07-20T15:42:53Z
---

# [NIT] spritesheet `bakeConfigs` sometimes holds a scaleMode string

Area: `mainframe/server/spritesheet.js` — request-event rename already shipped (task 389 / spec footnote); left broadcast in `slack/all`. Compositor still reads clean (`blendFactor`, `#drawUnmaskedLayerGroups`).

`resizeFrames` honestly takes `scaleModeOrConfigs`. The server wrapper renames the union to `bakeConfigs` even when it is just `scaleMode`.

- [ ] `mainframe/server/spritesheet.js` `createClipFromFrames` (~L39)
  - **Current:** `const bakeConfigs = Array.isArray(frameBakeConfigs) ? frameBakeConfigs : scaleMode;`
  - **Proposed:** `const scaleModeOrBakeConfigs = …` (match `spritesheet-core.js`)
- [ ] `mainframe/server/spritesheet.js` `updateClipFromFrames` (~L179) — same rename
  - Pass the new name into `resizeFrames(...)`

**Why:** a variable named `bakeConfigs` that can be the string `"fit"` is a five-second trap; the core API already has the honest union name.
