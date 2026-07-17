# [FEATURE IDEA] Grayscale-Driven Displacement / Fade Effects (from user, via Overseer outbox)

## Severity: Feature idea (not urgent — user explicitly said test the basics first; capturing so it isn't lost)

## Summary
Following up on the earlier "monochrome clips as effect base" idea, the user fleshed it out with two concrete effect concepts, drawing an analogy to how bitmask clips already work:

> "bitmasks aren't that like a just black and white image as the basis for one effect? ... grayscale images could add something similar — like for example we could move pixels right or left based on color, so no change is gray 50%, everything else kind of moves the pixels, but also just like a fade effect that is soft somehow, that could be done with grayscale."

Two distinct ideas here:
1. **Grayscale-driven pixel displacement**: a grayscale source image acts as a per-pixel displacement map — 50% gray (128) = no horizontal shift, values above/below 128 shift pixels left/right proportionally to distance from 128. This is a fairly standard "displacement map" VJ/shader technique.
2. **Grayscale-driven soft fade/blend**: grayscale values control a smooth (non-thresholded) blend/opacity, as opposed to the existing hard-cut effects.

The user also asked directly whether existing bitmasks already use grayscale, not just pure black/white — **confirmed and answered in the same outbox thread**: yes, `Compositor.js`'s `#mixMultiBit` already treats mask pixel values as grayscale for 2/4/8-bit depths (`floor(maskValue/divisor)/maxLevel`, giving 4/16/256 smooth blend levels respectively) — only 1-bit mode is a hard black/white threshold at 128. So the existing bitmask/mixer mechanism is closer to what the user is picturing than they may have realized; these new ideas could potentially reuse or extend that same grayscale-sampling machinery rather than needing an entirely separate pipeline.

## Where this could live
- The pixel-displacement idea is architecturally similar to the existing `offsetEffect.js` (wrap-around shift) and `glitchEffect.js` (per-pixel row displacement) — both already operate on `ImageData` with per-pixel math in `akvj/src/js/visuals/effects/`. A grayscale-driven variant would likely be a new effect module following the same `apply(imageData, effect, timestamp, effectContext)` shape.
- The soft-fade idea could reuse the existing multi-bit mask blend math (`Compositor.js#mixMultiBit`/`#blendPixel`) if it's meant to work like an alternate mask, or could be a new mixed-output/global effect if it's meant to apply within a single clip rather than across Layer Group A/B.

## Not scoping further
Per the user's own "sure, think about it" — this needs proper design discussion (is it a mask variant, a new effect type, or something else?) rather than being speced out unilaterally here. Filing so Team Lead/whoever picks up clip-format-adjacent design work later has this written down, once the current MIDI-clock/clip-format hardening priority work (Task 80 area) is further along.

## Dependencies
- None yet. Related conceptually to the existing bitmask/mixer system (`MaskManager.js`, `Compositor.js`) and the effect module pattern (`akvj/src/js/visuals/effects/`).
