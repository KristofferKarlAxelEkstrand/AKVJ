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

# 492 — rates-only meta clear + mappingLeaf pure units

From: `mail/in/read/[TEST]-mainframe-rates-only-and-mappingleaf.md` (test-marshal). Tests only.

## Do

1. **`handlePutClipMeta` rates-only clear** (`mainframe/test/server.test.js`)
   - Rates-only PUT (has `frameRatesForFrames`, omits `frameDurationsMs`) clears ms in response + disk `meta.json`.
   - Both fields present: ms wins (rates-only branch does not fire).
2. **`mappingLeaf` pure units** — new `mainframe/test/mappingLeaf.test.js` (or dedicated describe):
   - `parseMappingLeaf` — non-string/non-object; object without string `clipId`
   - `serializeMappingLeaf` — empty/null → bare string; non-empty → object
   - `parseFlatMappingEntry` — non-object; string + overrides; legacy bad nested
   - `collectMappingOverrideErrors` — bad overrides / triggerType / triggerGroup / syncBeats / beatsPerBar

No HTTP for mappingLeaf. Product **483**/**490** out of scope.

## Verify

`npm run lint -w mainframe`, `npm run test -w mainframe`.

Scope: **mainframe-developer**.
