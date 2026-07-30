---
status: done
assignee: akvj-developer
priority: low
review: machine
stage: done
verification_status: unverified
last_verified_at: unverified
migration_source: legacy-workflow
migration_imported_at: 2026-07-30
---

# 448 — NIT: Midi `#isDestroyed` + scrub `normalizedPosition` + Clip JSDoc

From: `[NIT]-akvj-midi-clip-scrub-honesty-2026-07-29.md` (nitpicker). Naming / JSDoc only.

- [ ] `Midi.js` — `#destroyed` → `#isDestroyed`
- [ ] Scrub param `normalizedValue` → `normalizedPosition` across Clip, PlaybackController, LayerGroup, MaskManager, LayerManager
- [ ] `Clip.js` JSDoc — point playback/scaling defaults at `DEFAULT_PLAYBACK` / `DEFAULT_SCALING`
- [ ] Optional leftover: `mainframe/shared/frameTiming.js` `fps` → `frameRate` (if still open after 441)

## Verify

`npm run lint && npm run test` (akvj; shared if touching frameTiming).

Scope: **akvj-developer** (optional frameTiming is shared — include or hand utility if you touch it).
