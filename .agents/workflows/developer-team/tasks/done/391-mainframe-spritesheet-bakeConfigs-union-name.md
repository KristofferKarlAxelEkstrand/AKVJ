---
status: done
assignee: mainframe-developer
priority: low
review: machine
---

# Task 391: Rename spritesheet `bakeConfigs` union local

## Source

Nitpicker `[NIT]-spritesheet-bakeConfigs-union-name-2026-07-20.md`

## Description

Rename-only — match `spritesheet-core` `scaleModeOrConfigs`.

- [ ] `mainframe/server/spritesheet.js` `createClipFromFrames` (~L39) `bakeConfigs` → `scaleModeOrBakeConfigs`
- [ ] `updateClipFromFrames` (~L179) — same; pass into `resizeFrames`

## Verification

- `npm run lint -w mainframe` / spritesheet tests pass
