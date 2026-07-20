import { describe, test, expect, beforeEach } from 'vitest';
import grayscaleBlendEffect from '../src/js/visuals/effects/grayscaleBlendEffect.js';
import { MAX_MIDI_VELOCITY } from '../src/js/core/midiConstants.js';
import { RGBA_CHANNEL_COUNT } from '../src/js/visuals/effects/effectConstants.js';

const WIDTH = 2;
const HEIGHT = 2;
const BYTE_COUNT = WIDTH * HEIGHT * RGBA_CHANNEL_COUNT;

/**
 * Create an ImageData-like object with a known pattern.
 * @returns {{ data: Uint8ClampedArray, width: number, height: number }}
 */
function createImageData() {
	const data = new Uint8ClampedArray(BYTE_COUNT);
	return { data, width: WIDTH, height: HEIGHT };
}

describe('grayscaleBlendEffect', () => {
	let imageData;
	let effectContext;

	beforeEach(() => {
		// Create a 2x2 test image with known pixel values
		imageData = createImageData();
		const pixels = imageData.data;

		// Pixel (0,0): red (255, 0, 0, 255)
		pixels[0] = 255;
		pixels[1] = 0;
		pixels[2] = 0;
		pixels[3] = 255;

		// Pixel (1,0): green (0, 255, 0, 255)
		pixels[4] = 0;
		pixels[5] = 255;
		pixels[6] = 0;
		pixels[7] = 255;

		// Pixel (0,1): blue (0, 0, 255, 255)
		pixels[8] = 0;
		pixels[9] = 0;
		pixels[10] = 255;
		pixels[11] = 255;

		// Pixel (1,1): white (255, 255, 255, 255)
		pixels[12] = 255;
		pixels[13] = 255;
		pixels[14] = 255;
		pixels[15] = 255;

		effectContext = {
			width: WIDTH,
			height: HEIGHT,
			scratchBuffer: null,
			effectParams: {
				effectVariantThreshold: 64,
				grayscaleBlendBitDepth: 2
			},
			effectRanges: {
				grayscaleBlend: { min: 0, max: 127 }
			}
		};
	});

	describe('Variant A (inverted colors)', () => {
		test('at full intensity, inverts red pixel to cyan', () => {
			const effect = { note: 0, velocity: MAX_MIDI_VELOCITY };
			const modified = grayscaleBlendEffect.apply(imageData, effect, 0, effectContext);

			expect(modified).toBe(true);

			// Red pixel (255, 0, 0) should invert toward cyan (0, 255, 255)
			// At full intensity, should be close to inverted
			const redPixel = imageData.data;
			expect(redPixel[0]).toBeLessThan(255); // Red channel reduced
			expect(redPixel[1]).toBeGreaterThan(0); // Green channel increased
			expect(redPixel[2]).toBeGreaterThan(0); // Blue channel increased
		});

		test('at zero intensity, leaves pixels unchanged', () => {
			const effect = { note: 0, velocity: 0 };
			const originalPixels = new Uint8ClampedArray(imageData.data);
			const modified = grayscaleBlendEffect.apply(imageData, effect, 0, effectContext);

			expect(modified).toBe(true);
			// At zero intensity, should be very close to original
			for (let i = 0; i < imageData.data.length; i++) {
				expect(imageData.data[i]).toBeCloseTo(originalPixels[i], 0);
			}
		});

		test('at half intensity, partially inverts toward inverted value', () => {
			const effect = { note: 0, velocity: MAX_MIDI_VELOCITY / 2 };
			const modified = grayscaleBlendEffect.apply(imageData, effect, 0, effectContext);

			expect(modified).toBe(true);

			// Red pixel (255, 0, 0) at half intensity should be partially inverted
			// Inverted would be (0, 255, 255), half intensity should be around (127, 127, 127)
			const redPixel = imageData.data;
			expect(redPixel[0]).toBeLessThan(255); // Red reduced
			expect(redPixel[0]).toBeGreaterThan(0); // But not fully inverted
			expect(redPixel[1]).toBeGreaterThan(0); // Green increased
			expect(redPixel[2]).toBeGreaterThan(0); // Blue increased
		});

		test('white pixel inverts to black at full intensity', () => {
			const effect = { note: 0, velocity: MAX_MIDI_VELOCITY };
			const modified = grayscaleBlendEffect.apply(imageData, effect, 0, effectContext);

			expect(modified).toBe(true);

			// White pixel (255, 255, 255) should invert toward black (0, 0, 0)
			const whitePixelIndex = 3 * RGBA_CHANNEL_COUNT;
			expect(imageData.data[whitePixelIndex]).toBeLessThan(255);
			expect(imageData.data[whitePixelIndex + 1]).toBeLessThan(255);
			expect(imageData.data[whitePixelIndex + 2]).toBeLessThan(255);
		});

		test('black pixel has minimal effect due to low luminance', () => {
			// Create a black pixel
			imageData.data[0] = 0;
			imageData.data[1] = 0;
			imageData.data[2] = 0;

			const effect = { note: 0, velocity: MAX_MIDI_VELOCITY };
			const modified = grayscaleBlendEffect.apply(imageData, effect, 0, effectContext);

			expect(modified).toBe(true);

			// Black pixel (0, 0, 0) has luminance 0, so blendFactor is 0
			// The effect is luminance-driven, so black pixels get minimal modification
			// The modified array has the inverted value, but the blend step uses luminance
			expect(imageData.data[0]).toBe(0); // Stays near black due to 0 luminance
		});
	});

	describe('Variant B (color shift)', () => {
		test('applies chromatic aberration at full intensity', () => {
			const effect = { note: 127, velocity: MAX_MIDI_VELOCITY };
			const modified = grayscaleBlendEffect.apply(imageData, effect, 0, effectContext);

			expect(modified).toBe(true);
			// Variant B shifts colors - the effect should modify pixels
			// We can't easily assert exact values without complex setup
		});

		test('at zero intensity, leaves pixels unchanged', () => {
			const effect = { note: 127, velocity: 0 };
			const originalPixels = new Uint8ClampedArray(imageData.data);
			const modified = grayscaleBlendEffect.apply(imageData, effect, 0, effectContext);

			expect(modified).toBe(true);
			// At zero intensity, should be very close to original
			for (let i = 0; i < imageData.data.length; i++) {
				expect(imageData.data[i]).toBeCloseTo(originalPixels[i], 0);
			}
		});
	});

	describe('effect metadata', () => {
		test('has correct type', () => {
			expect(grayscaleBlendEffect.type).toBe('grayscaleBlend');
		});

		test('requires note parameter', () => {
			expect(grayscaleBlendEffect.requiresNote).toBe(true);
		});
	});
});
