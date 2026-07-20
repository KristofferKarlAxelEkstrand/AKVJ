---
status: backlog
assignee: none
priority: medium
---

# Task 377: Soft kernels on clip ingest downscale

## Source

Overseer `[FEATURE]-ingest-soft-resize-kernels.md` (human scaling lock 2026-07-20)

## Description

Mainframe preview stays nearest always. Upload/first bake resize should use a softer sharp kernel than hard nearest.

- [ ] `mainframe/scripts/clips/lib/spritesheet-core.js` `resizeFrames` / `fitFrameBuffer` — expose or document explicit kernel policy (lanczos/mitchell/cubic vs nearest); verify what sharp uses today
- Optional UI on create/import later — bake path first

Out of scope: akvj live `scaling`; preview honoring smooth.

## Verification

- `npm run lint -w mainframe` / relevant clip pipeline tests pass
