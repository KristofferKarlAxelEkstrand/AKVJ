import { RGBA_CHANNEL_COUNT } from './effectConstants.js';

/**
 * Mirror effect: reflect the left/top half onto the right/bottom half.
 */
export default {
	/**
	 * @param {ImageData} imageData
	 * @param {{note: number}} effect
	 * @param {number} _timestamp
	 * @param {{width: number, height: number, effectRanges: Object, effectParams: Object}} effectContext
	 */
	apply(imageData, effect, _timestamp, effectContext) {
		const pixels = imageData.data;
		const { width, height } = effectContext;
		const noteInRange = effect.note - effectContext.effectRanges.mirror.min;
		const { effectVariantThreshold } = effectContext.effectParams;

		if (noteInRange < effectVariantThreshold) {
			// Horizontal mirror: copy left half to right half
			for (let y = 0; y < height; y++) {
				for (let x = 0; x < width / 2; x++) {
					const sourcePixelIndex = (y * width + x) * RGBA_CHANNEL_COUNT;
					const destinationPixelIndex = (y * width + (width - 1 - x)) * RGBA_CHANNEL_COUNT;
					pixels[destinationPixelIndex] = pixels[sourcePixelIndex];
					pixels[destinationPixelIndex + 1] = pixels[sourcePixelIndex + 1];
					pixels[destinationPixelIndex + 2] = pixels[sourcePixelIndex + 2];
					pixels[destinationPixelIndex + 3] = pixels[sourcePixelIndex + 3];
				}
			}
		} else {
			// Vertical mirror: copy top half to bottom half
			for (let y = 0; y < height / 2; y++) {
				for (let x = 0; x < width; x++) {
					const sourcePixelIndex = (y * width + x) * RGBA_CHANNEL_COUNT;
					const destinationPixelIndex = ((height - 1 - y) * width + x) * RGBA_CHANNEL_COUNT;
					pixels[destinationPixelIndex] = pixels[sourcePixelIndex];
					pixels[destinationPixelIndex + 1] = pixels[sourcePixelIndex + 1];
					pixels[destinationPixelIndex + 2] = pixels[sourcePixelIndex + 2];
					pixels[destinationPixelIndex + 3] = pixels[sourcePixelIndex + 3];
				}
			}
		}
		return true;
	},

	type: 'mirror',
	// Reads effect.note to pick the variant; the pipeline skips malformed entries
	requiresNote: true
};
