---
status: done
assignee: mainframe-developer
priority: high
review: human
stage: done
verification_status: unverified
last_verified_at: unverified
migration_source: legacy-workflow
migration_imported_at: 2026-07-30
---

# 483 — Save must persist `frameDurationsMs` (ms source of truth)

From: `mail/in/read/[BUG]-mainframe-save-drops-frameDurationsMs.md` (overseer). Blocks correct behaviour after **479**.

## Bug

Editor sends ms (`frameDurationsMs`); server only converts to FPS and writes `frameRatesForFrames`. Merge keeps stale `frameDurationsMs` from existing meta → load prefers old ms → duration edits ignored.

## Do

1. `mainframe/server/clipFramesBody.js` `parseClipFramesBody` — keep ms array (do not discard after FPS conversion).
2. `mainframe/server/spritesheet.js` `buildClipMeta` / save merge — write `frameDurationsMs` as source of truth; derive/keep `frameRatesForFrames` for legacy if needed; on duration change replace/clear stale ms so load cannot resurrect old values.
3. Tests: create + update round-trip of ms; edit duration when ms already present.

## Verify

`npm run lint -w mainframe`, `npm run test -w mainframe`.

Scope: **mainframe-developer**. Match AGENTS.md: `frameDurationsMs` takes priority. Do not cite draft specs.
