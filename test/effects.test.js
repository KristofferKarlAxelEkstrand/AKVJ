/**
 * Unit tests for individual pixel effect modules.
 * Tests mirror, offset, split, color, and pixelUtils directly with controlled pixel data.
 */
import { describe, test, expect, vi } from 'vitest';
import mirrorEffect from '../src/js/visuals/effects/mirrorEffect.js';
import offsetEffect from '../src/js/visuals/effects/offsetEffect.js';
import splitEffect from '../src/js/visuals/effects/splitEffect.js';
import colorEffect from '../src/js/visuals/effects/colorEffect.js';
import strobeEffect from '../src/js/visuals/effects/strobeEffect.js';
import glitchEffect from '../src/js/visuals/effects/glitchEffect.js';
import { transformCopy } from '../src/js/visuals/effects/pixelUtils.js';
import { RGBA_CHANNEL_COUNT, MAX_COLOR_VALUE } from '../src/js/visuals/effects/effectConstants.js';
import settings from '../src/js/core/settings.js';

const WIDTH = 4;
const HEIGHT = 2;
const BYTE_COUNT = WIDTH * HEIGHT * RGBA_CHANNEL_COUNT;

/**
 * Create an ImageData-like object with a known pattern.
 * Each pixel gets a unique sequential R value for tracking.
 * @returns {{ data: Uint8ClampedArray, width: number, height: number }}
 */
function createImageData() {
	const data = new Uint8ClampedArray(BYTE_COUNT);
	for (let i = 0; i < WIDTH * HEIGHT; i++) {
		data[i * 4] = i; // R = pixel index
		data[i * 4 + 1] = 0; // G
		data[i * 4 + 2] = 0; // B
		data[i * 4 + 3] = 255; // A
	}
	return { data, width: WIDTH, height: HEIGHT };
}

const EFFECT_CONTEXT = {
	width: WIDTH,
	height: HEIGHT,
	effectRanges: settings.effectRanges,
	effectParams: settings.effectParams,
	scratchBuffer: null,
	bpm: 120,
	bpmMin: settings.bpm.min,
	bpmDefault: settings.bpm.default
};

describe('colorEffect', () => {
	test('inverts colors when note is below variant threshold', () => {
		const img = createImageData();
		// Set a known pixel value
		img.data[0] = 100;
		img.data[1] = 50;
		img.data[2] = 25;

		const result = colorEffect.apply(
			img,
			{
				note: settings.effectRanges.color.min,
				velocity: 127
			},
			0,
			EFFECT_CONTEXT
		);

		expect(result).toBe(true);
		expect(img.data[0]).toBe(MAX_COLOR_VALUE - 100);
		expect(img.data[1]).toBe(MAX_COLOR_VALUE - 50);
		expect(img.data[2]).toBe(MAX_COLOR_VALUE - 25);
	});

	test('posterizes colors when note is at or above variant threshold', () => {
		const img = createImageData();
		img.data[0] = 100;
		img.data[1] = 50;
		img.data[2] = 25;

		const result = colorEffect.apply(
			img,
			{
				note: settings.effectRanges.color.min + settings.effectParams.effectVariantThreshold,
				velocity: 127
			},
			0,
			EFFECT_CONTEXT
		);

		expect(result).toBe(true);
		// Posterized values should be quantized
		// With high intensity, levels should be reduced
		const intensity = 127 / 127;
		const levels = Math.max(2, Math.floor(settings.effectParams.posterizeBaseLevels - intensity * settings.effectParams.posterizeIntensityScale));
		const step = MAX_COLOR_VALUE / levels;
		expect(img.data[0]).toBe(Math.floor(100 / step) * step);
	});

	test('has type "color" and requiresNote true', () => {
		expect(colorEffect.type).toBe('color');
		expect(colorEffect.requiresNote).toBe(true);
	});
});

describe('mirrorEffect', () => {
	test('horizontal mirror copies left half to right half', () => {
		const img = createImageData();
		// Set unique R values per pixel: 0,1,2,3 | 4,5,6,7
		for (let i = 0; i < WIDTH * HEIGHT; i++) {
			img.data[i * 4] = i;
		}

		const result = mirrorEffect.apply(
			img,
			{
				note: settings.effectRanges.mirror.min,
				velocity: 127
			},
			0,
			EFFECT_CONTEXT
		);

		expect(result).toBe(true);
		// After horizontal mirror, pixel at x=3 should have pixel at x=0's value
		// Row 0: pixel(3,0) should equal original pixel(0,0) = 0
		expect(img.data[(0 * WIDTH + 3) * 4]).toBe(0);
		// pixel(2,0) should equal original pixel(1,0) = 1
		expect(img.data[(0 * WIDTH + 2) * 4]).toBe(1);
	});

	test('vertical mirror copies top half to bottom half', () => {
		const img = createImageData();
		for (let i = 0; i < WIDTH * HEIGHT; i++) {
			img.data[i * 4] = i;
		}

		const result = mirrorEffect.apply(
			img,
			{
				note: settings.effectRanges.mirror.min + settings.effectParams.effectVariantThreshold,
				velocity: 127
			},
			0,
			EFFECT_CONTEXT
		);

		expect(result).toBe(true);
		// After vertical mirror, pixel at y=1 should have pixel at y=0's values
		// pixel(0,1) should equal original pixel(0,0) = 0
		expect(img.data[(1 * WIDTH + 0) * 4]).toBe(0);
		// pixel(1,1) should equal original pixel(1,0) = 1
		expect(img.data[(1 * WIDTH + 1) * 4]).toBe(1);
	});

	test('has type "mirror" and requiresNote true', () => {
		expect(mirrorEffect.type).toBe('mirror');
		expect(mirrorEffect.requiresNote).toBe(true);
	});
});

describe('offsetEffect', () => {
	test('horizontal offset shifts pixels with wrap-around', () => {
		const img = createImageData();
		for (let i = 0; i < WIDTH * HEIGHT; i++) {
			img.data[i * 4] = i;
		}

		// velocity=63 -> intensity≈0.496 -> offsetX = floor(0.496 * 4) = 1
		const result = offsetEffect.apply(
			img,
			{
				note: settings.effectRanges.offset.min,
				velocity: 63
			},
			0,
			EFFECT_CONTEXT
		);

		expect(result).toBe(true);
		// After horizontal offset by 1: pixel(0,0) should come from pixel(1,0)
		expect(img.data[0]).toBe(1);
		// pixel(3,0) should come from pixel(0,0) (wrap)
		expect(img.data[(0 * WIDTH + 3) * 4]).toBe(0);
	});

	test('vertical offset shifts pixels with wrap-around', () => {
		const img = createImageData();
		for (let i = 0; i < WIDTH * HEIGHT; i++) {
			img.data[i * 4] = i;
		}

		// velocity=127 -> intensity=1 -> offsetY = floor(1 * 2) = 2 -> full height wrap (no-op)
		// Use velocity=63 -> intensity≈0.496 -> offsetY = floor(0.496 * 2) = 0 (no shift)
		// Use velocity=95 -> intensity≈0.748 -> offsetY = floor(0.748 * 2) = 1
		const result = offsetEffect.apply(
			img,
			{
				note: settings.effectRanges.offset.min + settings.effectParams.effectVariantThreshold,
				velocity: 95
			},
			0,
			EFFECT_CONTEXT
		);

		expect(result).toBe(true);
		// After vertical offset by 1: pixel(0,0) should come from pixel(0,1)
		// Row 1 had values 4,5,6,7 -> now row 0 should have those
		expect(img.data[0]).toBe(4);
		// Row 0 had values 0,1,2,3 -> now row 1 should have those
		expect(img.data[(1 * WIDTH + 0) * 4]).toBe(0);
	});

	test('has type "offset" and requiresNote true', () => {
		expect(offsetEffect.type).toBe('offset');
		expect(offsetEffect.requiresNote).toBe(true);
	});
});

describe('splitEffect', () => {
	test('horizontal split creates repeating sections', () => {
		const img = createImageData();
		for (let i = 0; i < WIDTH * HEIGHT; i++) {
			img.data[i * 4] = i;
		}

		const result = splitEffect.apply(
			img,
			{
				note: settings.effectRanges.split.min,
				velocity: 127
			},
			0,
			EFFECT_CONTEXT
		);

		expect(result).toBe(true);
		// The effect should modify pixels (split into sections)
		// Just verify it runs and returns true; exact pixel values depend on split count
	});

	test('vertical split creates repeating sections', () => {
		const img = createImageData();
		for (let i = 0; i < WIDTH * HEIGHT; i++) {
			img.data[i * 4] = i;
		}

		const result = splitEffect.apply(
			img,
			{
				note: settings.effectRanges.split.min + settings.effectParams.effectVariantThreshold,
				velocity: 127
			},
			0,
			EFFECT_CONTEXT
		);

		expect(result).toBe(true);
	});

	test('has type "split" and requiresNote true', () => {
		expect(splitEffect.type).toBe('split');
		expect(splitEffect.requiresNote).toBe(true);
	});
});

describe('strobeEffect', () => {
	test('velocity 0 returns false (no flash)', () => {
		const img = createImageData();
		const result = strobeEffect.apply(img, { velocity: 0 }, 0, EFFECT_CONTEXT);
		expect(result).toBe(false);
	});

	test('velocity 1-9 produces white-out (all pixels white)', () => {
		const img = createImageData();
		img.data[0] = 50;
		const result = strobeEffect.apply(img, { velocity: 5 }, 123, EFFECT_CONTEXT);
		expect(result).toBe(true);
		expect(img.data[0]).toBe(255);
		expect(img.data[1]).toBe(255);
		expect(img.data[2]).toBe(255);
	});

	test('has type "strobe" and no requiresNote', () => {
		expect(strobeEffect.type).toBe('strobe');
		expect(strobeEffect.requiresNote).toBeUndefined();
	});
});

describe('transformCopy (pixelUtils)', () => {
	test('identity transform copies pixels unchanged', () => {
		const pixels = new Uint8ClampedArray(BYTE_COUNT);
		for (let i = 0; i < WIDTH * HEIGHT; i++) {
			pixels[i * 4] = i;
			pixels[i * 4 + 3] = 255;
		}

		const identityFn = (x, y) => (y * WIDTH + x) * RGBA_CHANNEL_COUNT;
		const result = transformCopy(pixels, WIDTH, HEIGHT, null, identityFn);

		expect(result).toBe(true);
		// Pixels should be unchanged
		expect(pixels[0]).toBe(0);
		expect(pixels[4]).toBe(1);
	});

	test('allocates scratch buffer when not provided', () => {
		const pixels = new Uint8ClampedArray(BYTE_COUNT);
		const swapFn = (x, y) => (y * WIDTH + (WIDTH - 1 - x)) * RGBA_CHANNEL_COUNT;
		expect(() => transformCopy(pixels, WIDTH, HEIGHT, null, swapFn)).not.toThrow();
	});

	test('uses provided scratch buffer when large enough', () => {
		const pixels = new Uint8ClampedArray(BYTE_COUNT);
		const scratch = new Uint8ClampedArray(BYTE_COUNT);
		for (let i = 0; i < WIDTH * HEIGHT; i++) {
			pixels[i * 4] = i;
		}

		const swapFn = (x, y) => (y * WIDTH + (WIDTH - 1 - x)) * RGBA_CHANNEL_COUNT;
		transformCopy(pixels, WIDTH, HEIGHT, scratch, swapFn);

		// After horizontal flip, pixel(0,0) should have original pixel(3,0)
		expect(pixels[0]).toBe(3);
	});

	test('allocates new buffer when scratch is too small', () => {
		const pixels = new Uint8ClampedArray(BYTE_COUNT);
		const smallScratch = new Uint8ClampedArray(4); // too small

		const identityFn = (x, y) => (y * WIDTH + x) * RGBA_CHANNEL_COUNT;
		expect(() => transformCopy(pixels, WIDTH, HEIGHT, smallScratch, identityFn)).not.toThrow();
	});
});

describe('glitchEffect', () => {
	test('velocity 0 returns false (no glitch)', () => {
		const img = createImageData();
		const result = glitchEffect.apply(img, { velocity: 0 }, 0, EFFECT_CONTEXT);
		expect(result).toBe(false);
	});

	test('high velocity with random always returning high value does not mutate pixels', () => {
		const img = createImageData();
		const original = new Uint8ClampedArray(img.data);
		// With velocity=127, intensity=1, glitchPixelProbability=0.1
		// Condition: Math.random() < 0.1 — use 0.5 to NOT trigger glitch
		const mathRandomSpy = vi.spyOn(Math, 'random').mockReturnValue(0.5);

		const result = glitchEffect.apply(img, { velocity: 127 }, 0, EFFECT_CONTEXT);

		expect(result).toBe(false);
		expect(img.data).toEqual(original);

		mathRandomSpy.mockRestore();
	});

	test('high velocity with random returning low value mutates pixels', () => {
		const img = createImageData();
		// With velocity=127, intensity=1, glitchPixelProbability=0.1
		// Condition: Math.random() < 0.1 — use 0.05 to trigger glitch
		const mathRandomSpy = vi.spyOn(Math, 'random').mockReturnValue(0.05);

		const result = glitchEffect.apply(img, { velocity: 127 }, 0, EFFECT_CONTEXT);

		expect(result).toBe(true);

		mathRandomSpy.mockRestore();
	});

	test('preserves alpha channel during glitch', () => {
		const img = createImageData();
		const mathRandomSpy = vi.spyOn(Math, 'random').mockReturnValue(0.05);

		glitchEffect.apply(img, { velocity: 127 }, 0, EFFECT_CONTEXT);

		// Alpha channel should remain 255 for all pixels
		for (let i = 0; i < WIDTH * HEIGHT; i++) {
			expect(img.data[i * 4 + 3]).toBe(255);
		}

		mathRandomSpy.mockRestore();
	});

	test('uses scratch buffer when provided and large enough', () => {
		const img = createImageData();
		const scratch = new Uint8ClampedArray(BYTE_COUNT);
		const mathRandomSpy = vi.spyOn(Math, 'random').mockReturnValue(0.05);

		// Should not throw and should use the provided scratch buffer
		expect(() => glitchEffect.apply(img, { velocity: 127 }, 0, { ...EFFECT_CONTEXT, scratchBuffer: scratch })).not.toThrow();

		mathRandomSpy.mockRestore();
	});

	test('allocates new buffer when scratch is too small', () => {
		const img = createImageData();
		const smallScratch = new Uint8ClampedArray(4);
		const mathRandomSpy = vi.spyOn(Math, 'random').mockReturnValue(0.05);

		expect(() => glitchEffect.apply(img, { velocity: 127 }, 0, { ...EFFECT_CONTEXT, scratchBuffer: smallScratch })).not.toThrow();

		mathRandomSpy.mockRestore();
	});

	test('has type "glitch" and no requiresNote', () => {
		expect(glitchEffect.type).toBe('glitch');
		expect(glitchEffect.requiresNote).toBeUndefined();
	});
});
