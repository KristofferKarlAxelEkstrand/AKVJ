---
status: done
stage: done
verification_status: unverified
last_verified_at: unverified
migration_source: legacy-workflow
migration_imported_at: 2026-07-30
---

# Task 20a: Backend Raw Asset Storage + Sharp Pipeline

## Objective
Add raw asset retention and sharp-based resize/processing to the clip ingestion backend.

## Requirements
1. Store original uploaded frames in `clips/.raw-assets/{clipId}/` before processing
2. Add optional `targetWidth`/`targetHeight` config to resize frames via sharp before sprite sheet compositing
3. Update `POST /api/clips` to accept config params (targetWidth, targetHeight, name, playback, frameRate)
4. Update `spritesheet.js` to support resize pipeline and raw asset storage
5. Add `rawAssetsDir()` to `paths.js` with path traversal protection
6. Add tests for new functionality

## Dependencies
- Existing `sharp` dependency in mainframe
- Existing `createClipFromFrames` in `spritesheet.js`
