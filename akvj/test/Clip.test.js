import { describe, test, expect, vi, beforeEach } from 'vitest';
import Clip from '../src/js/visuals/Clip.js';

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
		displayContext: createMockDrawContext(),
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

	test('dispose() unsubscribes from MIDI clock (no further advances)', async () => {
		const ctx = createMockDrawContext();
		const appState = (await import('../src/js/core/AppState.js')).default;

		// Use a frameDuration that maps to 1 pulse per frame (1/PPQN beats)
		const beatsPerFrame = 1 / 24; // 1 pulse when PPQN=24

		const clip = new Clip(
			defaultOptions({
				displayContext: ctx,
				frames: 2,
				framesPerRow: 2,
				frameDurationBeats: beatsPerFrame,
				playback: 'once'
			})
		);

		// Initial draw frame 0
		clip.play(0);
		expect(ctx.drawImage).toHaveBeenCalledTimes(1);
		expect(ctx.drawImage.mock.calls.at(-1)[1]).toBe(0);

		// Send 6 pulses to establish clock sync (bpmSource -> 'clock')
		for (let i = 0; i < 6; i++) {
			appState.dispatchMIDIClock(i * 10);
		}

		// Now a single pulse should advance the frame (pulsesPerFrame === 1)
		appState.dispatchMIDIClock(100);
		// Drawing after pulse should show frame 1
		clip.play(100);
		expect(ctx.drawImage.mock.calls.at(-1)[1]).not.toBe(0);

		// Dispose the clip (should unsubscribe from clock)
		clip.destroy();

		// Another pulse should NOT advance the frame further
		appState.dispatchMIDIClock(200);
		clip.play(200);
		// The frame should remain the same (still frame 1)
		expect(ctx.drawImage.mock.calls.at(-1)[1]).not.toBe(0);

		// Reset global AppState to avoid leaking clock sync between tests
		appState.reset();
	});

	test('frameDurationBeats array controls per-frame timing and falls back to first element', () => {
		// Create a fake context that captures drawImage sx value
		let lastSx = null;
		const ctx = {
			drawImage: (img, sx) => {
				lastSx = sx;
			}
		};

		const image = { width: 30, height: 10 }; // frameWidth = 10

		// frames = 3, framesPerRow = 3
		// Provide a frameDurationBeats array with explicit per-frame values
		const clip = new Clip({
			displayContext: ctx,
			image,
			frames: 3,
			framesPerRow: 3,
			frameDurationBeats: [0.25, 0.5, 0.25],
			playback: 'once'
		});

		// Frame 0 at t=0
		clip.renderToContext(ctx, 0);
		expect(lastSx).toBe(0);

		// Advance by 125ms (0.25 beats @ 120 BPM) -> frame 1
		clip.renderToContext(ctx, 125);
		expect(lastSx).toBe(10);

		// Advance by 250ms (0.5 beats) -> frame 2
		clip.renderToContext(ctx, 375);
		expect(lastSx).toBe(20);

		// If frameDurationBeats array length doesn't match frames, constructor should throw
		expect(
			() =>
				new Clip({
					displayContext: ctx,
					image,
					frames: 4,
					framesPerRow: 4,
					frameDurationBeats: [0.25, 0.5],
					playback: 'once'
				})
		).toThrow('frameDurationBeats array length');
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

			const clip = new Clip(defaultOptions({ displayContext: ctx, frameRatesForFrames: { 0: 0, 1: 'x' } }));
			// Play once at t=0
			clip.play();
			// Advance time a small amount; default fallback is numeric and > 0, so should not divide by zero
			mockNow.mockReturnValue(1000);
			// Should not throw due to invalid frame rates
			expect(() => clip.play()).not.toThrow();
			mockNow.mockRestore();
		});
	});

	describe('play()', () => {
		test('coerces numeric string keys to numeric indices', () => {
			const ctx = createMockDrawContext();
			// Use string keys to ensure coercion happens (JSON always parses keys as strings)
			const clip = new Clip(defaultOptions({ displayContext: ctx, frames: 2, framesPerRow: 2, frameRatesForFrames: { 0: 1000 } }));
			// t=0 -> initial draw
			clip.play(0);
			expect(ctx.drawImage).toHaveBeenCalledTimes(1);
			// t=1ms (exactly interval) -> should advance to next frame
			clip.play(1);
			expect(ctx.drawImage).toHaveBeenCalledTimes(2);
			// Verify second draw is for frame 1 (sx = 120 for 240px width / 2 frames per row)
			expect(ctx.drawImage.mock.calls.at(-1)[1]).toBe(120);
		});
		test('advances frame when exactly on interval boundary', () => {
			const ctx = createMockDrawContext();
			const mockNow = vi.spyOn(performance, 'now');
			// Set frame rate so interval is 1ms for easy testing
			const clip = new Clip(defaultOptions({ displayContext: ctx, frames: 2, framesPerRow: 2, frameRatesForFrames: { 0: 1000 } }));
			// t=0 -> initial draw
			mockNow.mockReturnValue(0);
			clip.play();
			expect(ctx.drawImage).toHaveBeenCalledTimes(1);
			// t=1ms (exactly interval) -> should advance to next frame
			mockNow.mockReturnValue(1);
			clip.play();
			expect(ctx.drawImage).toHaveBeenCalledTimes(2);
			// Verify second draw is for frame 1 (sx = 120 for 240px width / 2 frames per row)
			expect(ctx.drawImage.mock.calls.at(-1)[1]).toBe(120);
			mockNow.mockRestore();
		});

		test('returns early if image is null (after dispose)', () => {
			const ctx = createMockDrawContext();
			const clip = new Clip(defaultOptions({ displayContext: ctx }));

			clip.destroy();
			clip.play();

			expect(ctx.drawImage).not.toHaveBeenCalled();
		});

		test('returns early if displayContext is null', () => {
			// Creating a clip with a null canvas context should return early
			// (no errors and no drawing occurs).
			const clipWithNullCtx = new Clip(defaultOptions({ displayContext: null }));
			expect(() => clipWithNullCtx.play()).not.toThrow();
		});

		test('draws frame 0 on first play call without skipping', () => {
			const ctx = createMockDrawContext();
			const clip = new Clip(
				defaultOptions({
					displayContext: ctx,
					frames: 4,
					framesPerRow: 4
				})
			);

			// First play call should render the initial frame without requiring time to elapse
			clip.play();

			expect(ctx.drawImage).toHaveBeenCalledTimes(1);
			// First call args: image, sx, sy, sw, sh, dx, dy, dw, dh
			// Frame 0: sx=0, sy=0
			const callArgs = ctx.drawImage.mock.calls[0];
			expect(callArgs[1]).toBe(0); // sx = 0 for frame 0
			expect(callArgs[2]).toBe(0); // sy = 0 for frame 0
		});

		test('does not advance frame until interval has passed', () => {
			const ctx = createMockDrawContext();
			const clip = new Clip(
				defaultOptions({
					displayContext: ctx,
					frames: 4,
					framesPerRow: 4,
					frameRatesForFrames: { 0: 60 } // 60fps = ~16.67ms per frame
				})
			);

			// Mock performance.now to return consistent values
			const mockNow = vi.spyOn(performance, 'now');
			mockNow.mockReturnValue(0);

			clip.play(); // Initialize at t=0
			expect(ctx.drawImage).toHaveBeenCalledTimes(1);

			// Still at t=0, should not advance
			clip.play();
			expect(ctx.drawImage).toHaveBeenCalledTimes(2);

			// Verify still on frame 0 (sx=0)
			expect(ctx.drawImage.mock.calls[1][1]).toBe(0);
		});

		test('advances multiple frames when elapsed covers several intervals', () => {
			const ctx = createMockDrawContext();
			const mockNow = vi.spyOn(performance, 'now');
			// Set a low FPS so interval is large for easy testing (10 fps = 100ms)
			const clip = new Clip(defaultOptions({ displayContext: ctx, frames: 10, framesPerRow: 10, frameRatesForFrames: { 0: 10 } }));
			// t=0 -> initial draw
			mockNow.mockReturnValue(0);
			clip.play();
			expect(ctx.drawImage).toHaveBeenCalledTimes(1);
			// t=350ms -> should advance 3 frames (floor(350/100)=3)
			mockNow.mockReturnValue(350);
			clip.play();
			// Check last drawn frame (frame index should be 3)
			const lastCall = ctx.drawImage.mock.calls.at(-1);
			const frameWidth = 240 / 10;
			expect(lastCall[1]).toBe(frameWidth * 3);

			// t=400ms -> the 50ms leftover should be preserved, so elapsed becomes 100ms and
			// exactly one more frame should be advanced
			mockNow.mockReturnValue(400);
			clip.play();
			const secondCall = ctx.drawImage.mock.calls.at(-1);
			expect(secondCall[1]).toBe(frameWidth * 4);

			mockNow.mockRestore();
		});

		test('handles variable frame rates when advancing multiple frames', () => {
			const ctx = createMockDrawContext();
			const mockNow = vi.spyOn(performance, 'now');
			// frame 0 = 10fps (100ms), frame 1 = 20fps (50ms) so 130ms should advance 1 frame
			const clip = new Clip(defaultOptions({ displayContext: ctx, frames: 4, framesPerRow: 4, frameRatesForFrames: { 0: 10, 1: 20 } }));
			mockNow.mockReturnValue(0);
			clip.play();
			mockNow.mockReturnValue(130);
			clip.play();
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
					displayContext: ctx,
					frames: 2,
					framesPerRow: 2,
					playback: 'once',
					frameRatesForFrames: { 0: 1000 } // 1000fps = 1ms per frame
				})
			);

			const mockNow = vi.spyOn(performance, 'now');
			mockNow.mockReturnValue(0);
			clip.play(); // Initialize lastTime, draw frame 0

			mockNow.mockReturnValue(10);
			clip.play(); // Advances to frame 1, draws frame 1

			mockNow.mockReturnValue(20);
			clip.play(); // Advances to frame 2 (>= frames), draws clamped frame 1

			// Now #frame === 2 which is >= frames, and the clip should be marked finished
			expect(clip.isFinished).toBe(true);

			// next play() returns early
			const callCount = ctx.drawImage.mock.calls.length;
			mockNow.mockReturnValue(30);
			clip.play(); // Should return early without drawing

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
					displayContext: ctx,
					frames: 2,
					framesPerRow: 2,
					playback: 'loop',
					frameRatesForFrames: { 0: 1000 }
				})
			);

			const mockNow = vi.spyOn(performance, 'now');
			mockNow.mockReturnValue(0);
			clip.play(); // draw frame 0

			mockNow.mockReturnValue(10);
			clip.play(); // draw frame 1

			mockNow.mockReturnValue(20);
			clip.play(); // should wrap back to frame 0

			// Verify last draw was frame 0
			expect(ctx.drawImage.mock.calls.at(-1)[1]).toBe(0);
		});
	});

	describe('stop()', () => {
		test('resets state when retrigger is enabled', () => {
			const ctx = createMockDrawContext();
			const clip = new Clip(defaultOptions({ displayContext: ctx, retrigger: true }));

			const mockNow = vi.spyOn(performance, 'now');
			mockNow.mockReturnValue(0);
			clip.play();

			mockNow.mockReturnValue(100);
			clip.play(); // Advance some frames

			clip.stop();

			// After stop, next play should start from frame 0
			mockNow.mockReturnValue(200);
			clip.play();

			// Verify drawing frame 0 (sx=0)
			const lastCall = ctx.drawImage.mock.calls.at(-1);
			expect(lastCall[1]).toBe(0);
		});
	});

	describe('reset()', () => {
		test('resets to frame 0 when retrigger is enabled', () => {
			const ctx = createMockDrawContext();
			const clip = new Clip(defaultOptions({ displayContext: ctx, retrigger: true }));

			const mockNow = vi.spyOn(performance, 'now');
			mockNow.mockReturnValue(0);
			clip.play();

			mockNow.mockReturnValue(100);
			clip.play();

			clip.reset();

			mockNow.mockReturnValue(200);
			clip.play();

			const lastCall = ctx.drawImage.mock.calls.at(-1);
			expect(lastCall[1]).toBe(0);
		});

		test('restarts a finished non-retrigger clip so it can play again', () => {
			const ctx = createMockDrawContext();
			const clip = new Clip(
				defaultOptions({
					displayContext: ctx,
					retrigger: false,
					playback: 'once',
					frames: 2,
					framesPerRow: 2,
					frameRatesForFrames: { 0: 1000 } // 1ms per frame
				})
			);

			const mockNow = vi.spyOn(performance, 'now');
			mockNow.mockReturnValue(0);
			clip.play(); // frame 0
			mockNow.mockReturnValue(10);
			clip.play(); // frame 1
			mockNow.mockReturnValue(20);
			clip.play(); // past last frame -> finished
			expect(clip.isFinished).toBe(true);

			// A new note-on resets a finished one-shot
			clip.reset();
			expect(clip.isFinished).toBe(false);

			mockNow.mockReturnValue(30);
			clip.play();
			expect(ctx.drawImage.mock.calls.at(-1)[1]).toBe(0);
		});

		test('does not restart a non-retrigger clip mid-playback', () => {
			const ctx = createMockDrawContext();
			const clip = new Clip(
				defaultOptions({
					displayContext: ctx,
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
			clip.play(); // frame 0
			mockNow.mockReturnValue(10);
			clip.play(); // frame 1
			expect(clip.isFinished).toBe(false);

			clip.reset(); // mid-playback with retrigger disabled: no restart

			mockNow.mockReturnValue(12);
			clip.play();
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
			const clip = new Clip(defaultOptions({ displayContext: ctx, frames, framesPerRow, playback: 'shuffle', frameRatesForFrames: { 0: 1000 } }));

			mockNow.mockReturnValue(0);
			clip.play(); // initial draw (frame 0, not yet shuffled)

			const seenFrames = [];
			for (let t = 1; t <= frames; t++) {
				mockNow.mockReturnValue(t);
				clip.play();
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
			const clip = new Clip(defaultOptions({ displayContext: ctx, frames, framesPerRow, playback: 'shuffle', frameRatesForFrames: { 0: 1000 } }));

			mockNow.mockReturnValue(0);
			clip.play();

			const seenFrames = [];
			// Advance through two full cycles (8 advances)
			for (let t = 1; t <= frames * 2; t++) {
				mockNow.mockReturnValue(t);
				clip.play();
				seenFrames.push(frameIndexFromDrawCall(ctx.drawImage.mock.calls.at(-1), frameWidth, frameHeight, framesPerRow));
			}

			// No two consecutive frames (including the cycle boundary) should be identical
			for (let i = 1; i < seenFrames.length; i++) {
				expect(seenFrames[i]).not.toBe(seenFrames[i - 1]);
			}

			mockNow.mockRestore();
		});

		test('handles a single-frame clip without throwing', () => {
			const ctx = createMockDrawContext();
			const clip = new Clip(defaultOptions({ displayContext: ctx, frames: 1, framesPerRow: 1, playback: 'shuffle', frameRatesForFrames: { 0: 1000 } }));

			expect(() => {
				clip.play(0);
				clip.play(1);
				clip.play(2);
			}).not.toThrow();
		});

		test('resetting the clip clears the unplayed shuffle pool', () => {
			const mockNow = vi.spyOn(performance, 'now');
			const ctx = createMockDrawContext();
			const clip = new Clip(defaultOptions({ displayContext: ctx, frames: 4, framesPerRow: 4, playback: 'shuffle', retrigger: true, frameRatesForFrames: { 0: 1000 } }));

			mockNow.mockReturnValue(0);
			clip.play();
			mockNow.mockReturnValue(1);
			clip.play();

			// Reset should not throw and should allow shuffle to continue working
			clip.reset();
			expect(() => {
				mockNow.mockReturnValue(2);
				clip.play();
			}).not.toThrow();

			mockNow.mockRestore();
		});
	});

	describe('dispose()', () => {
		test('clears image reference', () => {
			const ctx = createMockDrawContext();
			const clip = new Clip(defaultOptions({ displayContext: ctx }));

			clip.play();
			expect(ctx.drawImage).toHaveBeenCalled();

			ctx.drawImage.mockClear();
			clip.destroy();
			clip.play();

			expect(ctx.drawImage).not.toHaveBeenCalled();
		});
	});

	describe('BPM sync mode (frameDurationBeats)', () => {
		test('accepts frameDurationBeats as single number and uses BPM sync', async () => {
			const ctx = createMockDrawContext();
			// Import appState to set BPM
			const appState = (await import('../src/js/core/AppState.js')).default;
			appState.bpm = 120; // 120 BPM

			const clip = new Clip(
				defaultOptions({
					displayContext: ctx,
					frames: 4,
					framesPerRow: 4,
					frameDurationBeats: 0.5 // Half beat per frame = 250ms at 120 BPM
				})
			);

			// t=0 -> initial draw (frame 0)
			clip.play(0);
			expect(ctx.drawImage).toHaveBeenCalledTimes(1);

			// t=249ms -> should still be on frame 0
			clip.play(249);
			expect(ctx.drawImage.mock.calls.at(-1)[1]).toBe(0); // sx=0 for frame 0

			// t=250ms -> should advance to frame 1
			clip.play(250);
			// Frame 1: sx = 60 (240px width / 4 frames)
			expect(ctx.drawImage.mock.calls.at(-1)[1]).toBe(60);
		});

		test('accepts frameDurationBeats as array with per-frame values', async () => {
			const ctx = createMockDrawContext();
			const appState = (await import('../src/js/core/AppState.js')).default;
			appState.bpm = 120; // 120 BPM

			const clip = new Clip(
				defaultOptions({
					displayContext: ctx,
					frames: 4,
					framesPerRow: 4,
					// Frame 0: 0.25 beat (125ms), Frame 1: 0.5 beat (250ms), etc.
					frameDurationBeats: [0.25, 0.5, 0.25, 0.5]
				})
			);

			// t=0 -> initial draw (frame 0)
			clip.play(0);
			expect(ctx.drawImage.mock.calls.at(-1)[1]).toBe(0);

			// t=125ms -> should advance to frame 1
			clip.play(125);
			expect(ctx.drawImage.mock.calls.at(-1)[1]).toBe(60); // Frame 1

			// t=375ms -> should advance to frame 2 (125 + 250 = 375)
			clip.play(375);
			expect(ctx.drawImage.mock.calls.at(-1)[1]).toBe(120); // Frame 2
		});

		test('responds to BPM changes during playback', async () => {
			const ctx = createMockDrawContext();
			const appState = (await import('../src/js/core/AppState.js')).default;
			appState.bpm = 60; // Start at 60 BPM (0.5 beat = 500ms)

			const clip = new Clip(
				defaultOptions({
					displayContext: ctx,
					frames: 4,
					framesPerRow: 4,
					frameDurationBeats: 0.5
				})
			);

			// t=0 -> frame 0
			clip.play(0);
			expect(ctx.drawImage.mock.calls.at(-1)[1]).toBe(0);

			// t=499ms at 60 BPM -> still frame 0 (need 500ms)
			clip.play(499);
			expect(ctx.drawImage.mock.calls.at(-1)[1]).toBe(0);

			// Reset appState to 120 BPM for other tests
			appState.bpm = 120;
		});

		test('throws when frameDurationBeats is invalid (no fallback)', async () => {
			const ctx = createMockDrawContext();

			expect(
				() =>
					new Clip(
						defaultOptions({
							displayContext: ctx,
							frames: 2,
							framesPerRow: 2,
							frameDurationBeats: 'invalid', // Invalid value
							frameRatesForFrames: { 0: 1000 } // would be used previously
						})
					)
			).toThrow('invalid frameDurationBeats');
		});

		test('frameDurationBeats takes priority over frameRatesForFrames', async () => {
			const ctx = createMockDrawContext();
			const appState = (await import('../src/js/core/AppState.js')).default;
			appState.bpm = 120;

			const clip = new Clip(
				defaultOptions({
					displayContext: ctx,
					frames: 2,
					framesPerRow: 2,
					frameDurationBeats: 0.5, // 250ms at 120 BPM
					frameRatesForFrames: { 0: 1000 } // Would be 1ms if used
				})
			);

			// t=0 -> frame 0
			clip.play(0);

			// t=10ms -> if FPS were used, would advance. With BPM sync, stays on frame 0
			clip.play(10);
			expect(ctx.drawImage.mock.calls.at(-1)[1]).toBe(0); // Still frame 0

			// t=250ms -> BPM sync advances
			clip.play(250);
			expect(ctx.drawImage.mock.calls.at(-1)[1]).toBe(120); // Frame 1
		});
	});
});
