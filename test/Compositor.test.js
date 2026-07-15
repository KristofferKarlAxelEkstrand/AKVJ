/**
 * Unit tests for Compositor - mask mixing and layer group compositing.
 * Tests all bit depths (1, 2, 4, 8), no-mask fallback, empty groups, and destroy.
 */
import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';
import Compositor from '../src/js/visuals/Compositor.js';
import { installMockCanvas } from './utils/rendererFixture.js';

const WIDTH = 4;
const HEIGHT = 2;
const PIXEL_COUNT = WIDTH * HEIGHT;
const BYTE_COUNT = PIXEL_COUNT * 4;

const RENDERING_CONFIG = {
	backgroundColor: '#000000',
	imageSmoothingEnabled: false,
	imageSmoothingQuality: 'low'
};

/**
 * Create a Compositor with small dimensions for fast pixel-level assertions.
 * @returns {Compositor}
 */
function createCompositor() {
	return new Compositor(WIDTH, HEIGHT, RENDERING_CONFIG);
}

/**
 * Fill a Uint8ClampedArray with a solid RGBA color.
 * @param {Uint8ClampedArray} pixels
 * @param {number} r
 * @param {number} g
 * @param {number} b
 * @param {number} [a=255]
 */
function fillSolid(pixels, r, g, b, a = 255) {
	for (let i = 0; i < pixels.length; i += 4) {
		pixels[i] = r;
		pixels[i + 1] = g;
		pixels[i + 2] = b;
		pixels[i + 3] = a;
	}
}

describe('Compositor', () => {
	let canvasMock;

	beforeEach(() => {
		canvasMock = installMockCanvas();
	});

	afterEach(() => {
		canvasMock.restore();
	});

	test('exposes ctxA, ctxB, ctxMask, ctxMixed, and canvasMixed getters', () => {
		const compositor = createCompositor();
		expect(compositor.ctxA).toBeDefined();
		expect(compositor.ctxB).toBeDefined();
		expect(compositor.ctxMask).toBeDefined();
		expect(compositor.ctxMixed).toBeDefined();
		expect(compositor.canvasMixed).toBeDefined();
	});

	test('clearLayerGroupCanvases calls fillRect on ctxA and ctxB', () => {
		const compositor = createCompositor();
		const ctxA = compositor.ctxA;
		const ctxB = compositor.ctxB;
		ctxA.fillRect.mockClear();
		ctxB.fillRect.mockClear();
		compositor.clearLayerGroupCanvases();
		expect(ctxA.fillRect).toHaveBeenCalledWith(0, 0, WIDTH, HEIGHT);
		expect(ctxB.fillRect).toHaveBeenCalledWith(0, 0, WIDTH, HEIGHT);
	});

	test('mixLayerGroups returns early when both groups are empty', () => {
		const compositor = createCompositor();
		const ctxMixed = compositor.ctxMixed;
		ctxMixed.fillRect.mockClear();
		ctxMixed.drawImage.mockClear();

		compositor.mixLayerGroups(
			{
				mask: null,
				bitDepth: 1,
				isLayerGroupAEmpty: true,
				isLayerGroupBEmpty: true
			},
			0
		);

		// Mixed canvas is cleared but no drawImage or putImageData called
		expect(ctxMixed.fillRect).toHaveBeenCalled();
		expect(ctxMixed.drawImage).not.toHaveBeenCalled();
		expect(ctxMixed.putImageData).not.toHaveBeenCalled();
	});

	test('mixLayerGroups with no mask and only Layer Group A active draws canvasA', () => {
		const compositor = createCompositor();
		const ctxMixed = compositor.ctxMixed;

		compositor.mixLayerGroups(
			{
				mask: null,
				bitDepth: 1,
				isLayerGroupAEmpty: false,
				isLayerGroupBEmpty: true
			},
			0
		);

		expect(ctxMixed.drawImage).toHaveBeenCalled();
	});

	test('mixLayerGroups with no mask and only Layer Group B active draws canvasB', () => {
		const compositor = createCompositor();
		const ctxMixed = compositor.ctxMixed;

		compositor.mixLayerGroups(
			{
				mask: null,
				bitDepth: 1,
				isLayerGroupAEmpty: true,
				isLayerGroupBEmpty: false
			},
			0
		);

		expect(ctxMixed.drawImage).toHaveBeenCalled();
	});

	test('1-bit mask: mask < 128 selects Layer Group A, mask >= 128 selects Layer Group B', () => {
		const compositor = createCompositor();
		const ctxA = compositor.ctxA;
		const ctxB = compositor.ctxB;
		const ctxMask = compositor.ctxMask;
		const ctxMixed = compositor.ctxMixed;

		const layerGroupAPixels = new Uint8ClampedArray(BYTE_COUNT);
		const layerGroupBPixels = new Uint8ClampedArray(BYTE_COUNT);
		const maskPixels = new Uint8ClampedArray(BYTE_COUNT);

		fillSolid(layerGroupAPixels, 0, 0, 0);
		fillSolid(layerGroupBPixels, 255, 255, 255);

		// First pixel: mask=0 (Layer Group A), rest: mask=255 (Layer Group B)
		maskPixels[0] = 0;
		maskPixels[1] = 0;
		maskPixels[2] = 0;
		maskPixels[3] = 255;
		for (let i = 4; i < BYTE_COUNT; i += 4) {
			maskPixels[i] = 255;
			maskPixels[i + 1] = 255;
			maskPixels[i + 2] = 255;
			maskPixels[i + 3] = 255;
		}

		ctxA.getImageData = () => ({ data: layerGroupAPixels });
		ctxB.getImageData = () => ({ data: layerGroupBPixels });
		ctxMask.getImageData = () => ({ data: maskPixels });

		let outputData = null;
		ctxMixed.putImageData = img => {
			outputData = img;
		};

		const maskClip = { isFinished: false, renderToContext: vi.fn() };
		compositor.mixLayerGroups(
			{
				mask: maskClip,
				bitDepth: 1,
				isLayerGroupAEmpty: false,
				isLayerGroupBEmpty: false
			},
			0
		);

		expect(outputData).toBeDefined();
		expect(outputData.data[0]).toBe(0); // Layer Group A (black)
		expect(outputData.data[4]).toBe(255); // Layer Group B (white)
	});

	test('2-bit mask: quantizes to 4 levels with correct blend', () => {
		const compositor = createCompositor();
		const ctxA = compositor.ctxA;
		const ctxB = compositor.ctxB;
		const ctxMask = compositor.ctxMask;
		const ctxMixed = compositor.ctxMixed;

		const layerGroupAPixels = new Uint8ClampedArray(BYTE_COUNT);
		const layerGroupBPixels = new Uint8ClampedArray(BYTE_COUNT);
		const maskPixels = new Uint8ClampedArray(BYTE_COUNT);

		fillSolid(layerGroupAPixels, 0, 0, 0);
		fillSolid(layerGroupBPixels, 255, 255, 255);
		// mask=64 -> level=1, alpha=1/3 -> output≈85
		fillSolid(maskPixels, 64, 64, 64);

		ctxA.getImageData = () => ({ data: layerGroupAPixels });
		ctxB.getImageData = () => ({ data: layerGroupBPixels });
		ctxMask.getImageData = () => ({ data: maskPixels });

		let outputData = null;
		ctxMixed.putImageData = img => {
			outputData = img;
		};

		const maskClip = { isFinished: false, renderToContext: vi.fn() };
		compositor.mixLayerGroups(
			{
				mask: maskClip,
				bitDepth: 2,
				isLayerGroupAEmpty: false,
				isLayerGroupBEmpty: false
			},
			0
		);

		expect(outputData).toBeDefined();
		expect(outputData.data[0]).toBe(85); // 0 + (255-0) * (1/3) = 85
	});

	test('4-bit mask: quantizes to 16 levels with correct blend', () => {
		const compositor = createCompositor();
		const ctxA = compositor.ctxA;
		const ctxB = compositor.ctxB;
		const ctxMask = compositor.ctxMask;
		const ctxMixed = compositor.ctxMixed;

		const layerGroupAPixels = new Uint8ClampedArray(BYTE_COUNT);
		const layerGroupBPixels = new Uint8ClampedArray(BYTE_COUNT);
		const maskPixels = new Uint8ClampedArray(BYTE_COUNT);

		fillSolid(layerGroupAPixels, 0, 0, 0);
		fillSolid(layerGroupBPixels, 255, 255, 255);
		// mask=80 -> level=5, alpha=5/15=1/3 -> output≈85
		fillSolid(maskPixels, 80, 80, 80);

		ctxA.getImageData = () => ({ data: layerGroupAPixels });
		ctxB.getImageData = () => ({ data: layerGroupBPixels });
		ctxMask.getImageData = () => ({ data: maskPixels });

		let outputData = null;
		ctxMixed.putImageData = img => {
			outputData = img;
		};

		const maskClip = { isFinished: false, renderToContext: vi.fn() };
		compositor.mixLayerGroups(
			{
				mask: maskClip,
				bitDepth: 4,
				isLayerGroupAEmpty: false,
				isLayerGroupBEmpty: false
			},
			0
		);

		expect(outputData).toBeDefined();
		expect(outputData.data[0]).toBe(85);
	});

	test('8-bit mask: smooth blend with full 256 levels', () => {
		const compositor = createCompositor();
		const ctxA = compositor.ctxA;
		const ctxB = compositor.ctxB;
		const ctxMask = compositor.ctxMask;
		const ctxMixed = compositor.ctxMixed;

		const layerGroupAPixels = new Uint8ClampedArray(BYTE_COUNT);
		const layerGroupBPixels = new Uint8ClampedArray(BYTE_COUNT);
		const maskPixels = new Uint8ClampedArray(BYTE_COUNT);

		fillSolid(layerGroupAPixels, 0, 0, 0);
		fillSolid(layerGroupBPixels, 255, 255, 255);
		// mask=128 -> alpha=128/255≈0.502 -> output≈128
		fillSolid(maskPixels, 128, 128, 128);

		ctxA.getImageData = () => ({ data: layerGroupAPixels });
		ctxB.getImageData = () => ({ data: layerGroupBPixels });
		ctxMask.getImageData = () => ({ data: maskPixels });

		let outputData = null;
		ctxMixed.putImageData = img => {
			outputData = img;
		};

		const maskClip = { isFinished: false, renderToContext: vi.fn() };
		compositor.mixLayerGroups(
			{
				mask: maskClip,
				bitDepth: 8,
				isLayerGroupAEmpty: false,
				isLayerGroupBEmpty: false
			},
			0
		);

		expect(outputData).toBeDefined();
		const r = outputData.data[0];
		expect(r === 127 || r === 128).toBe(true);
	});

	test('mask clip isFinished skips rendering mask to ctxMask', () => {
		const compositor = createCompositor();
		const ctxA = compositor.ctxA;
		const ctxB = compositor.ctxB;
		const ctxMask = compositor.ctxMask;
		const ctxMixed = compositor.ctxMixed;

		const layerGroupAPixels = new Uint8ClampedArray(BYTE_COUNT);
		const layerGroupBPixels = new Uint8ClampedArray(BYTE_COUNT);
		const maskPixels = new Uint8ClampedArray(BYTE_COUNT);

		fillSolid(layerGroupAPixels, 100, 100, 100);
		fillSolid(layerGroupBPixels, 200, 200, 200);
		fillSolid(maskPixels, 0, 0, 0);

		ctxA.getImageData = () => ({ data: layerGroupAPixels });
		ctxB.getImageData = () => ({ data: layerGroupBPixels });
		ctxMask.getImageData = () => ({ data: maskPixels });

		let outputData = null;
		ctxMixed.putImageData = img => {
			outputData = img;
		};

		const maskClip = { isFinished: true, renderToContext: vi.fn() };
		compositor.mixLayerGroups(
			{
				mask: maskClip,
				bitDepth: 1,
				isLayerGroupAEmpty: false,
				isLayerGroupBEmpty: false
			},
			0
		);

		// mask.renderToContext should NOT be called when isFinished is true
		expect(maskClip.renderToContext).not.toHaveBeenCalled();
		// But mixing still happens with whatever is in ctxMask
		expect(outputData).toBeDefined();
		expect(outputData.data[0]).toBe(100); // mask=0 -> Layer Group A
	});

	test('alpha channel takes max of Layer Group A and Layer Group B', () => {
		const compositor = createCompositor();
		const ctxA = compositor.ctxA;
		const ctxB = compositor.ctxB;
		const ctxMask = compositor.ctxMask;
		const ctxMixed = compositor.ctxMixed;

		const layerGroupAPixels = new Uint8ClampedArray(BYTE_COUNT);
		const layerGroupBPixels = new Uint8ClampedArray(BYTE_COUNT);
		const maskPixels = new Uint8ClampedArray(BYTE_COUNT);

		fillSolid(layerGroupAPixels, 0, 0, 0, 100);
		fillSolid(layerGroupBPixels, 255, 255, 255, 200);
		fillSolid(maskPixels, 0, 0, 0); // 1-bit: mask < 128 -> Layer Group A

		ctxA.getImageData = () => ({ data: layerGroupAPixels });
		ctxB.getImageData = () => ({ data: layerGroupBPixels });
		ctxMask.getImageData = () => ({ data: maskPixels });

		let outputData = null;
		ctxMixed.putImageData = img => {
			outputData = img;
		};

		const maskClip = { isFinished: false, renderToContext: vi.fn() };
		compositor.mixLayerGroups(
			{
				mask: maskClip,
				bitDepth: 1,
				isLayerGroupAEmpty: false,
				isLayerGroupBEmpty: false
			},
			0
		);

		expect(outputData).toBeDefined();
		// Alpha should be max(100, 200) = 200
		expect(outputData.data[3]).toBe(200);
	});

	test('destroy nullifies all canvas references and is idempotent', () => {
		const compositor = createCompositor();
		expect(compositor.ctxA).toBeDefined();
		compositor.destroy();
		expect(compositor.ctxA).toBeNull();
		expect(compositor.ctxB).toBeNull();
		expect(compositor.ctxMask).toBeNull();
		expect(compositor.ctxMixed).toBeNull();
		expect(compositor.canvasMixed).toBeNull();
		// Second destroy should not throw
		expect(() => compositor.destroy()).not.toThrow();
	});

	test('mixLayerGroups after destroy does not throw', () => {
		const compositor = createCompositor();
		compositor.destroy();
		expect(() =>
			compositor.mixLayerGroups(
				{
					mask: null,
					bitDepth: 1,
					isLayerGroupAEmpty: false,
					isLayerGroupBEmpty: false
				},
				0
			)
		).not.toThrow();
	});
});
