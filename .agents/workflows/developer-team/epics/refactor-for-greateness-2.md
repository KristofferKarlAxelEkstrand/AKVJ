# Refactor for Greatness — Wave 2 (Follow-Up Review)

Status: draft / idea dump for Team Lead tasking. Not a monolithic PR — break into small slices.

This is the **follow-up** to [`refactor-for-greateness.md`](./refactor-for-greateness.md). Wave 1
landed most of its targets (see "What Wave 1 delivered" below). Wave 2 is a **fresh, whole-project
review** (akvj engine, mainframe, monorepo-scripts, tests/e2e, and — new this pass — root config,
data layout, docs, and git/CI state). **midi-mcp is intentionally out of scope** (the package has
been retired; see cross-cutting §C).

Same guardrails as Wave 1 apply:

1. No shared JS import between `akvj/` and `mainframe/` — the bridge is JSON/files only
   (`spec/goal.md`). **This still holds** (verified: zero runtime cross-imports).
2. Don't make on-disk clip JSON harder to hand-write (`spec/clip-schema.md`).
3. Prefer merging/deleting over new abstraction — net-shrink the surface.
4. Keep the 60fps hot path allocation-free.

---

## What Wave 1 delivered (verified done)

So we don't re-open finished work:

- **akvj:** `Clip.js` split into `ClipTiming` + `PlaybackController` (thin facade); `ProjectCatalog`
  extracted; `ClipLoader` load paths merged; `clipMetadata.js` normalization; `utils/timing.js`
  (`MS_PER_MINUTE`, `msPerBeat`); `MAX_MIDI_VELOCITY` / `TRIGGER_TYPES` centralized;
  `EVENT_CLIP_LOAD_ERROR`; effects DRY (`effectVariant.js`, mirror uses `transformCopy`, strobe uses
  `msPerBeat`); DebugOverlay CSS externalized; event-driven `LoadingOverlay`; removed `Clip.play()`
  and empty stubs. Plus new `UserMessages`/`UserMessage` modal stack.
- **mainframe:** `server/index.js` **804 → 59 lines** (M1 done: `routes/` + `handlers/` +
  `httpUtils.js`); `mappingService.js` (M2); legacy `<akvj-clip-editor>` retired (M4);
  `mainframe/shared/` layer with server/frontend re-export shims (M5); `shared/clipId.js` centralizes
  the clip-id regex (M6).
- **monorepo-scripts:** all of S1–S4 done (`lib/gitTrackedTextFiles.js` + `lib/report.js`, `main()`
  entries, `sort-package-json` decision documented + CI-wired, non-git guard).

Wave 2 items below are **new or still-open**.

---

## Priority 0 — The projects migration isn't durable in git (do first)

This is the biggest risk found and it's **not a code-quality nicety** — the Task 128 per-project
clip layout works on disk but **a fresh clone would break**. Highest priority.

### P0.1 Commit the migration; retire the flat pool in git

- `projects/` is **entirely untracked** (`git ls-files projects/` → 0 files) — a clone gets **no
  source clip data**.
- Legacy `clips/` is **still in the git index** (62 tracked files) but **deleted on disk** — index
  and working tree disagree.
- **Action:** Commit the `projects/` tree as the new source of truth; stage the deletion of tracked
  `clips/`; resolve the orphan `clips/t6gf/` (untracked) — move to `projects/default/clips/t6gf/` or
  delete if a stray test artifact.

### P0.2 Fix CI so it matches the new layout

- `.github/workflows/ci.yml` "Verify public clips generated" (lines ~62–71) checks
  `akvj/src/public/clips/clips.json` and `akvj/src/public/clips/set-mapping.json` — **both paths are
  obsolete** (`set-mapping.json` was renamed to `key-map.json`; `public/clips/` no longer exists).
  Pipeline now emits `akvj/src/public/projects/{id}/clips/`.
- **Action:** Point the verify step at `akvj/src/public/projects/default/clips/clips.json` +
  `.../key-map.json` + `akvj/src/public/active-project.json`, and the PNG check at the projects tree.
  `npm run clips:validate` already passes on the new layout, so CI is internally inconsistent today.

### P0.3 Fix `akvj/package.json` `build:full`

- `akvj/package.json` `build:full` = `npm run clips && vite build …`, but **`clips` isn't defined in
  the akvj workspace** — running it from `akvj/` fails. Root `build:full` works.
- **Action:** Remove the broken workspace-local `build:full` (canonical is root), or repoint it.

### P0.4 Generated-output git policy

- New generated output (`akvj/src/public/projects/`, `akvj/src/public/active-project.json`, root
  `active-project.json`) is **untracked and not gitignored**; only the old `/akvj/src/public/clips/`
  is in `.gitignore` (and `.prettierignore`).
- **Action:** Decide policy and apply consistently: gitignore generated public output (matching the
  old `public/clips/` treatment); commit only source (`projects/`, `projects/index.json`, root
  `active-project.json`). Update `.gitignore` + `.prettierignore`.

### P0.5 Vite HMR watches the wrong clip path

- `akvj/vite.config.js` reload plugin matches `/public/clips/`, but the pipeline writes
  `/public/projects/{id}/clips/` — **dev server won't auto-reload after a clip rebuild**.
- **Action:** Match `/public/projects/` (or both during transition).

---

## AKVJ engine (`akvj/src/`)

Healthy post-Wave-1. Remaining debt clusters in one god-element, event hygiene, and CE naming.

### A2-1. `AdventureKidVideoJockey.js` is the new god-module

One custom element owns canvas setup, clip loading, **project-switch orchestration**, MIDI
subscriptions, AppState mutations, and child UI construction.

- Extract a `ProjectSwitchCoordinator` (owns `#resolveProjectIdFromNote`, `#switchProject`,
  `#projectIndex`, and the AppState lifecycle writes). Leave the VJ element as canvas + render
  bootstrap.
- Consolidate the **triple `activeProjectId`** (held separately on `AdventureKidVideoJockey`,
  `AppState`, and `ProjectCatalog`) into a single source of truth on `AppState`; `ProjectCatalog`
  takes the id as a parameter.

### A2-2. AppState event hygiene (A3 from Wave 1 still partly open)

- `EVENT_PROJECT_SWITCH` is **still overloaded** — fires both the MIDI "switch requested" `{note}`
  and the "switch completed" `{projectId}`. Split into `projectSwitchRequested` / `projectChanged`.
- **Dead dispatched events** (no subscribers in `src/`): `EVENT_CLIPS_LOADED_CHANGED`,
  `EVENT_BPM_SOURCE_CHANGED`, `EVENT_MIDI_START/CONTINUE/STOP`, `EVENT_CLIP_LOAD_ERROR`. Either wire
  consumers (e.g. `DebugOverlay` for transport + BPM-source; the overlay currently only listens to
  `EVENT_BPM_CHANGED` so the "Source" line goes stale on clock timeout) or delete them.
- Replace the raw `appState.dispatchEvent(new CustomEvent(EVENT_CLIP_LOAD_ERROR, …))` in the VJ with
  a dedicated `AppState.dispatchClipLoadError(url, message)` for a single dispatch path.

### A2-3. Custom-element consistency

- **File/class/tag mismatch:** `LoadingOverlay.js` exports class `AkvjLoadingOverlay`, tag
  `akvj-loading-overlay`, imported as `LoadingOverlay`. Align to the PascalCase-for-class rule.
- **Tag prefixes are inconsistent:** `adventure-kid-video-jockey`, `akvj-loading-overlay`,
  `user-messages`/`user-message` (unprefixed). Pick and document one rule (Wave 1 M8 suggested
  `akvj-*` for app chrome) and apply it (`akvj-user-messages`, etc.). This is the **same rule** the
  mainframe pass needs (§B) — decide it once for the whole repo.
- **CE construction is imperative:** `new LoadingOverlay()` / `new UserMessages()` instead of
  `document.createElement(tag)`; declare stable UI hosts in `index.html` for predictable lifecycle
  and z-index (the modal host is currently nested inside the VJ element, not `body`).
- **`UserMessages` bypasses "custom-events-up":** it subscribes directly to the `appState` singleton
  rather than receiving events from a parent; child creation is `new UserMessage()` + manual
  `addEventListener` instead of `createElement` + event delegation. `UserMessage`'s `dismiss` event
  lacks `composed: true`.
- **Duplicated message-type sets:** `MESSAGE_TYPES` (UserMessage) vs `USER_MESSAGE_TYPES` (AppState)
  — same values, two places. Export one.

### A2-4. Small modularity / naming cleanups

- **Dead `displayContext` chain:** `ClipLoader` stores/passes `#displayContext` into `Clip`, which
  explicitly ignores it (`displayContext: _displayContext`). Remove from both (and from the tests
  that still pass it).
- **Duplicated `#loadJson()`** in `ClipLoader` and `ProjectCatalog` (identical fetch + cache-bust) —
  extract one `fetchJson(url)`; delete the `ClipLoader` passthrough methods that only delegate to
  `ProjectCatalog`.
- **Dead API:** `PlaybackController.finish()` / `clearFinished()` have no callers.
- **`settings.js`:** `mergeProjectSettings()` still exported-but-unused; `effectParams` duplicated
  verbatim under `projectDefaults.effectParams`. Wire it into project switch or delete + dedupe.
- **`handlesChannel()`** on `MaskManager`/`EffectsManager` is test-only — adopt it in routing or drop.
- **Duplicate id regex:** `CLIP_ID_PATTERN` (ClipLoader) and `PROJECT_ID_PATTERN` (ProjectCatalog)
  are identical — one `SAFE_ID_PATTERN`.
- **Scattered constants:** `'scrub'` literal (no exported `PLAYBACK_MODES.SCRUB`); canvas `240×135`
  in `settings.js` vs `DEFAULT_FRAME_WIDTH/HEIGHT` in `clipMetadata.js` — have schema defaults import
  from one source so they can't drift.
- **Hot-path allocation:** `glitchEffect.js` can `new Uint8ClampedArray(pixels.length)` per frame if
  the scratch buffer is undersized — guarantee sizing in the pipeline or skip rather than allocate.

---

## Mainframe (`mainframe/`)

Wave 1 structural wins held (`server/index.js` 59 lines). The debt moved **downstream** into the
extracted controller and the frontend orchestrator, plus a few layering/P0-clip-format leftovers.

### B1. New god-modules after the split

- **`src/js/ClipEditorController.js` (~862 lines)** — the M3 extract absorbed too much: staging,
  hydrate, submit branching, DOM wiring, preview sync, GIF expand, form I/O. Split into
  `ClipEditorStaging` / `ClipEditorHydrator` / `ClipEditorSubmit` with the controller as a thin
  coordinator (or finish M3 by promoting the upload panel to `<akvj-clip-editor-panel>`).
- **`src/main.js` (~512 lines)** — down from 1034 but still owns library filters, mapping CRUD,
  projects, router, piano-roll wiring. Extract `MappingPanelController` + `ProjectsPanelController`
  (or custom elements that bubble `mappingchange`/`mappingsave`) so `main.js` is router + state
  subscriptions only.
- **`server/spritesheet.js` (~394 lines)** — **M7 still open:** three near-identical resolution
  blocks in `createClipFromFrames` / `recompileClip` / `updateClipFromFrames`. Extract
  `resolveCompileOptions(meta, overrides)`.
- **`server/handlers/clips.js` (~335 lines)** — mixes catalog listing, legacy flat `/api/mapping`,
  sprite serve, frame load/put, meta PUT, delete, recompile. Split by responsibility.

### B2. Layering: pipeline and server import each other's trees

- `scripts/clips/lib/validateMapping.js` imports from `../../../server/mappingService.js` — **the
  build pipeline depends on the HTTP server tree.** And `server/spritesheet.js` imports
  `../scripts/clips/lib/spritesheet-core.js` — **server depends on the CLI tree.**
- **Action:** Move `mappingService.js` and `spritesheet-core.js` into `mainframe/shared/` (the
  pattern M5 established) and import from both sides. Still within mainframe — no cross-realm breach.

### B3. Finish the P0 clip-format items from Wave 1

- **Validation still mutates:** `validate/index.js` `resolvePngPath` silently rewrites `meta.png`
  during a scan; the `--fix` flag referenced in warnings **doesn't exist anywhere**. Make validation
  report-only; add a real `--fix`/migrate step.
- **CLI spritesheet default drift (0.1):** `scripts/clips/spritesheet.js` defaults `framesPerRow: 8`
  while the server path caps at `MAX_FRAMES_PER_ROW = 16` — clips built via CLI vs API differ. Use
  the shared default.
- **Schema constants still duplicated (0.3):** `src/js/editorMeta.js` re-declares
  `DEFAULT_FRAME_WIDTH/HEIGHT`, `DEFAULT_PLAYBACK`, `BIT_DEPTHS` that already live in
  `shared/clipSchema.js`. Import, don't redefine. Also `validate/meta.js` hardcodes the scale-mode
  list `['fit','cover','stretch','none']` and **rejects `'pattern'`** which `shared/frameFit.js`
  allows — import `SCALE_MODES`.
- **Slugify diverges:** `src/js/generateClipId.js` (NFD/diacritics) vs `server/paths.js` `slugifyId`
  (simpler) produce different ids for non-ASCII names. One `slugifyPathSegment` in `shared/`.
- Add a **hand-written `meta.json` → save → identical output** round-trip test (0.4).

### B4. Naming (files vs classes; events)

- File/class mismatches: `ClipList.js`→`AkvjClipList`, `MappingTable.js`→`AkvjMappingTable`,
  `StagingPreview.js`→`AkvjStagingPreview`. Rename files or classes so they match.
- `apiClient.js` exports a generic `api` — rename to `mainframeApi`/`fetchMainframeJson`.
- Event naming is split-brain: state bus uses camelCase past-tense (`clipsChanged`), DOM events use
  lowercase-no-separator (`clipedit`, `mappingremove`, `rolechange`). Pick one convention and put the
  names in a `mainframeEvents.js` constants module.
- `server/health.test.js` doesn't test health — it tests `isValidClipId` / path safety. Rename to
  `paths.security.test.js` and move to `test/` (also Wave 1 M8).

### B5. Custom elements + events

- **Tag prefix rule (M8) still open** — same decision as A2-3; apply repo-wide.
- **No `composed: true` anywhere** in `mainframe/src` custom events, though `code-standards.md`
  requires `{ bubbles: true, composed: true }` for upward events (mechanical pass across
  `ClipInstance`, `MappingTable`, `ChoiceList`, `PianoRoll`, …).
- `ClipEditorController.bind()` registers many `document`/form listeners with **no `unbind()`/
  `destroy()`** — adopt the `AbortController` pattern already used in `ClipNameInput`.
- Imperative wiring that should be events: controller takes injected `setStatus`/`onLibraryChanged`
  callbacks; the mapping panel is entirely click-driven in `main.js`; `PianoRoll` rebuilds its own
  `<ul>` clip list instead of reusing `<clip-instance>`. Module-global singletons (`let clipEditor`,
  the `mainframeState` default export) block testability — inject `mainframeState` into the
  controller.
- **Good patterns to preserve:** `ClipList`→`ClipInstance` bubbling; `ChoiceList`/`ChoiceItem`
  two-tier `*changerequest`→`*change`; `ProjectChooser` events; user-messages via state subscription.

### B6. Dead / latent code

- `clipsaved` event: listened for in `main.js` and documented on `ClipInstance` (`@fires clipsaved`)
  but **never dispatched**.
- Category filter is wired in `mainframeState` + `ClipList` but **never connected** in `main.js`.
- Legacy flat `/api/mapping` routes duplicate the per-project key-map API and are still documented in
  `mainframe/README.md` — deprecate/remove.
- Deprecated import-time path snapshots in `server/paths.js` (`CLIPS_DIR`, `KEY_MAP_PATH`,
  `RAW_ASSETS_DIR`) go stale when the active project changes; only `health.test.js` uses them.

---

## Monorepo scripts + Tests (`monorepo-scripts/`, `test/`, `e2e/`)

S1–S4 are done. Remaining is polish + a real **test-coverage gap** around the Wave 1 extractions.

### T1. Coverage gaps for the new akvj modules (highest value here)

The Wave 1 refactor extracted logic into modules that have **no direct unit tests**:

- **`ClipTiming.js`** — no test file; BPM/clock logic only exercised indirectly through
  `Clip.test.js` against the global `appState` singleton. Add `ClipTiming.test.js` using the
  **injected** `bpmProvider`/`clockSource` (the whole point of Wave 1's injection) — FPS intervals,
  beat arrays, clock-pulse counting, unsubscribe on destroy, no global reset.
- **`PlaybackController.js`** — no test file; only `once`/`loop`/`shuffle` are covered (via Clip).
  `pingpong`, `random`, `reverse`, and `scrub`/`setScrubPosition` clamping are **untested** in akvj.
- **`ProjectCatalog.js`** — zero coverage; `ClipLoader.test.js` never calls
  `setupClipsFromProject()` nor injects a mock catalog.
- **`ClipEditorController` submit path** — tests cover nav/staging/hydrate but **not** the
  create-vs-meta-PUT-vs-frames-PUT branching or error handling (the critical path).

### T2. Test organization / duplication

- Orphan `mainframe/server/health.test.js` uses `node:test` (excluded from Vitest) and duplicates
  `paths.test.js` — merge + delete (ties to B4).
- Empty root `test/fixtures/` — remove or document.
- Smoke helpers (`pollUrl`/`killProcess`/…) are duplicated across ~3–4 `*/smoke/*.test.js` — extract
  a shared `test/smoke/lib/pollServer.js` (test infra, not a cross-realm package import). Also: the
  smoke files use a misleading `.test.js` suffix but aren't Vitest tests — rename to `*.smoke.js`.
- Duplicate `createMockClip` (`integration.test.js`, `LayerGroup.test.js`) and mock-2D-context
  factories (`Clip.test.js` vs `utils/rendererFixture.js`) — consolidate into `test/utils/`.
- `akvj/test/integration.test.js` opens with a `LayerGroup` `describe` that duplicates
  `LayerGroup.test.js` — rename to `layerPipeline.test.js` and keep only cross-module cases.
- Near-duplicate `UserMessages.test.js` in both realms — extract a parameterized DOM-behavior helper
  called with each realm's bus adapter.

### T3. E2E flakiness / staleness

- `e2e/mainframe.spec.js` still expects the **removed inline** `.clip-edit-form`; production now
  routes to the `ClipEditorController`. Rewrite to assert the `/clip/edit/{id}` URL + upload-panel
  fields.
- Fixed `waitForTimeout(1000)` sleeps (akvj + mainframe specs) — replace with DOM/poll waits.
- Conditional `if (itemCount > 0)` blocks pass vacuously on an empty library — seed a known fixture
  or `test.skip`.
- `e2e/akvj.spec.js` hardcodes `http://127.0.0.1:8888` while the config `baseURL` is `:9999` — use
  Playwright projects with per-project `baseURL`.

### T4. monorepo-scripts polish

- No unit tests for `sortPackageJson()` (exported) or the git-guard branch — add one small test.
- `check-utf8.js` hand-rolls its failure report (two separate blocks) instead of the shared
  `failWithOffenders`/`report.js` — unify.
- Duplicate npm script alias (`sort-package-json` vs `format:sort-package-json`) — drop one.
- Root `test` = akvj only while `test:all` runs both (CI uses `test:all`); `test:ci` is akvj-only
  despite the name. Align names so `npm test` at root isn't misleading.

---

## Cross-cutting config & docs (§C)

Beyond the P0 git/CI items, there's broad **doc drift** to the pre–Task 128 layout, plus references
to **removed tooling**.

### C1. midi-mcp is retired but still referenced

`AGENTS.md` documents a `midi-mcp/` workspace + `npm run midi:extract`; `knip.json` defines a
`midi-mcp` workspace; `eslint.config.js` ignores `midi-mcp/**`; the lockfile marks it extraneous.
The directory is gone and `.agents/workflows/README.md` says it's retired. **Purge** the references
(AGENTS.md section, knip block, eslint ignores; `npm install` to clean the lockfile).

### C2. Husky/lint-staged documented but removed (Task 33)

README, CONTRIBUTING, and AGENTS.md all claim a Husky pre-commit hook running lint-staged. There's no
`.husky/`, no `prepare` script, no dependency. Remove the claims (note `.vscode` format-on-save
instead).

### C3. Doc sweep to the projects layout

README (Clip System, File Structure, Contributing, License), CONTRIBUTING (clip paths, Node 18→20,
key-files missing the `akvj/` prefix), AGENTS.md (Security & Boundaries + Troubleshooting still point
at `akvj/src/public/clips/`), `docs/how-to-program-midi.md` (flat `clips/` paths, **channel 14 wrongly
listed as reserved** — it's project selection per PROJECT-SPECIFICATION.md), and
`projects/default/README.md` (`public/clips/` output path) all describe the old flat pool. Also a dead
`npm run migrate:clips` in README + a validate error message. Do a single consistency sweep against
`PROJECT-SPECIFICATION.md` (which is correct). Update the agent-skill reference
(`agent-agnostic-setup/references/agents-md-guide.md`) and this epic family's own stale bridge line
(Wave 1 line ~16 still says the bridge is `clips/`; `goal.md` now says `projects/{id}/clips/`).

### C4. Config polish

- Root and akvj `package.json` **share the name `akvj`** — rename root to `akvj-monorepo`.
- Vite version skew (`akvj` `^8.1.4` vs `mainframe` `^8.1.5`) — align.
- `knip.json` scans a non-existent `akvj/scripts/**`.
- Duplicate `clips:*` scripts in root and mainframe `package.json` (drift risk) — keep root as the
  documented entry.
- `.vscode/settings.json` comment references a nonexistent `npm run themes`.
- Stray/partial `akvj/src/public/projects/default/key-map.json` (47 bytes) not produced by the
  pipeline — delete. Document: edit `projects/{id}/key-map.json`; runtime reads `.../clips/key-map.json`.

### C5. Boundaries (healthy — keep)

The akvj↔mainframe JSON-only rule holds (no cross-imports). `mainframe/shared/` is a valid
in-realm consolidation. Document the intentional couplings: pipeline hardcodes repo paths while
`server/paths.js` supports `AKVJ_*` env overrides (align the CLI, or at least document); and
`npm run mainframe` runs `clips:watch`, which writes into `akvj/src/public/projects/` — note this in
the README dev section.

---

## Cross-cutting themes (the "why")

1. **The migration is done in code but not in git/CI/docs.** The single highest-value action is to
   land Task 128 durably: commit `projects/`, retire `clips/`, fix CI, sweep docs. Everything else is
   secondary to a clone that builds.
2. **God-modules moved, they didn't disappear.** `AdventureKidVideoJockey`, `ClipEditorController`,
   `src/main.js`, `server/spritesheet.js` are the new big ones — keep extracting by responsibility.
3. **Event hygiene is the recurring code smell.** Overloaded/dead events, missing `composed: true`,
   imperative wiring where a subscription belongs, and multiple owners of the same state
   (`activeProjectId`). Decide the event conventions once and apply per realm.
4. **Custom-element naming needs one rule for the whole repo** (file=class, tag prefix). It's flagged
   in both akvj and mainframe — decide it once.
5. **Test the Wave 1 extractions.** `ClipTiming`/`PlaybackController`/`ProjectCatalog` were split out
   *for* testability but still lack direct tests; the injection seams exist and are unused.
6. **Delete before abstract** (still): dead `displayContext`, `clipsaved`, category filter,
   `PlaybackController.finish`, deprecated path snapshots, legacy `/api/mapping`.

---

## Suggested slicing (for Team Lead)

Ordered so a clone builds first, then structure, then polish:

1. **P0 — Land the migration:** commit `projects/`, remove tracked `clips/`, fix CI verify step, fix
   `akvj/build:full`, set generated-output gitignore policy, fix Vite HMR path. (§P0)
2. **Doc + tooling truth-up:** purge midi-mcp + Husky references; sweep README/CONTRIBUTING/AGENTS/
   how-to-program-midi to the projects layout; config polish. (§C1–C4)
3. **Finish Wave 1 P0 clip-format:** stop validate-time mutation + real `--fix`; CLI `framesPerRow`
   default; `editorMeta` imports schema constants; one slugify + one scale-mode list; round-trip
   test. (§B3)
4. **Layering:** move `mappingService` + `spritesheet-core` to `mainframe/shared/`; M7
   `resolveCompileOptions`. (§B2, B1)
5. **akvj event hygiene + project-switch extract:** split `EVENT_PROJECT_SWITCH`, prune/wire dead
   events, single `activeProjectId` owner, `ProjectSwitchCoordinator`. (§A2-1, A2-2)
6. **Custom-element pass (repo-wide):** one naming/prefix rule, file↔class renames, `composed: true`,
   `createElement` + event delegation, controller `destroy()`. (§A2-3, B4, B5)
7. **Test coverage for Wave 1 extractions:** `ClipTiming`, `PlaybackController`, `ProjectCatalog`,
   `ClipEditorController` submit. (§T1)
8. **Test/e2e cleanup:** helper dedup, smoke rename, stale E2E rewrite, remove fixed sleeps. (§T2, T3)
9. **Frontend orchestrator split:** `MappingPanelController` / `ProjectsPanelController` out of
   `main.js`; controller decomposition. (§B1)
10. **Dead-code sweep + monorepo-scripts polish.** (§B6, A2-4, T4)

Each slice is independently shippable and testable. Land 1–2 before anything else — the repo doesn't
clone-and-build cleanly until the migration is committed and CI is fixed.

## Explicitly out of scope

- midi-mcp (retired).
- On-disk clip JSON changes that hurt hand-editability (`clip-schema.md`).
- Any shared JS import between `akvj` and `mainframe` (`goal.md`).
- New features (timing & sync, per-image scale, clip editor UX) — those ride on the cleaned base and
  have their own specs.
- Changing 60fps render behavior; refactors there stay perf-neutral.
