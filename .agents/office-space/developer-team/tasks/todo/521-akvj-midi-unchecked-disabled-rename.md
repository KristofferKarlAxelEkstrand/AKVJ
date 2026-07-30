---
status: todo
stage: queued
priority: low
assignee: none
work_class: general
risk: low
created: 2026-07-30
owned_paths:
  - akvj/src/js/midi-input/Midi.js
  - akvj/test/midi.test.js
verification_tier: focused
migration_source: legacy-workflow
migration_previous_state: backlog
---
# 521 — Midi.js "unchecked" → "disabled" naming honesty

From: `[NIT]-midi-device-chooser-terminology-drift.md` (nitpicker).

`akvj/src/js/midi-input/Midi.js` names the persisted disabled-device set "unchecked" while the
rest of the class (public API, `AppState`, `MidiSettingsOverlay.js`) talks entirely in
`enabled`/`disabled` terms. Rename to match.

## Steps

- [ ] `Midi.js:7` — const `UNCHECKED_DEVICES_STORAGE_KEY` → `DISABLED_DEVICE_IDS_STORAGE_KEY`
      (keep the stored string value `'akvj.midi.uncheckedDeviceIds'` as-is for localStorage
      back-compat, only rename the identifier)
- [ ] `Midi.js:17` — field `#uncheckedDeviceIds` → `#disabledDeviceIds`
- [ ] `Midi.js:30,199` — method `#loadUncheckedDeviceIds` → `#loadDisabledDeviceIds`
- [ ] `Midi.js:224` — method `#persistUncheckedDeviceIds` → `#persistDisabledDeviceIds`
- [ ] `Midi.js:219,231` — warn strings "unchecked device ids" → "disabled device ids"
- [ ] `Midi.js:265` — JSDoc "persisted as the unchecked set" → "persisted as the disabled set"
- Touch points at lines 215, 220, 239, 276, 278 follow from the field rename.

## Verify

`npm run lint && npm run test && npm run build`. No behaviour change — identifiers/strings/JSDoc only.

Scope: **akvj-developer**.
