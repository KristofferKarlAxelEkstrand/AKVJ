# akvj Engine Review — Task 221

## Summary
Completed a focused review of the akvj engine files listed in Task 221. Filed three findings (two runtime bugs and one architectural gap). Performed verification for the akvj workspace; root npm run lint still fails due to the .temp-repos ESLint config issue that Task 223 is already covering.

## Findings filed
All new findings are in .agents/workflows/developer-team/inbox/:

1. [BUG]-akvj-clip-construction-crash-missing-frameRatesForFrames.md (High)
   - ClipLoader passes frameRatesForFrames: null to new Clip, bypassing the Clip default and causing ClipTiming.#initFrameRates to throw TypeError: Cannot convert undefined or null to object. Caught by ClipLoader, so the clip is silently dropped.

2. [BUG]-akvj-bpm-sync-clock-pulse-rounds-to-zero.md (Medium)
   - ClipTiming.#initBPMSync computes pulsesPerFrame = Math.round(beats * 24). For per-frame beat values below 1/24, this rounds to 0, and #handleClockPulse advances the frame on every MIDI clock pulse.

3. per-project-effectParams-overrides-not-wired.md (Low)
   - settings.js exports mergeProjectSettings and defines projectDefaults.effectParams, but no module calls them. Per-project settings.json is never fetched, so the documented override behavior is not wired.

## Verification
- npm run lint -w akvj — passed
- npm run test -w akvj — passed (457 tests)
- npm run build -w akvj — passed
- npm run lint (root) — still fails with ERR_MODULE_NOT_FOUND for typescript-eslint from the .temp-repos/vscode-acp/eslint.config.mjs artifact. This is tracked by Task 223, so I did not modify the root ESLint config.

## Processed
- Deleted slack/akvj-developer/[TASK]-221-akvj-project-review.md.
- Removed temporary lock file .akvj-project-review-in-progress.

## Recommendations
1. Fix the frameRatesForFrames null path first — it can prevent default-project BPM-sync clips from loading at runtime.
2. Decide whether to floor pulsesPerFrame at 1 or move ClipTiming to a fractional pulse/beat accumulator for accurate short-frame BPM sync.
3. Resolve the mergeProjectSettings dead-code question: wire it or remove it.
