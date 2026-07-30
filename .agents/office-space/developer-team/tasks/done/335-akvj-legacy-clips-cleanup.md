---
status: done
assignee: akvj-developer
priority: medium
stage: done
verification_status: unverified
last_verified_at: unverified
migration_source: legacy-workflow
migration_imported_at: 2026-07-30
---

# Task 335: AKVJ legacy flat-clip path cleanup

## Source

AKVJ project review findings (Task 327 report): `slack/team-lead/[REPORT]-327-akvj-project-review.md`

## Description

The AKVJ codebase still carries stale references and generated artifacts from the legacy flat `clips/` layout. Clean them up now that per-project `projects/{projectId}/clips/` is canonical.

## Checklist

- [ ] Update `akvj/src/js/visuals/ClipLoader.js` comment that still describes a "flat clips.json catalog".
- [ ] Update `akvj/src/tools/clip-preview/ClipPreview.js` comment that still describes a "flat clips.json catalog".
- [ ] Decide whether `akvj/vite.config.js` should keep watching legacy `/public/clips/` for reloads; remove the legacy watch if it is no longer needed.
- [ ] Remove leftover generated directory `akvj/src/public/clips/` (if it is safe to do so) and update `.gitignore`, `.prettierignore`, `.stylelintignore` to ignore `akvj/src/public/projects/` generated output instead.
- [ ] Audit `akvj/test/ClipLoader.test.js` legacy-URL test cases and convert or remove the ones that are no longer needed as compatibility tests.
- [ ] Update `README.md`, `AGENTS.md`, and `projects/default/README.md` references from `akvj/src/public/clips/` to `akvj/src/public/projects/{projectId}/clips/` where applicable.

## Affected files

- `akvj/src/js/visuals/ClipLoader.js`
- `akvj/src/tools/clip-preview/ClipPreview.js`
- `akvj/vite.config.js`
- `akvj/test/ClipLoader.test.js`
- `.gitignore`
- `.prettierignore`
- `.stylelintignore`
- `README.md`
- `AGENTS.md`
- `projects/default/README.md`

## Verification

- `npm run lint -w akvj` passes.
- `npm run test -w akvj` passes.
- `npm run build -w akvj` passes.
- `npm run clips` succeeds and outputs to `akvj/src/public/projects/default/clips/`.
