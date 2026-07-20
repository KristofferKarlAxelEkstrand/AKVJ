---
type: nit
from: nitpicker
created: 2026-07-20T14:07:32Z
---

# [NIT] KeyBed + PianoRoll naming / terminology

Area: `mainframe/src/js/` — brand-new `KeyBed.js` / `syncTiming.js`, plus companion `PianoRoll.js` labels that still call DAW channel 14 “Reserved”.

`KeyBed.js` is a delight: file ↔ class ↔ `key-bed` tag all agree, `#keys` / `#hasRendered` read cleanly, and leaf-widget prefixing is correct. `syncTiming.js` mirrors akvj’s `resolveSyncBeats` with matching preset names — celebrate that. The nits below are the leftover fog around it.

## Checklist (copy-paste actionable)

- [ ] `mainframe/src/js/PianoRoll.js` `CHANNEL_LABELS[14]` is `'Reserved'` (line 63).
  - **Current:** `14: 'Reserved'`
  - **Proposed:** `14: 'Project selection'` (keep `15`/`16` as `'Reserved'`)
  - **Why:** DAW channel 14 is project selection (`AGENTS.md`, `settings.js` `projectSelection: 13` code channel). Same stale label already filed for `README.md`; the live channel picker still misnames it.

- [ ] `mainframe/src/js/PianoRoll.js` `channelLayerGroup(channel)` falls through to `'Reserved'` for channel 14 (line 46), and the filter `<select>` option list is `['', 'A', 'B', 'C', 'Mixer', 'Mixed', 'Global', 'Reserved']` (line 494).
  - **Current:** channel 14 → `'Reserved'`; no `'Project'` filter value
  - **Proposed:** return `'Project'` for channel `=== 14`; add `'Project'` to the filter option list (alongside `'Reserved'` for 15–16)
  - **Why:** one concept, three wrong homes — layer-group helper, filter values, and channel labels must agree with the MIDI map.

- [ ] `mainframe/src/js/KeyBed.js` method `setMappedKeys(channelMappings, mode)` (line 50; call site `PianoRoll.js` ~730).
  - **Current:** `setMappedKeys`
  - **Proposed:** `applyChannelMappings` (or `syncKeysFromMappings`)
  - **Why:** it sets `mapped`, `velocityBands`, *and* `clipId` — “set mapped keys” undersells the sync. Name the whole job.

- [ ] `mainframe/src/js/PianoRoll.js` custom-event name split within one element.
  - **Current:** compact lowercase (`keyclick`, `channelchange`, `mappingchange`, `mappingadd`, `mappingremove`, `noteon`, `noteoff`) mixed with namespaced kebab (`pianoroll:mode-changed`, `pianoroll:filter-changed`)
  - **Proposed:** pick one convention and extract named constants (prefer aligning the older compact names under `pianoroll:*`, e.g. `pianoroll:key-click`, `pianoroll:mapping-change`, … — or demote the two newer events to match the compact set). Update `AkvjMainframe.js` + tests in the same change.
  - **Why:** newcomers cannot tell which spelling to listen for; AGENTS.md asks for one event-name convention per realm.

## Out of lane / skip

- `syncTiming.js` — clean mirror of akvj; no nits.
- `PianoRoll.js` `#clips` → `#loadedClips` — already in digest from an earlier sweep.
- `DEFAULT_PREVIEW_VELOCITY = 100` — prior magic-number nit looks resolved.
