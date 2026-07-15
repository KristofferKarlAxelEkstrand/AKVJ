/**
 * Color effect: invert or posterize RGB channels based on note and intensity.
 */
export default {
	/**
	 * @param {ImageData} imageData
	 * @param {{note: number, velocity: number}} effect
	 * @param {number} _timestamp
	 * @param {{effectRanges: Object, effectParams: Object}} effectContext
	 */
	apply(imageData, effect, _timestamp, effectContext) {
		const data = imageData.data;
		const noteInRange = effect.note - effectContext.effectRanges.color.min;
		const { effectVariantThreshold, posterizeBaseLevels, posterizeIntensityScale } = effectContext.effectParams;
		const intensity = effect.velocity / 127;

		if (noteInRange < effectVariantThreshold) {
			for (let i = 0; i < data.length; i += 4) {
				data[i] = 255 - data[i];
				data[i + 1] = 255 - data[i + 1];
				data[i + 2] = 255 - data[i + 2];
			}
		} else {
			const levels = Math.max(2, Math.floor(posterizeBaseLevels - intensity * posterizeIntensityScale));
			const step = 255 / levels;
			for (let i = 0; i < data.length; i += 4) {
				data[i] = Math.floor(data[i] / step) * step;
				data[i + 1] = Math.floor(data[i + 1] / step) * step;
				data[i + 2] = Math.floor(data[i + 2] / step) * step;
			}
		}
		return true;
	},

	type: 'color',
	// Reads effect.note to pick the variant; the pipeline skips malformed entries
	requiresNote: true
};
