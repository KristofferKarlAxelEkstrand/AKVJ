import { describe, test, expect, beforeEach, afterEach } from 'vitest';
import Renderer from '../src/js/visuals/Renderer.js';
import settings from '../src/js/core/settings.js';
import appState from '../src/js/core/AppState.js';
import { installRAFMocks, restoreRAFMocks, installMockCanvas, createMockCanvasContext } from './utils/rendererFixture.js';

describe('Renderer strobe (BPM-synced)', () => {
	let rafMocks;
	let canvasMock;

	beforeEach(() => {
		rafMocks = installRAFMocks();
		canvasMock = installMockCanvas();
	});

	afterEach(() => {
		restoreRAFMocks(rafMocks);
		canvasMock.restore();
		// Reset BPM to default
		appState.reset();
	});

	test('strobe flashes on beat-aligned timestamp with high intensity', () => {
		const displayContext = createMockCanvasContext();
		const layerManager = {
			getLayerGroupA: () => ({ hasActiveClips: () => false, getActiveClips: () => [] }),
			getLayerGroupB: () => ({ hasActiveClips: () => false, getActiveClips: () => [] }),
			getLayerGroupC: () => ({ getActiveClips: () => [] }),
			getMaskManager: () => ({ getCurrentMask: () => null }),
			getEffectsManager: () => ({ hasMixedOutputEffects: () => false, hasGlobalEffects: () => true, getActiveGlobalEffects: () => [{ type: 'strobe', velocity: 127, note: settings.effectRanges.strobe.min }] })
		};

		// Set a deterministic BPM
		appState.bpm = 120;

		const renderer = new Renderer(displayContext, layerManager, settings, { bpm: 120 });
		renderer.start();
		// Grab raf callback
		const cb = rafMocks.rafSpy.mock.calls[0][0];

		// Timestamp 0 should be beat-aligned and flash for high intensity
		cb(0);

		// putImageData should have been called on displayContext (global effects wrote to canvas)
		expect(displayContext.putImageData).toHaveBeenCalled();
		const img = displayContext.putImageData.mock.calls[0][0];
		expect(img.data[0]).toBe(255); // first pixel should be white

		renderer.destroy();
	});

	test('strobe does not flash at off-phase timestamp', () => {
		const displayContext = createMockCanvasContext();
		const layerManagerLow = {
			getLayerGroupA: () => ({ hasActiveClips: () => false, getActiveClips: () => [] }),
			getLayerGroupB: () => ({ hasActiveClips: () => false, getActiveClips: () => [] }),
			getLayerGroupC: () => ({ getActiveClips: () => [] }),
			getMaskManager: () => ({ getCurrentMask: () => null }),
			getEffectsManager: () => ({
				hasMixedOutputEffects: () => false,
				hasGlobalEffects: () => true,
				getActiveGlobalEffects: () => [{ type: 'strobe', velocity: 10, note: settings.effectRanges.strobe.min }]
			})
		};

		appState.bpm = 120;

		// Low intensity (velocity 10): 1 pulse/beat, duty 0.25.
		// At t=250ms with 120 BPM (500ms/beat), pulsePhase = 0.5 → off.
		const rendererLow = new Renderer(displayContext, layerManagerLow, settings, { bpm: 120 });
		rendererLow.start();
		const cbLow = rafMocks.rafSpy.mock.calls[0][0];
		displayContext.putImageData.mockClear();
		cbLow(250);
		expect(displayContext.putImageData).not.toHaveBeenCalled();
		rendererLow.destroy();

		// High intensity (velocity 127): 12 pulses/beat, duty ≈ 0.444.
		// At t=400ms, pulsePhase = (0.8 * 12) % 1 = 0.6 → off.
		const layerManagerHigh = {
			...layerManagerLow,
			getEffectsManager: () => ({
				hasMixedOutputEffects: () => false,
				hasGlobalEffects: () => true,
				getActiveGlobalEffects: () => [{ type: 'strobe', velocity: 127, note: settings.effectRanges.strobe.min }]
			})
		};
		const rendererHigh = new Renderer(displayContext, layerManagerHigh, settings, { bpm: 120 });
		rendererHigh.start();
		const cbHigh = rafMocks.rafSpy.mock.calls[1][0];
		displayContext.putImageData.mockClear();
		cbHigh(400);
		expect(displayContext.putImageData).not.toHaveBeenCalled();
		rendererHigh.destroy();
	});

	test('strobe white-out for velocity 5 (full white)', () => {
		const displayContext = createMockCanvasContext();
		const layerManager = {
			getLayerGroupA: () => ({ hasActiveClips: () => false, getActiveClips: () => [] }),
			getLayerGroupB: () => ({ hasActiveClips: () => false, getActiveClips: () => [] }),
			getLayerGroupC: () => ({ getActiveClips: () => [] }),
			getMaskManager: () => ({ getCurrentMask: () => null }),
			getEffectsManager: () => ({ hasMixedOutputEffects: () => false, hasGlobalEffects: () => true, getActiveGlobalEffects: () => [{ type: 'strobe', velocity: 5, note: settings.effectRanges.strobe.min }] })
		};

		appState.bpm = 120;

		const renderer = new Renderer(displayContext, layerManager, settings, { bpm: 120 });
		renderer.start();
		const cb = rafMocks.rafSpy.mock.calls[0][0];

		cb(123); // arbitrary timestamp
		expect(displayContext.putImageData).toHaveBeenCalled();
		const img = displayContext.putImageData.mock.calls[0][0];
		expect(img.data[0]).toBe(255);

		renderer.destroy();
	});
});
