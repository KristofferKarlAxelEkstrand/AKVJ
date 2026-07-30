import { describe, test, expect, vi } from 'vitest';
import PlaybackController from '../src/js/visuals/PlaybackController.js';

describe('PlaybackController', () => {
	describe('once', () => {
		test('advances to last frame then finishes and stays finished', () => {
			const playback = new PlaybackController({ frameCount: 3, playbackMode: 'once' });
			expect(playback.frame).toBe(0);
			expect(playback.isFinished).toBe(false);

			expect(playback.advance()).toBe(true);
			expect(playback.frame).toBe(1);
			expect(playback.isFinished).toBe(false);

			expect(playback.advance()).toBe(true);
			expect(playback.frame).toBe(2);
			expect(playback.isFinished).toBe(false);

			expect(playback.advance()).toBe(false);
			expect(playback.frame).toBe(2);
			expect(playback.isFinished).toBe(true);

			expect(playback.advance()).toBe(false);
			expect(playback.frame).toBe(2);
			expect(playback.isFinished).toBe(true);
		});
	});

	describe('loop', () => {
		test('wraps from last frame back to 0 and always returns true', () => {
			const playback = new PlaybackController({ frameCount: 3, playbackMode: 'loop' });
			expect(playback.frame).toBe(0);

			expect(playback.advance()).toBe(true);
			expect(playback.frame).toBe(1);
			expect(playback.advance()).toBe(true);
			expect(playback.frame).toBe(2);
			expect(playback.advance()).toBe(true);
			expect(playback.frame).toBe(0);
			expect(playback.isFinished).toBe(false);
		});

		test('single-frame loop stays on frame 0', () => {
			const playback = new PlaybackController({ frameCount: 1, playbackMode: 'loop' });
			expect(playback.frame).toBe(0);
			expect(playback.advance()).toBe(true);
			expect(playback.frame).toBe(0);
			expect(playback.advance()).toBe(true);
			expect(playback.frame).toBe(0);
		});
	});

	describe('shuffle', () => {
		test('plays every frame exactly once before any frame repeats', () => {
			const randomSpy = vi.spyOn(Math, 'random').mockReturnValue(0);
			const playback = new PlaybackController({ frameCount: 5, playbackMode: 'shuffle' });
			const seen = [];
			for (let i = 0; i < 5; i++) {
				expect(playback.advance()).toBe(true);
				seen.push(playback.frame);
			}
			expect(new Set(seen).size).toBe(5);
			expect([...seen].sort((a, b) => a - b)).toEqual([0, 1, 2, 3, 4]);
			randomSpy.mockRestore();
		});

		test('does not use last frame of one cycle as first frame of the next', () => {
			// Fisher–Yates with Math.random always 0 yields identity order;
			// pop() plays high→low, so cycle ends on 0. Next pool would also
			// end-of-build (first-to-pop) as 0 unless anti-repeat swaps it.
			const randomSpy = vi.spyOn(Math, 'random').mockReturnValue(0);
			const playback = new PlaybackController({ frameCount: 4, playbackMode: 'shuffle' });
			const seen = [];
			for (let i = 0; i < 8; i++) {
				playback.advance();
				seen.push(playback.frame);
			}
			for (let i = 1; i < seen.length; i++) {
				expect(seen[i]).not.toBe(seen[i - 1]);
			}
			// Explicit cycle boundary: last of first pool vs first of second
			expect(seen[4]).not.toBe(seen[3]);
			randomSpy.mockRestore();
		});

		test('single-frame shuffle always stays on frame 0', () => {
			const playback = new PlaybackController({ frameCount: 1, playbackMode: 'shuffle' });
			expect(playback.advance()).toBe(true);
			expect(playback.frame).toBe(0);
			expect(playback.advance()).toBe(true);
			expect(playback.frame).toBe(0);
		});

		test('reset() clears the unplayed shuffle pool', () => {
			const randomSpy = vi.spyOn(Math, 'random').mockReturnValue(0);
			const playback = new PlaybackController({ frameCount: 4, playbackMode: 'shuffle' });
			playback.advance();
			playback.advance();
			const midFrame = playback.frame;

			playback.reset();
			expect(playback.frame).toBe(0);
			expect(playback.isFinished).toBe(false);

			// Fresh full pool after reset — all frames appear once
			const seen = [];
			for (let i = 0; i < 4; i++) {
				playback.advance();
				seen.push(playback.frame);
			}
			expect(new Set(seen).size).toBe(4);
			expect([...seen].sort((a, b) => a - b)).toEqual([0, 1, 2, 3]);
			// Pool was rebuilt (not resumed mid-cycle leftover of size 2)
			expect(seen).toHaveLength(4);
			expect(midFrame).toBeDefined();
			randomSpy.mockRestore();
		});
	});

	describe('pingpong', () => {
		test('reverses direction at top boundary', () => {
			const playback = new PlaybackController({ frameCount: 4, playbackMode: 'pingpong' });
			expect(playback.frame).toBe(0);
			playback.advance(); // 1
			playback.advance(); // 2
			playback.advance(); // 3 (top)
			expect(playback.frame).toBe(3);
			playback.advance(); // direction flipped, move to 2
			expect(playback.frame).toBe(2);
		});

		test('reverses direction at bottom boundary', () => {
			const playback = new PlaybackController({ frameCount: 3, playbackMode: 'pingpong' });
			playback.advance(); // 1
			playback.advance(); // 2 (top, flip to -1)
			playback.advance(); // 1
			playback.advance(); // 0 (bottom, flip to +1)
			expect(playback.frame).toBe(0);
			playback.advance();
			expect(playback.frame).toBe(1);
		});

		test('multiple advances traverse back and forth', () => {
			const playback = new PlaybackController({ frameCount: 3, playbackMode: 'pingpong' });
			const frames = [];
			for (let i = 0; i < 8; i++) {
				playback.advance();
				frames.push(playback.frame);
			}
			expect(frames).toEqual([1, 2, 1, 0, 1, 2, 1, 0]);
		});
	});

	describe('random', () => {
		test('returns a frame in [0, frames-1] with mocked Math.random', () => {
			const randomSpy = vi.spyOn(Math, 'random').mockReturnValue(0.99);
			const playback = new PlaybackController({ frameCount: 10, playbackMode: 'random' });
			expect(playback.advance()).toBe(true);
			expect(playback.frame).toBe(9);
			randomSpy.mockReturnValue(0);
			playback.advance();
			expect(playback.frame).toBe(0);
			randomSpy.mockRestore();
		});
	});

	describe('reverse', () => {
		test('starts at frames-1', () => {
			const playback = new PlaybackController({ frameCount: 5, playbackMode: 'reverse' });
			expect(playback.frame).toBe(4);
		});

		test('wraps from frame 0 back to frames-1', () => {
			const playback = new PlaybackController({ frameCount: 3, playbackMode: 'reverse' });
			expect(playback.frame).toBe(2);
			playback.advance(); // 1
			playback.advance(); // 0
			playback.advance(); // wrap → 2
			expect(playback.frame).toBe(2);
		});

		test('reset() restores frame to frames-1', () => {
			const playback = new PlaybackController({ frameCount: 4, playbackMode: 'reverse' });
			playback.advance();
			playback.advance();
			playback.reset();
			expect(playback.frame).toBe(3);
			expect(playback.isFinished).toBe(false);
		});
	});

	describe('scrub', () => {
		test('setScrubPosition maps 0 / 0.5 / 1 to frame indices', () => {
			const playback = new PlaybackController({ frameCount: 5, playbackMode: 'scrub' });
			playback.setScrubPosition(0);
			expect(playback.frame).toBe(0);
			playback.setScrubPosition(1);
			expect(playback.frame).toBe(4);
			playback.setScrubPosition(0.5);
			expect(playback.frame).toBe(2);
		});

		test('clamps out-of-range scrub values', () => {
			const playback = new PlaybackController({ frameCount: 5, playbackMode: 'scrub' });
			playback.setScrubPosition(-0.5);
			expect(playback.frame).toBe(0);
			playback.setScrubPosition(1.5);
			expect(playback.frame).toBe(4);
		});

		test('setScrubPosition is a no-op outside scrub mode', () => {
			const playback = new PlaybackController({ frameCount: 5, playbackMode: 'loop' });
			playback.setScrubPosition(1);
			expect(playback.frame).toBe(0);
		});

		test('advance() always returns true and does not change frame', () => {
			const playback = new PlaybackController({ frameCount: 5, playbackMode: 'scrub' });
			playback.setScrubPosition(0.5);
			expect(playback.advance()).toBe(true);
			expect(playback.frame).toBe(2);
		});
	});

	describe('setLinearProgress', () => {
		test('loop: maps progress directly to frame index, never finishes', () => {
			const playback = new PlaybackController({ frameCount: 4, playbackMode: 'loop' });
			playback.setLinearProgress(0);
			expect(playback.frame).toBe(0);
			expect(playback.isFinished).toBe(false);
			playback.setLinearProgress(0.5);
			expect(playback.frame).toBe(2);
			playback.setLinearProgress(1);
			expect(playback.frame).toBe(3);
			expect(playback.isFinished).toBe(false);
		});

		test('once: maps progress directly to frame index and finishes at progress 1', () => {
			const playback = new PlaybackController({ frameCount: 4, playbackMode: 'once' });
			playback.setLinearProgress(0);
			expect(playback.frame).toBe(0);
			expect(playback.isFinished).toBe(false);
			playback.setLinearProgress(1);
			expect(playback.frame).toBe(3);
			expect(playback.isFinished).toBe(true);
		});

		test('reverse: flips the linear index and finishes at progress 1', () => {
			const playback = new PlaybackController({ frameCount: 4, playbackMode: 'reverse' });
			playback.setLinearProgress(0);
			expect(playback.frame).toBe(3);
			expect(playback.isFinished).toBe(false);
			playback.setLinearProgress(1);
			expect(playback.frame).toBe(0);
			expect(playback.isFinished).toBe(true);
		});

		test('pingpong: progress 0 starts at frame 0, 0.5 lands on the last frame, 1 returns to frame 0 and finishes', () => {
			const playback = new PlaybackController({ frameCount: 4, playbackMode: 'pingpong' });
			playback.setLinearProgress(0);
			expect(playback.frame).toBe(0);
			expect(playback.isFinished).toBe(false);
			playback.setLinearProgress(0.5);
			expect(playback.frame).toBe(3);
			expect(playback.isFinished).toBe(false);
			playback.setLinearProgress(1);
			expect(playback.frame).toBe(0);
			expect(playback.isFinished).toBe(true);
		});

		test('pingpong: interpolates within the forward and backward legs', () => {
			const playback = new PlaybackController({ frameCount: 5, playbackMode: 'pingpong' });
			playback.setLinearProgress(0.2); // position 1.6 of span 8 (forward leg)
			expect(playback.frame).toBe(2);
			playback.setLinearProgress(0.6); // position 4.8 of span 8 (backward leg)
			expect(playback.frame).toBe(3);
		});

		test('clamps out-of-range progress values', () => {
			const playback = new PlaybackController({ frameCount: 4, playbackMode: 'loop' });
			playback.setLinearProgress(-0.5);
			expect(playback.frame).toBe(0);
			playback.setLinearProgress(1.5);
			expect(playback.frame).toBe(3);
		});

		test('throws for random and shuffle modes rather than silently no-oping', () => {
			const randomPlayback = new PlaybackController({ frameCount: 4, playbackMode: 'random' });
			expect(() => randomPlayback.setLinearProgress(0.5)).toThrow();

			const shufflePlayback = new PlaybackController({ frameCount: 4, playbackMode: 'shuffle' });
			expect(() => shufflePlayback.setLinearProgress(0.5)).toThrow();
		});
	});

	describe('playbackMode', () => {
		test('playbackMode getter returns constructor mode', () => {
			expect(new PlaybackController({ frameCount: 2, playbackMode: 'shuffle' }).playbackMode).toBe('shuffle');
		});
	});
});
