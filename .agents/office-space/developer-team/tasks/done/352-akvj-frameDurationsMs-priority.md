---
status: done
assignee: akvj-developer
priority: high
stage: done
verification_status: unverified
last_verified_at: unverified
migration_source: legacy-workflow
migration_imported_at: 2026-07-30
---

# Task 352: AKVJ `frameDurationsMs` priority and BPM clamp

## Source

- `.agents/workflows/developer-team/mail/in/[BUG]-akvj-clip-timing-frameDurationsMs-drift-2026-07-20.md`
- `.agents/workflows/developer-team/mail/in/[TEST]-akvj-visuals-frameDurationsMs-coverage.md`

## Description

`frameDurationsMs` is the canonical per-frame timing source, but the load path currently normalizes it away and `Clip.js` never passes it to `ClipTiming`, so the engine does not honor the intended priority.

Fix:

1. `akvj/src/js/visuals/clipMetadata.js` — preserve `frameDurationsMs` as a `{frameIndex: ms}` object when present, and give it priority over `frameRatesForFrames`. Skip invalid/zero/negative entries; an empty result yields `null` for both fields.
2. `akvj/src/js/visuals/Clip.js` — accept `frameDurationsMs` and pass it (plus `frameRatesForFrames`) to `ClipTiming`.
3. `akvj/src/js/visuals/ClipLoader.js` — ensure mapping overrides can supply `frameDurationsMs` and that it reaches the constructed `Clip`.
4. `akvj/src/js/visuals/ClipTiming.js` — clamp BPM to `settings.bpm.max` in `getFrameInterval()` when in beat mode.

Update the relevant unit tests (see Source) so they assert the corrected priority and clamping.

## Verification

- `npm run lint -w akvj` passes
- `npm run test -w akvj` passes
- `npm run build -w akvj` passes
- A clip with both `frameRatesForFrames` and `frameDurationsMs` advances using the ms intervals
- `ClipTiming.getFrameInterval()` clamps a `bpmProvider` above `settings.bpm.max` to the max value
