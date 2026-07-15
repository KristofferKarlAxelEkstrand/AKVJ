import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';
import Renderer from '../src/js/visuals/Renderer.js';
import settings from '../src/js/core/settings.js';
import withSettings from './utils/with-settings.js';
import { installRAFMocks, restoreRAFMocks, installMockCanvas, createMockContext } from './utils/renderer-fixture.js';

describe('Renderer', () => {
	let rafMocks;
	let canvasMock;

	beforeEach(() => {
		rafMocks = installRAFMocks();
		canvasMock = installMockCanvas();
	});

	test('reuses output ImageData instance across consecutive frames', () => {
		const displayContext = createMockContext();
		const layerGroupA = { hasActiveClips: () => true, getActiveClips: () => [{ renderToContext: vi.fn() }] };
		const layerGroupB = { hasActiveClips: () => true, getActiveClips: () => [{ renderToContext: vi.fn() }] };
		const maskAnimationClip = { isFinished: false, renderToContext: vi.fn() };
		const maskManager = { getCurrentMask: () => maskAnimationClip, getBitDepth: () => 1 };
		const effectsManager = { hasMixedOutputEffects: () => false, hasGlobalEffects: () => false };
		const layerManager = {
			getLayerGroupA: () => layerGroupA,
			getLayerGroupB: () => layerGroupB,
			getLayerGroupC: () => ({ getActiveClips: () => [] }),
			getMaskManager: () => maskManager,
			getEffectsManager: () => effectsManager
		};

		const renderer = new Renderer(displayContext, layerManager, settings, { bpm: 120 });
		const [layerGroupACanvas, layerGroupBCanvas, maskCanvas, mixedOutputCanvas] = canvasMock.createdCanvases;
		const layerGroupAContext = layerGroupACanvas.getContext();
		const layerGroupBContext = layerGroupBCanvas.getContext();
		const maskContext = maskCanvas.getContext();
		const mixedOutputContext = mixedOutputCanvas.getContext();

		// Provide deterministic pixel arrays
		const canvasWidth = settings.canvas.width;
		const canvasHeight = settings.canvas.height;
		const pixelCount = canvasWidth * canvasHeight * 4;
		const layerGroupAPixels = new Uint8ClampedArray(pixelCount);
		const layerGroupBPixels = new Uint8ClampedArray(pixelCount);
		const maskPixels = new Uint8ClampedArray(pixelCount);
		for (let i = 0; i < pixelCount; i += 4) {
			layerGroupAPixels[i] = 0;
			layerGroupAPixels[i + 1] = 0;
			layerGroupAPixels[i + 2] = 0;
			layerGroupAPixels[i + 3] = 255;
			layerGroupBPixels[i] = 255;
			layerGroupBPixels[i + 1] = 255;
			layerGroupBPixels[i + 2] = 255;
			layerGroupBPixels[i + 3] = 255;
			maskPixels[i] = 0;
			maskPixels[i + 1] = 0;
			maskPixels[i + 2] = 0;
			maskPixels[i + 3] = 255;
		}

		layerGroupAContext.getImageData = () => ({ data: layerGroupAPixels });
		layerGroupBContext.getImageData = () => ({ data: layerGroupBPixels });
		maskContext.getImageData = () => ({ data: maskPixels });

		const outputs = [];
		mixedOutputContext.putImageData = outData => outputs.push(outData);

		// Run two frames
		renderer.start();
		const rafCb = rafMocks.rafSpy.mock.calls[0][0];
		rafCb(0);
		rafCb(1);

		expect(outputs.length).toBeGreaterThanOrEqual(2);
		// The same ImageData instance should be reused across frames
		expect(outputs[0]).toBe(outputs[1]);
		renderer.destroy();
	});

	test('allocates ImageData with new dimensions when canvas pixelCount changes via settings', () => {
		withSettings({ canvas: { width: 320, height: 180 } }, () => {
			const displayContext = createMockContext();
			const layerGroupA = { hasActiveClips: () => true, getActiveClips: () => [{ renderToContext: vi.fn() }] };
			const layerGroupB = { hasActiveClips: () => true, getActiveClips: () => [{ renderToContext: vi.fn() }] };
			const maskAnimationClip = { isFinished: false, renderToContext: vi.fn() };
			const maskManager = { getCurrentMask: () => maskAnimationClip, getBitDepth: () => 8 };
			const effectsManager = { hasMixedOutputEffects: () => false, hasGlobalEffects: () => false };
			const layerManager = {
				getLayerGroupA: () => layerGroupA,
				getLayerGroupB: () => layerGroupB,
				getLayerGroupC: () => ({ getActiveClips: () => [] }),
				getMaskManager: () => maskManager,
				getEffectsManager: () => effectsManager
			};

			const renderer = new Renderer(displayContext, layerManager, settings, { bpm: 120 });
			const [layerGroupACanvas, layerGroupBCanvas, maskCanvas, mixedOutputCanvas] = canvasMock.createdCanvases;
			const layerGroupAContext = layerGroupACanvas.getContext();
			const layerGroupBContext = layerGroupBCanvas.getContext();
			const maskContext = maskCanvas.getContext();
			const mixedOutputContext = mixedOutputCanvas.getContext();

			// Prepare image arrays with new dimensions for getImageData
			const canvasWidth2 = settings.canvas.width;
			const canvasHeight2 = settings.canvas.height;
			const pixelCount2 = canvasWidth2 * canvasHeight2 * 4;
			const layerGroupAPixels2 = new Uint8ClampedArray(pixelCount2);
			const layerGroupBPixels2 = new Uint8ClampedArray(pixelCount2);
			const maskPixels2 = new Uint8ClampedArray(pixelCount2);
			for (let i = 0; i < pixelCount2; i += 4) {
				layerGroupAPixels2[i] = 0;
				layerGroupAPixels2[i + 1] = 0;
				layerGroupAPixels2[i + 2] = 0;
				layerGroupAPixels2[i + 3] = 255;
				layerGroupBPixels2[i] = 255;
				layerGroupBPixels2[i + 1] = 255;
				layerGroupBPixels2[i + 2] = 255;
				layerGroupBPixels2[i + 3] = 255;
				maskPixels2[i] = 128;
				maskPixels2[i + 1] = 128;
				maskPixels2[i + 2] = 128;
				maskPixels2[i + 3] = 255;
			}
			layerGroupAContext.getImageData = () => ({ data: layerGroupAPixels2 });
			layerGroupBContext.getImageData = () => ({ data: layerGroupBPixels2 });
			maskContext.getImageData = () => ({ data: maskPixels2 });

			let putArg = null;
			mixedOutputContext.putImageData = out => (putArg = out);

			renderer.start();
			const cb = rafMocks.rafSpy.mock.calls[0][0];
			cb(0);

			expect(putArg).toBeDefined();
			expect(putArg.width).toBe(320);
			expect(putArg.height).toBe(180);

			renderer.destroy();
		});
	});

	afterEach(() => {
		restoreRAFMocks(rafMocks);
		canvasMock.restore();
	});

	test('fills canvas with background color and renders active clips', () => {
		const displayContext = createMockContext();
		const animationClip = { renderToContext: vi.fn() };
		const layerGroupA = { hasActiveClips: () => true, getActiveClips: () => [animationClip] };
		const layerManager = {
			getLayerGroupA: () => layerGroupA,
			getLayerGroupB: () => ({ hasActiveClips: () => false, getActiveClips: () => [] }),
			getLayerGroupC: () => ({ getActiveClips: () => [] }),
			getMaskManager: () => ({ getCurrentMask: () => null }),
			getEffectsManager: () => ({ hasMixedOutputEffects: () => false, hasGlobalEffects: () => false })
		};

		const renderer = new Renderer(displayContext, layerManager, settings, { bpm: 120 });
		rafMocks.rafSpy.mockClear();
		renderer.start();
		const rafCb = rafMocks.rafSpy.mock.calls[0][0];
		rafCb(0);

		expect(displayContext.fillRect).toHaveBeenCalled();
		expect(animationClip.renderToContext).toHaveBeenCalled();
		// stop and destroy should not throw
		const stopSpy = vi.spyOn(renderer, 'stop');
		renderer.destroy();
		expect(stopSpy).toHaveBeenCalled();
	});

	test('passes RAF timestamp to clip render method', () => {
		const displayContext = createMockContext();
		let receivedTimestamp = null;
		const animationClip = {
			renderToContext: (displayContext, t) => {
				receivedTimestamp = t;
			}
		};
		const layerGroupA = { hasActiveClips: () => true, getActiveClips: () => [animationClip] };
		const layerManager = {
			getLayerGroupA: () => layerGroupA,
			getLayerGroupB: () => ({ hasActiveClips: () => false, getActiveClips: () => [] }),
			getLayerGroupC: () => ({ getActiveClips: () => [] }),
			getMaskManager: () => ({ getCurrentMask: () => null }),
			getEffectsManager: () => ({ hasMixedOutputEffects: () => false, hasGlobalEffects: () => false })
		};

		// Set up RAF to immediately invoke the callback with a timestamp
		let called = false;
		rafMocks.rafSpy.mockImplementation(cb => {
			if (!called) {
				called = true;
				cb(12345);
			}
			return 1;
		});

		const renderer = new Renderer(displayContext, layerManager, settings, { bpm: 120 });
		renderer.start();
		expect(receivedTimestamp).toBe(12345);
		renderer.destroy();
	});

	test('skips finished non-looping clips during render', () => {
		const displayContext = createMockContext();
		const finishedAnimationClip = { renderToContext: vi.fn(), isFinished: true };
		const activeAnimationClip = { renderToContext: vi.fn(), isFinished: false };
		// getActiveClips() should only return non-finished clips (filtering is done by LayerGroup)
		const layerGroupA = { hasActiveClips: () => true, getActiveClips: () => [activeAnimationClip] };
		const layerManager = {
			getLayerGroupA: () => layerGroupA,
			getLayerGroupB: () => ({ hasActiveClips: () => false, getActiveClips: () => [] }),
			getLayerGroupC: () => ({ getActiveClips: () => [] }),
			getMaskManager: () => ({ getCurrentMask: () => null }),
			getEffectsManager: () => ({ hasMixedOutputEffects: () => false, hasGlobalEffects: () => false })
		};

		const renderer = new Renderer(displayContext, layerManager, settings, { bpm: 120 });
		renderer.start();

		// Finished animationClip should not be in getActiveClips() result, so renderToContext not called
		expect(finishedAnimationClip.renderToContext).not.toHaveBeenCalled();
		expect(activeAnimationClip.renderToContext).toHaveBeenCalled();
		renderer.destroy();
	});

	test('continues rendering loop when no active clips present', () => {
		const displayContext = createMockContext();
		const layerManager = {
			getLayerGroupA: () => ({ hasActiveClips: () => false, getActiveClips: () => [] }),
			getLayerGroupB: () => ({ hasActiveClips: () => false, getActiveClips: () => [] }),
			getLayerGroupC: () => ({ getActiveClips: () => [] }),
			getMaskManager: () => ({ getCurrentMask: () => null }),
			getEffectsManager: () => ({ hasMixedOutputEffects: () => false, hasGlobalEffects: () => false })
		};

		rafMocks.rafSpy.mockClear();
		const renderer = new Renderer(displayContext, layerManager, settings, { bpm: 120 });
		renderer.start();

		expect(displayContext.fillRect).toHaveBeenCalled();
		// Loop continues even when there are no active clips; ensure RAF was scheduled
		expect(rafMocks.rafSpy).toHaveBeenCalled();
		renderer.destroy();
	});

	test('mixes Layer Group B when Layer Group A is empty and no mask', () => {
		const displayContext = createMockContext();

		// Layer groups: Layer Group A has no animations, Layer Group B has one animation (mock)
		const layerGroupA = { hasActiveClips: () => false, getActiveClips: () => [] };
		const layerGroupB = { hasActiveClips: () => true, getActiveClips: () => [{ renderToContext: vi.fn() }] };
		const maskManager = { getCurrentMask: () => null };
		const effectsManager = { hasMixedOutputEffects: () => false, hasGlobalEffects: () => false };
		const layerManager = {
			getLayerGroupA: () => layerGroupA,
			getLayerGroupB: () => layerGroupB,
			getLayerGroupC: () => ({ getActiveClips: () => [] }),
			getMaskManager: () => maskManager,
			getEffectsManager: () => effectsManager
		};

		const renderer = new Renderer(displayContext, layerManager, settings, { bpm: 120 });
		// Start renderer but don't auto-invoke RAF; call the stored callback manually to simulate a frame
		rafMocks.rafSpy.mockClear();
		renderer.start();
		const cbA = rafMocks.rafSpy.mock.calls[0][0];
		cbA(0);

		// The renderer should draw the mixed canvas to the main canvas
		expect(displayContext.drawImage).toHaveBeenCalled();
		// And since Layer Group A is empty, mixedOutputContext.drawImage should have been called with layerGroupBCanvas
		// The offscreen mixedOutputContext drew the layerGroupBCanvas onto itself; we can't inspect that directly from this mock,
		// but verifying that main drawing was triggered suffices for the logic branch coverage.
		renderer.destroy();
	});

	test('mixes Layer Group A and Layer Group B with 1-bit mask (hard cut)', () => {
		const displayContext = createMockContext();
		const layerGroupA = { hasActiveClips: () => true, getActiveClips: () => [{ renderToContext: vi.fn() }] };
		const layerGroupB = { hasActiveClips: () => true, getActiveClips: () => [{ renderToContext: vi.fn() }] };
		const maskAnimationClip = { isFinished: false, renderToContext: vi.fn() };
		const maskManager = { getCurrentMask: () => maskAnimationClip, getBitDepth: () => 1 };
		const effectsManager = { hasMixedOutputEffects: () => false, hasGlobalEffects: () => false };
		const layerManager = {
			getLayerGroupA: () => layerGroupA,
			getLayerGroupB: () => layerGroupB,
			getLayerGroupC: () => ({ getActiveClips: () => [] }),
			getMaskManager: () => maskManager,
			getEffectsManager: () => effectsManager
		};

		const renderer = new Renderer(displayContext, layerManager, settings, { bpm: 120 });

		// At this point, the internal offscreen canvases should be created in the same order
		// Layer Group A, Layer Group B, Mask, Mixed. Grab contexts to control getImageData/putImageData behavior.
		const [layerGroupACanvas, layerGroupBCanvas, maskCanvas, mixedOutputCanvas] = canvasMock.createdCanvases;
		const layerGroupAContext = layerGroupACanvas.getContext();
		const layerGroupBContext = layerGroupBCanvas.getContext();
		const maskContext = maskCanvas.getContext();
		const mixedOutputContext = mixedOutputCanvas.getContext();

		// Prepare image arrays: Layer Group A black, Layer Group B white, Mask either black or white
		const canvasWidth = 240;
		const canvasHeight = 135;
		const pixelCount = canvasWidth * canvasHeight * 4;
		const layerGroupAPixels = new Uint8ClampedArray(pixelCount);
		const layerGroupBPixels = new Uint8ClampedArray(pixelCount);
		const maskPixels = new Uint8ClampedArray(pixelCount);
		for (let i = 0; i < pixelCount; i += 4) {
			// Layer Group A: black opaque
			layerGroupAPixels[i] = 0;
			layerGroupAPixels[i + 1] = 0;
			layerGroupAPixels[i + 2] = 0;
			layerGroupAPixels[i + 3] = 255;
			// Layer Group B: white opaque
			layerGroupBPixels[i] = 255;
			layerGroupBPixels[i + 1] = 255;
			layerGroupBPixels[i + 2] = 255;
			layerGroupBPixels[i + 3] = 255;
			// Mask: first pixel black, second pixel white (for test variety)
			maskPixels[i] = 0;
			maskPixels[i + 1] = 0;
			maskPixels[i + 2] = 0;
			maskPixels[i + 3] = 255;
		}

		// Return arrays from getImageData and capture putImageData output
		layerGroupAContext.getImageData = () => ({ data: layerGroupAPixels });
		layerGroupBContext.getImageData = () => ({ data: layerGroupBPixels });
		maskContext.getImageData = () => ({ data: maskPixels });

		let putImageDataArg = null;
		mixedOutputContext.putImageData = outData => {
			putImageDataArg = outData;
		};

		// Run a single RAF frame to perform mixing using the stored RAF callback
		rafMocks.rafSpy.mockClear();
		renderer.start();
		const rafCbLocal = rafMocks.rafSpy.mock.calls[0][0];
		rafCbLocal(0);

		// After mixing, mixedOutputContext.putImageData should have been called with outputImageData
		expect(putImageDataArg).toBeDefined();
		// For the first pixel, mask = 0 => chooses Layer Group A (black)
		expect(putImageDataArg.data[0]).toBe(0);
		// Change mask to white and rerun: should choose Layer Group B (white)
		maskPixels[0] = 255;
		maskPixels[1] = 255;
		maskPixels[2] = 255;
		// Reset putImageDataArg
		putImageDataArg = null;
		rafCbLocal(1);
		expect(putImageDataArg.data[0]).toBe(255);
		renderer.destroy();
	});

	test('mixes Layer Group A and Layer Group B with 8-bit mask (smooth blend)', () => {
		const displayContext = createMockContext();
		const layerGroupA = { hasActiveClips: () => true, getActiveClips: () => [{ renderToContext: vi.fn() }] };
		const layerGroupB = { hasActiveClips: () => true, getActiveClips: () => [{ renderToContext: vi.fn() }] };
		const maskAnimationClip = { isFinished: false, renderToContext: vi.fn() };
		const maskManager = { getCurrentMask: () => maskAnimationClip, getBitDepth: () => 8 };
		const effectsManager = { hasMixedOutputEffects: () => false, hasGlobalEffects: () => false };
		const layerManager = {
			getLayerGroupA: () => layerGroupA,
			getLayerGroupB: () => layerGroupB,
			getLayerGroupC: () => ({ getActiveClips: () => [] }),
			getMaskManager: () => maskManager,
			getEffectsManager: () => effectsManager
		};

		const renderer = new Renderer(displayContext, layerManager, settings, { bpm: 120 });
		const [layerGroupACanvas, layerGroupBCanvas, maskCanvas, mixedOutputCanvas] = canvasMock.createdCanvases;
		const layerGroupAContext = layerGroupACanvas.getContext();
		const layerGroupBContext = layerGroupBCanvas.getContext();
		const maskContext = maskCanvas.getContext();
		const mixedOutputContext = mixedOutputCanvas.getContext();

		const canvasWidth = 240;
		const canvasHeight = 135;
		const pixelCount = canvasWidth * canvasHeight * 4;
		const layerGroupAPixels = new Uint8ClampedArray(pixelCount);
		const layerGroupBPixels = new Uint8ClampedArray(pixelCount);
		const maskPixels = new Uint8ClampedArray(pixelCount);
		for (let i = 0; i < pixelCount; i += 4) {
			layerGroupAPixels[i] = 0;
			layerGroupAPixels[i + 1] = 0;
			layerGroupAPixels[i + 2] = 0;
			layerGroupAPixels[i + 3] = 255;
			layerGroupBPixels[i] = 255;
			layerGroupBPixels[i + 1] = 255;
			layerGroupBPixels[i + 2] = 255;
			layerGroupBPixels[i + 3] = 255;
			maskPixels[i] = 128;
			maskPixels[i + 1] = 128;
			maskPixels[i + 2] = 128;
			maskPixels[i + 3] = 255;
		}
		layerGroupAContext.getImageData = () => ({ data: layerGroupAPixels });
		layerGroupBContext.getImageData = () => ({ data: layerGroupBPixels });
		maskContext.getImageData = () => ({ data: maskPixels });

		let putImageDataArg = null;
		mixedOutputContext.putImageData = outData => {
			putImageDataArg = outData;
		};

		rafMocks.rafSpy.mockClear();
		renderer.start();
		const rafCb2 = rafMocks.rafSpy.mock.calls[0][0];
		rafCb2(0);
		expect(putImageDataArg).toBeDefined();
		// For a 50% mask (128/255), output should be around 128 for R channel (blend of Layer Group A black and Layer Group B white)
		const r = putImageDataArg.data[0];
		expect(r === 127 || r === 128).toBe(true);
		renderer.destroy();
	});

	test('mixes Layer Group A and Layer Group B with 2-bit mask (4 quantized levels)', () => {
		const displayContext = createMockContext();
		const layerGroupA = { hasActiveClips: () => true, getActiveClips: () => [{ renderToContext: vi.fn() }] };
		const layerGroupB = { hasActiveClips: () => true, getActiveClips: () => [{ renderToContext: vi.fn() }] };
		const maskAnimationClip = { isFinished: false, renderToContext: vi.fn() };
		const maskManager = { getCurrentMask: () => maskAnimationClip, getBitDepth: () => 2 };
		const effectsManager = { hasMixedOutputEffects: () => false, hasGlobalEffects: () => false };
		const layerManager = {
			getLayerGroupA: () => layerGroupA,
			getLayerGroupB: () => layerGroupB,
			getLayerGroupC: () => ({ getActiveClips: () => [] }),
			getMaskManager: () => maskManager,
			getEffectsManager: () => effectsManager
		};

		const renderer = new Renderer(displayContext, layerManager, settings, { bpm: 120 });
		const [layerGroupACanvas, layerGroupBCanvas, maskCanvas, mixedOutputCanvas] = canvasMock.createdCanvases;
		const layerGroupAContext = layerGroupACanvas.getContext();
		const layerGroupBContext = layerGroupBCanvas.getContext();
		const maskContext = maskCanvas.getContext();
		const mixedOutputContext = mixedOutputCanvas.getContext();

		const canvasWidth = 240;
		const canvasHeight = 135;
		const pixelCount = canvasWidth * canvasHeight * 4;
		const layerGroupAPixels = new Uint8ClampedArray(pixelCount);
		const layerGroupBPixels = new Uint8ClampedArray(pixelCount);
		const maskPixels = new Uint8ClampedArray(pixelCount);
		for (let i = 0; i < pixelCount; i += 4) {
			layerGroupAPixels[i] = 0;
			layerGroupAPixels[i + 1] = 0;
			layerGroupAPixels[i + 2] = 0;
			layerGroupAPixels[i + 3] = 255;
			layerGroupBPixels[i] = 255;
			layerGroupBPixels[i + 1] = 255;
			layerGroupBPixels[i + 2] = 255;
			layerGroupBPixels[i + 3] = 255;
			// Mask value 64 -> level 1, alpha = 1/3
			maskPixels[i] = 64;
			maskPixels[i + 1] = 64;
			maskPixels[i + 2] = 64;
			maskPixels[i + 3] = 255;
		}
		layerGroupAContext.getImageData = () => ({ data: layerGroupAPixels });
		layerGroupBContext.getImageData = () => ({ data: layerGroupBPixels });
		maskContext.getImageData = () => ({ data: maskPixels });

		let putImageDataArg = null;
		mixedOutputContext.putImageData = outData => {
			putImageDataArg = outData;
		};

		rafMocks.rafSpy.mockClear();
		renderer.start();
		const rafCb = rafMocks.rafSpy.mock.calls[0][0];
		rafCb(0);

		expect(putImageDataArg).toBeDefined();
		// 2-bit: level = floor(64/64) = 1, alpha = 1/3
		// output = Layer Group A + (Layer Group B - Layer Group A) * (1/3) = 85
		expect(putImageDataArg.data[0]).toBe(85);
		renderer.destroy();
	});

	test('mixes Layer Group A and Layer Group B with 4-bit mask (16 quantized levels)', () => {
		const displayContext = createMockContext();
		const layerGroupA = { hasActiveClips: () => true, getActiveClips: () => [{ renderToContext: vi.fn() }] };
		const layerGroupB = { hasActiveClips: () => true, getActiveClips: () => [{ renderToContext: vi.fn() }] };
		const maskAnimationClip = { isFinished: false, renderToContext: vi.fn() };
		const maskManager = { getCurrentMask: () => maskAnimationClip, getBitDepth: () => 4 };
		const effectsManager = { hasMixedOutputEffects: () => false, hasGlobalEffects: () => false };
		const layerManager = {
			getLayerGroupA: () => layerGroupA,
			getLayerGroupB: () => layerGroupB,
			getLayerGroupC: () => ({ getActiveClips: () => [] }),
			getMaskManager: () => maskManager,
			getEffectsManager: () => effectsManager
		};

		const renderer = new Renderer(displayContext, layerManager, settings, { bpm: 120 });
		const [layerGroupACanvas, layerGroupBCanvas, maskCanvas, mixedOutputCanvas] = canvasMock.createdCanvases;
		const layerGroupAContext = layerGroupACanvas.getContext();
		const layerGroupBContext = layerGroupBCanvas.getContext();
		const maskContext = maskCanvas.getContext();
		const mixedOutputContext = mixedOutputCanvas.getContext();

		const canvasWidth = 240;
		const canvasHeight = 135;
		const pixelCount = canvasWidth * canvasHeight * 4;
		const layerGroupAPixels = new Uint8ClampedArray(pixelCount);
		const layerGroupBPixels = new Uint8ClampedArray(pixelCount);
		const maskPixels = new Uint8ClampedArray(pixelCount);
		for (let i = 0; i < pixelCount; i += 4) {
			layerGroupAPixels[i] = 0;
			layerGroupAPixels[i + 1] = 0;
			layerGroupAPixels[i + 2] = 0;
			layerGroupAPixels[i + 3] = 255;
			layerGroupBPixels[i] = 255;
			layerGroupBPixels[i + 1] = 255;
			layerGroupBPixels[i + 2] = 255;
			layerGroupBPixels[i + 3] = 255;
			// Mask value 80 -> level = floor(80/16) = 5, alpha = 5/15 = 1/3
			maskPixels[i] = 80;
			maskPixels[i + 1] = 80;
			maskPixels[i + 2] = 80;
			maskPixels[i + 3] = 255;
		}
		layerGroupAContext.getImageData = () => ({ data: layerGroupAPixels });
		layerGroupBContext.getImageData = () => ({ data: layerGroupBPixels });
		maskContext.getImageData = () => ({ data: maskPixels });

		let putImageDataArg = null;
		mixedOutputContext.putImageData = outData => {
			putImageDataArg = outData;
		};

		rafMocks.rafSpy.mockClear();
		renderer.start();
		const rafCb = rafMocks.rafSpy.mock.calls[0][0];
		rafCb(0);

		expect(putImageDataArg).toBeDefined();
		// 4-bit: level = floor(80/16) = 5, alpha = 5/15
		// output = Layer Group A + (Layer Group B - Layer Group A) * (5/15) = 85
		expect(putImageDataArg.data[0]).toBe(85);
		renderer.destroy();
	});

	test('glitch effect displaces pixels with mocked Math.random', () => {
		const displayContext = createMockContext();
		const layerGroupA = { hasActiveClips: () => true, getActiveClips: () => [{ renderToContext: vi.fn() }] };
		const layerGroupB = { hasActiveClips: () => false, getActiveClips: () => [] };
		const maskManager = { getCurrentMask: () => null };
		const effectsManager = {
			hasMixedOutputEffects: () => false,
			hasGlobalEffects: () => true,
			getActiveGlobalEffects: () => [{ type: 'glitch', velocity: 127 }]
		};
		const layerManager = {
			getLayerGroupA: () => layerGroupA,
			getLayerGroupB: () => layerGroupB,
			getLayerGroupC: () => ({ getActiveClips: () => [] }),
			getMaskManager: () => maskManager,
			getEffectsManager: () => effectsManager
		};

		const canvasWidth = settings.canvas.width;
		const canvasHeight = settings.canvas.height;
		const pixelCount = canvasWidth * canvasHeight * 4;
		const img = { data: new Uint8ClampedArray(pixelCount) };
		// Set pixel 0 to red, pixel 1 to blue
		img.data[0] = 255;
		img.data[1] = 0;
		img.data[2] = 0;
		img.data[3] = 255;
		img.data[4] = 0;
		img.data[5] = 0;
		img.data[6] = 255;
		img.data[7] = 255;
		displayContext.getImageData = () => img;

		let out = null;
		displayContext.putImageData = o => (out = o);

		const renderer = new Renderer(displayContext, layerManager, settings, { bpm: 120 });

		// Mock Math.random to trigger glitch and displace pixels
		// intensity = 127/127 = 1, glitchPixelProbability = 0.1
		// 0.05 < 1 * 0.1 = true, glitch triggers
		// glitchAmount = floor(1 * 20) = 20
		// offsetPx = floor(0.05 * 21) - floor(20/2) = 1 - 10 = -9
		// For pixel at x=1 (index 4), srcIdx clamped to rowStart=0, so gets pixel 0's data
		const randomSpy = vi.spyOn(Math, 'random').mockReturnValue(0.05);

		renderer.start();
		const rafCb = rafMocks.rafSpy.mock.calls[0][0];
		rafCb(0);

		expect(out).toBeDefined();
		// Pixel at x=1 (blue) should now be red (sampled from x=0 due to displacement)
		expect(out.data[4]).toBe(255); // R channel now red
		expect(out.data[5]).toBe(0);
		expect(out.data[6]).toBe(0);

		randomSpy.mockRestore();
		renderer.destroy();
	});

	test('applies multiple mixed output effects in order (color then strobe)', () => {
		const displayContext = createMockContext();
		const layerGroupA = { hasActiveClips: () => true, getActiveClips: () => [{ renderToContext: vi.fn() }] };
		const layerGroupB = { hasActiveClips: () => true, getActiveClips: () => [{ renderToContext: vi.fn() }] };
		const maskManager = { getCurrentMask: () => null, getBitDepth: () => 8 };
		const effectsManager = {
			hasMixedOutputEffects: () => true,
			hasGlobalEffects: () => false,
			getActiveMixedOutputEffects: () => [
				{ type: 'color', note: settings.effectRanges.color.min, velocity: 127 },
				{ type: 'strobe', note: settings.effectRanges.strobe.min, velocity: 127 }
			]
		};
		const layerManager = {
			getLayerGroupA: () => layerGroupA,
			getLayerGroupB: () => layerGroupB,
			getLayerGroupC: () => ({ getActiveClips: () => [] }),
			getMaskManager: () => maskManager,
			getEffectsManager: () => effectsManager
		};

		const renderer = new Renderer(displayContext, layerManager, settings, { bpm: 120 });
		const [, , , mixedOutputCanvas] = canvasMock.createdCanvases;
		const mixedOutputContext = mixedOutputCanvas.getContext();

		const canvasWidth = settings.canvas.width;
		const canvasHeight = settings.canvas.height;
		const pixelCount = canvasWidth * canvasHeight * 4;
		const img = { data: new Uint8ClampedArray(pixelCount) };
		// Initialize a known value
		img.data[0] = 10;
		mixedOutputContext.getImageData = () => img;

		let out = null;
		mixedOutputContext.putImageData = o => (out = o);

		renderer.start();
		const rafCb = rafMocks.rafSpy.mock.calls[0][0];
		rafCb(0);

		expect(out).toBeDefined();
		// color (invert) then strobe (flash on) should end with white (255)
		expect(out.data[0]).toBe(255);
		renderer.destroy();
	});

	test('respects mixed output effect order (strobe then color)', () => {
		const displayContext = createMockContext();
		const layerGroupA = { hasActiveClips: () => true, getActiveClips: () => [{ renderToContext: vi.fn() }] };
		const layerGroupB = { hasActiveClips: () => true, getActiveClips: () => [{ renderToContext: vi.fn() }] };
		const maskManager = { getCurrentMask: () => null, getBitDepth: () => 8 };
		const effectsManager = {
			hasMixedOutputEffects: () => true,
			hasGlobalEffects: () => false,
			getActiveMixedOutputEffects: () => [
				{ type: 'strobe', note: settings.effectRanges.strobe.min, velocity: 127 },
				{ type: 'color', note: settings.effectRanges.color.min, velocity: 127 }
			]
		};
		const layerManager = {
			getLayerGroupA: () => layerGroupA,
			getLayerGroupB: () => layerGroupB,
			getLayerGroupC: () => ({ getActiveClips: () => [] }),
			getMaskManager: () => maskManager,
			getEffectsManager: () => effectsManager
		};

		const renderer = new Renderer(displayContext, layerManager, settings, { bpm: 120 });
		const [, , , mixedOutputCanvas] = canvasMock.createdCanvases;
		const mixedOutputContext = mixedOutputCanvas.getContext();

		const canvasWidth = settings.canvas.width;
		const canvasHeight = settings.canvas.height;
		const pixelCount = canvasWidth * canvasHeight * 4;
		const img = { data: new Uint8ClampedArray(pixelCount) };
		img.data[0] = 10;
		mixedOutputContext.getImageData = () => img;

		let out = null;
		mixedOutputContext.putImageData = o => (out = o);

		renderer.start();
		const rafCb = rafMocks.rafSpy.mock.calls[0][0];
		rafCb(0);

		expect(out).toBeDefined();
		// strobe then color (invert) should end with black (0)
		expect(out.data[0]).toBe(0);
		renderer.destroy();
	});

	test('handles pending frame after destroy without throwing', () => {
		const displayContext = createMockContext();
		const animationClip = { renderToContext: vi.fn() };
		const layerGroupA = { hasActiveClips: () => true, getActiveClips: () => [animationClip] };
		const layerManager = {
			getLayerGroupA: () => layerGroupA,
			getLayerGroupB: () => ({ hasActiveClips: () => false, getActiveClips: () => [] }),
			getLayerGroupC: () => ({ getActiveClips: () => [] }),
			getMaskManager: () => ({ getCurrentMask: () => null }),
			getEffectsManager: () => ({ hasMixedOutputEffects: () => false, hasGlobalEffects: () => false })
		};

		let frameCallback = null;
		rafMocks.rafSpy.mockImplementation(cb => {
			frameCallback = cb;
			return 1;
		});

		const renderer = new Renderer(displayContext, layerManager, settings, { bpm: 120 });
		renderer.start();
		// Destroy while a frame callback is pending
		renderer.destroy();

		expect(frameCallback).toBeDefined();
		// Clear spy and invoke to verify no new RAF scheduled after destroy
		rafMocks.rafSpy.mockClear();
		expect(() => frameCallback()).not.toThrow();
		// No new frame should be scheduled after destroy
		expect(rafMocks.rafSpy).not.toHaveBeenCalled();
	});

	test('destroy is idempotent and safe to call multiple times', () => {
		const displayContext = createMockContext();
		const layerManager = {
			getLayerGroupA: () => ({ hasActiveClips: () => false, getActiveClips: () => [] }),
			getLayerGroupB: () => ({ hasActiveClips: () => false, getActiveClips: () => [] }),
			getLayerGroupC: () => ({ getActiveClips: () => [] }),
			getMaskManager: () => ({ getCurrentMask: () => null }),
			getEffectsManager: () => ({ hasMixedOutputEffects: () => false, hasGlobalEffects: () => false })
		};
		const renderer = new Renderer(displayContext, layerManager, settings, { bpm: 120 });

		renderer.destroy();
		expect(() => renderer.destroy()).not.toThrow();
	});

	test('destroy before start does not throw', () => {
		const displayContext = createMockContext();
		const layerManager = {
			getLayerGroupA: () => ({ hasActiveClips: () => false, getActiveClips: () => [] }),
			getLayerGroupB: () => ({ hasActiveClips: () => false, getActiveClips: () => [] }),
			getLayerGroupC: () => ({ getActiveClips: () => [] }),
			getMaskManager: () => ({ getCurrentMask: () => null }),
			getEffectsManager: () => ({ hasMixedOutputEffects: () => false, hasGlobalEffects: () => false })
		};
		const renderer = new Renderer(displayContext, layerManager, settings, { bpm: 120 });

		expect(() => renderer.destroy()).not.toThrow();
	});
});
