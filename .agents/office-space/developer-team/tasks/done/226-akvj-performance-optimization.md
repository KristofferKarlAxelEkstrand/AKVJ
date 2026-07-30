---
status: done
assignee: mainframe-developer
priority: medium
stage: done
verification_status: unverified
last_verified_at: unverified
migration_source: legacy-workflow
migration_imported_at: 2026-07-30
---

# Task 226: Optimize akvj Engine Performance Hot Paths

## Source
Finding report: `.agents/workflows/developer-team/inbox/read/performance-review-findings.md`

## Affected Files
- `akvj/src/js/visuals/Renderer.js`
- `akvj/src/js/visuals/Clip.js`
- `akvj/src/js/midi-input/Midi.js`
- `akvj/src/js/core/AppState.js`

## Description
The engine meets 60fps but has optimization headroom in the render loop, clip frame math, MIDI parsing, and BPM calculation. Reduce allocation and redundant computation.

## Discrete Actions
1. Cache layer references in `Renderer.js` and avoid repeated null checks.
2. Precompute clip frame/source coordinates in `Clip.js` when scale mode or frame index is stable.
3. Reduce intermediate object allocation in `Midi.js` message parsing and route handlers.
4. Replace array `push`/`shift` in `AppState.js` clock-pulse processing with a circular buffer and add a BPM-change threshold.
5. Consider object pooling for frequently created MIDI/render objects.
6. Add performance monitoring hooks to validate 60fps under load.

## Verification
- `npm run test -w akvj`
- `npm run build -w akvj`
- Manual 60fps smoke test.

## Related Epic
`.agents/workflows/developer-team/epics/project-review.md`
