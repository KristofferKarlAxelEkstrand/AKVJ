import { transformCopy } from './pixelUtils.js';
import { RGBA_CHANNEL_COUNT } from './effectConstants.js';
import { getEffectVariant } from './effectVariant.js';

/**
 * Mirror effect: reflect the left/top half onto the right/bottom half.
 */
export default {
	/**
	 * @param {ImageData} imageData
	 * @param {{note: number}} effect
	 * @param {number} _timestamp
	 * @param {{width: number, height: number, effectRanges: Object, effectParams: Object, scratchBuffer: Uint8ClampedArray|null}} effectContext
	 */
	apply(imageData, effect, _timestamp, effectContext) {
		const pixels = imageData.data;
		const { width, height, scratchBuffer } = effectContext;
		const { effectVariantThreshold } = effectContext.effectParams;
		const { isVariantA } = getEffectVariant(effect.note, effectContext.effectRanges.mirror, effectVariantThreshold);

		if (isVariantA) {
			transformCopy(pixels, width, height, scratchBuffer, (x, y) => {
				const sourceX = x < width / 2 ? x : width - 1 - x;
				return (y * width + sourceX) * RGBA_CHANNEL_COUNT;
			});
		} else {
			transformCopy(pixels, width, height, scratchBuffer, (x, y) => {
				const sourceY = y < height / 2 ? y : height - 1 - y;
				return (sourceY * width + x) * RGBA_CHANNEL_COUNT;
			});
		}
		return true;
	},

	type: 'mirror',
	requiresNote: true
};
