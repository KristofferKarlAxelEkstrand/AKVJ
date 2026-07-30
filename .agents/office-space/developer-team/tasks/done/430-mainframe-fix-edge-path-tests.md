---
status: done
assignee: mainframe-developer
priority: medium
review: machine
stage: done
verification_status: unverified
last_verified_at: unverified
migration_source: legacy-workflow
migration_imported_at: 2026-07-30
---

# 430 — `fix.js` edge paths untested

From: `[TEST]-mainframe-fix-edge-paths.md` (test-marshal). Test-only — touch
`mainframe/test/fix.test.js` (reuse `writeClip`/`root` tmpdir fixture). No product source unless a
bug surfaces.

`fix.js` is the only pipeline module that rewrites source `meta.json`. Pin these four edges:

1. **`fixClip` ENOENT** (`fix.js:69-72`) — clip folder with no `meta.json` →
   `{changes:[], skipped:[], errors:[]}`, no write. Pin current silent behaviour.
2. **`fixClip` non-ENOENT read error** (`fix.js:70`) — e.g. `EACCES` →
   `errors` has one entry containing `Cannot read meta.json`.
3. **`fixClips` skips non-`CLIP_ID_PATTERN` folders** (`fix.js:95-97`) — invalid id folder
   alongside a valid one; only the valid one appears in results.
4. **`fixClips` aggregates `skipped` and `errors`** (`fix.js:102-107`) — bucket with one
   ambiguous-png clip + one unreadable meta; assert both arrays have one entry with the right
   `clipId`.

Verify: `npm run lint -w mainframe`, `npm run test -w mainframe`.
