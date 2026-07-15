/**
 * Glitch effect: randomly displace pixels horizontally within the same row.
 */
export default {
	/**
	 * @param {ImageData} imageData
	 * @param {{velocity: number}} effect
	 * @param {number} _timestamp
	 * @param {{width: number, scratchBuffer: Uint8ClampedArray|null, effectParams: Object}} effectContext
	 */
	apply(imageData, effect, _timestamp, effectContext) {
		const data = imageData.data;
		const { width, scratchBuffer, effectParams } = effectContext;
		const { glitchMaxDisplacement, glitchPixelProbability } = effectParams;
		const intensity = effect.velocity / 127;

		let original = scratchBuffer;
		if (!original || original.length < data.length) {
			original = new Uint8ClampedArray(data.length);
		}
		original.set(data);

		const rowBytes = width * 4;
		const glitchAmount = Math.floor(intensity * glitchMaxDisplacement);
		let mutated = false;

		for (let i = 0; i < data.length; i += 4) {
			if (Math.random() < intensity * glitchPixelProbability) {
				const rowStart = Math.floor(i / rowBytes) * rowBytes;
				const rowEnd = rowStart + rowBytes - 4;
				const offsetPx = Math.floor(Math.random() * (glitchAmount + 1)) - Math.floor(glitchAmount / 2);
				const offsetBytes = offsetPx * 4;
				const srcIdx = Math.max(rowStart, Math.min(rowEnd, i + offsetBytes));
				data[i] = original[srcIdx];
				data[i + 1] = original[srcIdx + 1];
				data[i + 2] = original[srcIdx + 2];
				mutated = true;
			}
		}
		return mutated;
	},

	type: 'glitch'
};
