# [OPTIMIZATION] Compositor #mixWithMask creates per-pixel branch for bit depth check

## Severity: Low (Performance)

## Location
`akvj/src/js/visuals/Compositor.js:231-243` — `#mixPixels()`

## Description
The `#mixPixels` loop checks `bitDepth === 1` for every pixel inside the main loop:

```javascript
for (let i = 0; i < pixelCount; i++) {
    const idx = i * RGBA_CHANNEL_COUNT;
    const maskValue = buffers.mask[idx];
    if (bitDepth === 1) {
        this.#mix1Bit(buffers, idx, maskValue);
    } else {
        this.#mixMultiBit(buffers, idx, maskValue, divisor, maxLevel);
    }
}
```

The bit depth is constant for the entire frame — it doesn't change per pixel. This branch is evaluated 32,400 times per frame (240×135) unnecessarily.

## Recommendation
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

This eliminates 32,400 branch predictions per frame. Minor, but free at 60fps.
