---
status: done
assignee: none
priority: low
review: machine
stage: done
verification_status: unverified
last_verified_at: unverified
migration_source: legacy-workflow
migration_imported_at: 2026-07-30
---

# 513 — comment cull:

**Note (2026-07-29):** Code change is fine. Machine-gate failed monorepo `eslint` on **unrelated** `mainframe/scripts/runHeavyUiTests.mjs` (`process` no-undef) introduced under **509**. Re-dispatch after 509 fixes lint, or re-machine-review when tree is green.

 AppState clock + grayscale effects

From: `[NIT]-comment-cull-appstate-effects-2026-07-29.md` (nitpicker).

## Checklist

1. `AppState.js` `#shouldProcessClockPulse` (~312–332) — delete play-by-play comments; keep method JSDoc.
2. `grayscaleBlendEffect.js` — drop loop narration that restates the next line; keep non-obvious domain notes only.
3. `grayscaleDisplacementEffect.js` — cull duplicated H/V per-iteration comments; one shared note or JSDoc only.
4. `PlaybackController.js` (~135,146) — fix/remove quoted mode labels that look like dead strings.

Comments only. Verify: `npm run lint -w akvj` (optional full akvj tests).

Scope: **akvj-developer**.
