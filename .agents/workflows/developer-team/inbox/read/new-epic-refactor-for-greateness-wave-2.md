# Team Update: New epic — Refactor for Greatness Wave 2

## Summary

I did a fresh whole-project review and wrote a follow-up epic:
**`epics/refactor-for-greateness-2.md`**.

Wave 1 largely landed (verified): `server/index.js` is down 804 → 59 lines, `Clip.js` split into
`ClipTiming`/`PlaybackController`, `ProjectCatalog`/`clipMetadata`/`mainframe/shared/` all exist,
monorepo-scripts S1–S4 done. Wave 2 covers what's **new or still open** across akvj, mainframe,
monorepo-scripts, tests/e2e, and — new this pass — root config, data layout, docs, and git/CI state.
**midi-mcp was left out of scope** (it's retired).

## Impact / headline finding

The **single most important thing** isn't a code smell — it's that the **Task 128 projects migration
is not durable in git**:

- `projects/` is **entirely untracked** (a fresh clone gets no source clip data).
- Legacy `clips/` is **still in the git index** but deleted on disk.
- CI's "Verify public clips generated" step still checks obsolete paths
  (`akvj/src/public/clips/clips.json`, `set-mapping.json`) → **CI fails even when the build succeeds.**
- `akvj/package.json` `build:full` calls a `clips` script that doesn't exist in that workspace.

So the repo doesn't cleanly clone-and-build today. That's P0 in the epic.

## Action Needed

- **Team Lead:** review `epics/refactor-for-greateness-2.md` and slice it (a 10-step suggested
  slicing is included, ordered so a clone builds first).
- **Do P0 first** (§P0): commit `projects/`, retire tracked `clips/`, fix the CI verify step, fix
  `akvj/build:full`, set the generated-output gitignore policy, fix the Vite HMR clip path.
- Then the doc/tooling truth-up (purge midi-mcp + Husky references, sweep README/CONTRIBUTING/
  AGENTS/how-to-program-midi to the projects layout).

## Notes

- Other big themes: god-modules moved but didn't disappear (`AdventureKidVideoJockey`,
  `ClipEditorController`, `main.js`, `server/spritesheet.js`); event hygiene (overloaded/dead events,
  missing `composed: true`, multiple owners of `activeProjectId`); one repo-wide custom-element naming
  rule; and **test coverage for the Wave 1 extractions** (`ClipTiming`/`PlaybackController`/
  `ProjectCatalog` were split out for testability but still have no direct tests).
- Guardrails from Wave 1 still apply and the akvj↔mainframe JSON-only bridge was verified intact
  (zero cross-imports).
- Findings are grounded in the actual files (line numbers/paths in the epic). Review only — no code
  changed.
- Epic: `.agents/workflows/developer-team/epics/refactor-for-greateness-2.md`
