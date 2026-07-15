import { MAX_MIDI_VELOCITY, RGBA_CHANNEL_COUNT } from './effectConstants.js';

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
		const pixels = imageData.data;
		const { width, scratchBuffer, effectParams } = effectContext;
		const { glitchMaxDisplacement, glitchPixelProbability } = effectParams;
		const intensity = effect.velocity / MAX_MIDI_VELOCITY;

		const original = !scratchBuffer || scratchBuffer.length < pixels.length ? new Uint8ClampedArray(pixels.length) : scratchBuffer;
		original.set(pixels);

		const rowBytes = width * RGBA_CHANNEL_COUNT;
		const glitchAmount = Math.floor(intensity * glitchMaxDisplacement);
		let isMutated = false;

		for (let i = 0; i < pixels.length; i += RGBA_CHANNEL_COUNT) {
			if (Math.random() < intensity * glitchPixelProbability) {
				const rowStart = Math.floor(i / rowBytes) * rowBytes;
				const rowEnd = rowStart + rowBytes - RGBA_CHANNEL_COUNT;
				const offsetPixels = Math.floor(Math.random() * (glitchAmount + 1)) - Math.floor(glitchAmount / 2);
				const offsetBytes = offsetPixels * RGBA_CHANNEL_COUNT;
				const sourcePixelIndex = Math.max(rowStart, Math.min(rowEnd, i + offsetBytes));
				pixels[i] = original[sourcePixelIndex];
				pixels[i + 1] = original[sourcePixelIndex + 1];
				pixels[i + 2] = original[sourcePixelIndex + 2];
				isMutated = true;
			}
		}
		return isMutated;
	},

	type: 'glitch'
};
