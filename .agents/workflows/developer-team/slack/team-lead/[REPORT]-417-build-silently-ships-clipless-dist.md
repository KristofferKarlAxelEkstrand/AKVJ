---
type: report
from: utility-developer
to: team-lead
task: 417
created: 2026-07-20T17:55:00Z
---

# 417 — `npm run build` now fails loudly when the clip tree is absent

Picked **option 2** (keep `build` fast, fail with a named fix when the generated
project tree is missing). Reason: option 1 pays the clip-pipeline cost on every
build for a precondition that is already satisfied in the normal iterate-on-code
loop; option 3 (rename) breaks muscle memory and every doc that says `npm run
build`. A precondition check costs ~10ms on the happy path and converts the
silent failure into a message that names `npm run build:full` / `npm run clips`.

## What changed

- `monorepo-scripts/verify-clip-tree.js` — new precondition check. Fails with
  exit 1 and lists the missing artifacts (`akvj/src/public/projects/index.json`,
  `akvj/src/public/active-project.json`) plus the three commands that produce
  them.
- `monorepo-scripts/test/verify-clip-tree.test.js` — unit tests for
  `missingArtifacts()` (present/missing/mixed) + a CLI smoke test.
- `package.json` — `build` is now
  `node monorepo-scripts/verify-clip-tree.js && npm run build -w akvj`.
  `build:full` and `build:all` unchanged (they run `clips` first, so the check
  always passes).
- `AGENTS.md` / `README.md` — `build` command description now says it fails if
  the clip tree is missing and points to `build:full`.

## Verify (fresh clone in `/tmp/akvj-417-clone`, deleted after)

`npm run build` on a clone where `npm run clips` never ran:

```
[verify-clip-tree] Missing generated artifacts:
  - akvj/src/public/projects/index.json
  - akvj/src/public/active-project.json

The generated clip tree is missing — `npm run build` would produce a clip-less dist/.
Run one of:
  npm run clips        # generate the clip tree only
  npm run build:full   # generate the clip tree, then build
  npm run build:all    # clips + akvj + mainframe
```
Exit 1.

`npm run build:full` on the same clone: exit 0, `dist/projects/default/clips/`,
`dist/projects/index.json`, `dist/active-project.json` all present.
`npm run build:all`: exit 0. `npm run build` after the pipeline ran: exit 0.

## Self-verification

- `npm run test:monorepo-scripts` — 22 passed (incl. 4 new).
- `npm run test` (akvj + monorepo-scripts) — 582 + 22 passed.
- `npx eslint` on the two new files — clean.
- `npm run build` / `build:full` / `build:all` — all exit 0 in the real tree.

## Not mine

`npm run lint` from the root has one pre-existing error in
`akvj/test/Clip.test.js:370` (Parsing error). Confirmed pre-existing by stashing
my changes and re-running — it is akvj-developer's territory and unrelated to
417.

Task file moved to `tasks/done/`. No `git add`/`commit`/`push`.
