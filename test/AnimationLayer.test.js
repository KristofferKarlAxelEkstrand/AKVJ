import { describe, it, expect, vi, beforeEach } from 'vitest';
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
		it('throws if numberOfFrames is missing or less than 1', () => {
			expect(() => new AnimationLayer(defaultOptions({ numberOfFrames: 0 }))).toThrow('AnimationLayer requires numberOfFrames >= 1');
			expect(() => new AnimationLayer(defaultOptions({ numberOfFrames: undefined }))).toThrow('AnimationLayer requires numberOfFrames >= 1');
		});

		it('throws if framesPerRow is missing or less than 1', () => {
			expect(() => new AnimationLayer(defaultOptions({ framesPerRow: 0 }))).toThrow('AnimationLayer requires framesPerRow >= 1');
		});

		it('throws if image dimensions result in invalid frame size', () => {
			expect(() => new AnimationLayer(defaultOptions({ image: { width: 0, height: 135 } }))).toThrow('AnimationLayer: Invalid image dimensions');
		});

		it('creates successfully with valid options', () => {
			const layer = new AnimationLayer(defaultOptions());
			expect(layer).toBeInstanceOf(AnimationLayer);
		});
	});

	describe('play()', () => {
		it('returns early if image is null (after dispose)', () => {
			const ctx = createMockContext();
			const layer = new AnimationLayer(defaultOptions({ canvas2dContext: ctx }));

			layer.dispose();
			layer.play();

			expect(ctx.drawImage).not.toHaveBeenCalled();
		});

		it('returns early if canvas2dContext is null', () => {
			// Creating a layer with a null canvas context should return early
			// (no errors and no drawing occurs).
			const layerWithNullCtx = new AnimationLayer(defaultOptions({ canvas2dContext: null }));
			expect(() => layerWithNullCtx.play()).not.toThrow();
		});

		it('draws frame 0 on first play call without skipping', () => {
			const ctx = createMockContext();
			const layer = new AnimationLayer(
				defaultOptions({
					canvas2dContext: ctx,
					numberOfFrames: 4,
					framesPerRow: 4
				})
			);

			// First play should draw frame 0
			layer.play();

			expect(ctx.drawImage).toHaveBeenCalledTimes(1);
			// First call args: image, sx, sy, sw, sh, dx, dy, dw, dh
			// Frame 0: sx=0, sy=0
			const callArgs = ctx.drawImage.mock.calls[0];
			expect(callArgs[1]).toBe(0); // sx = 0 for frame 0
			expect(callArgs[2]).toBe(0); // sy = 0 for frame 0
		});

		it('does not advance frame until interval has passed', () => {
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

		it('stops rendering non-looping animation after last frame', () => {
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

			// Now #frame === 2 which is >= numberOfFrames, so next play() returns early
			const callCount = ctx.drawImage.mock.calls.length;
			mockNow.mockReturnValue(30);
			layer.play(); // Should return early without drawing

			// Verify no additional draw after completion
			expect(ctx.drawImage.mock.calls.length).toBe(callCount);
		});

		it('wraps back to frame 0 when looping is enabled', () => {
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
		it('resets state when retrigger is enabled', () => {
			const ctx = createMockContext();
			const layer = new AnimationLayer(
				defaultOptions({
					canvas2dContext: ctx,
					retrigger: true
				})
			);

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
		it('resets to frame 0 when retrigger is enabled', () => {
			const ctx = createMockContext();
			const layer = new AnimationLayer(
				defaultOptions({
					canvas2dContext: ctx,
					retrigger: true
				})
			);

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
		it('clears image reference', () => {
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
