import { MAX_MIDI_VELOCITY } from '../../core/midiConstants.js';
import { RGBA_CHANNEL_COUNT, RGB_CHANNEL_COUNT } from './effectConstants.js';
import { getEffectVariant } from './effectVariant.js';

/** Mid-gray luminance: no displacement; below shifts one way, above the other. */
const MID_GRAY_LUMINANCE = 128;

/**
 * Grayscale displacement effect: Uses pixel luminance as a displacement map.
 *
 * Lo-fi Amiga demo scene aesthetic:
 * - 50% gray (MID_GRAY_LUMINANCE) = no displacement
 * - Values < mid-gray shift left (or up)
 * - Values > mid-gray shift right (or down)
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

		// Bail out before copying the frame — low velocities would otherwise copy and discard it every frame.
		const maxShift = Math.floor(intensity * grayscaleDisplacementMaxShift);
		if (maxShift === 0) {
			return false;
		}

		const original = !scratchBuffer || scratchBuffer.length < pixels.length ? new Uint8ClampedArray(pixels.length) : scratchBuffer;
		original.set(pixels);

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

			const luminance = (original[idx] + original[idx + 1] + original[idx + 2]) / RGB_CHANNEL_COUNT;
			const displacement = luminance > MID_GRAY_LUMINANCE ? Math.floor(((luminance - MID_GRAY_LUMINANCE) / MID_GRAY_LUMINANCE) * maxShift) : -Math.floor(((MID_GRAY_LUMINANCE - luminance) / MID_GRAY_LUMINANCE) * maxShift);

			const shiftAmount = Math.max(-maxShift, Math.min(maxShift, displacement));
			if (shiftAmount === 0) {
				continue;
			}

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

			const luminance = (original[idx] + original[idx + 1] + original[idx + 2]) / RGB_CHANNEL_COUNT;
			const displacement = luminance > MID_GRAY_LUMINANCE ? Math.floor(((luminance - MID_GRAY_LUMINANCE) / MID_GRAY_LUMINANCE) * maxShift) : -Math.floor(((MID_GRAY_LUMINANCE - luminance) / MID_GRAY_LUMINANCE) * maxShift);

			const shiftAmount = Math.max(-maxShift, Math.min(maxShift, displacement));
			if (shiftAmount === 0) {
				continue;
			}

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
