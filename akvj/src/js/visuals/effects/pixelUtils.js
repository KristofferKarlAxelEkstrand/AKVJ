import { RGBA_CHANNEL_COUNT } from './effectConstants.js';

/**
 * Pixel utilities shared by CPU-based canvas effects.
 */

/**
 * Transform-copy pixel data using a source-index function.
 * Writes the transformed result back into `data` using a reusable scratch buffer.
 *
 * @param {Uint8ClampedArray} pixels - Pixel data to transform in place
 * @param {number} width - Image width in pixels
 * @param {number} height - Image height in pixels
 * @param {Uint8ClampedArray|null} scratchBuffer - Reusable scratch buffer. Callers must size it
 *   >= pixels.length; an undersized or missing buffer forces a fresh allocation on every
 *   call, which defeats its purpose in the per-frame render path.
 * @param {Function} transformFn - (x, y) => source byte index for pixel at (x, y)
 * @returns {boolean} Always true to indicate the buffer was modified
 */
export function transformCopy(pixels, width, height, scratchBuffer, transformFn) {
	if (!scratchBuffer || scratchBuffer.length < pixels.length) {
		scratchBuffer = new Uint8ClampedArray(pixels.length);
	}
	const destinationPixels = scratchBuffer;
	for (let y = 0; y < height; y++) {
		for (let x = 0; x < width; x++) {
			const destinationPixelIndex = (y * width + x) * RGBA_CHANNEL_COUNT;
			const sourcePixelIndex = transformFn(x, y);
			destinationPixels[destinationPixelIndex] = pixels[sourcePixelIndex];
			destinationPixels[destinationPixelIndex + 1] = pixels[sourcePixelIndex + 1];
			destinationPixels[destinationPixelIndex + 2] = pixels[sourcePixelIndex + 2];
			destinationPixels[destinationPixelIndex + 3] = pixels[sourcePixelIndex + 3];
		}
	}
	pixels.set(destinationPixels);
	return true;
}
