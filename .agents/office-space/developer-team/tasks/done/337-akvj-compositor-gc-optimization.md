---
status: done
assignee: akvj-developer
priority: medium
stage: done
verification_status: unverified
last_verified_at: unverified
migration_source: legacy-workflow
migration_imported_at: 2026-07-30
---

# Task 337: AKVJ Compositor GC optimization

## Source

- Human review `mail/in/[REVIEW]-akvj-src-2026-07-20.md` finding 2
- Epic `.agents/workflows/developer-team/epics/drafts/akvj-visuals-quality.md`

## Description

`akvj/src/js/visuals/Compositor.js:203-205` allocates three fresh `ImageData` objects per frame (~390 KB each, ~23 MB/s at 60fps). The `#pixelBuffers` comment says buffers are reused every frame, but only `output` is actually reused.

Investigate and fix: either hoist A/B/mask buffers so they persist across frames, or replace the manual blend with `globalCompositeOperation` if it yields the same pixel result without per-frame allocation.

## Verification

- `npm run lint -w akvj` passes
- `npm run test -w akvj` passes
- `npm run build -w akvj` passes
- No measurable GC pressure spike during a 60fps run
