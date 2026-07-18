import { MAX_MIDI_VELOCITY, RGBA_CHANNEL_COUNT, MAX_COLOR_VALUE } from './effectConstants.js';
import { getEffectVariant } from './effectVariant.js';

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
		const pixels = imageData.data;
		const { effectVariantThreshold, posterizeBaseLevels, posterizeIntensityScale } = effectContext.effectParams;
		const { isVariantA } = getEffectVariant(effect.note, effectContext.effectRanges.color, effectVariantThreshold);
		const intensity = effect.velocity / MAX_MIDI_VELOCITY;

		if (isVariantA) {
			invertColors(pixels);
		} else {
			posterizeColors(pixels, posterizeBaseLevels, posterizeIntensityScale, intensity);
		}
		return true;
	},

	type: 'color',
	requiresNote: true
};

function invertColors(pixels) {
	for (let i = 0; i < pixels.length; i += RGBA_CHANNEL_COUNT) {
		pixels[i] = MAX_COLOR_VALUE - pixels[i];
		pixels[i + 1] = MAX_COLOR_VALUE - pixels[i + 1];
		pixels[i + 2] = MAX_COLOR_VALUE - pixels[i + 2];
	}
}

function posterizeColors(pixels, posterizeBaseLevels, posterizeIntensityScale, intensity) {
	const levels = Math.max(2, Math.floor(posterizeBaseLevels - intensity * posterizeIntensityScale));
	const step = MAX_COLOR_VALUE / levels;
	for (let i = 0; i < pixels.length; i += RGBA_CHANNEL_COUNT) {
		pixels[i] = Math.floor(pixels[i] / step) * step;
		pixels[i + 1] = Math.floor(pixels[i + 1] / step) * step;
		pixels[i + 2] = Math.floor(pixels[i + 2] / step) * step;
	}
}
