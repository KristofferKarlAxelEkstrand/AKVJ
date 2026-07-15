import { transformCopy } from './pixelUtils.js';
import { RGBA_CHANNEL_COUNT } from './effectConstants.js';

/**
 * Split effect: divide the image into repeating horizontal or vertical sections.
 */
export default {
	/**
	 * @param {ImageData} imageData
	 * @param {{note: number, velocity: number}} effect
	 * @param {number} _timestamp
	 * @param {{width: number, height: number, effectRanges: Object, effectParams: Object, scratchBuffer: Uint8ClampedArray|null}} effectContext
	 */
	apply(imageData, effect, _timestamp, effectContext) {
		const pixels = imageData.data;
		const { width, height, scratchBuffer } = effectContext;
		const noteInRange = effect.note - effectContext.effectRanges.split.min;
		const { effectVariantThreshold, splitMin, splitMax } = effectContext.effectParams;

		const splits = Math.min(splitMax, Math.max(splitMin, Math.floor(noteInRange / 2) + splitMin));

		if (noteInRange < effectVariantThreshold) {
			// Horizontal split
			transformCopy(pixels, width, height, scratchBuffer, (x, y) => {
				const sectionWidth = Math.floor(width / splits);
				const sourceX = ((x % sectionWidth) * splits) % width;
				return (y * width + sourceX) * RGBA_CHANNEL_COUNT;
			});
		} else {
			// Vertical split
			transformCopy(pixels, width, height, scratchBuffer, (x, y) => {
				const sectionHeight = Math.floor(height / splits);
				const sourceY = ((y % sectionHeight) * splits) % height;
				return (sourceY * width + x) * RGBA_CHANNEL_COUNT;
			});
		}
		return true;
	},

	type: 'split',
	// Reads effect.note to pick the variant; the pipeline skips malformed entries
	requiresNote: true
};
