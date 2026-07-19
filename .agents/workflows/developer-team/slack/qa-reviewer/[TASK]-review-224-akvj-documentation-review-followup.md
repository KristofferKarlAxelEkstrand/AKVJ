# [TASK] Task 224: Address Documentation Gaps in Core Components

## Task File
`.agents/workflows/developer-team/tasks/224-akvj-documentation-review-followup.md`

## Files to Review
- `akvj/src/js/core/AdventureKidVideoJockey.js`
- `akvj/src/js/core/AppState.js`
- `akvj/src/js/visuals/Renderer.js`
- `akvj/src/js/visuals/Clip.js`
- `akvj/src/js/visuals/ClipLoader.js`
- `akvj/src/js/midi-input/Midi.js`
- `akvj/src/js/visuals/LayerManager.js`
- `akvj/src/js/core/settings.js`

## Description
The akvj engine has solid class-level JSDoc, but private methods and complex algorithms lack documentation. Add missing JSDoc for private helpers and document the project-switching workflow, freeze/unfreeze mechanism, BPM sync algorithm, MIDI routing strategy, and clip timing synchronization.

## Discrete Actions
1. Add JSDoc to private methods in `AdventureKidVideoJockey.js`, `AppState.js`, `Renderer.js`, `Clip.js`, `ClipLoader.js`, `Midi.js`, and `LayerManager.js`.
2. Document the project-switching workflow and freeze/unfreeze mechanism.
3. Document the BPM calculation algorithm and MIDI parsing strategy.
4. Add inline comments explaining the render loop timing and clip trigger types/groups.
5. Add an architecture overview document, development setup guide, performance-tuning guide, and troubleshooting guide (or file separate documentation tasks).

## Verification
- `npm run lint`
- `npm run build -w akvj`
- Manual review that new JSDoc is present and accurate.

## Related Epic
`.agents/workflows/developer-team/epics/project-review.md`
