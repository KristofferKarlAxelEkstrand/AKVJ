# Draft epic: Simplify MIDI channel stack (one role per channel)

**Source:** Human answer on `mail/out/question-338-compositor-layer-b-intent.md` (2026-07-20).
**Status:** Draft intent only — not approved for implementation. Do not change `settings.js` channelMapping yet.

## Human lean

Simplify programming: **one MIDI channel per role**, renumber as needed. Proposed bottom→top stack (DAW channels as stated by human):

| Ch | Role |
| --- | --- |
| 1 | Layer Group Background |
| 2 | Layer Group Background Effects |
| 3 | Layer Group A (primary deck) |
| 4 | A/B mix (bitmasks / mix effects) |
| 5 | Layer Group B (secondary deck; mixed with A via ch 4 mask) |
| 6 | Mixed-output effects (on A+B mix; may include bitmask-style blend effects) |
| 7 | Layer Group C (overlays) |
| 8 | Global effects (whole frame) |

**Draw order inside a group:** lower channel first (bottom), then lower note (bottom); source-over.

**Mask empty / nothing playing:** human wants transparency so background (or background colour) shows through — not a hard black hole.

**Unstated vs today:** project-selection channel (today DAW 14), reserved channels, multi-slot decks (A today uses 4 channels). Need follow-up before any migration plan.

## Relation to task 338

**Locked 2026-07-20:** no-mask + both A and B → **option 2** (A then B source-over). Implement in task 338 only; this epic stays separate.

## Current shipped mapping (do not invent drift)

Today (`akvj/src/js/core/settings.js`): A=[0–3], mixer=4, B=[5–8], mixedFx=9, C=[10–11], global=12, project=13, reserved=[14–15] (code channels; DAW = code+1).

## Next (Overseer / human)

1. Confirm 338 option 1 vs 2 for *current* compositor (independent of remap).
2. Confirm whether Background + Background Effects are new layer groups or rename of existing slots.
3. Where project-switch MIDI lives after an 8-channel role map.
4. Migration story for existing `key-map.json` / FL Studio templates.
