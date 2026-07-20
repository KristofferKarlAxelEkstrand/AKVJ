# Bitmask-Based Visual Effects

## Summary

Research and implement new visual effects that leverage bitmasks and bitwise operations on pixel data. The existing mask system (1/2/4/8-bit depth) is a foundation; this epic explores pushing it further into the effects pipeline.

## Ideas

- **Bit-depth crushing / posterization** — reduce color channels to fewer bits, MIDI velocity controls crush intensity.
- **XOR blending between layers** — XOR pixel data from Layer Group A and B instead of alpha/mask crossfade.
- **Bit-shift effects** — shift R/G/B channels, circular bit rotation for color cycling, MIDI CC controls shift amount.
- **Threshold masks from live content** — generate bitmasks dynamically from brightness threshold of playing clips and feed back into mixer.
- **Dithering patterns** — Floyd-Steinberg or ordered (Bayer matrix) dithering as real-time effect, bit depth controlled by MIDI velocity.
- **Bitplane isolation** — extract individual bit planes from each color channel.
- **Binary pattern generators** — Wolfram cellular automata rules as procedural masks, MIDI note selects rule number, velocity sets initial seed.

## Approach

1. Research feasibility at 60fps on 240×135 canvas (bitwise ops on typed arrays should be cheap).
2. Prototype 2–3 strongest visual candidates.
3. Wire to MIDI CC or effects channels (10 or 13).
4. Add to EffectsManager pipeline following existing effect pattern in `akvj/src/js/visuals/effects/`.

## Constraints

- 60fps, allocation-free in hot path (pre-allocate buffers).
- Follow existing effect pattern in `akvj/src/js/visuals/effects/`.

## Status

Research first, then implement best candidates.

## Research findings

See [docs/bitmask-effects-research.md](../../../../docs/bitmask-effects-research.md) for the full evaluation.

**Recommended 2–3 prototypes:**

1. **XOR blend between Layer Group A and B** — cheapest, strongest visual extension of the existing mask mixer.
2. **Bayer ordered dither + bit-depth crush** — retro lo-fi look, low cost, great MIDI velocity mapping.
3. **Per-channel bit-shift / circular bit rotation** — cheap color-channel manipulation that fits the existing color effect range.
