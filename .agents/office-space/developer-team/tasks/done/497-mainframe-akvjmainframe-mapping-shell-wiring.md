---
status: done
assignee: mainframe-developer
priority: medium
stage: done
verification_status: unverified
last_verified_at: unverified
migration_source: legacy-workflow
migration_imported_at: 2026-07-30
---

# 497 — AkvjMainframe piano-roll mapping shell wiring unit tests

From: `[TEST]-mainframe-akvjmainframe-mapping-shell-wiring.md` (test-marshal).

`mainframe/test/AkvjMainframe.test.js` covers `pianoroll:mapping-added` and table `mappingremove`, plus keyclick `action: 'select'`. Other edit-mode shell paths in `AkvjMainframe.js` (~323–394) have **zero** unit tests.

## Checklist

1. **`pianoroll:mapping-changed` (breakpoint drag)** — seed two velocities on note 60; dispatch `{ channel, note, oldVelocity, newVelocity, clipId }`. Assert matching entry’s velocity becomes `newVelocity`, other slots untouched, status contains `Breakpoint … → vel …` and `is-ok`.
2. **`pianoroll:mapping-removed` (region delete / redistribute)** — seed note 60 with soft+hard; dispatch remove with `mappings` = redistributed remainder. Assert note rebuilt from `detail.mappings` (channel/note stamped), other notes/channels kept, status `Removed … @ note … vel …`.
3. **keyclick assign (no `action: 'select'`)** — set `#map-clip-id` to a ready clip, dispatch keyclick with note/velocity only. Assert mapping upserted at `(mainframeState.channel, note, assignVelocity)` and form note/channel fields sync.
4. **keyclick assign with empty clip select** — clear `#map-clip-id`; dispatch non-select keyclick. Assert status `Select a clip first` + `is-err`, mappings unchanged.
5. **Overrides on remove/add rebuild** — if `detail.mappings` entries include `overrides`, shell must not drop them when rebuilding `mainframeState.mappings` (today the `.map` only keeps `channel/note/clipId/velocity` — either fix + assert, or document intentional strip). Move path re-emits `mapping-removed` per changed note (`PianoRoll.#handleMappingMove`), so the same rebuild code runs.

## Out of scope

- PianoRoll / PianoKey unit behaviour (`PianoRoll.test.js`, `pianoRollMappingEdit.test.js`).
- Mapping table remove (already tested).
- Epic 422/423 product work.

## Note

Shell rebuild for `mapping-removed` / `mapping-added` reconstructs entries without `overrides`. Pure helpers preserve overrides; if placement overrides must survive edit via the shell, that is product drift, not only a test gap.

## Verify

`npm run lint -w mainframe`, `npm run test -w mainframe`.

Scope: **mainframe-developer**. Extend `mainframe/test/AkvjMainframe.test.js`.
