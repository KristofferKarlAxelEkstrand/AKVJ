# Team Update: Mainframe refactor audit (post Tasks 119–127)

## Summary

Propose-only audit of `mainframe/` after the refactor-for-greateness epic (Tasks 119–127) plus later edit-clip / sync / user-message / clip-ID work. Focus: structure and communication quality. Prefer delete/merge over new abstraction.

## Impact

Mainframe developer / Team Lead — slice follow-up tasks from these findings. No source changes in this pass.

## Action Needed

Team Lead: consolidate with akvj audit (Task 150) and open concrete follow-up tasks. Do not treat epic §M3/`main.js` extraction or server split as unfinished — those landed.

## Notes

### 1. `ClipEditorController.js` (~862 lines) — second split?

**Public methods:** `bind`, `open`, `reset`, `hydrate`, `submit`, `stageSelectedFiles`, `clearStagedFrames`, `refreshGeneratedClipId`, `resetUploadClipId`, `updateEditorChrome`, `updateBitDepthVisibility`, `renderFileList`, `updateClipFrames`, `applyGlobalDurationToAllFrames`, `applyFpsPresetToAllFrames`, `syncGlobalDurationControl`, `updateStagingPreview`, `updateSyncFieldVisibility`.

**Concern clusters (approx. line spans):**

| Cluster | ~lines | Methods / helpers |
| ------- | ------ | ----------------- |
| Bind / DOM wiring | ~86–191 | `bind` |
| Lifecycle (reset/hydrate/open) | ~197–276 | `open`, `reset`, `hydrate`, `#applyHydratedClip`, `#setFormDefaults` |
| Submit / API branching | ~281–391 | `submit`, `#readExtendedEditorFields` |
| Staging files + GIF | ~393–453 | `stageSelectedFiles`, `clearStagedFrames`, module `dataUrlToFile` / `readFilesAsDataURLs` |
| Clip-ID generation | ~455–473 | `refreshGeneratedClipId`, `resetUploadClipId` |
| Chrome / bit-depth | ~475–498 | `updateEditorChrome`, `updateBitDepthVisibility` |
| File list + frames UI | ~500–538 | `renderFileList`, `updateClipFrames` |
| Global duration / FPS | ~544–620 | `applyGlobalDurationToAllFrames`, `applyFpsPresetToAllFrames`, `syncGlobalDurationControl` |
| Sync + preview | ~622–726 | `updateStagingPreview`, `updateSyncFieldVisibility`, `#populateSyncLengthOptions`, `#previewDurationsMs`, `#readSyncFieldsFromDom` |

**Verdict:** Do **not** extract a second controller class yet. Growth is coherent (one panel’s staging + save). Pure helpers for sync/FPS/clip-id already live in `syncTiming.js`, `frameTiming.js`, `generateClipId.js`, `editorMeta.js`.

**Suggested changes (prefer delete/merge):**

1. **Delete** the redundant `#file-list` / `renderFileList` filename dump (`index.html` `#file-list`, `PageShell.scss` `.file-list*`) — superseded by `<clip-frames>`. Keep `updateClipFrames` + preview only.
2. **Merge** duplicated `'1 bar'` default (`ClipEditorController` `DEFAULT_SYNC_LENGTH` + `editorMeta.js` hydrate) into `shared/clipSchema.js` as `DEFAULT_SYNC_LENGTH`.
3. Optional later: extract pure “uniform duration / FPS select state” helpers from `syncGlobalDurationControl` only if that method keeps growing — not a new class.

---

### 2. Naming consistency (newer modules)

| Module | Form | Verdict |
| ------ | ---- | ------- |
| `syncTiming.js` | camelCase functions | Matches AGENTS.md (non-class module) |
| `shared/mappingLeaf.js` | camelCase functions | OK |
| `generateClipId.js` | camelCase functions | OK |
| `ClipNameInput.js` / `UserMessage.js` / `UserMessages.js` | PascalCase class files | OK |

**No rename needed** for PascalCase-vs-camelCase — newer modules follow the class-vs-helpers rule.

Minor: `editorMeta.js` exports `BIT_DEPTHS` while shared uses `VALID_BIT_DEPTHS` — **merge** name to `VALID_BIT_DEPTHS` and import from `clipSchema.js`.

---

### 3. Custom elements — tags & light DOM

All mainframe elements use light DOM (`replaceChildren` / append; no Shadow DOM). Newer ones match `ClipFrames` / `ClipFrame` patterns.

**`customElements.define` inventory:**

| Tag | Class | File |
| --- | ----- | ---- |
| `akvj-staging-preview` | `AkvjStagingPreview` | `StagingPreview.js` |
| `akvj-clip-list` | `AkvjClipList` | `ClipList.js` |
| `akvj-mapping-table` | `AkvjMappingTable` | `MappingTable.js` |
| `clip-frames` / `clip-frame` | `ClipFrames` / `ClipFrame` | matching files |
| `clip-name-input` | `ClipNameInput` | Task 135 |
| `user-messages` / `user-message` | `UserMessages` / `UserMessage` | Task 133 |
| `role-choices` / `role-choice` / `sort-choices` / `sort-choice` | … | Choice* |
| `project-chooser` | `ProjectChooser` | … |
| `piano-roll` / `piano-key` | … | … |
| `clip-instance` / `clip-category` | … | … |

**Problem:** Epic already flagged mixed `akvj-*` vs unprefixed. Newer elements (`clip-name-input`, `user-messages`, `user-message`) **worsened** the mix — they followed the unprefixed leaf style, not `akvj-staging-preview`.

**Suggested change:** Document one rule (recommend: `akvj-*` only for top-level app shells that appear once in the shell; unprefixed for reusable leaf widgets). Then either rename the three `akvj-*` shells to drop prefix, **or** leave tags as-is and stop adding `akvj-` — **do not** mass-rename unless a real collision appears. Prefer document + freeze over churn.

Also: no mainframe custom events set `composed: true` (code-standards ask for it). Pre-existing; only fix if/when Shadow DOM appears.

---

### 4. `mainframeState` / `messages` / `setStatus`

**Intentional split (still mostly valid):**

- `setStatus(el, msg, kind)` — inline progressive status on a panel’s `<p class="status">` (Loading… / Saving…).
- `messages.*` → `EVENT_USER_MESSAGE` → `<user-messages>` — modal outcomes (errors, save confirmation).

**Blur / debt (new since Task 133):**

| Location | Problem | Suggested change |
| -------- | ------- | ---------------- |
| `ClipEditorController` | Clears `#upload-status` then `messages.*` for every outcome; progressive text still via injected `setStatus` | Keep dual channel, but stop injecting `setStatus` if upload-status is only cleared — or use status only for in-progress and never leave stale text |
| `main.js` `/clip/edit/:clipId` catch | Hydrate failure uses `setStatus(upload-status, …)` while controller uses `messages.error` | Route hydrate failures through `messages.error` only |
| `main.js` `deleteClip` | Still uses `alert()` | Use `messages.error` (and keep `confirm` for destructive confirm) |
| Boot `Promise.all` catch | Writes API error to `upload-status` | Prefer `messages.error` |

**Dead / unused state:**

- `mainframeState.category` + `EVENT_CATEGORY_CHANGED` — never set in production (`main.js` never assigns). `ClipList.category` only exercised in tests. Piano “category” mode filters via `searchQuery`, not this event.
- **Suggested:** delete `category` / `EVENT_CATEGORY_CHANGED` from `mainframeState`, or wire piano → state → list if product still wants category filtering. Prefer delete if unused.

`messages` facade duplicating `mainframeState.error/warn/info` is thin sugar — fine; optional merge to only `mainframeState.*` later.

Do **not** turn panel `setStatus` into EventTarget unless multiple subscribers appear; current imperative panel status is fine.

---

### 5. `main.js` (~512 lines) — god-wiring?

Much better than pre-Task-125 (~1034). Remaining responsibilities: router tabs, library filters, mapping piano/table CRUD, projects CRUD, boot load, `setStatus` helper.

**Suggested extractions (only if it keeps growing):** merge-by-move into 2–3 files without new abstraction layers:

- `libraryPanel.js` — search/role/sort wiring + `loadLibrary` / `renderLibrary` / `deleteClip`
- `mappingPanel.js` — mapping piano + save/reload/pipeline
- `projectsPanel.js` — activate/create/rename/delete

Until then, leave as the app shell. Not a blocker.

---

### 6. `editorMeta.js` vs `clipSchema.js` defaults

**Problem:** `editorMeta.js` re-declares `DEFAULT_FRAME_WIDTH/HEIGHT`, `DEFAULT_SCALE_MODE`, `DEFAULT_PLAYBACK`, `DEFAULT_FRAME_RATE`, `DEFAULT_TRIGGER_TYPE`, and `BIT_DEPTHS = [1,2,4,8]` while `shared/clipSchema.js` already owns the same values as `VALID_BIT_DEPTHS`.

**Suggested change:** delete local constants in `editorMeta.js`; import from `./clipSchema.js` (re-export of shared). Keep only mapping functions (`editorValuesFromMeta`, `metaPatchFromEditor`, `optionalMetaFromEditor`, `parseFrameDurationBeats`) in `editorMeta.js`.

---

### 7. Server vs shared — new tangles?

**Healthy:**

- `server/index.js` stays thin (Task 124).
- `shared/mappingLeaf.js` used by `server/mappingService.js` + validate — good placement.
- Browser shims `src/js/clipSchema.js`, `frameTiming.js`, `frameFit.js` re-export shared.

**Cleanup (prefer merge):**

| File | Problem | Suggested change |
| ---- | ------- | ---------------- |
| `scripts/clips/lib/optimize.js` | Local `VALID_BIT_DEPTHS` Set duplicates shared | Import `VALID_BIT_DEPTHS` from `shared/clipSchema.js` |
| `shared/index.js` | Barrel incomplete (no sync constants, no `mappingLeaf`) and only used by `test/shared.test.js` | Either export the missing symbols, or **delete** the barrel and import modules directly in the test |
| `src/js/syncTiming.js` | Mirrors `akvj/.../clipMetadata.js` expand logic (intentional no cross-realm import) | Keep; add a thin parity test for preset→beats like `clipSchema.syncParity.test.js` if not already covered by `syncTiming.test.js` |

No new server↔browser circular imports found. `generateClipId.js` correctly stays browser-side and uses `shared/clipId.js`.

---

### Priority order (suggested slicing)

1. Delete dead `#file-list` / `renderFileList`; merge `editorMeta` defaults into `clipSchema`; fix `BIT_DEPTHS` → `VALID_BIT_DEPTHS`.
2. Delete or wire `mainframeState.category` / `EVENT_CATEGORY_CHANGED`.
3. Unify user feedback: hydrate/delete/boot errors → `messages.*`; keep panel `setStatus` for in-progress only.
4. Document custom-element tag prefix rule (no mass rename).
5. Optional: split `main.js` panel wiring; `optimize.js` bit-depth import; prune/fix `shared/index.js`.
6. **Defer** second `ClipEditorController` class split.
