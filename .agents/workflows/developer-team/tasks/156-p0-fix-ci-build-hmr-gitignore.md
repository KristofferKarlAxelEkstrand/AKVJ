---
status: in-progress
assignee: akvj-developer
priority: high
---

# Task 156: P0 — Fix CI Verify Step, `build:full`, Vite HMR Path, Gitignore Policy

## Source
Epic: `.agents/workflows/developer-team/epics/refactor-for-greateness-2.md` §P0.2–P0.5
(P0.1 — actually committing the `projects/` migration and retiring tracked `clips/` — is
**explicitly not part of this task**. That's a git-history operation requiring the human's
sign-off; Team Lead has filed it in `outbox/question-projects-migration-git-commit.md`. This
task is only the code/config fixes, which don't need approval — same as any other file edit.)

## Urgency
**High.** The repo does not cleanly build in CI today, and one of these bugs
(`build:full`) breaks a documented workflow command directly.

## P0.2 — CI Verify Step Checks Obsolete Paths
`.github/workflows/ci.yml` "Verify public clips generated" step (~lines 62-71) checks
`akvj/src/public/clips/clips.json` and `akvj/src/public/clips/set-mapping.json`. Both paths
are obsolete post-Task-128: `set-mapping.json` was renamed `key-map.json`, and
`public/clips/` no longer exists — the pipeline now emits
`akvj/src/public/projects/{id}/clips/`. **Fix**: point the verify step at
`akvj/src/public/projects/default/clips/clips.json` + `.../key-map.json` +
`akvj/src/public/active-project.json`, and check PNGs under the projects tree.
`npm run clips:validate` already passes on the new layout — CI is internally inconsistent
with the pipeline it's supposed to verify.

## P0.3 — `akvj/package.json` `build:full` Is Broken
`build:full` = `npm run clips && vite build …`, but `clips` isn't a defined script in the
`akvj` workspace — running it from `akvj/` fails outright. The root `build:full` works
correctly. **Fix**: remove the broken workspace-local `build:full` (root is canonical), or
repoint it to call the root script.

## P0.5 — Vite HMR Watches the Wrong Clip Path
`akvj/vite.config.js`'s reload plugin matches `/public/clips/`, but the pipeline writes to
`/public/projects/{id}/clips/` — the dev server won't auto-reload after a clip rebuild.
**Fix**: match `/public/projects/` (or both patterns during transition, if that's simpler).

## P0.4 — Generated-Output Gitignore Policy
New generated output (`akvj/src/public/projects/`, `akvj/src/public/active-project.json`,
root `active-project.json`) is untracked but **not gitignored** — it'll show as noise in every
`git status` until this is decided. The old `akvj/src/public/clips/` path is gitignored (and
in `.prettierignore`). **Fix**: apply the same treatment — gitignore generated public output,
matching old precedent. This is a config decision, not a commit of migration data — safe to
make now regardless of how the P0.1 outbox question resolves.

## Suggested Verification
- `npm run clips` then `npm run build` (or `build:full` from root) succeeds and produces the
  expected `akvj/src/public/projects/default/clips/clips.json`.
- Manually confirm the CI yaml step's paths match what the pipeline actually produces (read,
  don't need to trigger real CI for this).
- `npm run akvj` (dev server) + `npm run clips:watch`, touch a clip, confirm HMR reload fires.
- `git status` after a clean `npm run clips` run shows no untracked generated-output noise.

## Files
- `.github/workflows/ci.yml`
- `akvj/package.json`
- `akvj/vite.config.js`
- `.gitignore`, `.prettierignore`
