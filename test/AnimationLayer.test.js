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

		test('accepts explicit timestamp argument and advances accordingly', () => {
			const ctx = createMockContext();
			const layer = new AnimationLayer(defaultOptions({ canvas2dContext: ctx, numberOfFrames: 10, framesPerRow: 10, frameRatesForFrames: { 0: 10 } }));
			// Explicitly pass timestamps instead of mocking performance.now
			layer.play(0);
			// 350ms should advance 3 frames (10fps = 100ms)
			layer.play(350);
			const frameWidth = 240 / 10;
			expect(ctx.drawImage.mock.calls.at(-1)[1]).toBe(frameWidth * 3);
			// 400ms should advance one more frame due to preserved leftover
			layer.play(400);
			expect(ctx.drawImage.mock.calls.at(-1)[1]).toBe(frameWidth * 4);
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

	describe('timing and delta behavior (catch-up)', () => {
		/**
		 * Helper to extract the current frame index from drawImage call args.
		 * Frame index = (sx / frameWidth) + (sy / frameHeight) * framesPerRow
		 * For a simple single-row setup: frame = sx / frameWidth
		 */
		function getDrawnFrameIndex(ctx, frameWidth, framesPerRow, frameHeight) {
			const lastCall = ctx.drawImage.mock.calls.at(-1);
			if (!lastCall) {
				return -1;
			}
			const sx = lastCall[1];
			const sy = lastCall[2];
			const col = sx / frameWidth;
			const row = sy / frameHeight;
			return row * framesPerRow + col;
		}

		test('preserves fractional elapsed time across calls (no drift)', () => {
			const ctx = createMockContext();
			const mockNow = vi.spyOn(performance, 'now');

			// 10 fps = 100ms per frame
			const layer = new AnimationLayer(
				defaultOptions({
					canvas2dContext: ctx,
					numberOfFrames: 10,
					framesPerRow: 10,
					frameRatesForFrames: { 0: 10 }
				})
			);

			const frameWidth = 240 / 10;

			mockNow.mockReturnValue(0);
			layer.play(); // frame 0

			// Advance 75ms (< 100ms interval), should stay on frame 0
			mockNow.mockReturnValue(75);
			layer.play();
			expect(getDrawnFrameIndex(ctx, frameWidth, 10, 135)).toBe(0);

			// Advance another 50ms (total elapsed from last anchor: 75ms leftover becomes 125ms)
			// Should advance 1 frame, with 25ms leftover
			mockNow.mockReturnValue(125);
			layer.play();
			expect(getDrawnFrameIndex(ctx, frameWidth, 10, 135)).toBe(1);

			// Advance another 75ms (leftover 25 + 75 = 100ms exactly)
			// Should advance 1 frame to frame 2
			mockNow.mockReturnValue(200);
			layer.play();
			expect(getDrawnFrameIndex(ctx, frameWidth, 10, 135)).toBe(2);

			// Verify no drift: after exactly 500ms from start, should be on frame 5
			mockNow.mockReturnValue(500);
			layer.play();
			expect(getDrawnFrameIndex(ctx, frameWidth, 10, 135)).toBe(5);

			mockNow.mockRestore();
		});

		test('catches up multiple frames after a long blocking delay', () => {
			const ctx = createMockContext();
			const mockNow = vi.spyOn(performance, 'now');

			// 20 fps = 50ms per frame
			const layer = new AnimationLayer(
				defaultOptions({
					canvas2dContext: ctx,
					numberOfFrames: 20,
					framesPerRow: 20,
					frameRatesForFrames: { 0: 20 }
				})
			);

			const frameWidth = 240 / 20;

			mockNow.mockReturnValue(0);
			layer.play(); // frame 0

			// Simulate a 275ms GC pause or blocking operation
			// Should catch up: floor(275 / 50) = 5 frames
			mockNow.mockReturnValue(275);
			layer.play();
			expect(getDrawnFrameIndex(ctx, frameWidth, 20, 135)).toBe(5);

			// Leftover should be 25ms; advance another 30ms (total 55ms from anchor)
			// Should advance 1 more frame
			mockNow.mockReturnValue(305);
			layer.play();
			expect(getDrawnFrameIndex(ctx, frameWidth, 20, 135)).toBe(6);

			mockNow.mockRestore();
		});

		test('handles looping wrap-around during catch-up', () => {
			const ctx = createMockContext();
			const mockNow = vi.spyOn(performance, 'now');

			// 10 fps = 100ms per frame, 4 frames total
			const layer = new AnimationLayer(
				defaultOptions({
					canvas2dContext: ctx,
					numberOfFrames: 4,
					framesPerRow: 4,
					loop: true,
					frameRatesForFrames: { 0: 10 }
				})
			);

			const frameWidth = 240 / 4;

			mockNow.mockReturnValue(0);
			layer.play(); // frame 0

			// Advance 550ms = 5.5 intervals
			// Should advance 5 frames and wrap: (0 + 5) % 4 = 1
			mockNow.mockReturnValue(550);
			layer.play();
			expect(getDrawnFrameIndex(ctx, frameWidth, 4, 135)).toBe(1);

			// Advance another 300ms (leftover 50 + 300 = 350ms = 3 frames)
			// (1 + 3) % 4 = 0
			mockNow.mockReturnValue(850);
			layer.play();
			expect(getDrawnFrameIndex(ctx, frameWidth, 4, 135)).toBe(0);

			mockNow.mockRestore();
		});

		test('non-looping animation stops at last frame during catch-up', () => {
			const ctx = createMockContext();
			const mockNow = vi.spyOn(performance, 'now');

			// 10 fps = 100ms per frame, 4 frames total, non-looping
			const layer = new AnimationLayer(
				defaultOptions({
					canvas2dContext: ctx,
					numberOfFrames: 4,
					framesPerRow: 4,
					loop: false,
					frameRatesForFrames: { 0: 10 }
				})
			);

			const frameWidth = 240 / 4;

			mockNow.mockReturnValue(0);
			layer.play(); // frame 0

			// Advance 1000ms = 10 intervals, but only 4 frames exist
			// Should stop at frame 3 (last valid frame index) and mark finished
			mockNow.mockReturnValue(1000);
			layer.play();
			// The draw uses clamped frame: min(frame, numberOfFrames - 1) = 3
			expect(getDrawnFrameIndex(ctx, frameWidth, 4, 135)).toBe(3);
			expect(layer.isFinished).toBe(true);

			// Subsequent plays should not draw
			const callCount = ctx.drawImage.mock.calls.length;
			mockNow.mockReturnValue(2000);
			layer.play();
			expect(ctx.drawImage.mock.calls.length).toBe(callCount);

			mockNow.mockRestore();
		});

		test('variable frame rates are respected during catch-up', () => {
			const ctx = createMockContext();
			const mockNow = vi.spyOn(performance, 'now');

			// Frame 0: 10fps (100ms), Frame 1: 5fps (200ms), Frame 2: 20fps (50ms)
			const layer = new AnimationLayer(
				defaultOptions({
					canvas2dContext: ctx,
					numberOfFrames: 10,
					framesPerRow: 10,
					loop: true,
					frameRatesForFrames: { 0: 10, 1: 5, 2: 20 }
				})
			);

			const frameWidth = 240 / 10;

			mockNow.mockReturnValue(0);
			layer.play(); // frame 0

			// After 100ms: advance past frame 0 (100ms interval) -> frame 1
			mockNow.mockReturnValue(100);
			layer.play();
			expect(getDrawnFrameIndex(ctx, frameWidth, 10, 135)).toBe(1);

			// After 300ms total: frame 1 needs 200ms, so 300-100=200ms elapsed
			// Should advance to frame 2
			mockNow.mockReturnValue(300);
			layer.play();
			expect(getDrawnFrameIndex(ctx, frameWidth, 10, 135)).toBe(2);

			// After 350ms total: frame 2 needs 50ms, 350-300=50ms elapsed
			// Should advance to frame 3 (uses default rate from frame 0 = 100ms)
			mockNow.mockReturnValue(350);
			layer.play();
			expect(getDrawnFrameIndex(ctx, frameWidth, 10, 135)).toBe(3);

			mockNow.mockRestore();
		});

		test('catches up correctly with mixed variable rates in one delta', () => {
			const ctx = createMockContext();
			const mockNow = vi.spyOn(performance, 'now');

			// Frame 0: 10fps (100ms), Frame 1: 20fps (50ms), Frame 2: 10fps (100ms)
			const layer = new AnimationLayer(
				defaultOptions({
					canvas2dContext: ctx,
					numberOfFrames: 10,
					framesPerRow: 10,
					loop: true,
					frameRatesForFrames: { 0: 10, 1: 20, 2: 10 }
				})
			);

			const frameWidth = 240 / 10;

			mockNow.mockReturnValue(0);
			layer.play(); // frame 0

			// Jump 250ms in one go:
			// - Frame 0 consumes 100ms -> elapsed 150ms, frame 1
			// - Frame 1 consumes 50ms -> elapsed 100ms, frame 2
			// - Frame 2 consumes 100ms -> elapsed 0ms, frame 3
			mockNow.mockReturnValue(250);
			layer.play();
			expect(getDrawnFrameIndex(ctx, frameWidth, 10, 135)).toBe(3);

			mockNow.mockRestore();
		});

		test('reset clears timing state and restarts from frame 0', () => {
			const ctx = createMockContext();
			const mockNow = vi.spyOn(performance, 'now');

			const layer = new AnimationLayer(
				defaultOptions({
					canvas2dContext: ctx,
					numberOfFrames: 10,
					framesPerRow: 10,
					frameRatesForFrames: { 0: 10 }, // 100ms per frame
					retrigger: true
				})
			);

			const frameWidth = 240 / 10;

			mockNow.mockReturnValue(0);
			layer.play(); // frame 0

			mockNow.mockReturnValue(350);
			layer.play(); // frame 3

			expect(getDrawnFrameIndex(ctx, frameWidth, 10, 135)).toBe(3);

			// Reset mid-animation
			layer.reset();

			// Play after reset should start from frame 0, ignoring previous time
			mockNow.mockReturnValue(400);
			layer.play();
			expect(getDrawnFrameIndex(ctx, frameWidth, 10, 135)).toBe(0);

			// Subsequent timing should work from new anchor
			mockNow.mockReturnValue(500); // 100ms from reset
			layer.play();
			expect(getDrawnFrameIndex(ctx, frameWidth, 10, 135)).toBe(1);

			mockNow.mockRestore();
		});

		test('stop clears timing state when retrigger enabled', () => {
			const ctx = createMockContext();
			const mockNow = vi.spyOn(performance, 'now');

			const layer = new AnimationLayer(
				defaultOptions({
					canvas2dContext: ctx,
					numberOfFrames: 10,
					framesPerRow: 10,
					frameRatesForFrames: { 0: 10 },
					retrigger: true
				})
			);

			const frameWidth = 240 / 10;

			mockNow.mockReturnValue(0);
			layer.play();

			mockNow.mockReturnValue(250);
			layer.play(); // frame 2

			layer.stop();

			// After stop, next play restarts from frame 0
			mockNow.mockReturnValue(300);
			layer.play();
			expect(getDrawnFrameIndex(ctx, frameWidth, 10, 135)).toBe(0);

			mockNow.mockRestore();
		});

		test('elapsed time is exactly zero on first play (no skip)', () => {
			const ctx = createMockContext();
			const mockNow = vi.spyOn(performance, 'now');

			const layer = new AnimationLayer(
				defaultOptions({
					canvas2dContext: ctx,
					numberOfFrames: 10,
					framesPerRow: 10,
					frameRatesForFrames: { 0: 10 }
				})
			);

			// First play at arbitrary time should draw frame 0
			mockNow.mockReturnValue(12345);
			layer.play();

			const frameWidth = 240 / 10;
			expect(getDrawnFrameIndex(ctx, frameWidth, 10, 135)).toBe(0);

			mockNow.mockRestore();
		});

		test('handles very high frame rates without issues', () => {
			const ctx = createMockContext();
			const mockNow = vi.spyOn(performance, 'now');

			// 1000 fps = 1ms per frame
			const layer = new AnimationLayer(
				defaultOptions({
					canvas2dContext: ctx,
					numberOfFrames: 100,
					framesPerRow: 10,
					frameRatesForFrames: { 0: 1000 }
				})
			);

			mockNow.mockReturnValue(0);
			layer.play();

			// After 50ms, should be on frame 50
			mockNow.mockReturnValue(50);
			layer.play();

			const frameWidth = 240 / 10;
			const frameHeight = 135 / 10;
			expect(getDrawnFrameIndex(ctx, frameWidth, 10, frameHeight)).toBe(50);

			mockNow.mockRestore();
		});

		test('handles sub-millisecond precision timing', () => {
			const ctx = createMockContext();
			const mockNow = vi.spyOn(performance, 'now');

			// Use 50fps = exactly 20ms per frame to avoid floating-point issues
			const layer = new AnimationLayer(
				defaultOptions({
					canvas2dContext: ctx,
					numberOfFrames: 10,
					framesPerRow: 10,
					frameRatesForFrames: { 0: 50 }
				})
			);

			const frameWidth = 240 / 10;
			// 50fps = 20ms per frame (exact)

			mockNow.mockReturnValue(0);
			layer.play(); // frame 0

			// Just under one interval - should stay on frame 0
			mockNow.mockReturnValue(19);
			layer.play();
			expect(getDrawnFrameIndex(ctx, frameWidth, 10, 135)).toBe(0);

			// Exactly one interval - should advance to frame 1
			mockNow.mockReturnValue(20);
			layer.play();
			expect(getDrawnFrameIndex(ctx, frameWidth, 10, 135)).toBe(1);

			// Exactly 6 intervals from start (120ms)
			mockNow.mockReturnValue(120);
			layer.play();
			expect(getDrawnFrameIndex(ctx, frameWidth, 10, 135)).toBe(6);

			// Test 60fps separately: verify behavior around interval boundaries
			const layer60 = new AnimationLayer(
				defaultOptions({
					canvas2dContext: ctx,
					numberOfFrames: 10,
					framesPerRow: 10,
					frameRatesForFrames: { 0: 60 }
				})
			);

			ctx.drawImage.mockClear();
			mockNow.mockReturnValue(0);
			layer60.play(); // frame 0

			// 60fps = ~16.667ms per frame
			// At 16ms, should still be frame 0
			mockNow.mockReturnValue(16);
			layer60.play();
			expect(getDrawnFrameIndex(ctx, frameWidth, 10, 135)).toBe(0);

			// At 17ms, should advance to frame 1
			mockNow.mockReturnValue(17);
			layer60.play();
			expect(getDrawnFrameIndex(ctx, frameWidth, 10, 135)).toBe(1);

			mockNow.mockRestore();
		});

		test('stress test: many rapid play() calls maintain correct frame', () => {
			const ctx = createMockContext();
			const mockNow = vi.spyOn(performance, 'now');

			// 30 fps = ~33.33ms per frame
			const layer = new AnimationLayer(
				defaultOptions({
					canvas2dContext: ctx,
					numberOfFrames: 100,
					framesPerRow: 10,
					frameRatesForFrames: { 0: 30 }
				})
			);

			const frameWidth = 240 / 10;
			const frameHeight = 135 / 10;
			const interval = 1000 / 30;

			mockNow.mockReturnValue(0);
			layer.play();

			// Simulate 60fps render loop (16.67ms between calls) for 1 second
			for (let t = 16.67; t <= 1000; t += 16.67) {
				mockNow.mockReturnValue(t);
				layer.play();
			}

			// After 1000ms at 30fps, should be on frame 30
			const expectedFrame = Math.floor(1000 / interval);
			expect(getDrawnFrameIndex(ctx, frameWidth, 10, frameHeight)).toBe(expectedFrame);

			mockNow.mockRestore();
		});
	});
});
