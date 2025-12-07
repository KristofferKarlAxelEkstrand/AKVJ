import { describe, test, expect, vi, beforeEach } from 'vitest';
import AnimationLayer from '../src/js/visuals/AnimationLayer.js';

/**
 * Create a mock canvas 2D context
 */
function createMockContext() {
	return {
		drawImage: vi.fn()
	};
}

/**
 * Create a mock image with specified dimensions
 */
function createMockImage(width = 240, height = 135) {
	return { width, height };
}

/**
 * Default options for creating an AnimationLayer
 */
function defaultOptions(overrides = {}) {
	return {
		canvas2dContext: createMockContext(),
		image: createMockImage(),
		numberOfFrames: 4,
		framesPerRow: 4,
		loop: true,
		frameRatesForFrames: { 0: 60 },
		retrigger: true,
		...overrides
	};
}

describe('AnimationLayer', () => {
	beforeEach(() => {
		vi.restoreAllMocks();
	});

	describe('constructor', () => {
		test('throws if numberOfFrames is missing or less than 1', () => {
			expect(() => new AnimationLayer(defaultOptions({ numberOfFrames: 0 }))).toThrow('AnimationLayer requires numberOfFrames >= 1');
			expect(() => new AnimationLayer(defaultOptions({ numberOfFrames: undefined }))).toThrow('AnimationLayer requires numberOfFrames >= 1');
		});

		test('throws if framesPerRow is missing or less than 1', () => {
			expect(() => new AnimationLayer(defaultOptions({ framesPerRow: 0 }))).toThrow('AnimationLayer requires framesPerRow >= 1');
		});

		test('throws if image dimensions result in invalid frame size', () => {
			expect(() => new AnimationLayer(defaultOptions({ image: { width: 0, height: 135 } }))).toThrow('AnimationLayer: Invalid image dimensions');
		});

		test('creates successfully with valid options', () => {
			const layer = new AnimationLayer(defaultOptions());
			expect(layer).toBeInstanceOf(AnimationLayer);
		});

		test('filters invalid frame rates and logs warnings', () => {
			const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
			new AnimationLayer(defaultOptions({ frameRatesForFrames: { 0: -1, 1: 0, 2: 'invalid', 3: 60 } }));
			// Should have logged a warning for the three invalid values
			expect(consoleWarnSpy).toHaveBeenCalledTimes(3);
			consoleWarnSpy.mockRestore();
		});

		test('falls back to default frame rate when all rates invalid', () => {
			const ctx = createMockContext();
			const mockNow = vi.spyOn(performance, 'now');
			mockNow.mockReturnValue(0);

			const layer = new AnimationLayer(defaultOptions({ canvas2dContext: ctx, frameRatesForFrames: { 0: 0, 1: 'x' } }));
			// Play once at t=0
			layer.play();
			// Advance time a small amount; default fallback is numeric and > 0, so should not divide by zero
			mockNow.mockReturnValue(1000);
			// Should not throw due to invalid frame rates
			expect(() => layer.play()).not.toThrow();
			mockNow.mockRestore();
		});

		test('coerces numeric string keys to numeric indices', () => {
			const ctx = createMockContext();
			const mockNow = vi.spyOn(performance, 'now');
			mockNow.mockReturnValue(0);

			const layer = new AnimationLayer(
				defaultOptions({
					canvas2dContext: ctx,
					numberOfFrames: 4,
					framesPerRow: 4,
					frameRatesForFrames: { 0: 10, 1: 20 }
				})
			);

			// frame 0 at 10fps (100ms) -> after 100ms we should be on frame 1
			layer.play();
			mockNow.mockReturnValue(100);
			layer.play();
			const frameWidth = 240 / 4;
			expect(ctx.drawImage.mock.calls.at(-1)[1]).toBe(frameWidth * 1);

			// frame 1 at 20fps (50ms) -> after additional 50ms we should be on frame 2
			mockNow.mockReturnValue(150);
			layer.play();
			expect(ctx.drawImage.mock.calls.at(-1)[1]).toBe(frameWidth * 2);

			mockNow.mockRestore();
		});

		test('skips invalid frame rate keys and logs warnings', () => {
			const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
			new AnimationLayer(
				defaultOptions({
					frameRatesForFrames: { '-1': 10, 999: 20, 1.5: 30, 1: 60 }
				})
			);
			// The three invalid keys should cause warnings (-1, 999, 1.5)
			expect(consoleWarnSpy).toHaveBeenCalledTimes(3);
			consoleWarnSpy.mockRestore();
		});
	});

	describe('play()', () => {
		test('advances frame when exactly on interval boundary', () => {
			const ctx = createMockContext();
			const mockNow = vi.spyOn(performance, 'now');
			// Set frame rate so interval is 1ms for easy testing
			const layer = new AnimationLayer(defaultOptions({ canvas2dContext: ctx, numberOfFrames: 2, framesPerRow: 2, frameRatesForFrames: { 0: 1000 } }));
			// t=0 -> initial draw
			mockNow.mockReturnValue(0);
			layer.play();
			expect(ctx.drawImage).toHaveBeenCalledTimes(1);
			// t=1ms (exactly interval) -> should advance to next frame
			mockNow.mockReturnValue(1);
			layer.play();
			expect(ctx.drawImage).toHaveBeenCalledTimes(2);
			// Verify second draw is for frame 1 (sx = 120 for 240px width / 2 frames per row)
			expect(ctx.drawImage.mock.calls.at(-1)[1]).toBe(120);
			mockNow.mockRestore();
		});

		... (truncated for brevity) ...
