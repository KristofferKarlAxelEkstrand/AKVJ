/**
 * Pixel utilities shared by CPU-based canvas effects.
 */

/**
 * Transform-copy pixel data using a source-index function.
 * Writes the transformed result back into `data` using a reusable scratch buffer.
 *
 * @param {Uint8ClampedArray} data - Pixel data to transform in place
 * @param {number} width - Image width in pixels
 * @param {number} height - Image height in pixels
 * @param {Uint8ClampedArray|null} scratchBuffer - Reusable scratch buffer. Callers must size it
 *   >= data.length; an undersized or missing buffer forces a fresh allocation on every
 *   call, which defeats its purpose in the per-frame render path.
 * @param {Function} transformFn - (x, y) => source byte index for pixel at (x, y)
 * @returns {boolean} Always true to indicate the buffer was modified
 */
export function transformCopy(data, width, height, scratchBuffer, transformFn) {
	if (!scratchBuffer || scratchBuffer.length < data.length) {
		scratchBuffer = new Uint8ClampedArray(data.length);
	}
	const out = scratchBuffer;
	for (let y = 0; y < height; y++) {
		for (let x = 0; x < width; x++) {
			const dst = (y * width + x) * 4;
			const src = transformFn(x, y);
			out[dst] = data[src];
			out[dst + 1] = data[src + 1];
			out[dst + 2] = data[src + 2];
			out[dst + 3] = data[src + 3];
		}
	}
	data.set(out);
	return true;
}
