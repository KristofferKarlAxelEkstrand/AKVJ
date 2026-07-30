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

# Task 242: `clipMetadata.js` — Remove `frameDurationBeats`, Resolve `syncBeats` Only

## Epic
`.agents/workflows/developer-team/epics/sync-to-bpm-redesign.md` — Phase 2

## Source
`.agents/workflows/developer-team/spec/featue-how-sync-to-bpm-works-for-clips.md`
(Sync-to-BPM Redesign — human-approved spec)

## Affected Files
- `akvj/src/js/visuals/clipMetadata.js` (or wherever `frameDurationBeats` /
  `expandSyncToFrameDurationBeats` currently live — grep for
  `expandSyncToFrameDurationBeats` and `frameDurationBeats` under `akvj/src/js/`)

## Description
`frameDurationBeats` is being removed as a per-frame concept entirely. Metadata
resolution should stop producing/expanding it and instead resolve `syncBeats` as the
single runtime value that `ClipTiming` (task 243) consumes:

- `sync: "free"` (default) — unchanged, no BPM sync.
- `sync: "beat"` — resolve `syncBeats` (the **total clip duration in beats**):
  - If `syncLength` is a preset (`"1/4 beat"` … `"8 bars"`), compute `syncBeats` from
    the preset (using `beatsPerBar` for bar-based presets, default `4`).
  - If `syncLength` is `"custom"`, use the author-provided `syncBeats` directly.
- Remove `expandSyncToFrameDurationBeats` (or equivalent per-frame expansion logic) and
  the `frameDurationBeats` field entirely from the resolved metadata shape.
- `ClipTiming` should only ever see a resolved `syncBeats` number — never `syncLength`
  (the string) and never `frameDurationBeats`.

Do **not** touch clip content/validation yet — that's tasks 244 (mainframe validation +
`syncTiming.js` mirror) and 245 (migrating the 5 existing clips). This task is scoped to
the akvj-side metadata resolution module only.

## Discrete Actions
1. Locate the current `frameDurationBeats` / `expandSyncToFrameDurationBeats` logic in
   `akvj/src/js/` and remove it.
2. Implement/confirm `syncLength` → `syncBeats` resolution (presets + `beatsPerBar`) as
   the only sync-resolution path.
3. Update any call sites/consumers that currently read `frameDurationBeats` from
   resolved metadata — they should not exist after task 243 lands, but check for other
   incidental readers (e.g. debug overlay) now.

## Verification
- Update/add unit tests for `syncLength` → `syncBeats` resolution across all presets
  (`"1/4 beat"` … `"8 bars"`) and the `"custom"` path.
- Add a test asserting `frameDurationBeats` is no longer read/produced anywhere in this
  module.
- Run `npm run lint && npm run test -w akvj && npm run build -w akvj`.

## Related
- Blocks task 243 (`ClipTiming.js` rewrite), which consumes the resolved `syncBeats`.
- Independent of task 241 — can be worked in either order or in parallel.
- Mainframe's mirrored `syncTiming.js` (task 244) must track this module's resolution
  logic per existing manually-mirrored-module precedent.
