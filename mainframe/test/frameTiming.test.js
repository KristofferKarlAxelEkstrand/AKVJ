import { describe, expect, it } from 'vitest';
import { durationsMsToFrameRates, fpsToMs, msToFps, DEFAULT_FALLBACK_FPS } from '../src/js/frameTiming.js';

describe('frameTiming', () => {
	it('converts ms to fps', () => {
		expect(msToFps(100)).toBe(10);
		expect(msToFps(50)).toBe(20);
	});

	it('falls back when delay is missing or 0', () => {
		expect(msToFps(0)).toBe(DEFAULT_FALLBACK_FPS);
		expect(msToFps(undefined)).toBe(DEFAULT_FALLBACK_FPS);
		expect(msToFps(-5)).toBe(DEFAULT_FALLBACK_FPS);
	});

	it('converts fps to ms', () => {
		expect(fpsToMs(10)).toBe(100);
		expect(fpsToMs(0)).toBeCloseTo(1000 / 12);
	});

	it('builds frameRatesForFrames from durations', () => {
		expect(durationsMsToFrameRates([100, 50, 0])).toEqual({
			'0': 10,
			'1': 20,
			'2': DEFAULT_FALLBACK_FPS
		});
	});
});
