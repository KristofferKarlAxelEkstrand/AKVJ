---
status: done
assignee: akvj-developer
priority: low
---

# 404 — MaskManager / EffectsManager readability nits

From `[NIT]-mask-effects-managers-2026-07-20.md` (nitpicker). No behaviour change intended.

1. `akvj/src/js/visuals/clipMetadata.js` — add frozen `PLAYBACK_MODE` object (`ONCE`, `LOOP`,
   `PINGPONG`, `RANDOM`, `REVERSE`, `SHUFFLE`, `SCRUB`), derive `PLAYBACK_MODES` from
   `Object.values(PLAYBACK_MODE)`. Follow the existing `TRIGGER_TYPES` precedent in the same file.
   Replace the bare `'scrub'` literal at `MaskManager.js:111`, `LayerGroup.js:229`,
   `PlaybackController.js:58`, `PlaybackController.js:100`.
2. `akvj/src/js/visuals/EffectsManager.js` class header (~L4-6) — channel numbers say 9/12 but
   AGENTS.md and DAWs say 10/13. Write `Channel 10 (mixedOutputEffects, code channel 9)` and
   `Channel 13 (globalEffects, code channel 12)`.
3. Same file, inline comments at L48 / L58 — same fix, or drop the parenthetical since the
   `#...Channel` fields already carry it.
4. Same file, `EffectType` typedef (L19) — drop `'reserved'` from the union; it stays a key of
   `#effectRanges` only. `#getEffectType` can never return it.
5. `akvj/src/js/visuals/MaskManager.js:102` — `getBitDepth()` → `getCurrentBitDepth()`, matching the
   adjacent `getCurrentMask()`. Update all call sites and tests.

## Verify

- `npm run lint && npm run test && npm run test:visual`
- `grep -rn "'scrub'" akvj/src/` returns only the `PLAYBACK_MODE` definition.
- `PLAYBACK_MODES` still validates the same seven values (check the consumers in
  `mainframe/scripts/clips/lib/validate/meta.js`).
