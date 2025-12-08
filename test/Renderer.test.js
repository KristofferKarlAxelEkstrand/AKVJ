import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';
import Renderer from '../src/js/visuals/Renderer.js';

function createMockContext() {
	return {
		fillRect: vi.fn(),
		drawImage: vi.fn(),
		fillStyle: '#000000'
	};
}

describe('Renderer', () => {
	beforeEach(() => {
		// Replace document.createElement for canvas with a mock that returns a context object
		// so Renderer can create off-screen canvases and their contexts.
		globalThis.__createElementBackup = document.createElement;
		globalThis.__createdCanvases = [];
		document.createElement = tagName => {
			if (tagName === 'canvas') {
				const ctx = {
					fillRect: vi.fn(),
					drawImage: vi.fn(),
					createImageData: (w, h) => ({ width: w, height: h, data: new Uint8ClampedArray(w * h * 4) }),
					getImageData: vi.fn(() => ({ width: 240, height: 135, data: new Uint8ClampedArray(240 * 135 * 4) })),
					putImageData: vi.fn(),
					imageSmoothingEnabled: true,
					imageSmoothingQuality: 'high'
				};
				const canvas = { width: 240, height: 135, getContext: () => ctx };
				globalThis.__createdCanvases.push(canvas);
				return canvas;
			}
			return globalThis.__createElementBackup(tagName);
		};
	});

	afterEach(() => {
		// Restore createElement
		if (globalThis.__createElementBackup) {
			document.createElement = globalThis.__createElementBackup;
			delete globalThis.__createElementBackup;
		}
	});
	let rafSpy;
	let cafSpy;

	beforeEach(() => {
		// Avoid recursive synchronous calls; let the first loop run and don't recursively call raf
		rafSpy = vi.spyOn(globalThis, 'requestAnimationFrame').mockImplementation(() => {
			return 1; // no immediate callback
		});
		cafSpy = vi.spyOn(globalThis, 'cancelAnimationFrame').mockImplementation(() => {});
	});

	afterEach(() => {
		rafSpy.mockRestore();
		cafSpy.mockRestore();
	});

	test('fills canvas with background color and renders active layers', () => {
		const ctx = createMockContext();
		const layer = { playToContext: vi.fn() };
		const layerA = { hasActiveLayers: () => true, getActiveLayers: () => [layer] };
		const layerManager = {
			getLayerA: () => layerA,
			getLayerB: () => ({ hasActiveLayers: () => false, getActiveLayers: () => [] }),
			getLayerC: () => ({ getActiveLayers: () => [] }),
			getMaskManager: () => ({ getCurrentMask: () => null }),
			getEffectsManager: () => ({ hasEffectsAB: () => false, hasEffectsGlobal: () => false })
		};

		const renderer = new Renderer(ctx, layerManager);
		rafSpy.mockClear();
		renderer.start();
		const rafCb = rafSpy.mock.calls[0][0];
		rafCb(0);

		expect(ctx.fillRect).toHaveBeenCalled();
		expect(layer.playToContext).toHaveBeenCalled();
		// stop and destroy should not throw
		const stopSpy = vi.spyOn(renderer, 'stop');
		renderer.destroy();
		expect(stopSpy).toHaveBeenCalled();
	});

	test('passes RAF timestamp to animation play method', () => {
		const ctx = createMockContext();
		let receivedTimestamp = null;
		const layer = {
			playToContext: (ctx, t) => {
				receivedTimestamp = t;
			}
		};
		const layerA = { hasActiveLayers: () => true, getActiveLayers: () => [layer] };
		const layerManager = {
			getLayerA: () => layerA,
			getLayerB: () => ({ hasActiveLayers: () => false, getActiveLayers: () => [] }),
			getLayerC: () => ({ getActiveLayers: () => [] }),
			getMaskManager: () => ({ getCurrentMask: () => null }),
			getEffectsManager: () => ({ hasEffectsAB: () => false, hasEffectsGlobal: () => false })
		};

		// Set up RAF to immediately invoke the callback with a timestamp
		let called = false;
		rafSpy.mockImplementation(cb => {
			if (!called) {
				called = true;
				cb(12345);
			}
			return 1;
		});

		const renderer = new Renderer(ctx, layerManager);
		renderer.start();
		expect(receivedTimestamp).toBe(12345);
		renderer.destroy();
	});

	test('skips finished non-looping layers during render', () => {
		const ctx = createMockContext();
		const finishedLayer = { playToContext: vi.fn(), isFinished: true };
		const activeLayer = { playToContext: vi.fn(), isFinished: false };
		const layers = [finishedLayer, activeLayer];
		const layerA = { hasActiveLayers: () => true, getActiveLayers: () => layers };
		const layerManager = {
			getLayerA: () => layerA,
			getLayerB: () => ({ hasActiveLayers: () => false, getActiveLayers: () => [] }),
			getLayerC: () => ({ getActiveLayers: () => [] }),
			getMaskManager: () => ({ getCurrentMask: () => null }),
			getEffectsManager: () => ({ hasEffectsAB: () => false, hasEffectsGlobal: () => false })
		};

		const renderer = new Renderer(ctx, layerManager);
		renderer.start();

		// Finished layer should not have playToContext invoked, but active layer should
		expect(finishedLayer.playToContext).not.toHaveBeenCalled();
		expect(activeLayer.playToContext).toHaveBeenCalled();
		renderer.destroy();
	});

	test('continues rendering loop when no active layers present', () => {
		const ctx = createMockContext();
		const layerManager = {
			getLayerA: () => ({ hasActiveLayers: () => false, getActiveLayers: () => [] }),
			getLayerB: () => ({ hasActiveLayers: () => false, getActiveLayers: () => [] }),
			getLayerC: () => ({ getActiveLayers: () => [] }),
			getMaskManager: () => ({ getCurrentMask: () => null }),
			getEffectsManager: () => ({ hasEffectsAB: () => false, hasEffectsGlobal: () => false })
		};

		rafSpy.mockClear();
		const renderer = new Renderer(ctx, layerManager);
		renderer.start();

		expect(ctx.fillRect).toHaveBeenCalled();
		// Loop continues even when there are no active layers; ensure RAF was scheduled
		expect(rafSpy).toHaveBeenCalled();
		renderer.destroy();
	});

	test('mixes Layer B when Layer A is empty and no mask', () => {
		const mainCtx = createMockContext();

		// Layer groups: Layer A has no layers, Layer B has one layer (mock)
		const layerA = { hasActiveLayers: () => false, getActiveLayers: () => [] };
		const layerB = { hasActiveLayers: () => true, getActiveLayers: () => [{ playToContext: vi.fn() }] };
		const maskManager = { getCurrentMask: () => null };
		const effectsManager = { hasEffectsAB: () => false, hasEffectsGlobal: () => false };
		const layerManager = {
			getLayerA: () => layerA,
			getLayerB: () => layerB,
			getLayerC: () => ({ getActiveLayers: () => [] }),
			getMaskManager: () => maskManager,
			getEffectsManager: () => effectsManager
		};

		const renderer = new Renderer(mainCtx, layerManager);
		// Start renderer but don't auto-invoke RAF; call the stored callback manually to simulate a frame
		rafSpy.mockClear();
		renderer.start();
		const cbA = rafSpy.mock.calls[0][0];
		cbA(0);

		// The renderer should draw the mixed canvas to the main canvas
		expect(mainCtx.drawImage).toHaveBeenCalled();
		// And since A is empty, ctxMixed.drawImage should have been called with canvasB
		// The offscreen ctxMixed drew the canvasB onto itself; we can't inspect that directly from this mock,
		// but verifying that main drawing was triggered suffices for the logic branch coverage.
		renderer.destroy();
	});

	test('mixes A and B with 1-bit mask (hard cut)', () => {
		const mainCtx = createMockContext();
		globalThis.__createdCanvases = [];

		const layerA = { hasActiveLayers: () => true, getActiveLayers: () => [{ playToContext: vi.fn() }] };
		const layerB = { hasActiveLayers: () => true, getActiveLayers: () => [{ playToContext: vi.fn() }] };
		const maskLayer = { isFinished: false, playToContext: vi.fn() };
		const maskManager = { getCurrentMask: () => maskLayer, getBitDepth: () => 1 };
		const effectsManager = { hasEffectsAB: () => false, hasEffectsGlobal: () => false };
		const layerManager = {
			getLayerA: () => layerA,
			getLayerB: () => layerB,
			getLayerC: () => ({ getActiveLayers: () => [] }),
			getMaskManager: () => maskManager,
			getEffectsManager: () => effectsManager
		};

		const renderer = new Renderer(mainCtx, layerManager);

		// At this point, the internal offscreen canvases should be created in the same order
		// A, B, Mask, Mixed. Grab contexts to control getImageData/putImageData behavior.
		const [canvasA, canvasB, canvasMask, canvasMixed] = globalThis.__createdCanvases;
		const ctxA = canvasA.getContext();
		const ctxB = canvasB.getContext();
		const ctxMask = canvasMask.getContext();
		const ctxMixed = canvasMixed.getContext();

		// Prepare image arrays: A black, B white, Mask either black or white
		const w = 240;
		const h = 135;
		const size = w * h * 4;
		const aPixels = new Uint8ClampedArray(size);
		const bPixels = new Uint8ClampedArray(size);
		const maskPixels = new Uint8ClampedArray(size);
		for (let i = 0; i < size; i += 4) {
			// A: black opaque
			aPixels[i] = 0;
			aPixels[i + 1] = 0;
			aPixels[i + 2] = 0;
			aPixels[i + 3] = 255;
			// B: white opaque
			bPixels[i] = 255;
			bPixels[i + 1] = 255;
			bPixels[i + 2] = 255;
			bPixels[i + 3] = 255;
			// Mask: first pixel black, second pixel white (for test variety)
			maskPixels[i] = 0;
			maskPixels[i + 1] = 0;
			maskPixels[i + 2] = 0;
			maskPixels[i + 3] = 255;
		}

		// Return arrays from getImageData and capture putImageData output
		ctxA.getImageData = () => ({ data: aPixels });
		ctxB.getImageData = () => ({ data: bPixels });
		ctxMask.getImageData = () => ({ data: maskPixels });

		let putImageDataArg = null;
		ctxMixed.putImageData = outData => {
			putImageDataArg = outData;
		};

		// Run a single RAF frame to perform mixing using the stored RAF callback
		rafSpy.mockClear();
		renderer.start();
		const rafCbLocal = rafSpy.mock.calls[0][0];
		rafCbLocal(0);

		// After mixing, ctxMixed.putImageData should have been called with outputImageData
		expect(putImageDataArg).toBeDefined();
		// For the first pixel, mask = 0 => chooses A (black)
		expect(putImageDataArg.data[0]).toBe(0);
		// Change mask to white and rerun: should choose B (white)
		maskPixels[0] = 255;
		maskPixels[1] = 255;
		maskPixels[2] = 255;
		// Reset putImageDataArg
		putImageDataArg = null;
		rafCbLocal(1);
		expect(putImageDataArg.data[0]).toBe(255);
		renderer.destroy();
	});

	test('mixes A and B with 8-bit mask (smooth blend)', () => {
		const mainCtx = createMockContext();
		globalThis.__createdCanvases = [];

		const layerA = { hasActiveLayers: () => true, getActiveLayers: () => [{ playToContext: vi.fn() }] };
		const layerB = { hasActiveLayers: () => true, getActiveLayers: () => [{ playToContext: vi.fn() }] };
		const maskLayer = { isFinished: false, playToContext: vi.fn() };
		const maskManager = { getCurrentMask: () => maskLayer, getBitDepth: () => 8 };
		const effectsManager = { hasEffectsAB: () => false, hasEffectsGlobal: () => false };
		const layerManager = {
			getLayerA: () => layerA,
			getLayerB: () => layerB,
			getLayerC: () => ({ getActiveLayers: () => [] }),
			getMaskManager: () => maskManager,
			getEffectsManager: () => effectsManager
		};

		const renderer = new Renderer(mainCtx, layerManager);
		const [canvasA, canvasB, canvasMask, canvasMixed] = globalThis.__createdCanvases;
		const ctxA = canvasA.getContext();
		const ctxB = canvasB.getContext();
		const ctxMask = canvasMask.getContext();
		const ctxMixed = canvasMixed.getContext();

		const w = 240;
		const h = 135;
		const size = w * h * 4;
		const aPixels = new Uint8ClampedArray(size);
		const bPixels = new Uint8ClampedArray(size);
		const maskPixels = new Uint8ClampedArray(size);
		for (let i = 0; i < size; i += 4) {
			aPixels[i] = 0;
			aPixels[i + 1] = 0;
			aPixels[i + 2] = 0;
			aPixels[i + 3] = 255;
			bPixels[i] = 255;
			bPixels[i + 1] = 255;
			bPixels[i + 2] = 255;
			bPixels[i + 3] = 255;
			maskPixels[i] = 128;
			maskPixels[i + 1] = 128;
			maskPixels[i + 2] = 128;
			maskPixels[i + 3] = 255;
		}
		ctxA.getImageData = () => ({ data: aPixels });
		ctxB.getImageData = () => ({ data: bPixels });
		ctxMask.getImageData = () => ({ data: maskPixels });

		let putImageDataArg = null;
		ctxMixed.putImageData = outData => {
			putImageDataArg = outData;
		};

		rafSpy.mockClear();
		renderer.start();
		const rafCb2 = rafSpy.mock.calls[0][0];
		rafCb2(0);
		expect(putImageDataArg).toBeDefined();
		// For a 50% mask (128/255), output should be around 128 for R channel (blend of 0 and 255)
		const r = putImageDataArg.data[0];
		expect(r === 127 || r === 128).toBe(true);
		renderer.destroy();
	});

	test('handles pending frame after destroy without throwing', () => {
		const ctx = createMockContext();
		const layer = { playToContext: vi.fn() };
		const layerA = { hasActiveLayers: () => true, getActiveLayers: () => [layer] };
		const layerManager = {
			getLayerA: () => layerA,
			getLayerB: () => ({ hasActiveLayers: () => false, getActiveLayers: () => [] }),
			getLayerC: () => ({ getActiveLayers: () => [] }),
			getMaskManager: () => ({ getCurrentMask: () => null }),
			getEffectsManager: () => ({ hasEffectsAB: () => false, hasEffectsGlobal: () => false })
		};

		let frameCallback = null;
		rafSpy.mockImplementation(cb => {
			frameCallback = cb;
			return 1;
		});

		const renderer = new Renderer(ctx, layerManager);
		renderer.start();
		// Destroy while a frame callback is pending
		renderer.destroy();

		expect(frameCallback).toBeDefined();
		// Clear spy and invoke to verify no new RAF scheduled after destroy
		rafSpy.mockClear();
		expect(() => frameCallback()).not.toThrow();
		// No new frame should be scheduled after destroy
		expect(rafSpy).not.toHaveBeenCalled();
	});

	test('destroy is idempotent and safe to call multiple times', () => {
		const ctx = createMockContext();
		const layerManager = {
			getLayerA: () => ({ hasActiveLayers: () => false, getActiveLayers: () => [] }),
			getLayerB: () => ({ hasActiveLayers: () => false, getActiveLayers: () => [] }),
			getLayerC: () => ({ getActiveLayers: () => [] }),
			getMaskManager: () => ({ getCurrentMask: () => null }),
			getEffectsManager: () => ({ hasEffectsAB: () => false, hasEffectsGlobal: () => false })
		};
		const renderer = new Renderer(ctx, layerManager);

		renderer.destroy();
		expect(() => renderer.destroy()).not.toThrow();
	});

	test('destroy before start does not throw', () => {
		const ctx = createMockContext();
		const layerManager = {
			getLayerA: () => ({ hasActiveLayers: () => false, getActiveLayers: () => [] }),
			getLayerB: () => ({ hasActiveLayers: () => false, getActiveLayers: () => [] }),
			getLayerC: () => ({ getActiveLayers: () => [] }),
			getMaskManager: () => ({ getCurrentMask: () => null }),
			getEffectsManager: () => ({ hasEffectsAB: () => false, hasEffectsGlobal: () => false })
		};
		const renderer = new Renderer(ctx, layerManager);

		expect(() => renderer.destroy()).not.toThrow();
	});
});
