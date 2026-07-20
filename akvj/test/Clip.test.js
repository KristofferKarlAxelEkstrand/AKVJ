import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';
import Clip, { MAX_PATTERN_TILES_PER_FRAME } from '../src/js/visuals/Clip.js';
import appState from '../src/js/core/AppState.js';

/**
 * Create a minimal mock canvas 2D context (drawImage only).
 * Distinct from test/utils/rendererFixture.js's createMockContext/createMockCanvasContext —
 * this file only needs drawImage, so it keeps its own local, differently-shaped mock.
 */
function createMockDrawContext() {
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
 * Default options for creating an Clip
 */
function defaultOptions(overrides = {}) {
	return {
		image: createMockImage(),
		frames: 4,
		framesPerRow: 4,
		playback: 'loop',
		frameRatesForFrames: { 0: 60 },
		retrigger: true,
		...overrides
	};
}

describe('Clip', () => {
	beforeEach(() => {
		vi.restoreAllMocks();
	});

	afterEach(() => {
		appState.reset();
	});

	test('dispose() unsubscribes from MIDI clock (no further advances)', async () => {
		const ctx = createMockDrawContext();
		const appState = (await import('../src/js/core/AppState.js')).default;

		// syncBeats small enough that totalPulses (round(syncBeats * 24 PPQN)) is tiny,
		// so a couple of clock pulses already move progress well past frame 0's span.
		const clip = new Clip(
			defaultOptions({
				frames: 2,
				framesPerRow: 2,
				syncBeats: 2 / 24, // totalPulses = 2
				playback: 'once'
			})
		);

		// Activate the clip to subscribe to clock events
		clip.reset();

		// Initial draw frame 0
		clip.renderToContext(ctx, 0);
		expect(ctx.drawImage).toHaveBeenCalledTimes(1);
		expect(ctx.drawImage.mock.calls.at(-1)[1]).toBe(0);

		// Send 6 pulses to establish clock sync (bpmSource -> 'clock')
		for (let i = 0; i < 6; i++) {
			appState.dispatchMIDIClock(i * 10);
		}

		// A pulse once clock-synced should advance progress off frame 0
		appState.dispatchMIDIClock(100);
		clip.renderToContext(ctx, 100);
		expect(ctx.drawImage.mock.calls.at(-1)[1]).not.toBe(0);

		// Dispose the clip (should unsubscribe from clock)
		clip.destroy();

		// Another pulse should NOT advance the frame further
		appState.dispatchMIDIClock(200);
		clip.renderToContext(ctx, 200);
		// The frame should remain the same (still the last drawn frame)
		expect(ctx.drawImage.mock.calls.at(-1)[1]).not.toBe(0);

		// Reset global AppState to avoid leaking clock sync between tests
		appState.reset();
	});

	test('syncBeats scales the whole clip while preserving each frame natural relative timing', () => {
		// Create a fake context that captures drawImage sx value
		let lastSx = null;
		const ctx = {
			drawImage: (img, sx) => {
				lastSx = sx;
			}
		};

		const image = { width: 30, height: 10 }; // frameWidth = 10

		// frames = 3, framesPerRow = 3; frameRatesForFrames gives frame 1 a natural
		// duration 2x frame 0/2 (8 fps = 125ms vs 4 fps = 250ms). syncBeats scales the
		// whole 500ms natural clip to 500ms target (speedMultiplier 1) at 120 BPM,
		// so the relative 125/250/125 timing is preserved unchanged.
		const clip = new Clip({
			image,
			frames: 3,
			framesPerRow: 3,
			frameRatesForFrames: { 0: 8, 1: 4, 2: 8 },
			syncBeats: 1,
			playback: 'once'
		});

		// Frame 0 at t=0
		clip.renderToContext(ctx, 0);
		expect(lastSx).toBe(0);

		// Advance by 125ms (frame 0's natural interval) -> frame 1
		clip.renderToContext(ctx, 125);
		expect(lastSx).toBe(10);

		// Advance by 250ms (frame 1's natural interval, 2x frame 0's) -> frame 2
		clip.renderToContext(ctx, 375);
		expect(lastSx).toBe(20);

		// Invalid syncBeats still throws (no silent fallback)
		expect(
			() =>
				new Clip({
						image,
					frames: 4,
					framesPerRow: 4,
					syncBeats: 0,
					playback: 'once'
				})
		).toThrow('invalid syncBeats');
	});

	test('random and shuffle playback ignore syncBeats and do not subscribe to MIDI clock', () => {
		for (const playback of ['random', 'shuffle']) {
			const subscribe = vi.fn();
			const clockSource = { bpmSource: 'clock', subscribe };
			const clip = new Clip(defaultOptions({ playback, syncBeats: 1, clockSource }));

			clip.reset();

			expect(subscribe).not.toHaveBeenCalled();
			clip.destroy();
		}
	});

	describe('constructor', () => {
		test('throws if frames is missing or less than 1', () => {
			expect(() => new Clip(defaultOptions({ frames: 0 }))).toThrow('Clip requires frames >= 1');
			expect(() => new Clip(defaultOptions({ frames: undefined }))).toThrow('Clip requires frames >= 1');
		});

		test('throws if framesPerRow is missing or less than 1', () => {
			expect(() => new Clip(defaultOptions({ framesPerRow: 0 }))).toThrow('Clip requires framesPerRow >= 1');
		});

		test('throws if image dimensions result in invalid frame size', () => {
			expect(() => new Clip(defaultOptions({ image: { width: 0, height: 135 } }))).toThrow('Clip: Invalid image dimensions');
		});

		test('creates successfully with valid options', () => {
			const clip = new Clip(defaultOptions());
			expect(clip).toBeInstanceOf(Clip);
		});

		test('filters invalid frame rates and logs warnings', () => {
			const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
			new Clip(defaultOptions({ frameRatesForFrames: { 0: -1, 1: 0, 2: 'invalid', 3: 60 } }));
			// Should have logged a warning for the three invalid values
			expect(consoleWarnSpy).toHaveBeenCalledTimes(3);
			consoleWarnSpy.mockRestore();
		});

		test('skips invalid frame rate keys and logs warnings', () => {
			const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

			// Keys: '-1' (negative), '999' (>= frames), '1.5' (non-integer)
			new Clip(defaultOptions({ frameRatesForFrames: { '-1': 10, 999: 20, 1.5: 30, 1: 60 } }));

			// Three invalid keys should have caused warnings
			expect(consoleWarnSpy).toHaveBeenCalledTimes(3);
			consoleWarnSpy.mockRestore();
		});

		test('falls back to default frame rate when all rates invalid', () => {
			const ctx = createMockDrawContext();
			const mockNow = vi.spyOn(performance, 'now');
			mockNow.mockReturnValue(0);

			const clip = new Clip(defaultOptions({ frameRatesForFrames: { 0: 0, 1: 'x' } }));
			// Play once at t=0
			clip.renderToContext(ctx);
			// Advance time a small amount; default fallback is numeric and > 0, so should not divide by zero
			mockNow.mockReturnValue(1000);
			// Should not throw due to invalid frame rates and should advance to the next frame
			clip.renderToContext(ctx);
			expect(ctx.drawImage).toHaveBeenCalledTimes(2);
			expect(clip.currentFrame).toBeGreaterThan(0);
			mockNow.mockRestore();
		});

		test('handles frameRatesForFrames: null without throwing', () => {
			const ctx = createMockDrawContext();
			const mockNow = vi.spyOn(performance, 'now');
			mockNow.mockReturnValue(0);

			// This simulates the case where normalizeClipMetadata returns frameRatesForFrames: null
			// when the field is missing from meta.json
			const clip = new Clip(defaultOptions({ frameRatesForFrames: null }));
			// Should not throw during construction
			expect(clip).toBeInstanceOf(Clip);
			// Should render at t=0 and advance using the default frame rate by t=1000ms
			clip.renderToContext(ctx);
			mockNow.mockReturnValue(1000);
			clip.renderToContext(ctx);
			expect(ctx.drawImage).toHaveBeenCalledTimes(2);
			expect(clip.currentFrame).toBeGreaterThan(0);
			mockNow.mockRestore();
		});
	});

	describe('Clip — frameDurationsMs priority', () => {
		test('constructor accepts frameDurationsMs and passes it to ClipTiming', () => {
			const ctx = createMockDrawContext();
			const mockNow = vi.spyOn(performance, 'now');
			mockNow.mockReturnValue(0);

			const clip = new Clip(
				defaultOptions({
						frames: 2,
					framesPerRow: 2,
					playback: 'once',
					frameRatesForFrames: { 0: 1000, 1: 1000 }, // 1ms per frame if FPS were used
					frameDurationsMs: { 0: 50, 1: 100 } // ms intervals should win
				})
			);

			clip.renderToContext(ctx, 0);
			expect(clip.currentFrame).toBe(0);

			// 40ms has not reached the 50ms frame 0 duration
			clip.renderToContext(ctx, 40);
			expect(clip.currentFrame).toBe(0);

			// 50ms exactly reaches the frame 0 duration -> advance to frame 1
			clip.renderToContext(ctx, 50);
			expect(clip.currentFrame).toBe(1);

			mockNow.mockRestore();
		});

		test('clip with both frameRatesForFrames and frameDurationsMs advances using ms intervals', () => {
			const ctx = createMockDrawContext();
			const clip = new Clip(
				defaultOptions({
						frames: 4,
					framesPerRow: 4,
					playback: 'once',
					frameRatesForFrames: { 0: 1000, 1: 1000, 2: 1000, 3: 1000 },
					frameDurationsMs: { 0: 50, 1: 100, 2: 25, 3: 75 }
				})
			);

			clip.renderToContext(ctx, 0);
			expect(clip.currentFrame).toBe(0);

			clip.renderToContext(ctx, 50);
			expect(clip.currentFrame).toBe(1);

			clip.renderToContext(ctx, 150); // 50 + 100
			expect(clip.currentFrame).toBe(2);

			clip.renderToContext(ctx, 175); // + 25
			expect(clip.currentFrame).toBe(3);
		});

		test('handles frameDurationsMs: null without throwing', () => {
			const ctx = createMockDrawContext();
			const clip = new Clip(
				defaultOptions({
						frames: 2,
					framesPerRow: 2,
					playback: 'once',
					frameDurationsMs: null,
					frameRatesForFrames: { 0: 1000 }
				})
			);

			clip.renderToContext(ctx, 0);
			expect(clip.currentFrame).toBe(0);

			clip.renderToContext(ctx, 1);
			expect(clip.currentFrame).toBe(1);
		});
	});

	describe('scrub()', () => {
		test('setScrubPosition maps normalized position to frame index', () => {
			const clip = new Clip(defaultOptions({ playback: 'scrub' }));
			clip.setScrubPosition(0.5);
			expect(clip.currentFrame).toBe(1);
		});

		test('setScrubPosition clamps below 0 to first frame', () => {
			const clip = new Clip(defaultOptions({ playback: 'scrub' }));
			clip.setScrubPosition(-0.1);
			expect(clip.currentFrame).toBe(0);
		});

		test('setScrubPosition clamps above 1 to last frame', () => {
			const clip = new Clip(defaultOptions({ playback: 'scrub' }));
			clip.setScrubPosition(1.1);
			expect(clip.currentFrame).toBe(3);
		});
	});

	describe('play()', () => {
		test('coerces numeric string keys to numeric indices', () => {
			const ctx = createMockDrawContext();
			// Use string keys to ensure coercion happens (JSON always parses keys as strings)
			const clip = new Clip(defaultOptions({ frames: 2, framesPerRow: 2, frameRatesForFrames: { 0: 1000 } }));
			// t=0 -> initial draw
			clip.renderToContext(ctx, 0);
			expect(ctx.drawImage).toHaveBeenCalledTimes(1);
			// t=1ms (exactly interval) -> should advance to next frame
			clip.renderToContext(ctx, 1);
			expect(ctx.drawImage).toHaveBeenCalledTimes(2);
			// Verify second draw is for frame 1 (sx = 120 for 240px width / 2 frames per row)
			expect(ctx.drawImage.mock.calls.at(-1)[1]).toBe(120);
		});
		test('advances frame when exactly on interval boundary', () => {
			const ctx = createMockDrawContext();
			const mockNow = vi.spyOn(performance, 'now');
			// Set frame rate so interval is 1ms for easy testing
			const clip = new Clip(defaultOptions({ frames: 2, framesPerRow: 2, frameRatesForFrames: { 0: 1000 } }));
			// t=0 -> initial draw
			mockNow.mockReturnValue(0);
			clip.renderToContext(ctx);
			expect(ctx.drawImage).toHaveBeenCalledTimes(1);
			// t=1ms (exactly interval) -> should advance to next frame
			mockNow.mockReturnValue(1);
			clip.renderToContext(ctx);
			expect(ctx.drawImage).toHaveBeenCalledTimes(2);
			// Verify second draw is for frame 1 (sx = 120 for 240px width / 2 frames per row)
			expect(ctx.drawImage.mock.calls.at(-1)[1]).toBe(120);
			mockNow.mockRestore();
		});

		test('returns early if image is null (after dispose)', () => {
			const ctx = createMockDrawContext();
			const clip = new Clip(defaultOptions({}));

			clip.destroy();
			clip.renderToContext(ctx);

			expect(ctx.drawImage).not.toHaveBeenCalled();
		});

		test('returns early if render context is null', () => {
			// Rendering with a null canvas context should return early
			// (no errors and no drawing occurs).
			const clip = new Clip(defaultOptions());
			expect(() => clip.renderToContext(null)).not.toThrow();
		});

		test('draws frame 0 on first play call without skipping', () => {
			const ctx = createMockDrawContext();
			const clip = new Clip(
				defaultOptions({
						frames: 4,
					framesPerRow: 4
				})
			);

			// First play call should render the initial frame without requiring time to elapse
			clip.renderToContext(ctx);

			expect(ctx.drawImage).toHaveBeenCalledTimes(1);
			// First call args: image, sx, sy, sw, sh, dx, dy, dw, dh
			// Frame 0: sx=0, sy=0
			const callArgs = ctx.drawImage.mock.calls[0];
			expect(callArgs[1]).toBe(0); // sx = 0 for frame 0
			expect(callArgs[2]).toBe(0); // sy = 0 for frame 0
		});

		test('does not double-advance or double-draw when play() and renderToContext() share same timestamp', () => {
			const ctx = createMockDrawContext();
			const clip = new Clip(
				defaultOptions({
						frames: 4,
					framesPerRow: 4,
					frameRatesForFrames: { 0: 10 }
				})
			);

			// First call via play() — should draw frame 0
			clip.renderToContext(ctx, 0);
			expect(ctx.drawImage).toHaveBeenCalledTimes(1);

			// Second call via renderToContext() with same timestamp — should be skipped
			const secondCtx = createMockDrawContext();
			clip.renderToContext(secondCtx, 0);
			expect(ctx.drawImage).toHaveBeenCalledTimes(1);
			expect(secondCtx.drawImage).not.toHaveBeenCalled();
		});

		test('does not advance frame until interval has passed', () => {
			const ctx = createMockDrawContext();
			const clip = new Clip(
				defaultOptions({
						frames: 4,
					framesPerRow: 4,
					frameRatesForFrames: { 0: 60 } // 60fps = ~16.67ms per frame
				})
			);

			// Mock performance.now to return consistent values
			const mockNow = vi.spyOn(performance, 'now');
			mockNow.mockReturnValue(0);

			clip.renderToContext(ctx); // Initialize at t=0
			expect(ctx.drawImage).toHaveBeenCalledTimes(1);

			// Still at t=0, should not advance or redraw (guarded by #lastRenderTimestamp)
			clip.renderToContext(ctx);
			expect(ctx.drawImage).toHaveBeenCalledTimes(1);

			// Verify still on frame 0 (sx=0)
			expect(ctx.drawImage.mock.calls[0][1]).toBe(0);
		});

		test('advances multiple frames when elapsed covers several intervals', () => {
			const ctx = createMockDrawContext();
			const mockNow = vi.spyOn(performance, 'now');
			// Set a low FPS so interval is large for easy testing (10 fps = 100ms)
			const clip = new Clip(defaultOptions({ frames: 10, framesPerRow: 10, frameRatesForFrames: { 0: 10 } }));
			// t=0 -> initial draw
			mockNow.mockReturnValue(0);
			clip.renderToContext(ctx);
			expect(ctx.drawImage).toHaveBeenCalledTimes(1);
			// t=350ms -> should advance 3 frames (floor(350/100)=3)
			mockNow.mockReturnValue(350);
			clip.renderToContext(ctx);
			// Check last drawn frame (frame index should be 3)
			const lastCall = ctx.drawImage.mock.calls.at(-1);
			const frameWidth = 240 / 10;
			expect(lastCall[1]).toBe(frameWidth * 3);

			// t=400ms -> the 50ms leftover should be preserved, so elapsed becomes 100ms and
			// exactly one more frame should be advanced
			mockNow.mockReturnValue(400);
			clip.renderToContext(ctx);
			const secondCall = ctx.drawImage.mock.calls.at(-1);
			expect(secondCall[1]).toBe(frameWidth * 4);

			mockNow.mockRestore();
		});

		test('handles variable frame rates when advancing multiple frames', () => {
			const ctx = createMockDrawContext();
			const mockNow = vi.spyOn(performance, 'now');
			// frame 0 = 10fps (100ms), frame 1 = 20fps (50ms) so 130ms should advance 1 frame
			const clip = new Clip(defaultOptions({ frames: 4, framesPerRow: 4, frameRatesForFrames: { 0: 10, 1: 20 } }));
			mockNow.mockReturnValue(0);
			clip.renderToContext(ctx);
			mockNow.mockReturnValue(130);
			clip.renderToContext(ctx);
			// After advancing, we should be on frame 1
			const lastCall = ctx.drawImage.mock.calls.at(-1);
			const frameWidth = 240 / 4;
			expect(lastCall[1]).toBe(frameWidth * 1);
			mockNow.mockRestore();
		});

		test('stops rendering non-looping clip after last frame', () => {
			const ctx = createMockDrawContext();
			const clip = new Clip(
				defaultOptions({
						frames: 2,
					framesPerRow: 2,
					playback: 'once',
					frameRatesForFrames: { 0: 1000 } // 1000fps = 1ms per frame
				})
			);

			const mockNow = vi.spyOn(performance, 'now');
			mockNow.mockReturnValue(0);
			clip.renderToContext(ctx); // Initialize lastTimestamp, draw frame 0

			mockNow.mockReturnValue(10);
			clip.renderToContext(ctx); // Advances to frame 1, draws frame 1

			mockNow.mockReturnValue(20);
			clip.renderToContext(ctx); // Advances to frame 2 (>= frames), draws clamped frame 1

			// Now #frame === 2 which is >= frames, and the clip should be marked finished
			expect(clip.isFinished).toBe(true);

			// next play() returns early
			const callCount = ctx.drawImage.mock.calls.length;
			mockNow.mockReturnValue(30);
			clip.renderToContext(ctx); // Should return early without drawing

			// Verify no additional draw after completion
			expect(ctx.drawImage.mock.calls.length).toBe(callCount);
			// Resetting should clear isFinished
			clip.reset();
			expect(clip.isFinished).toBe(false);
		});

		test('wraps back to frame 0 when looping is enabled', () => {
			const ctx = createMockDrawContext();
			const clip = new Clip(
				defaultOptions({
						frames: 2,
					framesPerRow: 2,
					playback: 'loop',
					frameRatesForFrames: { 0: 1000 }
				})
			);

			const mockNow = vi.spyOn(performance, 'now');
			mockNow.mockReturnValue(0);
			clip.renderToContext(ctx); // draw frame 0

			mockNow.mockReturnValue(10);
			clip.renderToContext(ctx); // draw frame 1

			mockNow.mockReturnValue(20);
			clip.renderToContext(ctx); // should wrap back to frame 0

			// Verify last draw was frame 0
			expect(ctx.drawImage.mock.calls.at(-1)[1]).toBe(0);
		});
	});

	describe('stop()', () => {
		test('resets state when retrigger is enabled', () => {
			const ctx = createMockDrawContext();
			const clip = new Clip(defaultOptions({ retrigger: true }));

			const mockNow = vi.spyOn(performance, 'now');
			mockNow.mockReturnValue(0);
			clip.renderToContext(ctx);

			mockNow.mockReturnValue(100);
			clip.renderToContext(ctx); // Advance some frames

			clip.stop();

			// After stop, next play should start from frame 0
			mockNow.mockReturnValue(200);
			clip.renderToContext(ctx);

			// Verify drawing frame 0 (sx=0)
			const lastCall = ctx.drawImage.mock.calls.at(-1);
			expect(lastCall[1]).toBe(0);
		});
	});

	describe('reset()', () => {
		test('resets to frame 0 when retrigger is enabled', () => {
			const ctx = createMockDrawContext();
			const clip = new Clip(defaultOptions({ retrigger: true }));

			const mockNow = vi.spyOn(performance, 'now');
			mockNow.mockReturnValue(0);
			clip.renderToContext(ctx);

			mockNow.mockReturnValue(100);
			clip.renderToContext(ctx);

			clip.reset();

			mockNow.mockReturnValue(200);
			clip.renderToContext(ctx);

			const lastCall = ctx.drawImage.mock.calls.at(-1);
			expect(lastCall[1]).toBe(0);
		});

		test('restarts a finished non-retrigger clip so it can play again', () => {
			const ctx = createMockDrawContext();
			const clip = new Clip(
				defaultOptions({
						retrigger: false,
					playback: 'once',
					frames: 2,
					framesPerRow: 2,
					frameRatesForFrames: { 0: 1000 } // 1ms per frame
				})
			);

			const mockNow = vi.spyOn(performance, 'now');
			mockNow.mockReturnValue(0);
			clip.renderToContext(ctx); // frame 0
			mockNow.mockReturnValue(10);
			clip.renderToContext(ctx); // frame 1
			mockNow.mockReturnValue(20);
			clip.renderToContext(ctx); // past last frame -> finished
			expect(clip.isFinished).toBe(true);

			// A new note-on resets a finished one-shot
			clip.reset();
			expect(clip.isFinished).toBe(false);

			mockNow.mockReturnValue(30);
			clip.renderToContext(ctx);
			expect(ctx.drawImage.mock.calls.at(-1)[1]).toBe(0);
		});

		test('does not restart a non-retrigger clip mid-playback', () => {
			const ctx = createMockDrawContext();
			const clip = new Clip(
				defaultOptions({
						retrigger: false,
					playback: 'once',
					frames: 4,
					framesPerRow: 4,
					frameRatesForFrames: { 0: 100 } // 10ms per frame
				})
			);
			const frameWidth = 240 / 4;

			const mockNow = vi.spyOn(performance, 'now');
			mockNow.mockReturnValue(0);
			clip.renderToContext(ctx); // frame 0
			mockNow.mockReturnValue(10);
			clip.renderToContext(ctx); // frame 1
			expect(clip.isFinished).toBe(false);

			clip.reset(); // mid-playback with retrigger disabled: no restart

			mockNow.mockReturnValue(12);
			clip.renderToContext(ctx);
			expect(ctx.drawImage.mock.calls.at(-1)[1]).toBe(frameWidth); // still frame 1
		});
	});

	describe('shuffle playback mode (true shuffle)', () => {
		/**
		 * Extract the frame index drawn from a drawImage mock call by
		 * reading the source x/y and dividing by frame dimensions.
		 */
		function frameIndexFromDrawCall(call, frameWidth, frameHeight, framesPerRow) {
			const [, sx, sy] = call;
			const col = Math.round(sx / frameWidth);
			const row = Math.round(sy / frameHeight);
			return row * framesPerRow + col;
		}

		test('plays every frame exactly once before any frame repeats', () => {
			const mockNow = vi.spyOn(performance, 'now');
			const ctx = createMockDrawContext();
			const frames = 5;
			const framesPerRow = 5;
			const frameWidth = 240 / framesPerRow;
			const frameHeight = 135;
			const clip = new Clip(defaultOptions({ frames, framesPerRow, playback: 'shuffle', frameRatesForFrames: { 0: 1000 } }));

			mockNow.mockReturnValue(0);
			clip.renderToContext(ctx); // initial draw (frame 0, not yet shuffled)

			const seenFrames = [];
			for (let t = 1; t <= frames; t++) {
				mockNow.mockReturnValue(t);
				clip.renderToContext(ctx);
				seenFrames.push(frameIndexFromDrawCall(ctx.drawImage.mock.calls.at(-1), frameWidth, frameHeight, framesPerRow));
			}

			// All frames 0..4 must appear exactly once in the first full cycle
			expect(new Set(seenFrames).size).toBe(frames);
			expect([...seenFrames].sort((a, b) => a - b)).toEqual([0, 1, 2, 3, 4]);

			mockNow.mockRestore();
		});

		test('does not repeat the last frame of one cycle as the first frame of the next', () => {
			const mockNow = vi.spyOn(performance, 'now');
			const ctx = createMockDrawContext();
			const frames = 4;
			const framesPerRow = 4;
			const frameWidth = 240 / framesPerRow;
			const frameHeight = 135;
			const clip = new Clip(defaultOptions({ frames, framesPerRow, playback: 'shuffle', frameRatesForFrames: { 0: 1000 } }));

			mockNow.mockReturnValue(0);
			clip.renderToContext(ctx);

			const seenFrames = [];
			// Advance through two full cycles (8 advances)
			for (let t = 1; t <= frames * 2; t++) {
				mockNow.mockReturnValue(t);
				clip.renderToContext(ctx);
				seenFrames.push(frameIndexFromDrawCall(ctx.drawImage.mock.calls.at(-1), frameWidth, frameHeight, framesPerRow));
			}

			// No two consecutive frames (including the cycle boundary) should be identical
			for (let i = 1; i < seenFrames.length; i++) {
				expect(seenFrames[i]).not.toBe(seenFrames[i - 1]);
			}

			mockNow.mockRestore();
		});

		test('handles a single-frame clip by redrawing frame 0 each render', () => {
			const ctx = createMockDrawContext();
			const clip = new Clip(defaultOptions({ frames: 1, framesPerRow: 1, playback: 'shuffle', frameRatesForFrames: { 0: 1000 } }));

			clip.renderToContext(ctx, 0);
			clip.renderToContext(ctx, 1);
			clip.renderToContext(ctx, 2);

			expect(ctx.drawImage).toHaveBeenCalledTimes(3);
			expect(clip.currentFrame).toBe(0);
		});

		test('resetting the clip clears the unplayed shuffle pool', () => {
			const ctx = createMockDrawContext();
			const frames = 4;
			const framesPerRow = 4;
			const image = createMockImage();
			const clip = new Clip(defaultOptions({ image, frames, framesPerRow, playback: 'shuffle', retrigger: true, frameRatesForFrames: { 0: 1000 } }));
			const frameWidth = image.width / framesPerRow;
			const frameHeight = image.height / Math.ceil(frames / framesPerRow);

			clip.renderToContext(ctx, 0);
			clip.renderToContext(ctx, 1);

			const preResetFrames = ctx.drawImage.mock.calls.slice(-2).map(call => frameIndexFromDrawCall(call, frameWidth, frameHeight, framesPerRow));
			expect(preResetFrames).toHaveLength(2);

			clip.reset();

			// Render the reset frame, then draw a full pool to verify the
			// unplayed shuffle pool was cleared and reshuffled.
			clip.renderToContext(ctx, 2);
			const postResetFrames = [];
			for (let t = 3; t < 3 + frames; t++) {
				clip.renderToContext(ctx, t);
				postResetFrames.push(frameIndexFromDrawCall(ctx.drawImage.mock.calls.at(-1), frameWidth, frameHeight, framesPerRow));
			}
			expect(postResetFrames).toHaveLength(frames);
			expect(new Set(postResetFrames).size).toBe(frames);
		});
	});

	describe('dispose()', () => {
		test('clears image reference', () => {
			const ctx = createMockDrawContext();
			const clip = new Clip(defaultOptions({}));

			clip.renderToContext(ctx);
			expect(ctx.drawImage).toHaveBeenCalled();

			ctx.drawImage.mockClear();
			clip.destroy();
			clip.renderToContext(ctx);

			expect(ctx.drawImage).not.toHaveBeenCalled();
		});
	});
});

describe('Clip — scaleMode + placement', () => {
	beforeEach(() => {
		vi.restoreAllMocks();
	});

	test('stretch mode draws to full canvas (legacy behavior)', () => {
		const ctx = createMockDrawContext();
		const image = createMockImage(240, 135);
		const clip = new Clip(defaultOptions({ image, frames: 1, framesPerRow: 1, scaleMode: 'stretch' }));
		clip.reset();
		clip.renderToContext(ctx, 0);

		const call = ctx.drawImage.mock.calls[0];
		// drawImage(img, sx, sy, sWidth, sHeight, dx, dy, dWidth, dHeight)
		expect(call[5]).toBe(0); // dx
		expect(call[6]).toBe(0); // dy
		expect(call[7]).toBe(240); // dWidth = canvasWidth
		expect(call[8]).toBe(135); // dHeight = canvasHeight
	});

	test('fit mode with default-size clip produces same result as stretch', () => {
		const ctx = createMockDrawContext();
		const image = createMockImage(240, 135);
		const clip = new Clip(defaultOptions({ image, frames: 1, framesPerRow: 1, scaleMode: 'fit' }));
		clip.reset();
		clip.renderToContext(ctx, 0);

		const call = ctx.drawImage.mock.calls[0];
		expect(call[5]).toBe(0); // dx = 0 (centered, no offset)
		expect(call[6]).toBe(0); // dy = 0
		expect(call[7]).toBe(240); // dWidth = full canvas
		expect(call[8]).toBe(135); // dHeight = full canvas
	});

	test('fit mode with smaller clip letterboxes centered', () => {
		const ctx = createMockDrawContext();
		const image = createMockImage(120, 68);
		const clip = new Clip(defaultOptions({ image, frames: 1, framesPerRow: 1, scaleMode: 'fit' }));
		clip.reset();
		clip.renderToContext(ctx, 0);

		const call = ctx.drawImage.mock.calls[0];
		// scale = min(240/120, 135/68) = 135/68 ≈ 1.9853
		// dWidth = floor(120 * 1.9853) = 238
		// dHeight = floor(68 * 1.9853) = floor(135.0) = 135
		// dx = floor((240 - 238) / 2) = 1
		// dy = floor((135 - 135) / 2) = 0
		expect(call[7]).toBe(238); // dWidth
		expect(call[8]).toBe(135); // dHeight
		expect(call[5]).toBe(1); // dx centered
		expect(call[6]).toBe(0); // dy centered
	});

	test('fit mode with placement offsets the draw position', () => {
		const ctx = createMockDrawContext();
		const image = createMockImage(120, 68);
		const clip = new Clip(
			defaultOptions({
				image,
				frames: 1,
				framesPerRow: 1,
				scaleMode: 'fit',
				placement: { x: 10, y: 5 }
			})
		);
		clip.reset();
		clip.renderToContext(ctx, 0);

		const call = ctx.drawImage.mock.calls[0];
		// Without placement: dx=1, dy=0. With placement x=10, y=5: dx=11, dy=5
		expect(call[5]).toBe(11); // dx = snapToPixel(1 + 10)
		expect(call[6]).toBe(5); // dy = snapToPixel(0 + 5)
	});

	test('stretch mode ignores placement', () => {
		const ctx = createMockDrawContext();
		const image = createMockImage(240, 135);
		const clip = new Clip(
			defaultOptions({
				image,
				frames: 1,
				framesPerRow: 1,
				scaleMode: 'stretch',
				placement: { x: 50, y: 30 }
			})
		);
		clip.reset();
		clip.renderToContext(ctx, 0);

		const call = ctx.drawImage.mock.calls[0];
		expect(call[5]).toBe(0); // dx = 0 (placement ignored)
		expect(call[6]).toBe(0); // dy = 0
	});

	test('pattern mode tiles to fill canvas', () => {
		const ctx = createMockDrawContext();
		const image = createMockImage(60, 45);
		const clip = new Clip(
			defaultOptions({
				image,
				frames: 1,
				framesPerRow: 1,
				scaleMode: 'pattern'
			})
		);
		clip.reset();
		clip.renderToContext(ctx, 0);

		// 60×45 tiles on 240×135 canvas: 4 columns × 3 rows = 12 tiles
		// But tiling starts from negative offset to cover edges, so may be more
		const drawCalls = ctx.drawImage.mock.calls;
		expect(drawCalls.length).toBeGreaterThanOrEqual(12);

		// Each tile should be drawn at native size (60×45)
		for (const call of drawCalls) {
			expect(call[7]).toBe(60); // dWidth = tileWidth
			expect(call[8]).toBe(45); // dHeight = tileHeight
		}
	});

	test('pattern mode with placement shifts tile grid', () => {
		const ctx = createMockDrawContext();
		const image = createMockImage(60, 45);
		const clip = new Clip(
			defaultOptions({
				image,
				frames: 1,
				framesPerRow: 1,
				scaleMode: 'pattern',
				placement: { x: 30, y: 0 }
			})
		);
		clip.reset();
		clip.renderToContext(ctx, 0);

		const drawCalls = ctx.drawImage.mock.calls;
		// With offset x=30, the first tile column starts at 30 - 60 = -30
		const firstDx = drawCalls[0][5];
		expect(firstDx).toBe(-30); // offsetX - tileWidth = 30 - 60 = -30
	});

	test('pattern mode with tiny tiles caps draw calls and still paints', () => {
		const ctx = createMockDrawContext();
		// 1×1 frame on 240×135 would otherwise issue ~32k+ drawImage calls
		const image = createMockImage(1, 1);
		const clip = new Clip(
			defaultOptions({
				image,
				frames: 1,
				framesPerRow: 1,
				scaleMode: 'pattern'
			})
		);
		clip.reset();
		clip.renderToContext(ctx, 0);

		const drawCalls = ctx.drawImage.mock.calls;
		expect(drawCalls.length).toBe(MAX_PATTERN_TILES_PER_FRAME);
		expect(drawCalls.length).toBeGreaterThan(0);
		for (const call of drawCalls) {
			expect(call[7]).toBe(1);
			expect(call[8]).toBe(1);
		}
	});

	test('pattern mode with 8×8 tiles stays under the draw-call cap (full coverage)', () => {
		const ctx = createMockDrawContext();
		const image = createMockImage(8, 8);
		const clip = new Clip(
			defaultOptions({
				image,
				frames: 1,
				framesPerRow: 1,
				scaleMode: 'pattern'
			})
		);
		clip.reset();
		clip.renderToContext(ctx, 0);

		const drawCalls = ctx.drawImage.mock.calls;
		expect(drawCalls.length).toBeGreaterThan(0);
		expect(drawCalls.length).toBeLessThanOrEqual(MAX_PATTERN_TILES_PER_FRAME);
		// Uncapped 8×8 with edge overdraw is well under the cap — expect full grid, not a truncated run
		expect(drawCalls.length).toBeLessThan(MAX_PATTERN_TILES_PER_FRAME);
	});

	test('whole-pixel snapping: fractional placement produces integer draw coords', () => {
		const ctx = createMockDrawContext();
		const image = createMockImage(100, 100);
		const clip = new Clip(
			defaultOptions({
				image,
				frames: 1,
				framesPerRow: 1,
				scaleMode: 'none',
				placement: { x: 10.7, y: 20.3 }
			})
		);
		clip.reset();
		clip.renderToContext(ctx, 0);

		const call = ctx.drawImage.mock.calls[0];
		// none mode: 100×100 clip on 240×135 canvas
		// dx = max(0, floor((240-100)/2)) = 70, dy = max(0, floor((135-100)/2)) = 17
		// placedX = floor(70 + 10.7) = 80, placedY = floor(17 + 20.3) = 37
		expect(Number.isInteger(call[5])).toBe(true);
		expect(Number.isInteger(call[6])).toBe(true);
		expect(call[5]).toBe(80);
		expect(call[6]).toBe(37);
	});

	test('legacy clip (no scaleMode/placement) defaults to fit + centered', () => {
		const ctx = createMockDrawContext();
		const image = createMockImage(240, 135);
		const clip = new Clip(defaultOptions({ image, frames: 1, framesPerRow: 1 }));
		clip.reset();
		clip.renderToContext(ctx, 0);

		const call = ctx.drawImage.mock.calls[0];
		// Default scaleMode is 'fit', default placement is {0,0}
		// 240×135 clip on 240×135 canvas with fit = full canvas, centered at 0,0
		expect(call[5]).toBe(0);
		expect(call[6]).toBe(0);
		expect(call[7]).toBe(240);
		expect(call[8]).toBe(135);
	});

	test('cover mode scales to cover canvas', () => {
		const ctx = createMockDrawContext();
		const image = createMockImage(120, 100);
		const clip = new Clip(
			defaultOptions({
				image,
				frames: 1,
				framesPerRow: 1,
				scaleMode: 'cover'
			})
		);
		clip.reset();
		clip.renderToContext(ctx, 0);

		const call = ctx.drawImage.mock.calls[0];
		// scale = max(240/120, 135/100) = max(2, 1.35) = 2
		// sWidth = 120/2 = 60, sHeight = 100/2 = 50
		// dWidth = 240, dHeight = 135
		expect(call[7]).toBe(240); // dWidth = canvasWidth
		expect(call[8]).toBe(135); // dHeight = canvasHeight
		expect(call[3]).toBe(60); // sWidth (cropped source)
		expect(call[4]).toBe(50); // sHeight
	});

	test('none mode with larger clip does centered crop', () => {
		const ctx = createMockDrawContext();
		const image = createMockImage(300, 200);
		const clip = new Clip(
			defaultOptions({
				image,
				frames: 1,
				framesPerRow: 1,
				scaleMode: 'none'
			})
		);
		clip.reset();
		clip.renderToContext(ctx, 0);

		const call = ctx.drawImage.mock.calls[0];
		// none: sWidth = min(300, 240) = 240, sHeight = min(200, 135) = 135
		// sx = max(0, floor((300-240)/2)) = 30, sy = max(0, floor((200-135)/2)) = 32
		// dx = 0, dy = 0 (source larger than target)
		expect(call[1]).toBe(30); // sx
		expect(call[2]).toBe(32); // sy
		expect(call[5]).toBe(0); // dx
		expect(call[6]).toBe(0); // dy
		expect(call[7]).toBe(240); // dWidth
		expect(call[8]).toBe(135); // dHeight
	});

	test('nearest scaling disables image smoothing by default', () => {
		const ctx = createMockDrawContext();
		const clip = new Clip(defaultOptions({}));
		clip.reset();
		clip.renderToContext(ctx, 0);
		expect(ctx.imageSmoothingEnabled).toBe(false);
		expect(ctx.imageSmoothingQuality).toBe('low');
	});

	test('smooth scaling enables high-quality image smoothing', () => {
		const ctx = createMockDrawContext();
		const clip = new Clip(defaultOptions({ scaling: 'smooth' }));
		clip.reset();
		clip.renderToContext(ctx, 0);
		expect(ctx.imageSmoothingEnabled).toBe(true);
		expect(ctx.imageSmoothingQuality).toBe('high');
	});
});
