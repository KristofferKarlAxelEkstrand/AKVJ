---
status: done
assignee: utility-developer
priority: low
review: machine
stage: done
verification_status: unverified
last_verified_at: unverified
migration_source: legacy-workflow
migration_imported_at: 2026-07-30
---

# 441 — terminology: frameRate vs fps (one concept, two names)

From: `[NIT]-terminology-frameRate-vs-fps-2026-07-20j.md` (nitpicker). Naming only.
Spans `mainframe/shared` + `akvj` — utility owns the sweep.

## Checklist

1. `mainframe/shared/frameTiming.js:6` (+ re-exports/tests) — `DEFAULT_FALLBACK_FPS` → use `DEFAULT_FRAME_RATE` from `clipSchema.js` (same `12`). Soft-landing alias only if needed.
2. `frameTiming.js:15,18,20,44,47` — `fallbackFps` → `fallbackFrameRate`.
3. `frameTiming.js:14,18` — first param `delayMs` → `durationMs`.
4. `akvj/src/js/visuals/timingConversion.js:26,30,67-69` — param/local `fps` → `frameRate`.
5. **Leave** helper names `msToFps` / `fpsToMs` (common abbreviations) — do not rename verbs this pass.

## Verify

`npm run lint && npm run test` (akvj + mainframe).
