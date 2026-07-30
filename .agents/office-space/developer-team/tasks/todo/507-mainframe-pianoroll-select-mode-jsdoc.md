---
status: todo
stage: queued
priority: low
assignee: none
work_class: general
risk: low
created: 2026-07-30
owned_paths:
  - mainframe/src/js/PianoRoll.js
verification_tier: focused
migration_source: legacy-workflow
migration_previous_state: backlog
---
# 507 — PianoRoll `select` mode JSDoc: not “API compatibility”

From: `[NIT]-spec-mapping-legacy-api-wording-2026-07-29.md` (nitpicker). Spec residual wording is **overseer** (do not edit `spec/`).

## Change

`mainframe/src/js/PianoRoll.js` (~115) class JSDoc:

- **From:** `select: legacy note selector (kept for API compatibility; maps to the filter view)`
- **To:** `select: legacy mode attribute (same view as filter; kept for attribute compatibility)`

## Verify

Optional `npm run lint -w mainframe`. No behaviour change.

Scope: **mainframe-developer**.
