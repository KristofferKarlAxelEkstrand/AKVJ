# Draft: Refactor for Greatness — Technical Cleanup Across `akvj`, `mainframe`, `monorepo-scripts`

Status: **all 9 suggested slices implemented and QA-approved** (Tasks 119–127 — clip-format
core, akvj constants/dead-code, `Clip.js` split, `ClipLoader` merge, mainframe shared module,
`server/index.js` split, `ClipEditorController` extraction, effects DRY/MIDI/loading-overlay,
monorepo-scripts `lib/`). This document is kept as a record of what was done and the
reasoning behind it — do not re-propose these items in a fresh audit; check the "Suggested
slicing" section below against `tasks/done/` before flagging something as new.

This is a **technical** refactor pass (naming, structure, duplication, coupling). It deliberately does **not** add features. It exists to make the upcoming feature work (Projects, unified clip editor, MIDI-clock hardening) land on a clean base.

## Alignment with the spec

Grounded in `spec/` so we refactor toward the stated vision, not away from it:

- **`goal.md`** — Keep `akvj` and `mainframe` strictly decoupled. The only bridge is the `clips/` directory + JSON. **They must never share JS module imports.** Also: the **clip format is the backbone** and matters more right now than Projects; get it solid and testable first, and start testing what exists rather than adding scope.
- **`clip-schema.md`** — Human-first (KISS). Any change that makes `meta.json` harder to hand-write is a bad change. Same format read/written by human, `mainframe`, and `akvj`.
- **`code-standards.md`** — SRP + SLAP (not arbitrary line limits), event-driven decoupling via `EventTarget`, custom-events-up, `#private` fields, magic numbers → named constants, descriptive domain naming.
- **`aesthetics.md`** — `akvj` = zero UI, pixel-perfect, hot path stays lean. `mainframe` = minimal, functional.

**Refactor guardrails from the above (apply to every item below):**

1. Do not introduce a shared JS import between `akvj/` and `mainframe/`. Shared logic is duplicated intentionally or lives in each realm; the bridge stays JSON-only.
2. Do not touch the on-disk clip JSON shape to make it "cleaner for code." Human-first wins.
3. Prefer merging/deleting code over adding abstraction. This pass should shrink the surface area.
4. Keep the 60fps hot path (`Renderer` → `Compositor` → effects, `Clip` per-frame) allocation-free; refactors there must preserve current perf discipline.

---

## Priority 0 — Clip format is the backbone (do first)

Per `goal.md`, the clip format matters most. Today the "format" logic is smeared across many files with subtle divergences. Consolidate the **reading/normalizing/validating** of clip metadata so there is exactly one behavior per realm.

### 0.1 Two spritesheet builders have already drifted

- `mainframe/server/spritesheet.js` (API ingest: scale modes, raw assets, `framesPerRow = min(n, 16)`) vs `mainframe/scripts/clips/spritesheet.js` (CLI, default `framesPerRow = 8`, no scale modes).
- Same conceptual operation, two implementations, **different defaults** → clips built via CLI vs API can differ.
- Action: extract one compositing/spritesheet lib **inside `mainframe`** (e.g. `mainframe/scripts/clips/lib/spritesheet-core.js` or `mainframe/shared/`), used by both server and CLI. Pick one default for `framesPerRow` and document it. (Stays inside `mainframe` — no cross-realm import.)

### 0.2 Legacy metadata normalization duplicated

- `frames ?? numberOfFrames` and `playback ?? (loop === false ? 'once' : 'loop')` appear in `akvj/src/js/visuals/ClipLoader.js`, `akvj/src/js/tools/clip-preview/ClipPreview.js`, and again as a mutation in `mainframe/scripts/clips/lib/validate/meta.js`.
- Action (akvj side): one `normalizeClipMetadata(meta)` in `akvj` shared by `ClipLoader` and `ClipPreview`.
- Action (mainframe side): `validate/meta.js` should **not mutate** source meta during validation (it currently rewrites `loop` → `playback` and deletes `loop`). Validation reports; a separate explicit `migrate` step (or `--fix`) rewrites. Silent rewrite-during-validate is surprising and violates SRP.

### 0.3 Clip-schema field defaults scattered

- `240 × 135`, `scaleMode: 'fit'`, playback-mode lists live in: `settings.js`, `server/spritesheet.js`, `src/js/editorMeta.js`, `index.html`, and inline `main.js` fallbacks; `PLAYBACK_MODES` is defined twice in the frontend (`ClipEditor.js` and `StagingPreview.js`, different order).
- Action: one clip-schema constants module per realm (e.g. `mainframe/src/js/clipSchema.js`, and reuse `akvj/settings.js` for the engine). Same values, defined once per side. Do not create a cross-realm shared import — mirror the constants and add a test asserting they match the schema doc.

### 0.4 Get the format under test

Per the user's "start testing what exists": once normalization is centralized, add round-trip tests — hand-written `meta.json` → load → save → identical human-readable output (KISS invariant from `clip-schema.md`).

---

## AKVJ engine (`akvj/src/`)

Overall healthy and clearly performance-conscious. The refactor targets are a few god-classes, some latent/dead API, and constant/duplication cleanup. Full file-by-file audit: [akvj audit](d38c9d9b-8625-4274-8497-8532f8c699a3).

### A1. `Clip.js` (~493 lines) — split responsibilities

God-class: constructor validation + FPS timing + BPM sync + per-clip clock subscription + 7 playback modes + scrub + render + destroy, plus hard coupling to the `appState` singleton (reads `appState.bpm` every frame interval).

- Extract a `ClipTiming` (FPS/BPM/clock → next-frame interval) and a `PlaybackController` (the 7-mode advance switch). Keep `Clip` a thin render facade.
- Inject BPM/clock into `Clip` (constructor/factory param) instead of reaching for the global singleton — makes it testable without resetting global state.
- Public fields `triggerType` / `triggerGroup` break the `#private` convention used elsewhere — make private with accessors.
- Remove dead `play()` method and its only-consumer `#displayContext` (production uses `renderToContext()` only).

### A2. `ClipLoader.js` (~389 lines) — merge duplicate setup paths

- `setupClips()` and `setupClipsFromProject()` differ only in key-map URL resolution — collapse into one `#loadClipsFromKeyMap(url)`.
- Consider a small `ProjectCatalog` helper (`fetchActiveProjectId`, `fetchProjectsIndex`, `buildProjectKeyMapUrl`) so loader focuses on load, not project resolution. (Aligns with the Projects direction in `goal.md`.)

### A3. `AppState.js` (~418 lines) — trim latent API, fix overloaded event

- Many exported events have **zero subscribers** in `src/`: `EVENT_CLIPS_LOADED_CHANGED`, `EVENT_BPM_SOURCE_CHANGED`, `EVENT_MIDI_START/CONTINUE/STOP`, `EVENT_VIDEO_JOCKEY_READY`, `EVENT_PROJECT_LOAD_*`. Either wire them (see A5) or delete — dead event surface is maintenance debt.
- `EVENT_PROJECT_SWITCH` is **overloaded**: it fires both the MIDI "switch requested" (`{note}`) and the "switch completed" (`{projectId}`). Split into `projectSwitchRequested` / `projectChanged`. This matters because Projects are coming and this event will get more consumers.

### A4. Centralize constants (magic numbers)

- `MS_PER_MINUTE = 60000` is redefined in `Clip.js`, `strobeEffect.js`, `AppState.js`.
- MIDI max `127` is a literal in `LayerManager.js` (`value / 127`) and `AppState.js`, while `effects/effectConstants.js` already exports `MAX_MIDI_VELOCITY`.
- Trigger strings `'latch' | 'one-shot' | 'momentary'` are literals in `LayerGroup.js`.
- `clipLoadError` is a raw event string in `AdventureKidVideoJockey.js`, inconsistent with the `AppState` event catalog.
- Action: `akvj/src/js/utils/timing.js` (`MS_PER_MINUTE`, ms/beat helper), import `MAX_MIDI_VELOCITY` everywhere, a `TRIGGER_TYPES` enum, and move `clipLoadError` into the `AppState` event constants.

### A5. Unify MIDI routing + wire project/load lifecycle to UI

- Note events route through `AdventureKidVideoJockey`, but CC scrub is a **separate** `AppState` subscription inside `LayerManager` — two routing paths. Unify under one subscription point.
- `LoadingOverlay.setProgress()` and the `PROJECT_LOAD_*` events exist but the overlay is driven imperatively and progress is cosmetic-only. Let the overlay **subscribe** to project-load events (event-driven per `code-standards.md`) instead of imperative show/hide in the VJ element.

### A6. Effects DRY (low risk)

- The variant A/B branch (`noteInRange < effectVariantThreshold ? ...`) is copy-pasted across `colorEffect`, `mirrorEffect`, `splitEffect`, `offsetEffect` → extract `getEffectVariant(note, range, threshold)`.
- `mirrorEffect.js` hand-rolls pixel copy loops while `split`/`offset` already use `pixelUtils.transformCopy` — migrate mirror to it.
- `strobeEffect.js` has its own `MS_PER_MINUTE` + BPM-beat math parallel to `Clip` — share via A4's timing util.

### A7. Small cleanups

- `settings.js`: `effectParams` is duplicated verbatim under `projectDefaults.effectParams`; and `mergeProjectSettings()` is exported but never called — wire into project switch or defer/delete.
- Empty stub `#teardownProjectEventListeners()` in `AdventureKidVideoJockey.js` — remove or implement.
- `handlesChannel()` on `MaskManager`/`EffectsManager` is used by tests only, not the router chain — decide: adopt it in routing or drop it.
- `DebugOverlay.js` holds ~50 lines of inline CSS — move to a CSS file like `LoadingOverlay` (keeps `akvj` "zero UI in the render path" tidy; debug overlay is dev-only).
- `tools/clip-preview/ClipPreview.js` re-implements clip timing/normalization with its own constants — fold onto the shared `akvj` normalization from 0.2.

---

## Mainframe (`mainframe/`)

Product direction (unified clip editor via routing; create + edit share one surface) is **already correct** and matches `spec/feature-edit-clip.md` + `spec/clip-upload-edit-feature.md`. The debt is **god modules** and **domain logic duplicated across server / pipeline / frontend**. Full audit: [mainframe audit](77f9f7d2-6a87-4dca-a53b-025632dad7fc).

### M1. `server/index.js` (~804 lines) — split the god file

Holds HTTP plumbing, routing, clip catalog logic, key-map flatten/nest/validate, and ~20 route handlers.

- Extract `server/routes/` (or `handlers/`) + a thin `createMainframeServer()`.
- Shared `server/httpUtils.js` for `readBody`, `sendJson`, `applyCors`, `MAX_BODY_BYTES`.
- `handlePostClips` and `handlePutClipFrames` share ~15-field body destructuring + base64 decode → `parseClipFramesBody(body)` + `decodeFrameDataUrls(frames)`.
- `handlePutMapping` has no try/catch (bubbles to 500) while the project key-map PUT returns 400 — make error handling symmetric.

### M2. One mapping service (three implementations today)

`writeMapping()` (server, flat array) + `handlePutProjectKeyMap()` (server, nested) + `scripts/clips/lib/validateMapping.js` (pipeline, nested read) each validate/flatten/nest key-maps separately.

- Extract `server/mappingService.js` (validate + flatten + nest) used by both server write paths; reconcile with the pipeline validator so the rules live in one place per realm. This is on the critical path for Projects (per-project key-maps).

### M3. `src/main.js` (~1034 lines) — extract the clip editor controller

Router + library + mapping + projects + upload staging + GIF expand + frame reorder + submit branching all live here. Staging state is module globals (`stagedFiles`, `stagedDurationsMs`, `stagedFrameUrls`, `framesDirty`, `loadedFrameWidth`…), untestable without loading all of `main.js`.

- Extract `ClipEditorController.js` (or a `<akvj-clip-editor-panel>` custom element) owning staging state, hydrate (`hydrateClipEditor`), and submit (create vs meta-only-PUT vs frames-PUT). `main.js` becomes router → controller wiring only.
- This directly serves `feature-edit-clip.md` §"Implementation notes" (URL-driven hydrate/reset, one editor surface).

### M4. Retire legacy `<akvj-clip-editor>`

`ClipEditor.js` (~347 lines) is explicitly legacy (metadata-only form, "kept for unit tests"); `ClipList.attachEditForm()` references it but is unused in production. It also re-implements `frameRatesForFrames` / `frameDurationBeats` JSON validation that overlaps `editorMeta.js` and the pipeline validator.

- Migrate the tests onto the shared editor path, then delete the legacy component + `attachEditForm`. Removes a whole duplicate validation surface.

### M5. Server ↔ frontend import layering (watch the realm boundary)

Server imports frontend `src/` today: `server/index.js` → `src/js/frameTiming.js`; `server/spritesheet.js` → `frameFit.js`; `frameLoad.js`/`gifExpand.js` → `frameTiming.js`.

- This is **within** `mainframe` so it does not violate the `goal.md` akvj↔mainframe rule, but it couples the Node server to the browser bundle tree. Move `frameTiming` / `frameFit` / clip-id patterns / playback enums to `mainframe/shared/` imported by both server and `src/`. Keep it inside `mainframe`.

### M6. De-duplicate `clipId` / `pngName` patterns and clip-id validation

`CLIP_ID_PATTERN` (`/^[a-zA-Z0-9][a-zA-Z0-9_-]*$/`) is copy-pasted in ≥6 places (`server/paths.js`, `src/js/clipEditorRoute.js`, `scripts/clips/new.js`, `validate/index.js`, `validateMapping.js`, `generate.js`); `SAFE_PNG_NAME` exists in both `server/index.js` and `paths.js` (only `paths.js` used).

- One source for these per realm (the `mainframe/shared/` from M5). The spec (`clip-upload-edit-feature.md` §1) wants a plain, path-safe unique id — centralizing the regex makes "reject empties/dupes" consistent.

### M7. `server/spritesheet.js` triplicated resolution block

Target-size / scale-mode / frame-rate resolution is copy-pasted across `createClipFromFrames`, `updateClipFromFrames`, `recompileClip` (three near-identical blocks). Extract `resolveCompileOptions(meta, overrides)`. Ties into 0.1.

### M8. Small placement/consistency

- Custom-element tag prefixes are mixed: `akvj-clip-list`, `akvj-mapping-table`, `akvj-staging-preview` vs `clip-frames`, `clip-instance`, `piano-roll`, `project-chooser`. Pick one rule and apply it (recommend `akvj-*` for app-level, unprefixed for generic leaf items — but document the rule either way).
- `server/health.test.js` sits in `server/` while every other test is in `test/` — relocate.
- Pipeline CLI (`scripts/clips/index.js`) hardcodes repo paths and lacks the `AKVJ_CLIPS_DIR` env override that `server/paths.js` supports — align configurability.

---

## Monorepo scripts (`monorepo-scripts/`)

Small and mostly fine (3 files, ~221 lines, all wired in root `package.json`; EOL + UTF-8 run in CI). Full audit: [monorepo-scripts audit](9ce4e5a2-79e5-40e7-98f0-75c5de121813).

### S1. Extract shared git-file discovery

`getTrackedTextFiles()` (`git grep -Il ""` → list) is byte-for-byte duplicated in `check-line-endings.js` and `check-utf8.js`, along with the `--fix` flag parse and the offender-list + `exit(1)` reporting.

- Add `monorepo-scripts/lib/gitTrackedTextFiles.js` (+ optional `lib/report.js`). This mirrors the `mainframe/scripts/clips/lib/` pattern the repo already uses. No `package.json` needed (built-ins only); the dir intentionally isn't a workspace.

### S2. Consistent entry structure

`sort-package-json.js` runs at top-level import time; the other two use a `main()` wrapper. Wrap it in `main()` for consistency and to allow a future `--check`/`--dry-run`.

### S3. Decide `sort-package-json`'s fate

It diverges from its original task spec (task 72 asked for the npm `sort-package-json` package + `format:sort-package-json` in the format pipeline + CI). Today it's a custom 3-field sorter, not in CI or the format flow. Either: (a) adopt the npm tool and delete the custom sorter, or (b) keep custom, wire it into CI/format, and document the reduced field order. Don't leave it half-way.

### S4. Minor

- `check-utf8.js` has an unreachable final success `console.log` (line ~88; earlier returns cover the success path) — remove.
- Neither check guards against running outside a git repo (`git grep` failure) — add a friendly error.

---

## Cross-cutting themes (the "why" behind most items)

1. **One definition per concept, per realm.** Clip-id regex, `MS_PER_MINUTE`, MIDI `127`, default `240×135`, playback modes, spritesheet compositing, mapping validation each exist in 2–6 places. Centralize **within each realm** (never a cross-realm import — `goal.md`).
2. **Events over imperative wiring** (`code-standards.md`): several `AppState` events are dispatched but unused; UI is poked imperatively where a subscription is cleaner (loading overlay, clips-loaded).
3. **God modules → focused units** (SRP/SLAP): `Clip.js`, `server/index.js`, `src/main.js` are the three big ones. Extract by responsibility, not by line count.
4. **Validation must not mutate.** Both `mainframe/scripts/clips/lib/validate/meta.js` and the loaders quietly rewrite legacy fields; separate report vs migrate.
5. **Delete before abstract.** Dead code (`Clip.play()`, empty stubs, unused events/handlers, legacy `<akvj-clip-editor>`) should go; this pass should net-shrink.

---

## Suggested slicing (for Team Lead)

Ordered so the backbone lands first and nothing blocks feature work:

1. **Clip-format core (P0):** centralize clip metadata normalization (akvj) + stop validate-time mutation (mainframe) + one spritesheet lib in mainframe + schema constants + round-trip tests. (§0)
2. **akvj constants + dead-code sweep:** timing util, `MAX_MIDI_VELOCITY`, `TRIGGER_TYPES`, `clipLoadError` event, remove `Clip.play()`/stubs/unused events. (§A4, A7)
3. **`Clip.js` split** into timing + playback + inject BPM/clock. (§A1)
4. **`ClipLoader` merge** + optional `ProjectCatalog`. (§A2)
5. **mainframe shared module** (`frameTiming`, `frameFit`, clip-id regex, playback enums) + fix server↔frontend imports. (§M5, M6)
6. **`server/index.js` split** + `mappingService` + symmetric error handling. (§M1, M2)
7. **`main.js` → `ClipEditorController`** + retire legacy `<akvj-clip-editor>`. (§M3, M4)
8. **Effects DRY** + unify MIDI routing + event-driven loading overlay. (§A5, A6)
9. **monorepo-scripts `lib/`** + `sort-package-json` decision. (§S1–S4)

Each of the above is independently shippable and testable. Prefer landing 1–4 (clip backbone + akvj) before 5–7 (mainframe structural), since the user explicitly wants the clip format solid and under test before more scope.

## Explicitly out of scope for this pass

- Any change to on-disk clip JSON shape that hurts hand-editability (`clip-schema.md`).
- Introducing a shared JS import between `akvj` and `mainframe` (`goal.md`).
- New features (Projects logic, grayscale-displacement effects, MIDI-clock behavior changes) — this is structure only; do those on the cleaned base.
- Changing the 60fps render pipeline's behavior; refactors there must be perf-neutral.
