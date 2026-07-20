---
status: done
assignee: mainframe-developer
priority: medium
---

# Task 313: AKVJ visuals core clip modules naming nits

## Source

Nitpicker sweep: `.agents/workflows/developer-team/mail/in/read/[NIT]-visuals-core-naming-sweep-2026-07-19.md`

## Description

Apply small naming cleanups to `akvj/src/js/visuals/` core clip modules.

## Findings

The requested naming cleanups were already present in the codebase:

- `akvj/src/js/visuals/Clip.js`
  - Uses `playbackContinues` instead of `continues` in `#advanceNextFrame()` and `#advancePlayback()`.
- `akvj/src/js/visuals/ClipTiming.js`
  - Uses `elapsedMs`, `intervalMs`, and `totalMs` for millisecond durations.
  - Uses `playbackContinues` in `#handleClockPulse()`.

No source edits were required.

## Affected files

- `akvj/src/js/visuals/Clip.js`
- `akvj/src/js/visuals/ClipTiming.js`

## Verification

- `npm run lint -w akvj` — passed
- `npm run test -w akvj` — passed (535 tests)
- `npm run build -w akvj` — passed

## Notes

- Naming-only cleanup; no runtime behavior changes.
