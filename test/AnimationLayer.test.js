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

		test('skips invalid frame rate keys and logs warnings', () => {
			const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

			// Keys: '-1' (negative), '999' (>= numberOfFrames), '1.5' (non-integer)
			new AnimationLayer(defaultOptions({ frameRatesForFrames: { '-1': 10, 999: 20, 1.5: 30, 1: 60 } }));

			// Three invalid keys should have caused warnings
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
	});

	describe('play()', () => {
		test('coerces numeric string keys to numeric indices', () => {
			const ctx = createMockContext();
			// Use string keys to ensure coercion happens (JSON always parses keys as strings)
			const layer = new AnimationLayer(defaultOptions({ canvas2dContext: ctx, numberOfFrames: 2, framesPerRow: 2, frameRatesForFrames: { 0: 1000 } }));
			// t=0 -> initial draw
			layer.play(0);
			expect(ctx.drawImage).toHaveBeenCalledTimes(1);
			// t=1ms (exactly interval) -> should advance to next frame
			layer.play(1);
			expect(ctx.drawImage).toHaveBeenCalledTimes(2);
			// Verify second draw is for frame 1 (sx = 120 for 240px width / 2 frames per row)
			expect(ctx.drawImage.mock.calls.at(-1)[1]).toBe(120);
		});
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

		test('returns early if image is null (after dispose)', () => {
			const ctx = createMockContext();
			const layer = new AnimationLayer(defaultOptions({ canvas2dContext: ctx }));

			layer.dispose();
			layer.play();

			expect(ctx.drawImage).not.toHaveBeenCalled();
		});

		test('returns early if canvas2dContext is null', () => {
			// Creating a layer with a null canvas context should return early
			// (no errors and no drawing occurs).
			const layerWithNullCtx = new AnimationLayer(defaultOptions({ canvas2dContext: null }));
			expect(() => layerWithNullCtx.play()).not.toThrow();
		});

		test('draws frame 0 on first play call without skipping', () => {
			const ctx = createMockContext();
			const layer = new AnimationLayer(
				defaultOptions({
					canvas2dContext: ctx,
					numberOfFrames: 4,
					framesPerRow: 4
				})
			);

			// First play call should render the initial frame without requiring time to elapse
			layer.play();

			expect(ctx.drawImage).toHaveBeenCalledTimes(1);
			// First call args: image, sx, sy, sw, sh, dx, dy, dw, dh
			// Frame 0: sx=0, sy=0
			const callArgs = ctx.drawImage.mock.calls[0];
			expect(callArgs[1]).toBe(0); // sx = 0 for frame 0
			expect(callArgs[2]).toBe(0); // sy = 0 for frame 0
		});

		test('does not advance frame until interval has passed', () => {
			const ctx = createMockContext();
			const layer = new AnimationLayer(
				defaultOptions({
					canvas2dContext: ctx,
					numberOfFrames: 4,
					framesPerRow: 4,
					frameRatesForFrames: { 0: 60 } // 60fps = ~16.67ms per frame
				})
			);

			// Mock performance.now to return consistent values
			const mockNow = vi.spyOn(performance, 'now');
			mockNow.mockReturnValue(0);

			layer.play(); // Initialize at t=0
			expect(ctx.drawImage).toHaveBeenCalledTimes(1);

			// Still at t=0, should not advance
			layer.play();
			expect(ctx.drawImage).toHaveBeenCalledTimes(2);

			// Verify still on frame 0 (sx=0)
			expect(ctx.drawImage.mock.calls[1][1]).toBe(0);
		});

		test('advances multiple frames when elapsed covers several intervals', () => {
			const ctx = createMockContext();
			const mockNow = vi.spyOn(performance, 'now');
			// Set a low FPS so interval is large for easy testing (10 fps = 100ms)
			const layer = new AnimationLayer(defaultOptions({ canvas2dContext: ctx, numberOfFrames: 10, framesPerRow: 10, frameRatesForFrames: { 0: 10 } }));
			// t=0 -> initial draw
			mockNow.mockReturnValue(0);
			layer.play();
			expect(ctx.drawImage).toHaveBeenCalledTimes(1);
			// t=350ms -> should advance 3 frames (floor(350/100)=3)
			mockNow.mockReturnValue(350);
			layer.play();
			// Check last drawn frame (frame index should be 3)
			const lastCall = ctx.drawImage.mock.calls.at(-1);
			const frameWidth = 240 / 10;
			expect(lastCall[1]).toBe(frameWidth * 3);

			// t=400ms -> the 50ms leftover should be preserved, so elapsed becomes 100ms and
			// exactly one more frame should be advanced
			mockNow.mockReturnValue(400);
			layer.play();
			const secondCall = ctx.drawImage.mock.calls.at(-1);
			expect(secondCall[1]).toBe(frameWidth * 4);

			mockNow.mockRestore();
		});

		test('handles variable frame rates when advancing multiple frames', () => {
			const ctx = createMockContext();
			const mockNow = vi.spyOn(performance, 'now');
			// frame 0 = 10fps (100ms), frame 1 = 20fps (50ms) so 130ms should advance 1 frame
			const layer = new AnimationLayer(defaultOptions({ canvas2dContext: ctx, numberOfFrames: 4, framesPerRow: 4, frameRatesForFrames: { 0: 10, 1: 20 } }));
			mockNow.mockReturnValue(0);
			layer.play();
			mockNow.mockReturnValue(130);
			layer.play();
			// After advancing, we should be on frame 1
			const lastCall = ctx.drawImage.mock.calls.at(-1);
			const frameWidth = 240 / 4;
			expect(lastCall[1]).toBe(frameWidth * 1);
			mockNow.mockRestore();
		});

		test('stops rendering non-looping animation after last frame', () => {
			const ctx = createMockContext();
			const layer = new AnimationLayer(
				defaultOptions({
					canvas2dContext: ctx,
					numberOfFrames: 2,
					framesPerRow: 2,
					loop: false,
					frameRatesForFrames: { 0: 1000 } // 1000fps = 1ms per frame
				})
			);

			const mockNow = vi.spyOn(performance, 'now');
			mockNow.mockReturnValue(0);
			layer.play(); // Initialize lastTime, draw frame 0

			mockNow.mockReturnValue(10);
			layer.play(); // Advances to frame 1, draws frame 1

			mockNow.mockReturnValue(20);
			layer.play(); // Advances to frame 2 (>= numberOfFrames), draws clamped frame 1

			// Now #frame === 2 which is >= numberOfFrames, and the layer should be marked finished
			expect(layer.isFinished).toBe(true);

			// next play() returns early
			const callCount = ctx.drawImage.mock.calls.length;
			mockNow.mockReturnValue(30);
			layer.play(); // Should return early without drawing

			// Verify no additional draw after completion
			expect(ctx.drawImage.mock.calls.length).toBe(callCount);
			// Resetting should clear isFinished
			layer.reset();
			expect(layer.isFinished).toBe(false);
		});

		test('wraps back to frame 0 when looping is enabled', () => {
			const ctx = createMockContext();
			const layer = new AnimationLayer(
				defaultOptions({
					canvas2dContext: ctx,
					numberOfFrames: 2,
					framesPerRow: 2,
					loop: true,
					frameRatesForFrames: { 0: 1000 }
				})
			);

			const mockNow = vi.spyOn(performance, 'now');
			mockNow.mockReturnValue(0);
			layer.play(); // draw frame 0

			mockNow.mockReturnValue(10);
			layer.play(); // draw frame 1

			mockNow.mockReturnValue(20);
			layer.play(); // should wrap back to frame 0

			// Verify last draw was frame 0
			expect(ctx.drawImage.mock.calls.at(-1)[1]).toBe(0);
		});
	});

	describe('stop()', () => {
		test('resets state when retrigger is enabled', () => {
			const ctx = createMockContext();
			const layer = new AnimationLayer(defaultOptions({ canvas2dContext: ctx, retrigger: true }));

			const mockNow = vi.spyOn(performance, 'now');
			mockNow.mockReturnValue(0);
			layer.play();

			mockNow.mockReturnValue(100);
			layer.play(); // Advance some frames

			layer.stop();

			// After stop, next play should start from frame 0
			mockNow.mockReturnValue(200);
			layer.play();

			// Verify drawing frame 0 (sx=0)
			const lastCall = ctx.drawImage.mock.calls.at(-1);
			expect(lastCall[1]).toBe(0);
		});
	});

	describe('reset()', () => {
		test('resets to frame 0 when retrigger is enabled', () => {
			const ctx = createMockContext();
			const layer = new AnimationLayer(defaultOptions({ canvas2dContext: ctx, retrigger: true }));

			const mockNow = vi.spyOn(performance, 'now');
			mockNow.mockReturnValue(0);
			layer.play();

			mockNow.mockReturnValue(100);
			layer.play();

			layer.reset();

			mockNow.mockReturnValue(200);
			layer.play();

			const lastCall = ctx.drawImage.mock.calls.at(-1);
			expect(lastCall[1]).toBe(0);
		});
	});

	describe('dispose()', () => {
		test('clears image reference', () => {
			const ctx = createMockContext();
			const layer = new AnimationLayer(defaultOptions({ canvas2dContext: ctx }));

			layer.play();
			expect(ctx.drawImage).toHaveBeenCalled();

			ctx.drawImage.mockClear();
			layer.dispose();
			layer.play();

			expect(ctx.drawImage).not.toHaveBeenCalled();
		});
	});
});
