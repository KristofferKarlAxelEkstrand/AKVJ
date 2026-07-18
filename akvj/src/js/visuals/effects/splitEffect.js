import { transformCopy } from './pixelUtils.js';
import { RGBA_CHANNEL_COUNT } from './effectConstants.js';
import { getEffectVariant } from './effectVariant.js';

/**
 * Split effect: divide the image into repeating horizontal or vertical sections.
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
	 * imageData.data for the section repeat transform. Does not retain the
	 * scratch buffer reference after returning.
	 */
	apply(imageData, effect, _timestamp, effectContext) {
		const pixels = imageData.data;
		const { width, height, scratchBuffer } = effectContext;
		const { effectVariantThreshold, splitMin, splitMax } = effectContext.effectParams;
		const { noteInRange, isVariantA } = getEffectVariant(effect.note, effectContext.effectRanges.split, effectVariantThreshold);
		const splits = Math.min(splitMax, Math.max(splitMin, Math.floor(noteInRange / 2) + splitMin));

		if (isVariantA) {
			applyHorizontalSplit(pixels, width, height, scratchBuffer, splits);
		} else {
			applyVerticalSplit(pixels, width, height, scratchBuffer, splits);
		}
		return true;
	},

	type: 'split',
	// Reads effect.note to pick the variant; the pipeline skips malformed entries
	requiresNote: true
};

function applyHorizontalSplit(pixels, width, height, scratchBuffer, splits) {
	transformCopy(pixels, width, height, scratchBuffer, (x, y) => {
		const sectionWidth = Math.floor(width / splits);
		const sourceX = ((x % sectionWidth) * splits) % width;
		return (y * width + sourceX) * RGBA_CHANNEL_COUNT;
	});
}

function applyVerticalSplit(pixels, width, height, scratchBuffer, splits) {
	transformCopy(pixels, width, height, scratchBuffer, (x, y) => {
		const sectionHeight = Math.floor(height / splits);
		const sourceY = ((y % sectionHeight) * splits) % height;
		return (sourceY * width + x) * RGBA_CHANNEL_COUNT;
	});
}
