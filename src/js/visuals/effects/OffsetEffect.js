import { transformCopy } from './pixelUtils.js';

/**
 * Offset effect: shift the image horizontally or vertically with wrap-around.
 */
export default {
	/**
	 * @param {ImageData} imageData
	 * @param {{note: number, velocity: number}} effect
	 * @param {number} _timestamp
	 * @param {{width: number, height: number, effectRanges: Object, effectParams: Object, scratchBuffer: Uint8ClampedArray|null}} effectContext
	 */
	apply(imageData, effect, _timestamp, effectContext) {
		const data = imageData.data;
		const { width, height, scratchBuffer } = effectContext;
		const noteInRange = effect.note - effectContext.effectRanges.offset.min;
		const { effectVariantThreshold } = effectContext.effectParams;
		const intensity = effect.velocity / 127;

		if (noteInRange < effectVariantThreshold) {
			const offsetX = Math.floor(intensity * width);
			transformCopy(data, width, height, scratchBuffer, (x, y) => (y * width + ((x + offsetX) % width)) * 4);
		} else {
			const offsetY = Math.floor(intensity * height);
			transformCopy(data, width, height, scratchBuffer, (x, y) => (((y + offsetY) % height) * width + x) * 4);
		}
		return true;
	},

	type: 'offset',
	// Reads effect.note to pick the variant; the pipeline skips malformed entries
	requiresNote: true
};
