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

# 486 — StagingPreview 12 FPS fallback duration tests

From: `mail/in/read/[TEST]-clip-timing-clock-dropout-and-preview-fallback.md` (test-marshal). Tests only — mainframe half.

Extend `mainframe/test/StagingPreview.test.js`.

## Do

1. **Missing / invalid durations** — `loadFrames` with 2+ files and `[]` / `undefined` / `[0, -1, NaN]`; assert advance ≈ `DEFAULT_FALLBACK_FRAME_DURATION_MS` (~83.33 ms @ 12 FPS), not 1000 ms.
2. **Partial array** — `[200]` for 2 frames → frame0 200 ms, frame1 fallback.

AKVJ clock-dropout half is task **485**. Product save bug is **483** (do not re-do).

## Verify

`npm run lint -w mainframe`, `npm run test -w mainframe`.

Scope: **mainframe-developer**.
