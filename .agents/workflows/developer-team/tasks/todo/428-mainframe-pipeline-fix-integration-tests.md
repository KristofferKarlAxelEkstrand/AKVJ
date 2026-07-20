---
status: backlog
assignee: none
priority: medium
review: machine
---

# 428 — Pipeline `--fix` integration untested

From: `[TEST]-mainframe-pipeline-fix-integration.md` (test-marshal).

`fixClips` is well-tested directly (`mainframe/test/fix.test.js`), but the Pipeline integration —
that `--fix` runs **before** validate, that a migrated clip then **passes** validation, and that
the build proceeds — has zero coverage. Neither `Pipeline.test.js` nor `Pipeline.full.test.js`
passes `fix: true`. If the ordering or the handoff between `fixClips` and `validate` breaks, no
test catches it.

Add cases (tier: unit, real filesystem like existing `Pipeline.full.test.js`):

- `run({ fix: true, sourceDir })` migrates a `loop: true` clip and the build succeeds (clip now has
  `playback: "loop"`, passes validate, produces `clips.json`).
- `run({ fix: true, sourceDir })` with a stale `png` filename pointing at the only on-disk sprite —
  migration rewrites `meta.png`, build succeeds.
- `run({ fix: true, sourceDir })` on clean clips is a no-op (no file rewrite, build still
  succeeds) — guards against `--fix` silently rewriting clean sources.
- `run({ fix: true, validateOnly: true, sourceDir })` migrates then validates-only (does not build)
  — confirms `--fix` runs before the `validateOnly` early return.

Scope: `mainframe/test/Pipeline*.test.js` only (test-only — touch no product source). Verify:
`npm run lint -w mainframe`, `npm run test -w mainframe`.
