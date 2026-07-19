import { MAX_MIDI_VELOCITY, RGBA_CHANNEL_COUNT, RGB_CHANNEL_COUNT } from './effectConstants.js';
import { getEffectVariant } from './effectVariant.js';

/**
 * Grayscale displacement effect: Uses pixel luminance as a displacement map.
 *
 * Lo-fi Amiga demo scene aesthetic:
 * - 50% gray (128) = no displacement
 * - Values < 128 shift left (or up)
 * - Values > 128 shift right (or down)
 * - Uses integer math with no interpolation for crude, stepped look
 * - Intensity controlled by MIDI velocity
 */
export default {
	/**
	 * @param {ImageData} imageData
	 * @param {{note: number, velocity: number}} effect
	 * @param {number} _timestamp
	 * @param {{width: number, height: number, scratchBuffer: Uint8ClampedArray|null, effectParams: Object, effectRanges: Object}} effectContext
	 * @returns {boolean} True if pixels were modified
	 *
	 * Scratch buffer usage: Copies imageData.data into the scratch buffer to preserve
	 * original pixel values for displacement sampling. Does not retain the scratch
	 * buffer reference after returning.
	 */
	apply(imageData, effect, _timestamp, effectContext) {
		const pixels = imageData.data;
		const { width, height, scratchBuffer, effectParams, effectRanges } = effectContext;
		const { effectVariantThreshold, grayscaleDisplacementMaxShift } = effectParams;
		const { isVariantA } = getEffectVariant(effect.note, effectRanges.grayscaleDisplacement, effectVariantThreshold);
		const intensity = effect.velocity / MAX_MIDI_VELOCITY;

		const original = !scratchBuffer || scratchBuffer.length < pixels.length ? new Uint8ClampedArray(pixels.length) : scratchBuffer;
		original.set(pixels);

		const maxShift = Math.floor(intensity * grayscaleDisplacementMaxShift);
		if (maxShift === 0) {
			return false;
		}

		return isVariantA ? applyHorizontalDisplacement(pixels, original, width, height, maxShift) : applyVerticalDisplacement(pixels, original, width, height, maxShift);
	},

	type: 'grayscaleDisplacement',
	requiresNote: true
};

/**
 * Horizontal displacement: luminance drives left/right shift.
 * Lo-fi: uses integer math, no interpolation, stepped displacement.
 */
function applyHorizontalDisplacement(pixels, original, width, height, maxShift) {
	const rowBytes = width * RGBA_CHANNEL_COUNT;
	let isMutated = false;

	for (let y = 0; y < height; y++) {
		const rowStart = y * rowBytes;
		for (let x = 0; x < width; x++) {
			const idx = rowStart + x * RGBA_CHANNEL_COUNT;

			// Calculate luminance (simple average for lo-fi look)
			const luminance = (original[idx] + original[idx + 1] + original[idx + 2]) / RGB_CHANNEL_COUNT;

			// Displacement: 128 = no shift, <128 = left, >128 = right
			// Lo-fi: use integer math with stepped values, scaled by maxShift
			const displacement = luminance > 128 ? Math.floor(((luminance - 128) / 128) * maxShift) : -Math.floor(((128 - luminance) / 128) * maxShift);

			const shiftAmount = Math.max(-maxShift, Math.min(maxShift, displacement));
			if (shiftAmount === 0) {
				continue;
			}

			// Wrap-around displacement
			const sourceX = (x + shiftAmount + width) % width;
			const sourceIdx = rowStart + sourceX * RGBA_CHANNEL_COUNT;

			pixels[idx] = original[sourceIdx];
			pixels[idx + 1] = original[sourceIdx + 1];
			pixels[idx + 2] = original[sourceIdx + 2];
			isMutated = true;
		}
	}
	return isMutated;
}

/**
 * Vertical displacement: luminance drives up/down shift.
 * Lo-fi: uses integer math, no interpolation, stepped displacement.
 */
function applyVerticalDisplacement(pixels, original, width, height, maxShift) {
	const rowBytes = width * RGBA_CHANNEL_COUNT;
	let isMutated = false;

	for (let y = 0; y < height; y++) {
		for (let x = 0; x < width; x++) {
			const idx = y * rowBytes + x * RGBA_CHANNEL_COUNT;

			// Calculate luminance (simple average for lo-fi look)
			const luminance = (original[idx] + original[idx + 1] + original[idx + 2]) / RGB_CHANNEL_COUNT;

			// Displacement: 128 = no shift, <128 = up, >128 = down
			// Lo-fi: use integer math with stepped values, scaled by maxShift
			const displacement = luminance > 128 ? Math.floor(((luminance - 128) / 128) * maxShift) : -Math.floor(((128 - luminance) / 128) * maxShift);

			const shiftAmount = Math.max(-maxShift, Math.min(maxShift, displacement));
			if (shiftAmount === 0) {
				continue;
			}

			// Wrap-around displacement
			const sourceY = (y + shiftAmount + height) % height;
			const sourceIdx = sourceY * rowBytes + x * RGBA_CHANNEL_COUNT;

			pixels[idx] = original[sourceIdx];
			pixels[idx + 1] = original[sourceIdx + 1];
			pixels[idx + 2] = original[sourceIdx + 2];
			isMutated = true;
		}
	}
	return isMutated;
}
