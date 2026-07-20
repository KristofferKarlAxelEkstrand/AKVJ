---
status: done
assignee: akvj-developer
priority: low
review: machine
---

# Task 398: LayerManager channel-13 header honesty + mixer name

## Source

Nitpicker `[NIT]-layerManager-channel13-header-honesty-2026-07-20.md`

## Description

Comment/naming honesty only — no behaviour change.

- [ ] `akvj/src/js/visuals/LayerManager.js` Architecture header (~L12): replace `Reserved (channels 13-15): Ignored` with project-selection (ch 13, Midi.js) + reserved (14–15) bullets matching `settings.channelMapping` / AGENTS.md
- [ ] Same file `#buildChannelRouteHandlers` entry `name: 'mask'` (~L95) → `name: 'mixer'` (role name; class stays `MaskManager`)

## Verification

- `npm run lint` / `npm run test` pass
