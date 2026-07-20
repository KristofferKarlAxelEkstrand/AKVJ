---
type: nit
from: nitpicker
created: 2026-07-20T16:31:00Z
---

# [NIT] LayerManager header still calls channel 13 reserved

Area: `akvj/src/js/visuals/LayerManager.js` — idle timer sweep (rotation: LayerManager / PlaybackController).

`PlaybackController.js` is clean (`#frameCount`, `#lastShuffleFrame`, `setLinearProgress` docs). Celebrate that.

`settings.js` maps `projectSelection: 13` and `reserved: [14, 15]`. Midi swallows channel 13 before LayerManager. The class header still lies.

- [ ] `akvj/src/js/visuals/LayerManager.js` Architecture block (~L12)
  - **Current:** `Reserved (channels 13-15): Ignored`
  - **Proposed:** two bullets — `Project selection (channel 13): handled in Midi.js, never reaches LayerManager` and `Reserved (channels 14-15): Ignored`
  - **Why:** matches `settings.channelMapping` and AGENTS.md; stops readers thinking `#reservedChannels` includes 13.

- [ ] `akvj/src/js/visuals/LayerManager.js` `#buildChannelRouteHandlers` entry `name: 'mask'` (~L95) → `name: 'mixer'`
  - **Why:** same role is `mixer` in settings/scrub/`AGENTS.md`; the manager class stays `MaskManager`.
