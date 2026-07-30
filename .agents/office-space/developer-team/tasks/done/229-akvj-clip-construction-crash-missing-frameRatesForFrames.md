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

# [BUG] Clip construction crashes when frameRatesForFrames is absent

## Priority
High — any clip whose meta.json omits frameRatesForFrames is silently dropped at load time.

## Affected files
- akvj/src/js/visuals/Clip.js (constructor default handling)
- akvj/src/js/visuals/ClipTiming.js (#initFrameRates)
- akvj/src/js/visuals/ClipLoader.js (#createClip)
- akvj/src/js/visuals/clipMetadata.js (normalizeClipMetadata)

## Description
normalizeClipMetadata returns frameRatesForFrames: null when the field is missing from meta.json. ClipLoader.#createClip passes that exact null through to new Clip({ ..., frameRatesForFrames: null, ... }). The Clip constructor has a default value frameRatesForFrames = { 0: 1 }, but JavaScript default parameters only apply when the argument is undefined, not null, so the null is forwarded to ClipTiming. ClipTiming.#initFrameRates immediately calls Object.entries(frameRatesForFrames), which throws TypeError: Cannot convert undefined or null to object.

ClipLoader.#createClip catches the error and returns null, so the failure is silent and the clip simply never loads. This affects the shipped default project: clips such as c1-n0-v0 use frameDurationBeats for BPM sync and do not define frameRatesForFrames.

## Suggested fix
1. Harden ClipTiming.#initFrameRates to treat null/undefined as an empty object:
   ```js
   for (const [frameIndex, frameRate] of Object.entries(frameRatesForFrames ?? {})) { ... }
   ```
2. Optionally make ClipLoader.#createClip coerce null to undefined so the Clip constructor default { 0: 1 } applies:
   ```js
   frameRatesForFrames: normalized.frameRatesForFrames ?? undefined,
   ```

## Suggested tests
- Clip.test.js: add a case that constructs a Clip (and ClipTiming) with frameRatesForFrames: null and asserts it does not throw and can render.
- ClipLoader.test.js: add a catalog entry that omits frameRatesForFrames and assert the clip loads successfully.
