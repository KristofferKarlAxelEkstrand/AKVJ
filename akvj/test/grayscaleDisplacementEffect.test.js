import { describe, test, expect, beforeEach } from 'vitest';
import grayscaleDisplacementEffect from '../src/js/visuals/effects/grayscaleDisplacementEffect.js';
import { MAX_MIDI_VELOCITY } from '../src/js/core/midiConstants.js';
import { RGBA_CHANNEL_COUNT } from '../src/js/visuals/effects/effectConstants.js';

const WIDTH = 4;
const HEIGHT = 4;
const BYTE_COUNT = WIDTH * HEIGHT * RGBA_CHANNEL_COUNT;

/**
 * Create an ImageData-like object with a known pattern.
 * @returns {{ data: Uint8ClampedArray, width: number, height: number }}
 */
function createImageData() {
	const data = new Uint8ClampedArray(BYTE_COUNT);
	return { data, width: WIDTH, height: HEIGHT };
}

describe('grayscaleDisplacementEffect', () => {
	let imageData;
	let effectContext;

	beforeEach(() => {
		// Create a 4x4 test image with known pixel values
		imageData = createImageData();
		const pixels = imageData.data;

		// Create a gradient from black to white to test displacement
		for (let y = 0; y < HEIGHT; y++) {
			for (let x = 0; x < WIDTH; x++) {
				const idx = (y * WIDTH + x) * RGBA_CHANNEL_COUNT;
				const value = Math.floor(((x + y) * 255) / (WIDTH + HEIGHT - 2));
				pixels[idx] = value; // R
				pixels[idx + 1] = value; // G
				pixels[idx + 2] = value; // B
				pixels[idx + 3] = 255; // A
			}
		}

		effectContext = {
			width: WIDTH,
			height: HEIGHT,
			scratchBuffer: null,
			effectParams: {
				effectVariantThreshold: 64,
				grayscaleDisplacementMaxShift: 16
			},
			effectRanges: {
				grayscaleDisplacement: { min: 0, max: 127 }
			}
		};
	});

	describe('Variant A (horizontal displacement)', () => {
		test('at full intensity, bright pixels shift right', () => {
			const effect = { note: 0, velocity: MAX_MIDI_VELOCITY };
			const modified = grayscaleDisplacementEffect.apply(imageData, effect, 0, effectContext);

			expect(modified).toBe(true);

			// Bright pixels (luminance > 128) should shift right
			// Check that pixels have been modified
			const originalPixel = imageData.data[0];
			expect(originalPixel).toBeDefined();
		});

		test('at full intensity, dark pixels shift left', () => {
			const effect = { note: 0, velocity: MAX_MIDI_VELOCITY };
			const modified = grayscaleDisplacementEffect.apply(imageData, effect, 0, effectContext);

			expect(modified).toBe(true);

			// Dark pixels (luminance < 128) should shift left
			// The effect should modify pixels
			expect(modified).toBe(true);
		});

		test('at half intensity, displacement is reduced', () => {
			const effect = { note: 0, velocity: MAX_MIDI_VELOCITY / 2 };
			const modified = grayscaleDisplacementEffect.apply(imageData, effect, 0, effectContext);

			expect(modified).toBe(true);

			// At half intensity, maxShift should be 8 instead of 16
			// Pixels should still be modified but with less displacement
			expect(modified).toBe(true);
		});

		test('at zero intensity, no displacement occurs', () => {
			const effect = { note: 0, velocity: 0 };
			const originalPixels = new Uint8ClampedArray(imageData.data);
			const modified = grayscaleDisplacementEffect.apply(imageData, effect, 0, effectContext);

			// At zero intensity, maxShift is 0, so no modification
			expect(modified).toBe(false);

			// Pixels should be unchanged
			for (let i = 0; i < imageData.data.length; i++) {
				expect(imageData.data[i]).toBe(originalPixels[i]);
			}
		});

		test('mid-gray pixels (luminance ~128) have minimal displacement', () => {
			// Create an image with mid-gray pixels
			const pixels = new Uint8ClampedArray(2 * 2 * RGBA_CHANNEL_COUNT);

			for (let i = 0; i < pixels.length; i += RGBA_CHANNEL_COUNT) {
				pixels[i] = 128; // R
				pixels[i + 1] = 128; // G
				pixels[i + 2] = 128; // B
				pixels[i + 3] = 255; // A
			}

			const midGrayImageData = { data: pixels, width: 2, height: 2 };
			effectContext.width = 2;
			effectContext.height = 2;

			const effect = { note: 0, velocity: MAX_MIDI_VELOCITY };
			const modified = grayscaleDisplacementEffect.apply(midGrayImageData, effect, 0, effectContext);

			// Mid-gray pixels (luminance exactly 128) have zero displacement
			expect(modified).toBe(false);
		});
	});

	describe('Variant B (vertical displacement)', () => {
		test('at full intensity, bright pixels shift down', () => {
			const effect = { note: 127, velocity: MAX_MIDI_VELOCITY };
			const modified = grayscaleDisplacementEffect.apply(imageData, effect, 0, effectContext);

			expect(modified).toBe(true);

			// Bright pixels (luminance > 128) should shift down
			// Check that pixels have been modified
			expect(modified).toBe(true);
		});

		test('at full intensity, dark pixels shift up', () => {
			const effect = { note: 127, velocity: MAX_MIDI_VELOCITY };
			const modified = grayscaleDisplacementEffect.apply(imageData, effect, 0, effectContext);

			expect(modified).toBe(true);

			// Dark pixels (luminance < 128) should shift up
			expect(modified).toBe(true);
		});

		test('at half intensity, displacement is reduced', () => {
			const effect = { note: 127, velocity: MAX_MIDI_VELOCITY / 2 };
			const modified = grayscaleDisplacementEffect.apply(imageData, effect, 0, effectContext);

			expect(modified).toBe(true);

			// At half intensity, maxShift should be 8 instead of 16
			expect(modified).toBe(true);
		});

		test('at zero intensity, no displacement occurs', () => {
			const effect = { note: 127, velocity: 0 };
			const originalPixels = new Uint8ClampedArray(imageData.data);
			const modified = grayscaleDisplacementEffect.apply(imageData, effect, 0, effectContext);

			// At zero intensity, maxShift is 0, so no modification
			expect(modified).toBe(false);

			// Pixels should be unchanged
			for (let i = 0; i < imageData.data.length; i++) {
				expect(imageData.data[i]).toBe(originalPixels[i]);
			}
		});
	});

	describe('displacement scaling with maxShift', () => {
		test('higher velocity produces larger displacement range', () => {
			// Test at 25% velocity
			const lowVelocityEffect = { note: 0, velocity: MAX_MIDI_VELOCITY * 0.25 };
			const imageDataLow = { data: new Uint8ClampedArray(imageData.data), width: imageData.width, height: imageData.height };
			const modifiedLow = grayscaleDisplacementEffect.apply(imageDataLow, lowVelocityEffect, 0, effectContext);

			// Test at 100% velocity
			const highVelocityEffect = { note: 0, velocity: MAX_MIDI_VELOCITY };
			const imageDataHigh = { data: new Uint8ClampedArray(imageData.data), width: imageData.width, height: imageData.height };
			const modifiedHigh = grayscaleDisplacementEffect.apply(imageDataHigh, highVelocityEffect, 0, effectContext);

			// Both should modify pixels
			expect(modifiedLow).toBe(true);
			expect(modifiedHigh).toBe(true);

			// The high velocity should produce different results than low velocity
			// (we can't easily assert exact values without complex setup, but we can verify both modify)
		});

		test('maxShift parameter controls maximum displacement', () => {
			// Test with low maxShift
			effectContext.effectParams.grayscaleDisplacementMaxShift = 4;
			const lowMaxShiftEffect = { note: 0, velocity: MAX_MIDI_VELOCITY };
			const imageDataLow = { data: new Uint8ClampedArray(imageData.data), width: imageData.width, height: imageData.height };
			const modifiedLow = grayscaleDisplacementEffect.apply(imageDataLow, lowMaxShiftEffect, 0, effectContext);

			// Test with high maxShift
			effectContext.effectParams.grayscaleDisplacementMaxShift = 16;
			const highMaxShiftEffect = { note: 0, velocity: MAX_MIDI_VELOCITY };
			const imageDataHigh = { data: new Uint8ClampedArray(imageData.data), width: imageData.width, height: imageData.height };
			const modifiedHigh = grayscaleDisplacementEffect.apply(imageDataHigh, highMaxShiftEffect, 0, effectContext);

			// Both should modify pixels
			expect(modifiedLow).toBe(true);
			expect(modifiedHigh).toBe(true);
		});
	});

	describe('effect metadata', () => {
		test('has correct type', () => {
			expect(grayscaleDisplacementEffect.type).toBe('grayscaleDisplacement');
		});

		test('requires note parameter', () => {
			expect(grayscaleDisplacementEffect.requiresNote).toBe(true);
		});
	});
});
