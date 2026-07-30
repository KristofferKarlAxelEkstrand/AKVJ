import { MAX_MIDI_VELOCITY } from '../../core/midiConstants.js';
import { RGBA_CHANNEL_COUNT, RGB_CHANNEL_COUNT, MAX_COLOR_VALUE } from './effectConstants.js';
import { getEffectVariant } from './effectVariant.js';

/** Max horizontal channel shift (px) for lo-fi chromatic aberration at full intensity. */
const CHROMATIC_ABERRATION_SHIFT_PIXELS = 4;

/** Quantization params per grayscale-blend bit depth (divisor + max level). */
const GRAYSCALE_BLEND_BIT_DEPTH_PARAMS = {
	2: { divisor: 64, maxLevel: 3 },
	4: { divisor: 16, maxLevel: 15 },
	8: { divisor: 1, maxLevel: 255 }
};

/**
 * Grayscale blend effect: Uses pixel luminance to drive soft blending between
 * the original image and a modified version.
 *
 * Lo-fi Amiga demo scene aesthetic:
 * - Reuses multi-bit mask blend math from Compositor.js
 * - Uses lower bit-depth quantization (2-bit or 4-bit) for visible stepping
 * - Creates crude, banded blends instead of smooth gradients
 * - Intensity controlled by MIDI velocity
 *
 * Variant A: Blend with inverted colors (lo-fi posterize-like effect)
 * Variant B: Blend with shifted colors (lo-fi chromatic aberration)
 */
export default {
	/**
	 * @param {ImageData} imageData
	 * @param {{note: number, velocity: number}} effect
	 * @param {number} _timestamp
	 * @param {{width: number, height: number, scratchBuffer: Uint8ClampedArray|null, secondaryScratchBuffer: Uint8ClampedArray|null, effectParams: Object, effectRanges: Object}} effectContext
	 * @returns {boolean} True if pixels were modified
	 *
	 * Scratch buffer usage: needs two working buffers — the primary holds a pristine copy
	 * of imageData.data to blend from, the secondary holds the modified version. Both are
	 * pipeline-owned and fully overwritten before being read; neither reference is retained
	 * after returning.
	 */
	apply(imageData, effect, _timestamp, effectContext) {
		const pixels = imageData.data;
		const { width, height, scratchBuffer, secondaryScratchBuffer, effectParams, effectRanges } = effectContext;
		const { effectVariantThreshold, grayscaleBlendBitDepth } = effectParams;
		const { isVariantA } = getEffectVariant(effect.note, effectRanges.grayscaleBlend, effectVariantThreshold);
		const intensity = effect.velocity / MAX_MIDI_VELOCITY;

		const original = usableBuffer(scratchBuffer, pixels.length);
		original.set(pixels);

		// Modified buffer is written in full before it is read
		const modified = usableBuffer(secondaryScratchBuffer, pixels.length);
		if (isVariantA) {
			createInvertedVersion(pixels, modified, intensity);
		} else {
			createShiftedVersion(pixels, modified, width, intensity);
		}

		const { divisor, maxLevel } = grayscaleBlendParamsFor(grayscaleBlendBitDepth);

		return applyGrayscaleBlend(pixels, original, modified, width, height, divisor, maxLevel);
	},

	type: 'grayscaleBlend',
	requiresNote: true
};

/**
 * Return the pipeline-owned buffer when it is big enough, otherwise allocate a
 * fallback. Standalone callers (tests) may not supply pipeline buffers.
 * @param {Uint8ClampedArray|null|undefined} buffer
 * @param {number} requiredLength
 * @returns {Uint8ClampedArray}
 */
function usableBuffer(buffer, requiredLength) {
	return !buffer || buffer.length < requiredLength ? new Uint8ClampedArray(requiredLength) : buffer;
}

/**
 * Create inverted color version with intensity scaling.
 * Lo-fi: simple channel inversion, no sophisticated color math.
 */
function createInvertedVersion(pixels, modified, intensity) {
	for (let i = 0; i < pixels.length; i += RGBA_CHANNEL_COUNT) {
		// Lerp toward inverted value (MAX - channel), not flat white
		modified[i] = pixels[i] + (MAX_COLOR_VALUE - pixels[i] - pixels[i]) * intensity;
		modified[i + 1] = pixels[i + 1] + (MAX_COLOR_VALUE - pixels[i + 1] - pixels[i + 1]) * intensity;
		modified[i + 2] = pixels[i + 2] + (MAX_COLOR_VALUE - pixels[i + 2] - pixels[i + 2]) * intensity;
		modified[i + 3] = pixels[i + 3];
	}
}

/**
 * Create color-shifted version (lo-fi chromatic aberration).
 * Lo-fi: simple channel shifting, no sub-pixel precision.
 */
function createShiftedVersion(pixels, modified, width, intensity) {
	const shiftAmount = Math.floor(intensity * CHROMATIC_ABERRATION_SHIFT_PIXELS);
	for (let i = 0; i < pixels.length; i += RGBA_CHANNEL_COUNT) {
		const x = (i / RGBA_CHANNEL_COUNT) % width;

		const redSourceX = (x - shiftAmount + width) % width;
		const blueSourceX = (x + shiftAmount) % width;

		const redIdx = i - (x - redSourceX) * RGBA_CHANNEL_COUNT;
		const blueIdx = i + (blueSourceX - x) * RGBA_CHANNEL_COUNT;

		modified[i] = pixels[redIdx];
		modified[i + 1] = pixels[i + 1];
		modified[i + 2] = pixels[blueIdx + 2];
		modified[i + 3] = pixels[i + 3];
	}
}

/**
 * Apply grayscale-driven blend using multi-bit quantization.
 * Reuses Compositor.js mixPixelMultiBit math for lo-fi stepped blending.
 */
function applyGrayscaleBlend(pixels, original, modified, width, height, divisor, maxLevel) {
	const pixelCount = width * height;
	let isMutated = false;

	for (let i = 0; i < pixelCount; i++) {
		const idx = i * RGBA_CHANNEL_COUNT;

		const luminance = (original[idx] + original[idx + 1] + original[idx + 2]) / RGB_CHANNEL_COUNT;
		const blendFactor = Math.floor(luminance / divisor) / maxLevel;

		for (let channel = 0; channel < RGB_CHANNEL_COUNT; channel++) {
			const newValue = original[idx + channel] + (modified[idx + channel] - original[idx + channel]) * blendFactor;
			pixels[idx + channel] = newValue;
		}
		pixels[idx + RGBA_CHANNEL_COUNT - 1] = original[idx + RGBA_CHANNEL_COUNT - 1];

		isMutated = true;
	}
	return isMutated;
}

/**
 * Quantization params for grayscale-blend bit depth.
 * Lower bit depths create more visible stepping (lo-fi look).
 * Distinct from Compositor.#getBitDepthParams (same shape, different tables).
 */
function grayscaleBlendParamsFor(bitDepth) {
	return GRAYSCALE_BLEND_BIT_DEPTH_PARAMS[bitDepth] ?? GRAYSCALE_BLEND_BIT_DEPTH_PARAMS[8];
}
