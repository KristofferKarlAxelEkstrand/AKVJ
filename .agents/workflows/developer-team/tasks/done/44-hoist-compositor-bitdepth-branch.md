# Task 44: Hoist Compositor Per-Pixel BitDepth Branch

## Severity: Low (Performance)

## Location
`akvj/src/js/visuals/Compositor.js:231-243` — `#mixPixels()`

## Problem
The `#mixPixels` loop checks `bitDepth === 1` for every pixel inside the main loop. The bit depth is constant for the entire frame — this branch is evaluated 32,400 times per frame unnecessarily.

## Fix
Hoist the bit depth check outside the loop by selecting the mix function before iterating:

```javascript
#mixPixels(buffers, pixelCount, bitDepth) {
    const { divisor, maxLevel } = this.#getBitDepthParams(bitDepth);
    if (bitDepth === 1) {
        for (let i = 0; i < pixelCount; i++) {
            const idx = i * RGBA_CHANNEL_COUNT;
            this.#mix1Bit(buffers, idx, buffers.mask[idx]);
        }
    } else {
        for (let i = 0; i < pixelCount; i++) {
            const idx = i * RGBA_CHANNEL_COUNT;
            this.#mixMultiBit(buffers, idx, buffers.mask[idx], divisor, maxLevel);
        }
    }
}
```

## Verification
- Run `npm run test -w akvj` to ensure all tests pass
- Run `npm run lint` to ensure no lint errors
- Verify visual output is unchanged

## Key Files
- `akvj/src/js/visuals/Compositor.js` — the file to optimize
- `akvj/test/Compositor.test.js` — existing tests

## Constraints
- Do NOT change visual output — only optimize branch placement
- Maintain 60fps performance requirement

## Dependencies
- None (discovered during Task 37a code review)
- Can be combined with Task 40 (same file: Compositor.js)
