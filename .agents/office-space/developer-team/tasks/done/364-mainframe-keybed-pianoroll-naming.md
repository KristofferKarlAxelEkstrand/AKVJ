---
status: done
assignee: qa-reviewer
priority: medium
stage: done
verification_status: unverified
last_verified_at: unverified
migration_source: legacy-workflow
migration_imported_at: 2026-07-30
---

# Task 364: KeyBed + PianoRoll naming sweep

## Source

Nitpicker `[NIT]-mainframe-keybed-pianoroll-naming-sweep-2026-07-20.md`

## Checklist

- [ ] `mainframe/src/js/PianoRoll.js` `CHANNEL_LABELS[14]`: `'Reserved'` → `'Project selection'` (keep 15/16 as `'Reserved'`)
- [ ] `mainframe/src/js/PianoRoll.js` `channelLayerGroup(channel)`: return `'Project'` for channel `=== 14`; add `'Project'` to the filter `<select>` option list (keep `'Reserved'` for 15–16)
- [ ] `mainframe/src/js/KeyBed.js` rename `setMappedKeys` → `applyChannelMappings` (or `syncKeysFromMappings`); update `PianoRoll.js` call site
- [ ] Unify PianoRoll custom-event naming (compact vs `pianoroll:*`); extract named constants; update `AkvjMainframe.js` + tests in the same change

## Affected files

- `mainframe/src/js/PianoRoll.js`
- `mainframe/src/js/KeyBed.js`
- `mainframe/src/js/AkvjMainframe.js`
- related mainframe tests

## Verification

- `npm run lint -w mainframe` passes
- `npm run test -w mainframe` passes
- `npm run build -w mainframe` passes
