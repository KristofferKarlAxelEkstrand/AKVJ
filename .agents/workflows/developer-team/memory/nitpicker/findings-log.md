# The Nitpicker — Findings Log

Running record of every nit I've already filed so I never report the same one twice. One line per
finding: `YYYY-MM-DD | area | file:identifier | ticket filed`.

Also track sweep rotation here so I cover the whole repo over time.

## Next sweep area
Rotate to `akvj/src/js/midi-input/` (re-check) or any brand-new files that appear.
Tag-prefix decision is settled in `spec/code-standards.md` — do not re-raise.

## Sweeps
- 2026-07-18 | akvj/src/js/core/ re-check (AdventureKidVideoJockey.js, AppState.js, settings.js) | Filed 4 nits in [NIT]-core-recheck-naming-sweep-2026-07-18.md (`#teardownMIDIEventListeners` scope lie, `EVENT_PROJECT_SWITCH` dual meaning, `MAX_MIDI_VELOCITY` used for CC, leftover `#setupClips`). Prior core renames applied. Celebrated clean `settings.js`. Noted 2 out-of-lane DRY items for Overseer.
- 2026-07-18 | akvj/src/js/visuals/ re-check (Clip.js, Compositor.js, clipDrawRect.js, EffectsPipeline.js + spot stale comments) | Filed 3 nits in [NIT]-visuals-recheck-naming-sweep-2026-07-18.md (stale `lastTime` JSDoc, Compositor `alpha`→`blendFactor`, Clip `posX`/`posY`→`frameColumn`/`frameRow`). Prior visuals renames look applied. Celebrated clean `clipDrawRect.js` / `EffectsPipeline.js`.
- 2026-07-18 | ClipEditorController.js deep pass (+ ClipFrame/ClipFrames bake API) | Filed 4 nits in [NIT]-clip-editor-controller-deep-pass-2026-07-18.md (legacy `upload*` fields, composition↔bakeConfig terminology split, vague `data` local, vague `kind` param). Noted prior tag-prefix nit closed by code-standards rule (no mass-rename).
- 2025-07-18 | akvj/src/js/visuals/ (22 files incl. effects/) | Filed 6 nits in [NIT]-visuals-naming-sweep-2025-07-18.md. Also noted 1 out-of-lane item (Compositor try/catch around null assignments) for Overseer.
- 2025-07-18 | akvj/src/js/core/ (3 files) | Filed 3 nits in [NIT]-core-naming-sweep-2025-07-18.md.
- 2025-07-18 | akvj/src/js/midi-input/ (1 file) | Filed 1 nit in [NIT]-midi-input-naming-sweep-2025-07-18.md (second instance of `#setup()` pattern).
- 2025-07-18 | akvj/src/js/ui/ (3 files) | Filed 3 nits in [NIT]-ui-naming-sweep-2025-07-18.md (file↔class mismatch, `#enqueue` semantic lie, `#items` vague).
- 2025-07-18 | akvj/src/js/utils/ (4 files) | Filed 3 nits in [NIT]-utils-naming-sweep-2025-07-18.md (3rd/4th `setup()` instances, `#midiLog` consistency).
- 2025-07-18 | akvj/src/main.js + akvj/src/tools/clip-preview/ (2 files) | Filed 3 nits in [NIT]-root-and-tools-naming-sweep-2025-07-18.md (3rd `#clips`, 3rd `#lastFrameTime`, 5th `setup()`). `main.js` is clean.
- 2025-07-18 | mainframe/src/js/ (35 files) | Filed 9 nits in [NIT]-mainframe-js-naming-sweep-2025-07-18.md (4th `#lastFrameTime`, 4th/5th `#clips`, `#frameData` banned vague term, 3 file↔class mismatches, 2nd `#items`/`#enqueue`).
- 2025-07-18 | mainframe/src/ non-JS (25 files: main.js, index.html, 23 SCSS) | Filed 2 nits in [NIT]-mainframe-non-js-sweep-2025-07-18.md (vague `kind` param, `upload-*` ID prefix semantic mismatch).
- 2025-07-18 | mainframe/server/ (16 files) | Filed 1 nit in [NIT]-mainframe-server-sweep-2025-07-18.md (`frames` param → `frameCount` in spritesheet.js). Cleanest sweep so far.
- 2025-07-18 | mainframe/shared/ + mainframe/scripts/ (19 files) | Filed 2 nits in [NIT]-mainframe-shared-scripts-sweep-2025-07-18.md (`layoutPath` legacy term, 2nd `frames` → `frameCount` instance).
- 2025-07-18 | monorepo-scripts/ (6 files) | Filed 0 nits in [NIT]-monorepo-scripts-sweep-2025-07-18.md. Cleanest sweep in the repo.
- 2025-07-18 | e2e/ + root config (5 files) | Filed 0 nits in [NIT]-e2e-root-config-sweep-2025-07-18.md. Repo sweep complete.
- 2025-07-18 | New/refactored files: UserMessage.js (×2), timing.js, ProjectCatalog.js, clipMetadata.js, shellUserFeedback.js, stagingPreviewDisplay.js, Pipeline.js, scripts/clips/lib/ (16 files) | Filed 5 nits in [NIT]-new-files-naming-sweep-2025-07-18-2.md. Noted 1 out-of-lane DRY issue (VALID_BIT_DEPTHS duplicate in optimize.js).
- 2025-07-18 | Random timeout sweep — new source files: AkvjLoadingOverlay.js (renamed from LoadingOverlay.js), snapToPixel.js, clipDrawRect.js, new test files (ProjectCatalog.test.js, ClipTiming.test.js, effectVariant.test.js, createMockClip.js, akvj-startup.smoke.js) | 0 nits filed. All clean. AkvjLoadingOverlay.js rename resolves previously filed nit #36 (file↔class mismatch).
- 2025-07-18 | Random timeout + protocol update message | 0 nits filed. No new source files since last sweep. Deleted protocol update message about drafts/ folder documentation.
- 2026-07-18 | Wake-up check (no messages, no new files) | 0 nits filed. All areas still clean. No new JS source files since last sweep. Sleeping.
- 2026-07-18 | New files: PianoKey.js, PianoRoll.js (mainframe/src/js/) | Filed 1 nit in [NIT]-piano-key-roll-naming-sweep-2026-07-18.md (inconsistent bound-handler pattern in PianoKey.js). Noted 1 out-of-lane item for Overseer (keydown listener leak in PianoKey.js).
- 2026-07-18 | Wake-up check (no messages, no new files) | 0 nits filed. All areas still clean. No new JS source files since last sweep. Sleeping.
- 2026-07-18 | New files: clip-editor refactor wave in mainframe/src/js/ (ChoiceItem.js, ChoiceList.js, ClipCategory.js, ClipEditorController.js, ClipFrame.js, ClipFrames.js (revisited), ClipInstance.js, ClipNameInput.js, ProjectChooser.js, RoleChoice(s).js, SimpleRouter.js, SortChoice(s).js, acceptedImageFiles.js, apiClient.js, clipEditorRoute.js, clipSchema.js, editorMeta.js, frameBake.js, frameFit.js, frameTiming.js, generateClipId.js, syncTiming.js) + index.html | Filed 5 nits in [NIT]-clip-editor-refactor-naming-sweep-2026-07-18.md: 3rd/4th `#abort` instance (escalated to batch fix), tag-prefix split-brain across 16 custom elements (akvj-* vs unprefixed, incl. cross-workspace UserMessage mismatch), vague `bind()` in ClipEditorController.js, `duration`/`durationMs` terminology drift (ClipFrame/ClipFrames vs ClipEditorController), `drop-zone`/`staging-preview` ids breaking `clip-editor-*` prefix. ClipEditorController.js (1022 lines) was grep-scanned for known smells + spot-read, not exhaustively read line-by-line.

## Filed nits
- 2026-07-18 | AdventureKidVideoJockey.js | `#teardownMIDIEventListeners` → `#teardownEventListeners` | [NIT]-core-recheck-naming-sweep-2026-07-18.md
- 2026-07-18 | AppState.js | `EVENT_PROJECT_SWITCH` dual meaning (request vs active-id) | [NIT]-core-recheck-naming-sweep-2026-07-18.md
- 2026-07-18 | AppState.js | `MAX_MIDI_VELOCITY` used for CC → `MAX_MIDI_DATA_BYTE` | [NIT]-core-recheck-naming-sweep-2026-07-18.md
- 2026-07-18 | AdventureKidVideoJockey.js | `#setupClips` → `#loadClipsFromUrl` | [NIT]-core-recheck-naming-sweep-2026-07-18.md
- 2026-07-18 | ClipTiming.js | JSDoc `lastTime` → `lastTimestamp` (stale after rename) | [NIT]-visuals-recheck-naming-sweep-2026-07-18.md
- 2026-07-18 | Compositor.js | `alpha` → `blendFactor` in `#mixMultiBit`/`#blendPixel` | [NIT]-visuals-recheck-naming-sweep-2026-07-18.md
- 2026-07-18 | Clip.js | `posX`/`posY` → `frameColumn`/`frameRow` | [NIT]-visuals-recheck-naming-sweep-2026-07-18.md
- 2026-07-18 | ClipEditorController.js | `#uploadForm`/`#uploadClipIdInput`/`#uploadClipIdHint`/`#uploadSubmitButton`/`resetUploadClipId()` → drop `upload` | [NIT]-clip-editor-controller-deep-pass-2026-07-18.md
- 2026-07-18 | ClipFrame.js, ClipFrames.js vs ClipEditorController.js | `composition`/`getCompositions` ↔ `bakeConfig`/`#stagedBakeConfigs` terminology split | [NIT]-clip-editor-controller-deep-pass-2026-07-18.md
- 2026-07-18 | ClipEditorController.js | `const data` (hydrate) → `framesResponse` | [NIT]-clip-editor-controller-deep-pass-2026-07-18.md
- 2026-07-18 | ClipEditorController.js | `#reportOutcome(kind, …)` → `(severity, …)` | [NIT]-clip-editor-controller-deep-pass-2026-07-18.md
- 2026-07-18 | ChoiceItem.js, ChoiceList.js, ClipNameInput.js | `#abort` → `#abortController` (3rd/4th/5th instance) | [NIT]-clip-editor-refactor-naming-sweep-2026-07-18.md
- 2026-07-18 | 16 custom elements in mainframe/src/js/ | tag-prefix split-brain (akvj-* vs unprefixed) | [NIT]-clip-editor-refactor-naming-sweep-2026-07-18.md
- 2026-07-18 | ClipEditorController.js | `bind()` → `bindEventListeners()`/`wireControls()` | [NIT]-clip-editor-refactor-naming-sweep-2026-07-18.md
- 2026-07-18 | ClipFrame.js, ClipFrames.js | `duration`/`getDurations()`/`setAllDurations()`/`areDurationsUniform()` → add `Ms` suffix | [NIT]-clip-editor-refactor-naming-sweep-2026-07-18.md
- 2026-07-18 | index.html | `drop-zone`/`staging-preview` → `clip-editor-drop-zone`/`clip-editor-staging-preview` | [NIT]-clip-editor-refactor-naming-sweep-2026-07-18.md
- 2026-07-18 | PianoKey.js | Inconsistent bound-handler pattern (arrow in callback vs .bind at field) | [NIT]-piano-key-roll-naming-sweep-2026-07-18.md
- 2025-07-18 | PlaybackController.js | `#lastRandomFrame` → `#lastShuffleFrame` | [NIT]-visuals-naming-sweep-2025-07-18.md
- 2025-07-18 | LayerGroup.js | `#isClipsDirty` → `#isClipCacheDirty` | [NIT]-visuals-naming-sweep-2025-07-18.md
- 2025-07-18 | LayerGroup.js | `#clips` → `#loadedClips` | [NIT]-visuals-naming-sweep-2025-07-18.md
- 2025-07-18 | LayerManager.js | `#handlers` → `#channelRouteHandlers` | [NIT]-visuals-naming-sweep-2025-07-18.md
- 2025-07-18 | ClipTiming.js | `#lastTime` → `#lastTimestamp` | [NIT]-visuals-naming-sweep-2025-07-18.md
- 2025-07-18 | ClipTiming.js | `#unsubscribeClock` → `#unsubscribeFromClock` | [NIT]-visuals-naming-sweep-2025-07-18.md
- 2025-07-18 | AdventureKidVideoJockey.js | `#setup()` → `#initializeVisuals()` | [NIT]-core-naming-sweep-2025-07-18.md
- 2025-07-18 | AppState.js | `#lastClockTime` → `#lastClockTimestamp` | [NIT]-core-naming-sweep-2025-07-18.md
- 2025-07-18 | AdventureKidVideoJockey.js | `#clips` → `#loadedClips` | [NIT]-core-naming-sweep-2025-07-18.md
- 2025-07-18 | Midi.js | `#setup()` → `#initializeMIDIAccess()` | [NIT]-midi-input-naming-sweep-2025-07-18.md
- 2025-07-18 | LoadingOverlay.js | file↔class mismatch (`LoadingOverlay.js` exports `AkvjLoadingOverlay`) | [NIT]-ui-naming-sweep-2025-07-18.md
- 2025-07-18 | UserMessages.js (akvj) | `#enqueue` → `#pushMessage` | [NIT]-ui-naming-sweep-2025-07-18.md
- 2025-07-18 | UserMessages.js (akvj) | `#items` → `#messages` | [NIT]-ui-naming-sweep-2025-07-18.md
- 2025-07-18 | DebugOverlay.js | `setup()` → `mount()` | [NIT]-utils-naming-sweep-2025-07-18.md
- 2025-07-18 | Fullscreen.js | `setup()` → `enable()` | [NIT]-utils-naming-sweep-2025-07-18.md
- 2025-07-18 | DebugOverlay.js | `#midiLog` → `#midiLogEntries` | [NIT]-utils-naming-sweep-2025-07-18.md
- 2025-07-18 | ClipPreview.js | `#clips` → `#loadedClips` | [NIT]-root-and-tools-naming-sweep-2025-07-18.md
- 2025-07-18 | ClipPreview.js | `#lastFrameTime` → `#lastFrameTimestamp` | [NIT]-root-and-tools-naming-sweep-2025-07-18.md
- 2025-07-18 | ClipPreview.js | `setup()` → `initialize()` | [NIT]-root-and-tools-naming-sweep-2025-07-18.md
- 2025-07-18 | StagingPreview.js | `#lastFrameTime` → `#lastFrameTimestamp` | [NIT]-mainframe-js-naming-sweep-2025-07-18.md
- 2025-07-18 | mainframeState.js | `#clips` → `#loadedClips` | [NIT]-mainframe-js-naming-sweep-2025-07-18.md
- 2025-07-18 | ClipList.js | `#clips` → `#loadedClips` | [NIT]-mainframe-js-naming-sweep-2025-07-18.md
- 2025-07-18 | ClipFrames.js | `#frameData` → `#frameEntries` | [NIT]-mainframe-js-naming-sweep-2025-07-18.md
- 2025-07-18 | StagingPreview.js | file↔class mismatch (`StagingPreview.js` exports `AkvjStagingPreview`) | [NIT]-mainframe-js-naming-sweep-2025-07-18.md
- 2025-07-18 | ClipList.js | file↔class mismatch (`ClipList.js` exports `AkvjClipList`) | [NIT]-mainframe-js-naming-sweep-2025-07-18.md
- 2025-07-18 | MappingTable.js | file↔class mismatch (`MappingTable.js` exports `AkvjMappingTable`) | [NIT]-mainframe-js-naming-sweep-2025-07-18.md
- 2025-07-18 | UserMessages.js (mainframe) | `#items` → `#messages` | [NIT]-mainframe-js-naming-sweep-2025-07-18.md
- 2025-07-18 | UserMessages.js (mainframe) | `#enqueue` → `#pushMessage` | [NIT]-mainframe-js-naming-sweep-2025-07-18.md
- 2025-07-18 | main.js (mainframe) | `setStatus` param `kind` → `statusClass` | [NIT]-mainframe-non-js-sweep-2025-07-18.md
- 2025-07-18 | index.html / main.js (mainframe) | `upload-*` ID prefix → `clip-editor-*` (semantic mismatch) | [NIT]-mainframe-non-js-sweep-2025-07-18.md
- 2025-07-18 | spritesheet.js | `frames` param → `frameCount` (array-vs-number semantic mismatch) | [NIT]-mainframe-server-sweep-2025-07-18.md
- 2025-07-18 | validateMapping.js | `layoutPath` → `keyMapPath` (legacy term) | [NIT]-mainframe-shared-scripts-sweep-2025-07-18.md
- 2025-07-18 | spritesheet.js (CLI) | `frames` param → `frameCount` (2nd instance) | [NIT]-mainframe-shared-scripts-sweep-2025-07-18.md
- 2025-07-18 | UserMessage.js (akvj + mainframe) | `#abort` → `#abortController` | [NIT]-new-files-naming-sweep-2025-07-18-2.md
- 2025-07-18 | UserMessages.js (akvj + mainframe) | `#idSeq` → `#nextMessageId` | [NIT]-new-files-naming-sweep-2025-07-18-2.md
- 2025-07-18 | UserMessages.js (akvj + mainframe) | `#stack` → `#messageStackElement` | [NIT]-new-files-naming-sweep-2025-07-18-2.md
- 2025-07-18 | validate/structure.js | `e`/`f` → `entry`/`filename` | [NIT]-new-files-naming-sweep-2025-07-18-2.md
- 2025-07-18 | validate/meta.js | `frameNum` → `frameIndex` | [NIT]-new-files-naming-sweep-2025-07-18-2.md
