# [TASK] Task 82: Grayscale-Driven Displacement / Fade Effects (Feature Idea)

## Task File
`.agents/workflows/developer-team/tasks/82-grayscale-displacement-fade-effects.md`

## Files to Review
- `akvj/src/js/visuals/Compositor.js` (for `#mixMultiBit` reference)
- `akvj/src/js/visuals/effects/` (existing effect modules pattern)
- `akvj/src/js/visuals/MaskManager.js` (bitmask system context)

## Description
This is a feature exploration task, not a bug fix. The user wants to research and potentially implement grayscale-driven effects inspired by Amiga demo scene techniques. The aesthetic should be lo-fi and crude, not smooth/polished.

## Discrete Actions
1. Research Amiga demo scene techniques (plasma effects, tunnel effects, palette cycling, bump mapping, raster bars, rotozoomer, copper bars)
2. Design a grayscale-driven displacement effect using existing effect module pattern
3. Design a grayscale-driven soft fade/blend effect reusing `Compositor.js#mixMultiBit` math
4. Implement one or both effects following the existing `apply(imageData, effect, timestamp, effectContext)` pattern
5. Test effects are lo-fi and crude as requested (not smooth/polished)
6. Add appropriate MIDI routing if effects need triggerable controls

## Verification
- `npm run lint`
- `npm run test -w akvj`
- `npm run build -w akvj`
- Manual testing that effects work and match lo-fi aesthetic

## Dependencies
- Should be sequenced after user has tested current clip format + MIDI clock work
- Conceptually related to bitmask/mixer system

## Related Epic
None (standalone feature idea)
