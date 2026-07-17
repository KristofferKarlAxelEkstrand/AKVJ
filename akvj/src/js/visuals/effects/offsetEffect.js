import { transformCopy } from './pixelUtils.js';
import { MAX_MIDI_VELOCITY, RGBA_CHANNEL_COUNT } from './effectConstants.js';

/**
 * Offset effect: shift the image horizontally or vertically with wrap-around.
 */
export default {
	/**
	 * @param {ImageData} imageData
	 * @param {{note: number, velocity: number}} effect
	 * @param {number} _timestamp
	 * @param {{width: number, height: number, effectRanges: Object, effectParams: Object, scratchBuffer: Uint8ClampedArray|null}} effectContext
	 * @returns {boolean} True if pixels were modified
	 *
	 * Scratch buffer usage: Copies imageData.data into the scratch buffer via
	 * transformCopy(), which reads from the scratch buffer and writes to
	 * imageData.data for the wrap-around transform. Does not retain the
	 * scratch buffer reference after returning.
	 */
	apply(imageData, effect, _timestamp, effectContext) {
		const pixels = imageData.data;
		const { width, height, scratchBuffer } = effectContext;
		const noteInRange = effect.note - effectContext.effectRanges.offset.min;
		const { effectVariantThreshold } = effectContext.effectParams;
		const intensity = effect.velocity / MAX_MIDI_VELOCITY;

		if (noteInRange < effectVariantThreshold) {
			const offsetX = Math.floor(intensity * width);
			transformCopy(pixels, width, height, scratchBuffer, (x, y) => (y * width + ((x + offsetX) % width)) * RGBA_CHANNEL_COUNT);
		} else {
			const offsetY = Math.floor(intensity * height);
			transformCopy(pixels, width, height, scratchBuffer, (x, y) => (((y + offsetY) % height) * width + x) * RGBA_CHANNEL_COUNT);
		}
		return true;
	},

	type: 'offset',
	// Reads effect.note to pick the variant; the pipeline skips malformed entries
	requiresNote: true
};
