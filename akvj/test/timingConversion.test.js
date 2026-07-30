import { describe, test, expect } from 'vitest';
import { msToFps, fpsToMs, durationsMsToFrameRates, frameRatesToDurationsMs } from '../src/js/visuals/timingConversion.js';

describe('timingConversion', () => {
	describe('msToFps', () => {
		test('converts ms to FPS correctly', () => {
			expect(msToFps(1000)).toBe(1); // 1000ms per frame = 1 FPS
			expect(msToFps(500)).toBe(2); // 500ms per frame = 2 FPS
			expect(msToFps(100)).toBe(10); // 100ms per frame = 10 FPS
			expect(msToFps(16.67)).toBeCloseTo(60, 1); // ~16.67ms per frame ≈ 60 FPS
		});

		test('throws on zero or negative durationMs', () => {
			expect(() => msToFps(0)).toThrow('msToFps: durationMs must be a positive number');
			expect(() => msToFps(-10)).toThrow('msToFps: durationMs must be a positive number');
		});

		test('throws on non-number input', () => {
			expect(() => msToFps('100')).toThrow('msToFps: durationMs must be a positive number');
			expect(() => msToFps(null)).toThrow('msToFps: durationMs must be a positive number');
			expect(() => msToFps(undefined)).toThrow('msToFps: durationMs must be a positive number');
		});
	});

	describe('fpsToMs', () => {
		test('converts FPS to ms correctly', () => {
			expect(fpsToMs(1)).toBe(1000); // 1 FPS = 1000ms per frame
			expect(fpsToMs(2)).toBe(500); // 2 FPS = 500ms per frame
			expect(fpsToMs(10)).toBe(100); // 10 FPS = 100ms per frame
			expect(fpsToMs(60)).toBeCloseTo(16.67, 2); // 60 FPS ≈ 16.67ms per frame
		});

		test('throws on zero or negative frameRate', () => {
			expect(() => fpsToMs(0)).toThrow('fpsToMs: frameRate must be a positive number');
			expect(() => fpsToMs(-10)).toThrow('fpsToMs: frameRate must be a positive number');
		});

		test('throws on non-number input', () => {
			expect(() => fpsToMs('60')).toThrow('fpsToMs: frameRate must be a positive number');
			expect(() => fpsToMs(null)).toThrow('fpsToMs: frameRate must be a positive number');
			expect(() => fpsToMs(undefined)).toThrow('fpsToMs: frameRate must be a positive number');
		});
	});

	describe('round-trip conversions', () => {
		test('ms → FPS → ms round-trip preserves value', () => {
			const originalMs = 50;
			const fps = msToFps(originalMs);
			const convertedMs = fpsToMs(fps);
			expect(convertedMs).toBeCloseTo(originalMs, 6);
		});

		test('FPS → ms → FPS round-trip preserves value', () => {
			const originalFps = 30;
			const ms = fpsToMs(originalFps);
			const convertedFps = msToFps(ms);
			expect(convertedFps).toBeCloseTo(originalFps, 6);
		});
	});

	describe('durationsMsToFrameRates', () => {
		test('converts ms mapping to FPS mapping', () => {
			const frameDurationsMs = { 0: 50, 1: 100, 2: 25 };
			const frameRatesForFrames = durationsMsToFrameRates(frameDurationsMs);
			expect(frameRatesForFrames[0]).toBe(20); // 1000 / 50
			expect(frameRatesForFrames[1]).toBe(10); // 1000 / 100
			expect(frameRatesForFrames[2]).toBe(40); // 1000 / 25
		});

		test('skips invalid entries (zero, negative, non-number)', () => {
			const frameDurationsMs = { 0: 50, 1: 0, 2: -10, 3: 'invalid' };
			const frameRatesForFrames = durationsMsToFrameRates(frameDurationsMs);
			expect(frameRatesForFrames[0]).toBe(20);
			expect(frameRatesForFrames[1]).toBeUndefined();
			expect(frameRatesForFrames[2]).toBeUndefined();
			expect(frameRatesForFrames[3]).toBeUndefined();
		});

		test('returns empty object for null/undefined input', () => {
			expect(durationsMsToFrameRates(null)).toEqual({});
			expect(durationsMsToFrameRates(undefined)).toEqual({});
		});

		test('returns empty object for non-object input', () => {
			expect(durationsMsToFrameRates('invalid')).toEqual({});
			expect(durationsMsToFrameRates(123)).toEqual({});
			expect(durationsMsToFrameRates([])).toEqual({});
		});

		test('handles empty object', () => {
			expect(durationsMsToFrameRates({})).toEqual({});
		});
	});

	describe('frameRatesToDurationsMs', () => {
		test('converts FPS mapping to ms mapping', () => {
			const frameRatesForFrames = { 0: 20, 1: 10, 2: 40 };
			const frameDurationsMs = frameRatesToDurationsMs(frameRatesForFrames);
			expect(frameDurationsMs[0]).toBe(50); // 1000 / 20
			expect(frameDurationsMs[1]).toBe(100); // 1000 / 10
			expect(frameDurationsMs[2]).toBe(25); // 1000 / 40
		});

		test('skips invalid entries (zero, negative, non-number)', () => {
			const frameRatesForFrames = { 0: 20, 1: 0, 2: -10, 3: 'invalid' };
			const frameDurationsMs = frameRatesToDurationsMs(frameRatesForFrames);
			expect(frameDurationsMs[0]).toBe(50);
			expect(frameDurationsMs[1]).toBeUndefined();
			expect(frameDurationsMs[2]).toBeUndefined();
			expect(frameDurationsMs[3]).toBeUndefined();
		});

		test('returns empty object for null/undefined input', () => {
			expect(frameRatesToDurationsMs(null)).toEqual({});
			expect(frameRatesToDurationsMs(undefined)).toEqual({});
		});

		test('returns empty object for non-object input', () => {
			expect(frameRatesToDurationsMs('invalid')).toEqual({});
			expect(frameRatesToDurationsMs(123)).toEqual({});
			expect(frameRatesToDurationsMs([])).toEqual({});
		});

		test('handles empty object', () => {
			expect(frameRatesToDurationsMs({})).toEqual({});
		});
	});

	describe('bidirectional mapping conversions', () => {
		test('durationsMsToFrameRates → frameRatesToDurationsMs round-trip', () => {
			const original = { 0: 50, 1: 100, 2: 25 };
			const frameRates = durationsMsToFrameRates(original);
			const converted = frameRatesToDurationsMs(frameRates);
			expect(converted[0]).toBeCloseTo(original[0], 6);
			expect(converted[1]).toBeCloseTo(original[1], 6);
			expect(converted[2]).toBeCloseTo(original[2], 6);
		});

		test('frameRatesToDurationsMs → durationsMsToFrameRates round-trip', () => {
			const original = { 0: 20, 1: 10, 2: 40 };
			const durations = frameRatesToDurationsMs(original);
			const converted = durationsMsToFrameRates(durations);
			expect(converted[0]).toBeCloseTo(original[0], 6);
			expect(converted[1]).toBeCloseTo(original[1], 6);
			expect(converted[2]).toBeCloseTo(original[2], 6);
		});
	});
});
