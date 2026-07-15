import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';
import Renderer from '../../src/js/visuals/Renderer.js';
import settings from '../../src/js/core/settings.js';
import appState from '../../src/js/core/AppState.js';
import { createSolidFillClip, createGradientClip, createStripedClip, createAsymmetricPatternClip, createMaskClip, createMockLayerManager, createEffect, canvasWidth, canvasHeight } from './helpers/visualTestHelpers.js';

/**
 * Visual regression tests for the Renderer using Vitest browser mode.
 * These tests run in real Chromium with actual canvas rendering.
 * Reference screenshots are stored in test/visual/__screenshots__/ and
 * diff images are generated on failure in test/visual/__diffs__/.
 */

let canvas;
let ctx;
let rafSpy;
let randomSpy;
let currentRenderer;

beforeEach(() => {
	canvas = document.createElement('canvas');
	canvas.width = canvasWidth;
	canvas.height = canvasHeight;
	document.body.appendChild(canvas);
	ctx = canvas.getContext('2d');
	ctx.imageSmoothingEnabled = false;

	rafSpy = vi.spyOn(globalThis, 'requestAnimationFrame').mockImplementation(() => 1);
	vi.spyOn(globalThis, 'cancelAnimationFrame').mockImplementation(() => {});

	appState.reset();
	appState.bpm = 120;
});

afterEach(() => {
	if (rafSpy) {
		rafSpy.mockRestore();
	}
	if (randomSpy) {
		randomSpy.mockRestore();
	}
	appState.reset();

	if (currentRenderer) {
		currentRenderer.destroy();
		currentRenderer = null;
	}
	document.body.removeChild(canvas);
	canvas = null;
	ctx = null;
});

/**
 * Helper: create a Renderer, start it, and trigger one full render frame.
 * Returns the Renderer instance.
 */
function renderFrame(layerManager, timestamp = 0) {
	const renderer = new Renderer(ctx, layerManager, settings, appState);
	currentRenderer = renderer;
	renderer.start();

	// The warmup call already happened synchronously in start().
	// Now trigger the full render loop (mixing + effects).
	const cb = rafSpy.mock.calls[0][0];
	cb(timestamp);

	return renderer;
}

describe('Mask mixing visual tests', () => {
	test('1-bit mask: hard cut between A and B', async () => {
		const animationClipA = createSolidFillClip(255, 0, 0);
		const animationClipB = createSolidFillClip(0, 0, 255);
		const maskAnimationClip = createMaskClip('1bit-split');
		const lm = createMockLayerManager({ animationClipA, animationClipB, maskAnimationClip, maskBitDepth: 1 });

		renderFrame(lm);
		await expect(canvas).toMatchScreenshot('mask-1bit-split');
	});

	test('2-bit mask: 4 quantized gray levels', async () => {
		const animationClipA = createSolidFillClip(0, 0, 0);
		const animationClipB = createSolidFillClip(255, 255, 255);
		const maskAnimationClip = createMaskClip('2bit-gradient');
		const lm = createMockLayerManager({ animationClipA, animationClipB, maskAnimationClip, maskBitDepth: 2 });

		renderFrame(lm);
		await expect(canvas).toMatchScreenshot('mask-2bit-gradient');
	});

	test('4-bit mask: 16 quantized gray levels', async () => {
		const animationClipA = createSolidFillClip(0, 0, 0);
		const animationClipB = createSolidFillClip(255, 255, 255);
		const maskAnimationClip = createMaskClip('4bit-gradient');
		const lm = createMockLayerManager({ animationClipA, animationClipB, maskAnimationClip, maskBitDepth: 4 });

		renderFrame(lm);
		await expect(canvas).toMatchScreenshot('mask-4bit-gradient');
	});

	test('8-bit mask: 50% gray blend', async () => {
		const animationClipA = createSolidFillClip(0, 0, 0);
		const animationClipB = createSolidFillClip(255, 255, 255);
		const maskAnimationClip = createMaskClip('8bit-50gray');
		const lm = createMockLayerManager({ animationClipA, animationClipB, maskAnimationClip, maskBitDepth: 8 });

		renderFrame(lm);
		await expect(canvas).toMatchScreenshot('mask-8bit-50gray');
	});
});

describe('Layer Group passthrough visual tests', () => {
	test('Layer Group A only (no mask, Layer Group B empty)', async () => {
		const animationClipA = createStripedClip([255, 0, 0], [0, 255, 0], 15);
		const lm = createMockLayerManager({ animationClipA });

		renderFrame(lm);
		await expect(canvas).toMatchScreenshot('layer-group-a-only');
	});

	test('Layer Group B only (no mask, Layer Group A empty)', async () => {
		const animationClipB = createStripedClip([0, 0, 255], [255, 255, 0], 15);
		const lm = createMockLayerManager({ animationClipB });

		renderFrame(lm);
		await expect(canvas).toMatchScreenshot('layer-group-b-only');
	});
});

describe('Effect visual tests', () => {
	test('color invert', async () => {
		const animationClipA = createStripedClip([255, 100, 50], [50, 200, 100], 20);
		const mixedOutputEffects = [createEffect('color', settings.effectRanges.color.min, 127)];
		const lm = createMockLayerManager({ animationClipA, mixedOutputEffects });

		renderFrame(lm);
		await expect(canvas).toMatchScreenshot('color-invert');
	});

	test('color posterize', async () => {
		const animationClipA = createGradientClip('horizontal', [0, 0, 0], [255, 255, 255]);
		const mixedOutputEffects = [createEffect('color', settings.effectRanges.color.min + 10, 127)];
		const lm = createMockLayerManager({ animationClipA, mixedOutputEffects });

		renderFrame(lm);
		await expect(canvas).toMatchScreenshot('color-posterize');
	});

	test('mirror horizontal', async () => {
		const animationClipA = createAsymmetricPatternClip();
		const mixedOutputEffects = [createEffect('mirror', settings.effectRanges.mirror.min, 127)];
		const lm = createMockLayerManager({ animationClipA, mixedOutputEffects });

		renderFrame(lm);
		await expect(canvas).toMatchScreenshot('mirror-horizontal');
	});

	test('split horizontal', async () => {
		const animationClipA = createAsymmetricPatternClip();
		const mixedOutputEffects = [createEffect('split', settings.effectRanges.split.min, 127)];
		const lm = createMockLayerManager({ animationClipA, mixedOutputEffects });

		renderFrame(lm);
		await expect(canvas).toMatchScreenshot('split-horizontal');
	});

	test('offset horizontal', async () => {
		const animationClipA = createAsymmetricPatternClip();
		const mixedOutputEffects = [createEffect('offset', settings.effectRanges.offset.min, 127)];
		const lm = createMockLayerManager({ animationClipA, mixedOutputEffects });

		renderFrame(lm);
		await expect(canvas).toMatchScreenshot('offset-horizontal');
	});

	test('glitch (deterministic)', async () => {
		randomSpy = vi.spyOn(Math, 'random').mockReturnValue(0.5);
		const animationClipA = createAsymmetricPatternClip();
		const globalEffects = [createEffect('glitch', settings.effectRanges.glitch.min, 63)];
		const lm = createMockLayerManager({ animationClipA, globalEffects });

		renderFrame(lm);
		await expect(canvas).toMatchScreenshot('glitch');
	});
});

describe('Effect stacking visual tests', () => {
	test('color invert + strobe white-out', async () => {
		const animationClipA = createSolidFillClip(100, 150, 200);
		const globalEffects = [createEffect('color', settings.effectRanges.color.min, 127), createEffect('strobe', settings.effectRanges.strobe.min, 5)];
		const lm = createMockLayerManager({ animationClipA, globalEffects });

		renderFrame(lm, 0);
		await expect(canvas).toMatchScreenshot('stack-color-strobe');
	});

	test('mirror horizontal + color invert', async () => {
		const animationClipA = createAsymmetricPatternClip();
		const mixedOutputEffects = [createEffect('mirror', settings.effectRanges.mirror.min, 127), createEffect('color', settings.effectRanges.color.min, 127)];
		const lm = createMockLayerManager({ animationClipA, mixedOutputEffects });

		renderFrame(lm);
		await expect(canvas).toMatchScreenshot('stack-mirror-color');
	});
});

describe('Edge case visual tests', () => {
	test('empty canvas (no layer groups, no mask, no effects)', async () => {
		const lm = createMockLayerManager({});

		renderFrame(lm);
		await expect(canvas).toMatchScreenshot('empty-canvas');
	});

	test('Layer Group C overlay on top of Layer Group A', async () => {
		const animationClipA = createSolidFillClip(255, 0, 0);
		const animationClipC = createStripedClip([0, 0, 0], [255, 255, 255], 10);
		const lm = createMockLayerManager({ animationClipA, animationClipC });

		renderFrame(lm);
		await expect(canvas).toMatchScreenshot('layer-group-c-overlay');
	});
});
