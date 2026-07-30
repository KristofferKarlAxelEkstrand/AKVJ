---
status: done
assignee: mainframe-developer
priority: high
review: human
stage: done
verification_status: unverified
last_verified_at: unverified
migration_source: legacy-workflow
migration_imported_at: 2026-07-30
---

# 479 — frameLoad must prefer `frameDurationsMs`

From: `mail/in/read/[BUG]-frameload-ignores-frameDurationsMs.md` (overseer).

## Bug

`mainframe/server/frameLoad.js` `durationsFromMeta` only reads `frameRatesForFrames`. Clips that store timing only as `frameDurationsMs` reload via `/frames` with empty durations → pad to 12 FPS (~83 ms).

Repro: `projects/default/clips/custom-clip` has `frameDurationsMs: [41.67]` — akvj plays ~24 FPS; mainframe editor hydrate does not.

## Contract

`AGENTS.md` Clip Metadata: `frameDurationsMs` takes priority over `frameRatesForFrames`. Match akvj runtime (`ClipTiming.js` / `Clip.js`). Do **not** cite draft specs.

## Do

1. Prefer `frameDurationsMs` when present (same priority as runtime); else convert `frameRatesForFrames`.
2. Extend `frameLoad.test.js` for both paths (and coexistence: ms wins).
3. **Also from** `mail/in/read/[TEST]-mainframe-frameload-sheet-grid-cell-size.md`: when meta omits `frameWidth`/`frameHeight`, assert extracted frame PNG width/height equals sheet÷grid (`Math.floor(sheetW / framesPerRow)`, `Math.floor(sheetH / rows)`). Optional cheap case: only one of width/height set — the other still derives.

## Verify

`npm run lint -w mainframe`, `npm run test -w mainframe` (or `test:unit` for focused).

Scope: **mainframe-developer**. Human QA after report.
