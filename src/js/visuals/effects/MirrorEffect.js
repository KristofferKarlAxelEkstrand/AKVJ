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
		const data = imageData.data;
		const { width, height } = effectContext;
		const noteInRange = effect.note - effectContext.effectRanges.mirror.min;
		const { effectVariantThreshold } = effectContext.effectParams;

		if (noteInRange < effectVariantThreshold) {
			// Horizontal mirror: copy left half to right half
			for (let y = 0; y < height; y++) {
				for (let x = 0; x < width / 2; x++) {
					const srcIdx = (y * width + x) * 4;
					const dstIdx = (y * width + (width - 1 - x)) * 4;
					data[dstIdx] = data[srcIdx];
					data[dstIdx + 1] = data[srcIdx + 1];
					data[dstIdx + 2] = data[srcIdx + 2];
					data[dstIdx + 3] = data[srcIdx + 3];
				}
			}
		} else {
			// Vertical mirror: copy top half to bottom half
			for (let y = 0; y < height / 2; y++) {
				for (let x = 0; x < width; x++) {
					const srcIdx = (y * width + x) * 4;
					const dstIdx = ((height - 1 - y) * width + x) * 4;
					data[dstIdx] = data[srcIdx];
					data[dstIdx + 1] = data[srcIdx + 1];
					data[dstIdx + 2] = data[srcIdx + 2];
					data[dstIdx + 3] = data[srcIdx + 3];
				}
			}
		}
		return true;
	},

	type: 'mirror',
	// Reads effect.note to pick the variant; the pipeline skips malformed entries
	requiresNote: true
};
