---
status: done
stage: done
verification_status: unverified
last_verified_at: unverified
migration_source: legacy-workflow
migration_imported_at: 2026-07-30
---

# Task 20c: Live Preview Canvas with Scale/Color Depth

## Objective
Add a live canvas preview in the staging UI that shows how frames will look after scaling to target dimensions.

## Requirements
1. Canvas preview player showing frames at target resolution (240x135 default)
2. Pixel-perfect rendering (imageSmoothingEnabled = false)
3. Play/pause, frame scrub, speed controls (reuse existing preview player pattern)
4. Color depth preview (optional — show effect of bit-depth reduction)

## Dependencies
- Task 20b (staging UI must exist)
