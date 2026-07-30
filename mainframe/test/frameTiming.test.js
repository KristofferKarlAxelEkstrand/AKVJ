import { describe, expect, it } from 'vitest';
import { durationsMsToFrameRates, fpsToMs, msToFps } from '../src/js/frameTiming.js';
import { DEFAULT_FRAME_RATE } from '../src/js/clipSchema.js';

describe('frameTiming', () => {
	it('converts ms to fps', () => {
		expect(msToFps(100)).toBe(10);
		expect(msToFps(50)).toBe(20);
	});

	it('falls back when delay is missing or 0', () => {
		expect(msToFps(0)).toBe(DEFAULT_FRAME_RATE);
		expect(msToFps(undefined)).toBe(DEFAULT_FRAME_RATE);
		expect(msToFps(-5)).toBe(DEFAULT_FRAME_RATE);
	});

	it('converts fps to ms', () => {
		expect(fpsToMs(10)).toBe(100);
		expect(fpsToMs(0)).toBeCloseTo(1000 / 12);
	});

	it('builds frameRatesForFrames from durations', () => {
		expect(durationsMsToFrameRates([100, 50, 0])).toEqual({
			0: 10,
			1: 20,
			2: DEFAULT_FRAME_RATE
		});
	});
});
