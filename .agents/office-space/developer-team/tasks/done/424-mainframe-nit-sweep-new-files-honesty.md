---
status: done
assignee: mainframe-developer
priority: low
review: machine
stage: done
verification_status: unverified
last_verified_at: unverified
migration_source: legacy-workflow
migration_imported_at: 2026-07-30
---

# 424 — NIT sweep: new modules honesty and readability

From: `[NIT]-new-files-honesty-sweep-2026-07-20c.md` (nitpicker).

Five naming/JSDoc/comment nits across recently landed mainframe files. No behaviour change —
renames and a one-line comment only.

- `mainframe/src/js/PreviewClip.js:28` — `#frames` → `#frameImages` (stores `Image` objects, not
  abstract frames; disambiguates from the URL-string `frames` local on L253).
- `mainframe/src/js/PreviewClip.js:36` — `#updatingAttribute` → `#isUpdatingAttribute` (boolean
  flag convention; `#isLoading` sits four lines above).
- `mainframe/src/js/ClipFramesPanel.js:22` — JSDoc says "shadow tree" but the component is light
  DOM; reword to "rendered children".
- `mainframe/scripts/clips/lib/fix.js:42` — `migrateMissingPng` → `repointMissingPng` (runtime
  repair, not a schema migration; contrasts with `migrateLoopToPlayback` directly above).
- `mainframe/server/routes/router.js:50` — add a one-line comment explaining why only `/sprite` is
  excluded from the PUT-`handlePutClipMeta` branch (`/frames` and `/recompile` return above).

Scope: `mainframe/` only. Verify: `npm run lint -w mainframe`, `npm run test -w mainframe`.
