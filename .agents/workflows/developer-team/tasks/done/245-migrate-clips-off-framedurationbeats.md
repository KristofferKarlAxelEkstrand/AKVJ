---
status: done
assignee: mainframe-developer
priority: medium
---

# Task 245: Migrate the 5 Existing Clips Off `frameDurationBeats`

## Epic
`.agents/workflows/developer-team/epics/sync-to-bpm-redesign.md` — Phase 5 (depends on
task 244 — do not start until it reports done, since the new format must pass validation
first)

## Source
`.agents/workflows/developer-team/spec/featue-how-sync-to-bpm-works-for-clips.md`
(Sync-to-BPM Redesign — human-approved spec, "What about `frameDurationBeats` in
existing clips?" table)

## Affected Files
- The `meta.json` for each of the 5 clips below (locate under `clips/*/` or
  `projects/*/clips/*/` — grep for `frameDurationBeats` to find current paths).

## Description
5 clips currently use `frameDurationBeats` explicitly. All have 64 frames and uniform
values, so migration is mechanical — since all have uniform FPS (default 1 fps),
`syncBeats = frameDurationBeats × frames` produces identical playback:

| Clip | Old | New |
|------|-----|-----|
| `c1-n0-v0` | `frameDurationBeats: 0.5` | `sync: "beat"`, `syncLength: "custom"`, `syncBeats: 32` |
| `c1-n1-v0` | `frameDurationBeats: 0.5` | `sync: "beat"`, `syncLength: "custom"`, `syncBeats: 32` |
| `c1-n2-v0` | `frameDurationBeats: 2` | `sync: "beat"`, `syncLength: "custom"`, `syncBeats: 128` |
| `c5-n0-v0` | `frameDurationBeats: 0.25` | `sync: "beat"`, `syncLength: "custom"`, `syncBeats: 16` |
| `c6-n0-v0` | `frameDurationBeats: 0.5` | `sync: "beat"`, `syncLength: "custom"`, `syncBeats: 32` |

## Discrete Actions
1. Locate each clip's `meta.json` (grep for `frameDurationBeats` repo-wide to find exact
   paths — clip content may live under multiple projects if `copyFrom` duplicated it).
2. Replace `frameDurationBeats` with `sync: "beat"`, `syncLength: "custom"`, and the
   `syncBeats` value from the table above.
3. Run `npm run clips` (or the relevant pipeline command) to regenerate/validate against
   task 244's updated validation — confirm all 5 clips pass with zero
   `frameDurationBeats` references remaining anywhere in the repo.

## Verification
- `grep -r "frameDurationBeats" clips/ projects/` returns no results after migration.
- `npm run clips` (validate/optimize/generate/copy pipeline) succeeds for all affected
  projects.
- Manual or automated check that playback timing is unchanged (64 uniform frames ×
  original `frameDurationBeats` == new `syncBeats`, per the table above).

## Related
- Depends on task 244 (mainframe validation must accept the new format first).
- Last phase of the sync-to-BPM redesign epic — closes out
  `epics/sync-to-bpm-redesign.md` once done.
