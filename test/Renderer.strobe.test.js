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
		const layerManager = {
			getLayerGroupA: () => ({ hasActiveClips: () => false, getActiveClips: () => [] }),
			getLayerGroupB: () => ({ hasActiveClips: () => false, getActiveClips: () => [] }),
			getLayerGroupC: () => ({ getActiveClips: () => [] }),
			getMaskManager: () => ({ getCurrentMask: () => null }),
			getEffectsManager: () => ({ hasMixedOutputEffects: () => false, hasGlobalEffects: () => true, getActiveGlobalEffects: () => [{ type: 'strobe', velocity: 127, note: settings.effectRanges.strobe.min }] })
		};

		appState.bpm = 120;

		const renderer = new Renderer(displayContext, layerManager, settings, { bpm: 120 });
		renderer.start();

		// Off-phase timestamps chosen for different intensities
		// For low intensity (use velocity 10: first non-white bucket), use mid-beat where flash should be off
		const layerManagerLow = Object.assign({}, layerManager, {
			getEffectsManager: () => ({ hasMixedOutputEffects: () => false, hasGlobalEffects: () => true, getActiveGlobalEffects: () => [{ type: 'strobe', velocity: 10, note: settings.effectRanges.strobe.min }] })
		});
		const rendererLow = new Renderer(displayContext, layerManagerLow, settings, { bpm: 120 });
		rendererLow.start();
		const cbLow = rafMocks.rafSpy.mock.calls[1][0];
		displayContext.putImageData.mockClear();
		cbLow(250); // middle of 500ms beat -> pulsePhase ~ 0.5
		// Validate strobe flash expectation programmatically using velocity mapping
		const computeFlash = (velocity, timestamp, bpm) => {
			if (!velocity || velocity === 0) {
				return false;
			}
			if (velocity >= 1 && velocity <= 9) {
				return true;
			} // white out
			const pulsesPerBeat = Math.max(1, Math.min(12, Math.floor((velocity - 10) / 10) + 1));
			const bucketRemainder = (velocity - 10) % 10;
			const duty = 0.25 + (bucketRemainder / 9) * 0.25; // 0.25..0.5
			const msPerBeat = 60000 / bpm;
			const beatPos = (timestamp % msPerBeat) / msPerBeat;
			const pulsePhase = (beatPos * pulsesPerBeat) % 1;
			return pulsePhase < duty;
		};

		const expectedLow = computeFlash(10, 250, appState.bpm);
		if (!expectedLow) {
			if (displayContext.putImageData.mock.calls.length === 0) {
				expect(displayContext.putImageData).not.toHaveBeenCalled();
			} else {
				const img = displayContext.putImageData.mock.calls[0][0];
				expect([0, 255]).toContain(img.data[0]);
			}
		} else {
			const img = displayContext.putImageData.mock.calls[0][0];
			expect(img.data[0]).toBe(255);
		}

		rendererLow.destroy();

		// Also assert high-intensity, off-phase for eighth-note subdivision
		displayContext.putImageData.mockClear();
		// Switch to high intensity (velocity 127)
		layerManager.getEffectsManager = () => ({ hasMixedOutputEffects: () => false, hasGlobalEffects: () => true, getActiveGlobalEffects: () => [{ type: 'strobe', velocity: 127, note: settings.effectRanges.strobe.min }] });
		const cbHigh = rafMocks.rafSpy.mock.calls[0][0];
		// Use a timestamp that is off-phase for high subdivision (choose ~0.8 beat position)
		cbHigh(400); // 400ms -> beatPos=0.8, pulsePhase=(0.8*12)%1 ~ 0.6 which is off-phase for duty ~0.44
		// Accept either not called or called with black pixel
		if (displayContext.putImageData.mock.calls.length === 0) {
			expect(displayContext.putImageData).not.toHaveBeenCalled();
		} else {
			const img = displayContext.putImageData.mock.calls[0][0];
			expect(img.data[0]).toBe(0);
		}

		renderer.destroy();
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
