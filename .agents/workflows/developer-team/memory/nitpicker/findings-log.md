# The Nitpicker — Findings Log

## Digest

One line per past finding — read this in full before a sweep.

- 2026-07-19 | `akvj/src/js/visuals/ClipLoader.js` | Filed 3 nits in [NIT]-visuals-clipLoader-naming-sweep-2026-07-19.md (`setupClips`/`setupClipsFromProject` → `loadClips`/`loadClip… [2026, 07, 19]
- 2026-07-19 | `akvj/src/js/visuals/` (timingConversion.js + core timing files) | Filed 1 nit in [NIT]-visuals-timingConversion-semantic-sweep-2026-07-19.md (ClipTiming.js error mess… [2026, 07, 19]
- 2026-07-19 | mainframe/src/js/ (37 files incl. AkvjMainframe, ChoiceItem/ChoiceList/SortChoice/RoleChoice, ClipCategory, ClipEditorController, ClipFrame/ClipFrames, ClipInstance, C…
- 2026-07-19 | .agents/workflows/developer-team/spec/ (10 files: code-standards.md, clip-schema.md, aesthetics.md, collaboration-protocol.md, goal.md, routine-maintenance.md, feature… [2026, 07, 19, 10]
- 2026-07-19 | akvj/test/utils/` + `mainframe/test/utils/` + sample test files (akvj/test/Clip.test.js, ClipLoader.test.js, ClipTiming.test.js, Compositor.test.js, EffectsManager.tes…
- 2026-07-19 | akvj/src/js/core/ re-check (3 files: AdventureKidVideoJockey.js, AppState.js, settings.js) | 0 nits filed. Code is clean. Celebrated descriptive private field names (`…
- 2026-07-19 | mainframe/scripts/ (16 files: index, Pipeline, new, spritesheet, lib/copy, lib/fsUtils, lib/generate, lib/hash, lib/optimize, lib/spritesheet-core, lib/validate, lib/v… [2026, 07, 19, 16]
- 2026-07-19 | mainframe/shared/ (7 files: clipId, clipSchema, frameBake, frameFit, frameTiming, index, mappingLeaf) | 0 nits filed. Code is clean. Celebrated descriptive constant na…
- 2026-07-19 | mainframe/server/ (16 files: clipCatalog, clipFramesBody, frameLoad, gifExpand, handlers/clips, handlers/misc, handlers/projects, httpUtils, index, mappingService, mig…
- 2026-07-19 | mainframe/src/js/ (35 files: ClipEditorController, PianoKey, PianoRoll, AkvjMainframe, ClipFrame, ClipFrames, UserMessage, UserMessages, ClipList, MappingTable, Stagin… [2026, 07, 19, 35]
- 2026-07-19 | akvj/src/js/visuals/effects/ (13 files: EffectsPipeline.js, colorEffect.js, effectConstants.js, effectVariant.js, glitchEffect.js, grayscaleBlendEffect.js, grayscaleDi…
- 2026-07-19 | akvj/src/css/ (5 files: adventure-kid-video-jockey.css, debug-overlay.css, loading-overlay.css, user-message.css, user-messages.css) | 0 nits filed. Code is clean. Cel…
- 2026-07-19 | akvj/src/tools/clip-preview/ re-check (3 files: ClipPreview.js, index.html, preview.css) | 0 nits filed. All 3 nits from 2025-07-18 sweep resolved: `#loadedClips` rena…
- 2026-07-19 | akvj/src/ root files (index.html, main.js) | 0 nits filed. Code is clean. Celebrated descriptive variable names (`fullscreenManager`, `debugOverlay`), proper HMR clean…
- 2026-07-19 | akvj/src/js/core/ re-check (3 files: AdventureKidVideoJockey.js, AppState.js, settings.js) | 0 nits filed. All 4 nits from 2026-07-18 sweep resolved: `#teardownEventLi…
- 2026-07-19 | akvj/src/js/midi-input/ re-check (1 file: Midi.js) | 0 nits filed. Code is clean. Celebrated proper bound-handler caching (`#boundHandleMIDIMessage`, `#boundHandleStat…
- 2026-07-19 | akvj/src/js/visuals/ re-check (22 files incl. Clip, ClipLoader, ClipTiming, Compositor, EffectsManager, LayerGroup, LayerManager, MaskManager, PlaybackController, Proj…
- 2026-07-19 | mainframe/server/ re-check (16 files incl. clipCatalog, clipFramesBody, frameLoad, gifExpand, httpUtils, index, mappingService, migrateClipsToProjects, paths, projects…
- 2026-07-19 | mainframe/src/js/ re-check (35 files incl. ClipEditorController, PianoKey, PianoRoll, AkvjMainframe, ClipFrame, ClipFrames, UserMessage, UserMessages, ClipList, Mappin…
- 2026-07-18 | akvj/src/js/core/ re-check (AdventureKidVideoJockey.js, AppState.js, settings.js) | Filed 4 nits in [NIT]-core-recheck-naming-sweep-2026-07-18.md (`#teardownMIDIEventL… [2026, 07, 18]
- 2026-07-18 | akvj/src/js/visuals/ re-check (Clip.js, Compositor.js, clipDrawRect.js, EffectsPipeline.js + spot stale comments) | Filed 3 nits in [NIT]-visuals-recheck-naming-sweep-… [2026, 07, 18]
- 2026-07-18 | ClipEditorController.js deep pass (+ ClipFrame/ClipFrames bake API) | Filed 4 nits in [NIT]-clip-editor-controller-deep-pass-2026-07-18.md (legacy `upload*` fields, co… [2026, 07, 18]
- 2025-07-18 | akvj/src/js/visuals/ (22 files incl. effects/) | Filed 6 nits in [NIT]-visuals-naming-sweep-2025-07-18.md. Also noted 1 out-of-lane item (Compositor try/catch around n… [2025, 07, 18, 22]
- 2025-07-18 | akvj/src/js/core/ (3 files) | Filed 3 nits in [NIT]-core-naming-sweep-2025-07-18.md. [2025, 07, 18]
- 2025-07-18 | akvj/src/js/midi-input/ (1 file) | Filed 1 nit in [NIT]-midi-input-naming-sweep-2025-07-18.md (second instance of `#setup()` pattern). [2025, 07, 18]
- 2025-07-18 | akvj/src/js/ui/ (3 files) | Filed 3 nits in [NIT]-ui-naming-sweep-2025-07-18.md (file↔class mismatch, `#enqueue` semantic lie, `#items` vague). [2025, 07, 18]
- 2025-07-18 | akvj/src/js/utils/ (4 files) | Filed 3 nits in [NIT]-utils-naming-sweep-2025-07-18.md (3rd/4th `setup()` instances, `#midiLog` consistency). [2025, 07, 18]
- 2025-07-18 | akvj/src/main.js + akvj/src/tools/clip-preview/ (2 files) | Filed 3 nits in [NIT]-root-and-tools-naming-sweep-2025-07-18.md (3rd `#clips`, 3rd `#lastFrameTime`, 5th `s… [2025, 07, 18]
- 2025-07-18 | mainframe/src/js/ (35 files) | Filed 9 nits in [NIT]-mainframe-js-naming-sweep-2025-07-18.md (4th `#lastFrameTime`, 4th/5th `#clips`, `#frameData` banned vague term, 3… [2025, 07, 18, 35]
- 2025-07-18 | mainframe/src/ non-JS (25 files: main.js, index.html, 23 SCSS) | Filed 2 nits in [NIT]-mainframe-non-js-sweep-2025-07-18.md (vague `kind` param, `upload-*` ID prefix s… [2025, 07, 18, 25]
- 2025-07-18 | mainframe/server/ (16 files) | Filed 1 nit in [NIT]-mainframe-server-sweep-2025-07-18.md (`frames` param → `frameCount` in spritesheet.js). Cleanest sweep so far. [2025, 07, 18, 16]
- 2025-07-18 | mainframe/shared/ + mainframe/scripts/ (19 files) | Filed 2 nits in [NIT]-mainframe-shared-scripts-sweep-2025-07-18.md (`layoutPath` legacy term, 2nd `frames` → `frame… [2025, 07, 18, 19]
- 2025-07-18 | monorepo-scripts/ (6 files) | Filed 0 nits in [NIT]-monorepo-scripts-sweep-2025-07-18.md. Cleanest sweep in the repo. [2025, 07, 18]
- 2025-07-18 | e2e/ + root config (5 files) | Filed 0 nits in [NIT]-e2e-root-config-sweep-2025-07-18.md. Repo sweep complete. [2025, 07, 18]
- 2025-07-18 | New/refactored files: UserMessage.js (×2), timing.js, ProjectCatalog.js, clipMetadata.js, shellUserFeedback.js, stagingPreviewDisplay.js, Pipeline.js, scripts/clips/li… [2025, 07, 18, 16]
- 2025-07-18 | Random timeout sweep — new source files: AkvjLoadingOverlay.js (renamed from LoadingOverlay.js), snapToPixel.js, clipDrawRect.js, new test files (ProjectCatalog.test.j…
- 2025-07-18 | Random timeout + protocol update message | 0 nits filed. No new source files since last sweep. Deleted protocol update message about drafts/ folder documentation.
- 2026-07-18 | Wake-up check (no messages, no new files) | 0 nits filed. All areas still clean. No new JS source files since last sweep. Sleeping.
- 2026-07-18 | New files: PianoKey.js, PianoRoll.js (mainframe/src/js/) | Filed 1 nit in [NIT]-piano-key-roll-naming-sweep-2026-07-18.md (inconsistent bound-handler pattern in PianoK… [2026, 07, 18]
- 2026-07-18 | Wake-up check (no messages, no new files) | 0 nits filed. All areas still clean. No new JS source files since last sweep. Sleeping.
- 2026-07-18 | New files: clip-editor refactor wave in mainframe/src/js/ (ChoiceItem.js, ChoiceList.js, ClipCategory.js, ClipEditorController.js, ClipFrame.js, ClipFrames.js (revisit… [2026, 07, 18]
- 2026-07-19 | akvj/src/js/midi-input/ re-check (Midi.js) | Filed 2 nits in [NIT]-midi-input-recheck-naming-sweep-2026-07-19.md (`initialize*`/`setup*` verb split-brain: `#setupPromi… [2026, 07, 19]
- 2026-07-19 | Random timeout, 🎲 special mission "comment cull" | Checked `akvj/src/js/ui/` + `akvj/src/js/utils/` first (per rotation plan) — both clean, zero inline comments, noth… [2026, 07, 19]
- 2026-07-19 | ClipLoader.js | `setupClips`/`setupClipsFromProject` → `loadClips`/`loadClipsFromProject` (vague setup* verb, inconsistent with `#loadClipsFromKeyMap`) | [NIT]-visuals… [2026, 07, 19]
- 2026-07-19 | ClipLoader.js | `destroy(clips)` → `destroyClips(clips)` (destroys external object, not the loader instance) | [NIT]-visuals-clipLoader-naming-sweep-2026-07-19.md [2026, 07, 19]
- 2026-07-19 | ClipLoader.js | `velocity`/`velocityThreshold` naming inconsistency in `#buildLoadTasks` vs downstream methods | [NIT]-visuals-clipLoader-naming-sweep-2026-07-19.md [2026, 07, 19]
- 2026-07-19 | collaboration-protocol.md | Table folder names "inbox/" / "outbox/" → "mail/in/" / "mail/out/" (outdated per 2026-07-19 changelog) | [NIT]-spec-terminology-consistency… [2026, 07, 19]
- 2026-07-19 | optimize.js | `VALID_BIT_DEPTHS` local Set → import from shared/clipSchema.js (DRY violation) | [NIT]-mainframe-scripts-dry-violation-2026-07-19.md [2026, 07, 19]
- 2026-07-18 | AdventureKidVideoJockey.js | `#teardownMIDIEventListeners` → `#teardownEventListeners` | [NIT]-core-recheck-naming-sweep-2026-07-18.md [2026, 07, 18]
- 2026-07-18 | AppState.js | `EVENT_PROJECT_SWITCH` dual meaning (request vs active-id) | [NIT]-core-recheck-naming-sweep-2026-07-18.md [2026, 07, 18]
- 2026-07-18 | AppState.js | `MAX_MIDI_VELOCITY` used for CC → `MAX_MIDI_DATA_BYTE` | [NIT]-core-recheck-naming-sweep-2026-07-18.md [2026, 07, 18]
- 2026-07-18 | AdventureKidVideoJockey.js | `#setupClips` → `#loadClipsFromUrl` | [NIT]-core-recheck-naming-sweep-2026-07-18.md [2026, 07, 18]
- 2026-07-18 | ClipTiming.js | JSDoc `lastTime` → `lastTimestamp` (stale after rename) | [NIT]-visuals-recheck-naming-sweep-2026-07-18.md [2026, 07, 18]
- 2026-07-18 | Compositor.js | `alpha` → `blendFactor` in `#mixMultiBit`/`#blendPixel` | [NIT]-visuals-recheck-naming-sweep-2026-07-18.md [2026, 07, 18]
- 2026-07-18 | Clip.js | `posX`/`posY` → `frameColumn`/`frameRow` | [NIT]-visuals-recheck-naming-sweep-2026-07-18.md [2026, 07, 18]
- 2026-07-18 | ClipEditorController.js | `#uploadForm`/`#uploadClipIdInput`/`#uploadClipIdHint`/`#uploadSubmitButton`/`resetUploadClipId()` → drop `upload` | [NIT]-clip-editor-contro… [2026, 07, 18]
- 2026-07-18 | ClipFrame.js, ClipFrames.js vs ClipEditorController.js | `composition`/`getCompositions` ↔ `bakeConfig`/`#stagedBakeConfigs` terminology split | [NIT]-clip-editor-cont… [2026, 07, 18]
- 2026-07-18 | ClipEditorController.js | `const data` (hydrate) → `framesResponse` | [NIT]-clip-editor-controller-deep-pass-2026-07-18.md [2026, 07, 18]
- 2026-07-18 | ClipEditorController.js | `#reportOutcome(kind, …)` → `(severity, …)` | [NIT]-clip-editor-controller-deep-pass-2026-07-18.md [2026, 07, 18]
- 2026-07-18 | ChoiceItem.js, ChoiceList.js, ClipNameInput.js | `#abort` → `#abortController` (3rd/4th/5th instance) | [NIT]-clip-editor-refactor-naming-sweep-2026-07-18.md [2026, 07, 18]
- 2026-07-18 | 16 custom elements in mainframe/src/js/ | tag-prefix split-brain (akvj-* vs unprefixed) | [NIT]-clip-editor-refactor-naming-sweep-2026-07-18.md [2026, 07, 18, 16]
- 2026-07-18 | ClipEditorController.js | `bind()` → `bindEventListeners()`/`wireControls()` | [NIT]-clip-editor-refactor-naming-sweep-2026-07-18.md [2026, 07, 18]
- 2026-07-18 | ClipFrame.js, ClipFrames.js | `duration`/`getDurations()`/`setAllDurations()`/`areDurationsUniform()` → add `Ms` suffix | [NIT]-clip-editor-refactor-naming-sweep-2026-… [2026, 07, 18]
- 2026-07-18 | index.html | `drop-zone`/`staging-preview` → `clip-editor-drop-zone`/`clip-editor-staging-preview` | [NIT]-clip-editor-refactor-naming-sweep-2026-07-18.md [2026, 07, 18]
- 2026-07-18 | PianoKey.js | Inconsistent bound-handler pattern (arrow in callback vs .bind at field) | [NIT]-piano-key-roll-naming-sweep-2026-07-18.md [2026, 07, 18]
- 2025-07-18 | PlaybackController.js | `#lastRandomFrame` → `#lastShuffleFrame` | [NIT]-visuals-naming-sweep-2025-07-18.md [2025, 07, 18]
- 2025-07-18 | LayerGroup.js | `#isClipsDirty` → `#isClipCacheDirty` | [NIT]-visuals-naming-sweep-2025-07-18.md [2025, 07, 18]
- 2025-07-18 | LayerGroup.js | `#clips` → `#loadedClips` | [NIT]-visuals-naming-sweep-2025-07-18.md [2025, 07, 18]
- 2025-07-18 | LayerManager.js | `#handlers` → `#channelRouteHandlers` | [NIT]-visuals-naming-sweep-2025-07-18.md [2025, 07, 18]
- 2025-07-18 | ClipTiming.js | `#lastTime` → `#lastTimestamp` | [NIT]-visuals-naming-sweep-2025-07-18.md [2025, 07, 18]
- 2025-07-18 | ClipTiming.js | `#unsubscribeClock` → `#unsubscribeFromClock` | [NIT]-visuals-naming-sweep-2025-07-18.md [2025, 07, 18]
- 2025-07-18 | AdventureKidVideoJockey.js | `#setup()` → `#initializeVisuals()` | [NIT]-core-naming-sweep-2025-07-18.md [2025, 07, 18]
- 2025-07-18 | AppState.js | `#lastClockTime` → `#lastClockTimestamp` | [NIT]-core-naming-sweep-2025-07-18.md [2025, 07, 18]
- 2025-07-18 | AdventureKidVideoJockey.js | `#clips` → `#loadedClips` | [NIT]-core-naming-sweep-2025-07-18.md [2025, 07, 18]
- 2025-07-18 | Midi.js | `#setup()` → `#initializeMIDIAccess()` | [NIT]-midi-input-naming-sweep-2025-07-18.md [2025, 07, 18]
- 2025-07-18 | LoadingOverlay.js | file↔class mismatch (`LoadingOverlay.js` exports `AkvjLoadingOverlay`) | [NIT]-ui-naming-sweep-2025-07-18.md [2025, 07, 18]
- 2025-07-18 | UserMessages.js (akvj) | `#enqueue` → `#pushMessage` | [NIT]-ui-naming-sweep-2025-07-18.md [2025, 07, 18]
- 2025-07-18 | UserMessages.js (akvj) | `#items` → `#messages` | [NIT]-ui-naming-sweep-2025-07-18.md [2025, 07, 18]
- 2025-07-18 | DebugOverlay.js | `setup()` → `mount()` | [NIT]-utils-naming-sweep-2025-07-18.md [2025, 07, 18]
- 2025-07-18 | Fullscreen.js | `setup()` → `enable()` | [NIT]-utils-naming-sweep-2025-07-18.md [2025, 07, 18]
- 2025-07-18 | DebugOverlay.js | `#midiLog` → `#midiLogEntries` | [NIT]-utils-naming-sweep-2025-07-18.md [2025, 07, 18]
- 2025-07-18 | ClipPreview.js | `#clips` → `#loadedClips` | [NIT]-root-and-tools-naming-sweep-2025-07-18.md [2025, 07, 18]
- 2025-07-18 | ClipPreview.js | `#lastFrameTime` → `#lastFrameTimestamp` | [NIT]-root-and-tools-naming-sweep-2025-07-18.md [2025, 07, 18]
- 2025-07-18 | ClipPreview.js | `setup()` → `initialize()` | [NIT]-root-and-tools-naming-sweep-2025-07-18.md [2025, 07, 18]
- 2025-07-18 | StagingPreview.js | `#lastFrameTime` → `#lastFrameTimestamp` | [NIT]-mainframe-js-naming-sweep-2025-07-18.md [2025, 07, 18]
- 2025-07-18 | mainframeState.js | `#clips` → `#loadedClips` | [NIT]-mainframe-js-naming-sweep-2025-07-18.md [2025, 07, 18]
- 2025-07-18 | ClipList.js | `#clips` → `#loadedClips` | [NIT]-mainframe-js-naming-sweep-2025-07-18.md [2025, 07, 18]
- 2025-07-18 | ClipFrames.js | `#frameData` → `#frameEntries` | [NIT]-mainframe-js-naming-sweep-2025-07-18.md [2025, 07, 18]
- 2025-07-18 | StagingPreview.js | file↔class mismatch (`StagingPreview.js` exports `AkvjStagingPreview`) | [NIT]-mainframe-js-naming-sweep-2025-07-18.md [2025, 07, 18]
- 2025-07-18 | ClipList.js | file↔class mismatch (`ClipList.js` exports `AkvjClipList`) | [NIT]-mainframe-js-naming-sweep-2025-07-18.md [2025, 07, 18]
- 2025-07-18 | MappingTable.js | file↔class mismatch (`MappingTable.js` exports `AkvjMappingTable`) | [NIT]-mainframe-js-naming-sweep-2025-07-18.md [2025, 07, 18]
- 2025-07-18 | UserMessages.js (mainframe) | `#items` → `#messages` | [NIT]-mainframe-js-naming-sweep-2025-07-18.md [2025, 07, 18]
- 2025-07-18 | UserMessages.js (mainframe) | `#enqueue` → `#pushMessage` | [NIT]-mainframe-js-naming-sweep-2025-07-18.md [2025, 07, 18]
- 2025-07-18 | main.js (mainframe) | `setStatus` param `kind` → `statusClass` | [NIT]-mainframe-non-js-sweep-2025-07-18.md [2025, 07, 18]
- 2025-07-18 | index.html / main.js (mainframe) | `upload-*` ID prefix → `clip-editor-*` (semantic mismatch) | [NIT]-mainframe-non-js-sweep-2025-07-18.md [2025, 07, 18]
- 2025-07-18 | spritesheet.js | `frames` param → `frameCount` (array-vs-number semantic mismatch) | [NIT]-mainframe-server-sweep-2025-07-18.md [2025, 07, 18]
- 2025-07-18 | validateMapping.js | `layoutPath` → `keyMapPath` (legacy term) | [NIT]-mainframe-shared-scripts-sweep-2025-07-18.md [2025, 07, 18]
- 2025-07-18 | spritesheet.js (CLI) | `frames` param → `frameCount` (2nd instance) | [NIT]-mainframe-shared-scripts-sweep-2025-07-18.md [2025, 07, 18]
- 2025-07-18 | UserMessage.js (akvj + mainframe) | `#abort` → `#abortController` | [NIT]-new-files-naming-sweep-2025-07-18-2.md [2025, 07, 18]
- 2025-07-18 | UserMessages.js (akvj + mainframe) | `#idSeq` → `#nextMessageId` | [NIT]-new-files-naming-sweep-2025-07-18-2.md [2025, 07, 18]
- 2025-07-18 | UserMessages.js (akvj + mainframe) | `#stack` → `#messageStackElement` | [NIT]-new-files-naming-sweep-2025-07-18-2.md [2025, 07, 18]
- 2025-07-18 | validate/structure.js | `e`/`f` → `entry`/`filename` | [NIT]-new-files-naming-sweep-2025-07-18-2.md [2025, 07, 18]
- 2025-07-18 | validate/meta.js | `frameNum` → `frameIndex` | [NIT]-new-files-naming-sweep-2025-07-18-2.md [2025, 07, 18]
- 2026-07-19 | Midi.js | `#setupPromise`/`#setupStateChangeListener`/`#setupMIDIInputs` → `initialize*` (verb split-brain vs `#initializeMIDIAccess`) | [NIT]-midi-input-recheck-namin… [2026, 07, 19]
- 2026-07-19 | Midi.js | `#handleMIDIFailure` shadowed `error` param in inner catch → rename to `resetError` | [NIT]-midi-input-recheck-naming-sweep-2026-07-19.md [2026, 07, 19]
- 2026-07-19 | ClipEditorController.js | `setStatus` callback param `kind` → `statusClass` (vague parameter name) | [NIT]-mainframe-js-recheck-naming-sweep-2026-07-19.md [2026, 07, 19]
- 2026-07-19 | DebugOverlay.js | `#midiLogEntries` dead `time` field (unused by `#renderLog`) | [NIT]-akvj-ui-utils-readability-sweep-2026-07-19.md [2026, 07, 19]
- 2026-07-19 | DebugOverlay.js | Magic hex colors `'#0f0'` / `'#f00'` for MIDI status → named constants | [NIT]-akvj-ui-utils-readability-sweep-2026-07-19.md [2026, 07, 19]
- 2026-07-19 | velocitySelection.js | JSDoc `@param {Object<string, Object<string, Clip>}` missing closing `>` | [NIT]-akvj-ui-utils-readability-sweep-2026-07-19.md [2026, 07, 19]
- 2026-07-19 | akvj/src/js/visuals/LayerManager.js + LayerGroup.js + MaskManager.js (+ Clip.js for one terminology drift) | Filed 4 nits in [NIT]-visuals-layer-coordination-naming-sw… [2026, 07, 19]
- 2026-07-19 | akvj/src/js/ui/ (AkvjLoadingOverlay.js, UserMessage.js, UserMessages.js) + akvj/src/js/utils/ (DebugOverlay.js, Fullscreen.js, snapToPixel.js, timing.js, velocitySelec… [2026, 07, 19]
- 2026-07-19 | akvj/src/js/visuals/ core clip modules (Clip.js, ClipTiming.js, PlaybackController.js, ProjectCatalog.js, clipDrawRect.js, clipMetadata.js) | Filed 2 nits in [NIT]-vis… [2026, 07, 19]
- 2026-07-19 | mainframe/src/ non-JS (styles.css, PageShell.scss, index.html, main.js, sample SCSS: PianoRoll.scss, PianoKey.scss, main.scss) | Filed 4 nits in [NIT]-mainframe-non-js… [2026, 07, 19]
- 2026-07-19 | mainframe/src/js/ new stable files (`ClipFramesUploadPanel.js`, `PreviewClip.js`, tests) | Filed 5 nits in [NIT]-mainframe-new-widgets-naming-sweep-2026-07-19.md (Clip… [2026, 07, 19]
- 2026-07-19 | `akvj/src/js/core/` re-check (`AppState.js`, `midiConstants.js`) | Filed 3 nits in [NIT]-akvj-core-unit-honesty-sweep-2026-07-19.md (`#processClockPulse` `interval` mi… [2026, 07, 19]
- 2026-07-19 | `mainframe/src/js/` new stable files re-check (`PreviewClip.js`, `ClipFramesUploadPanel.js`, `PreviewClip.test.js`, `ClipFramesUploadPanel.test.js`) | Filed 3 nits in … [2026, 07, 19]
- 2026-07-19 | `mainframe/scripts/` (`Pipeline.js`, `index.js`, `spritesheet.js`, `optimize.js`, `validateMapping.js`, `lib/*`) | Filed 4 nits in [NIT]-mainframe-scripts-recheck-nami… [2026, 07, 19, 12]
- 2026-07-19 | PreviewClip.js | `#setAttribute`/`#toggleAttribute` → `#setAttributeIfChanged`/`#toggleAttributeIfChanged` (shadow built-in Element methods) | [NIT]-mainframe-preview-… [2026, 07, 19]
- 2026-07-19 | PreviewClip.js | `#getFrameInterval` → `#getFrameIntervalMs` (unit honesty, returns ms) | [NIT]-mainframe-preview-clip-recheck-naming-sweep-2026-07-19.md [2026, 07, 19]
- 2026-07-19 | PreviewClip.js | `#loading` → `#isLoading` (boolean field naming consistency) | [NIT]-mainframe-preview-clip-recheck-naming-sweep-2026-07-19.md [2026, 07, 19]
- 2026-07-19 | validateMapping.js | `data` result property → `keyMap` (vague generic wrapper) | [NIT]-mainframe-scripts-recheck-naming-sweep-2026-07-19.md [2026, 07, 19]
- 2026-07-19 | spritesheet.js | `frameRate: 12` → `DEFAULT_FRAME_RATE` (hard-coded default) | [NIT]-mainframe-scripts-recheck-naming-sweep-2026-07-19.md [2026, 07, 19, 12]
- 2026-07-19 | index.js (scripts/clips) | bare `1000` → `MS_PER_SECOND` (ms-to-s magic number) | [NIT]-mainframe-scripts-recheck-naming-sweep-2026-07-19.md [2026, 07, 19, 1000]
- 2026-07-19 | optimize.js | `threshold(128)` → `DEFAULT_1BIT_THRESHOLD` (magic threshold) | [NIT]-mainframe-scripts-recheck-naming-sweep-2026-07-19.md [2026, 07, 19, 128]
- 2026-07-19 | `mainframe/shared/` (`frameTiming.js`, `clipSchema.js`, `frameFit.js`, `frameBake.js`, `mappingLeaf.js`, `clipId.js`, `index.js`) | Filed 2 nits in [NIT]-mainframe-sha… [2026, 07, 19]
- 2026-07-19 | frameTiming.js | bare `1000` ms-per-second → `MS_PER_SECOND` (unit honesty) | [NIT]-mainframe-shared-unit-honesty-sweep-2026-07-19.md [2026, 07, 19, 1000]
- 2026-07-19 | frameTiming.js | JSDoc `[fallbackFps=12]` → `[fallbackFps=DEFAULT_FALLBACK_FPS]` (stale default) | [NIT]-mainframe-shared-unit-honesty-sweep-2026-07-19.md [2026, 07, 19, 12]
- 2026-07-19 | `e2e/` + root config (`akvj.spec.js`, `mainframe.spec.js`, `playwright.config.js`, `eslint.config.js`, `knip.json`, `package.json`) | Filed 2 nits in [NIT]-e2e-and-roo… [2026, 07, 19]
- 2026-07-19 | mainframe.spec.js | bare `15000` timeout → `E2E_TIMEOUT_MS` (magic number) | [NIT]-e2e-and-root-config-magic-numbers-sweep-2026-07-19.md [2026, 07, 19]
- 2026-07-19 | playwright.config.js | bare `30000` webServer timeout → `WEB_SERVER_TIMEOUT_MS` (magic number) | [NIT]-e2e-and-root-config-magic-numbers-sweep-2026-07-19.md [2026, 07, 19]
- 2026-07-19 | `monorepo-scripts/` (`check-line-endings.js`, `check-utf8.js`, `sort-package-json.js`, `lib/gitTrackedTextFiles.js`, `lib/report.js`, tests, `vitest.config.js`) | No n… [2026, 07, 19]
- 2026-07-20 | `specs/docs` re-check (`code-standards.md`, `clip-schema.md`, `collaboration-protocol.md`, `README.md`) | Filed 5 nits in [NIT]-specs-docs-readme-stale-sweep-2026-07-2… [2026, 07, 20, 14]
- 2026-07-20 | `mainframe/src/js/` (focused on editor/preview/piano UI) | Filed 7 nits in [NIT]-mainframe-js-magic-numbers-sweep-2026-07-20.md (bare `1000` default frame duration in … [2026, 07, 20]
- Area: `projects/default/README.md, akvj/vite.config.js`
- Refs: 329
- Area: `akvj/src/js/ui/, akvj/src/js/utils/`
- Refs: DebugOverlay.js:128,133; velocitySelection.js:14,21; UserMessages.js:112,134,158
- Area: `akvj/src/js/visuals/`
- Refs: 18,51,62,70,92,174,193,324,350,10,24,62,105,117,124,125,136,141,146,166,179,180,190,193,195,204,221
- Area: `akvj/src/js/visuals/effects`
- Refs: 67,78,104,131,137,42,26
- Area: `akvj/src/js/visuals/effects/`
- Area: `mainframe/server/handlers/`
- Area: `mainframe/src/js/KeyBed.js,syncTiming.js,PianoRoll.js`
- Refs: 63,46,494,50,730
- Area: `spec/mapping.md,mainframe/src/js/MappingTable.js`
- Refs: 18,61,78,6,61-63
- Area: `akvj/src/js/visuals/clipDrawRect.js`
- Refs: 87,99,205
- Area: `mainframe/server/`
- Refs: 9,11,79,3,35
- Area: `mainframe/shared/frameFit.js`
- Refs: 7,13,15
- Area: `e2e/,mainframe/test/MappingTable.test.js`
- Refs: 167,41,56,103
- Area: `mainframe/src/js/StagingPreview.js,PreviewClip.js,spec/clip-format.md`
- Refs: 9,11,59
- Area: `mainframe/scripts/clips/lib/validate/`
- Refs: 10,15,34,85,121
- Area: `mainframe/scripts/clips/lib/optimize.js`
- Refs: 215,218,209
- Area: `mainframe/scripts/clips/lib/spritesheet-core.js`
- Refs: 63,69,232,234
- Area: `mainframe/src/js/ClipFramesUploadPanel.js`
- Refs: 7,11,33,39,69
- Area: `mainframe/src/js/PianoKey.js,PianoRoll.js`
- Refs: 250,331,574,600,282,285
- Area: `mainframe/server/spritesheet.js`

## Recent

- Refs: 39,179

- Area: `akvj/src/js/visuals/ClipTiming.js`

- Refs: 5,55,72,121,237

- Area: `akvj/src/js/visuals/LayerManager.js`

- Refs: 12,95

- Area: `.agents/workflows/developer-team/spec/goal.md,PROJECT-SPECIFICATION.md`

- Refs: 19,17

- Area: `mainframe/server/handlers/clips.js`

- Refs: 248,295,407

- Area: `akvj/src/js/visuals`

- Area: `akvj/src/js/visuals`

### 2026-07-20 17:56 — Timer wake, no new mail. Swept PianoRoll.js (current state), StagingPreview.js, ClipList.js, AkvjMainframe.js, generateClipId.js diffs since 2026-07-19. Filed 3 nits in [NIT]-pianoroll-staging-cliplist-sweep-2026-07-20d.md (StagingPreview #getFrameInterval→#getFrameIntervalMs, ClipList rolePianoFilter→roleFilter, PianoRoll dead ?? on #filterState). Dropped out-of-lane note [NOTE]-pianoroll-tooltip-innerhtml-xss-2026-07-20.md for Overseer (innerHTML with user data). Celebrated: PianoKey *request event naming resolved, AkvjMainframe uses EVENT_* constants, generateClipId uses shared slugify, StagingPreview magic 240/135→named constants.

- Area: `mainframe/src/js/PianoRoll.js,StagingPreview.js,ClipList.js`
- Refs: StagingPreview.js:350;ClipList.js:157;PianoRoll.js:376,882
