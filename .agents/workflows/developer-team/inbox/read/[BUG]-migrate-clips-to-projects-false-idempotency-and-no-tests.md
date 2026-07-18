# [BUG] migrateFlatClipsToDefaultProject false idempotency + zero test coverage

## Where
`mainframe/server/migrateClipsToProjects.js` (`migrateFlatClipsToDefaultProject`), invoked once at mainframe boot from `mainframe/server/index.js:47`.

## Context
Task 128 (per-project clip folders) shipped a one-time, destructive migration that moves the legacy flat `clips/` pool into `projects/default/clips/` and deletes the legacy folder's contents as it goes — explicitly "no legacy fallback" per the human's confirmed requirement. This is exactly the kind of code (runs once, moves/deletes real data, can't be casually re-tested by hand once it succeeds) that most needs solid tests and a correct completion check. It currently has neither.

## Problem 1: false idempotency on partial-crash retry
The early-exit guard (lines 21-26) treats "no clip folders and no `.raw-assets` left in the legacy dir" as "nothing to migrate":
```js
const clipFolders = legacyEntries.filter(...);
const hasRaw = legacyEntries.some(entry => entry.name === '.raw-assets');
if (clipFolders.length === 0 && !hasRaw) {
	return { migrated: false, clipCount: 0, rawMoved: false };
}
```
But the function does two more steps *after* the clip-folder and raw-assets loops: copying `LICENSE-ASSETS.md`/`README.md` (lines 84-97) and deleting the stale `clips/key-map.json` (lines 99-100). If the process dies between "clip folders + raw-assets fully moved" and "docs copied / key-map removed" (e.g. `index.js:51-54` calls `process.exit(1)` on any thrown error, or the process is killed externally — plausible in this repo's own documented container resource constraints, see `AGENTS.md`'s sharp/CPU notes), every subsequent boot will hit the early-exit guard and silently skip the remaining cleanup **forever** — there's no way to distinguish "never started" from "finished the destructive part but not the last two steps." Net effect: `clips/key-map.json`, `clips/README.md`, `clips/LICENSE-ASSETS.md` can be left behind permanently, and `projects/default/` may end up missing the docs — a genuine (if narrow-window) violation of the "no legacy fallback" requirement, and a misleading `migrated: false` return on a boot where clips actually did get moved by an earlier run.

## Problem 2: no test coverage at all
`grep -rl "migrateClipsToProjects\|migrateFlatClipsToDefaultProject" mainframe/test/` returns nothing — confirmed via `find mainframe/test -iname "*migrat*"` (no matches). The developer's `[REPORT]-128-per-project-clip-folders.md` verification section lists `npm run test -w mainframe — pass`, but that's the *existing* suite; nothing exercises this new, irreversible file-moving code path (empty legacy dir / partial legacy dir / raw-assets-only / retry-after-partial-crash / concurrent-boot).

## Suggested Fix
- Make completion idempotency explicit rather than inferred from folder presence — e.g. write a small `.migrated` marker file (or check for `projects/default/key-map.json` + doc files as the actual completion signal) so a retry after a partial crash resumes the *remaining* steps instead of no-op'ing.
- Add `mainframe/test/migrateClipsToProjects.test.js` covering: empty/missing legacy dir (no-op), full legacy pool migration, raw-assets-only, retry-after-partial-run (simulate by pre-creating `projects/default/clips` before calling again), and that `key-map.json`/docs land in the destination.

## Priority
Medium — migration already ran successfully in this repo (git status confirms `clips/` is fully gone), so there's no live data at risk *today*. But the code is now permanent (any fresh clone/environment still carrying a legacy `clips/` folder will run it), it's irreversible by nature, and it currently ships with zero tests for a one-shot destructive path — worth hardening before it's forgotten.
