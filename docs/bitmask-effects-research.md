# Bitmask-Based Visual Effects Research

Target canvas: **240 × 135 px** (32,400 pixels, 129,600 bytes of RGBA ImageData).  
Frame budget at 60 fps: **~16.7 ms**. The existing `EffectsPipeline` already does one `getImageData`/`putImageData` pair per effect pass plus a per-pixel CPU loop, so any new effect should stay roughly in the same CPU bound: a plain 32k-pixel loop costs well under 2 ms on modern hardware; expensive error-diffusion or per-pixel randomness can push toward 4–5 ms and risks dropping frames.

| Candidate | Cost | Visual impact | MIDI controllability | Verdict |
|-----------|------|---------------|----------------------|---------|
| **Bit-depth crushing / posterization** | Very low — one integer division/quantization per channel. | High retro lo-fi look. | Velocity maps directly to bit-depth/levels. | **Already implemented** in `colorEffect.js` (posterize variant); not a new prototype. |
| **XOR blending between Layer Group A and B** | Very low — one XOR per RGB channel per pixel inside the compositor loop. | Strong: color fringing, hard edges, tape-glitch aesthetic. | Note selects XOR mode; velocity mixes between normal and XOR. | **Strong candidate** — extends the existing mask/mixer foundation. |
| **Bit-shift / circular bit rotation on RGB** | Very low — shift/rotate per channel with a small table. | Medium-high: color channel separation, hue-cycling, lo-fi digital artifacts. | Note picks shift amount; velocity blends shifted/original. | **Strong candidate** — fits existing color effect range. |
| **Threshold masks from live clip brightness** | Medium — one extra per-pixel luminance pass over a layer group each frame. | High: content-aware transitions that follow motion. | Velocity sets threshold; note chooses source (A/B/mixed). | **Good candidate** but more invasive; best prototyped as a dynamic mixer mode. |
| **Dithering — Floyd-Steinberg** | High — multiple floating-point writes per pixel plus error propagation. | Classic lo-fi diffusion, but heavy. | Velocity controls target bit depth. | **Too expensive** for 60 fps at full resolution without down-sampling. |
| **Dithering — Bayer matrix (ordered)** | Low — one matrix lookup and threshold per pixel. | Crisp retro ordered dither, very VJ-friendly. | Velocity selects bit-depth/matrix size. | **Strong candidate** when paired with bit-depth crushing. |
| **Bitplane isolation** | Very low — one channel mask per pixel. | Subtle on full color; can look great on high-contrast clips. | Note selects bitplane (R0-R7, G0-G7, B0-B7). | **Interesting but niche**; better as a sub-variant of bit-shift. |
| **Binary pattern generators (Wolfram CA)** | Low — 1-D CA on a rolling buffer of width 240, evolved one row per frame or tick. | Strong procedural texture/mask source. | Note selects Wolfram rule; velocity seeds initial state. | **Viable**, but overlaps with the existing mask-clip system; needs a new generator module. |

## Recommended candidates to prototype

1. **XOR blend between Layer Group A and B**  
   - Adds `A ^ B` per channel as an alternative mixer mode (or as a global effect if we feed A and B into a scratch buffer).  
   - Cost is negligible and it is the most visually distinct extension of the existing bitmask mixer.  
   - MIDI mapping: reserve notes in the mixer channel or a new effect range for “XOR A⊕B” with velocity controlling the mix ratio.

2. **Bayer ordered dither + bit-depth crush**  
   - Combine the existing posterize step with a small Bayer threshold matrix.  
   - Pre-compute the matrix once and re-use it per frame; the hot path stays a single compare/quantize per channel.  
   - Velocity controls the target bit-depth, giving a smooth lo-fi/digital look that is easy to perform live.

3. **Per-channel bit-shift / circular bit rotation**  
   - Implemented as a new color-effect variant (or `bitShift` effect type).  
   - Each pixel applies `channel = ((channel << n) \| (channel >> (8 - n))) & 0xff` for one or more channels.  
   - Note selects channel and shift amount; velocity blends the shifted output with the original.  
   - Very cheap and highly controllable.

## Performance assumptions

- 240 × 135 × 4 bytes = **129,600 bytes** of ImageData per effect pass.
- A single pass over this buffer with simple integer/bitwise operations is roughly **0.3–1.0 ms** on a modern desktop CPU in Chrome; `getImageData` + `putImageData` add another **0.3–0.8 ms**.
- Effects that write to multiple neighbor pixels (Floyd-Steinberg) or use `Math.random()` per pixel (glitch-style) can exceed **2–3 ms**, leaving little headroom for other pipeline stages.
- All new effects should follow the existing scratch-buffer contract in `EffectsPipeline.js`: pre-allocate any needed buffers and re-use them, never allocate inside the per-frame loop.
