---
status: done
assignee: mainframe-developer
priority: medium
review: machine
stage: done
verification_status: unverified
last_verified_at: unverified
migration_source: legacy-workflow
migration_imported_at: 2026-07-30
---

# Task 365: Mainframe `scaling` metadata plumbing coverage

## Source

Test Marshal `[TEST]-mainframe-scaling-coverage.md`

## Description

Add unit/HTTP tests for the write/validate path that persists `scaling` into `meta.json`. Test-only — no product source changes.

## Checklist

- [ ] `mainframe/scripts/clips/lib/validate/meta.js` — accept `nearest`/`smooth`, reject invalid, omit still valid
- [ ] `mainframe/server/spritesheet.js` `resolveScaling` / `buildClipMeta` — smooth written; invalid/omitted → nearest (or assert actual contract)
- [ ] `mainframe/server/handlers/clips.js` — POST create / PUT meta round-trip; recompile without body `scaling` keeps existing
- [ ] `mainframe/server/clipFramesBody.js` — scaling passthrough if not already covered by handler tests

## Verification

- `npm run test -w mainframe` passes with new cases
- `npm run lint -w mainframe` passes
