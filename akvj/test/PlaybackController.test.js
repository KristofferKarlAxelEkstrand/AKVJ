import { describe, test, expect, vi } from 'vitest';
import PlaybackController from '../src/js/visuals/PlaybackController.js';

describe('PlaybackController', () => {
	describe('pingpong', () => {
		test('reverses direction at top boundary', () => {
			const playback = new PlaybackController({ frames: 4, playback: 'pingpong' });
			expect(playback.frame).toBe(0);
			playback.advance(); // 1
			playback.advance(); // 2
			playback.advance(); // 3 (top)
			expect(playback.frame).toBe(3);
			playback.advance(); // direction flipped, move to 2
			expect(playback.frame).toBe(2);
		});

		test('reverses direction at bottom boundary', () => {
			const playback = new PlaybackController({ frames: 3, playback: 'pingpong' });
			playback.advance(); // 1
			playback.advance(); // 2 (top, flip to -1)
			playback.advance(); // 1
			playback.advance(); // 0 (bottom, flip to +1)
			expect(playback.frame).toBe(0);
			playback.advance();
			expect(playback.frame).toBe(1);
		});

		test('multiple advances traverse back and forth', () => {
			const playback = new PlaybackController({ frames: 3, playback: 'pingpong' });
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
			const playback = new PlaybackController({ frames: 10, playback: 'random' });
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
			const playback = new PlaybackController({ frames: 5, playback: 'reverse' });
			expect(playback.frame).toBe(4);
		});

		test('wraps from frame 0 back to frames-1', () => {
			const playback = new PlaybackController({ frames: 3, playback: 'reverse' });
			expect(playback.frame).toBe(2);
			playback.advance(); // 1
			playback.advance(); // 0
			playback.advance(); // wrap → 2
			expect(playback.frame).toBe(2);
		});

		test('reset() restores frame to frames-1', () => {
			const playback = new PlaybackController({ frames: 4, playback: 'reverse' });
			playback.advance();
			playback.advance();
			playback.reset();
			expect(playback.frame).toBe(3);
			expect(playback.isFinished).toBe(false);
		});
	});

	describe('scrub', () => {
		test('setScrubPosition maps 0 / 0.5 / 1 to frame indices', () => {
			const playback = new PlaybackController({ frames: 5, playback: 'scrub' });
			playback.setScrubPosition(0);
			expect(playback.frame).toBe(0);
			playback.setScrubPosition(1);
			expect(playback.frame).toBe(4);
			playback.setScrubPosition(0.5);
			expect(playback.frame).toBe(2);
		});

		test('clamps out-of-range scrub values', () => {
			const playback = new PlaybackController({ frames: 5, playback: 'scrub' });
			playback.setScrubPosition(-0.5);
			expect(playback.frame).toBe(0);
			playback.setScrubPosition(1.5);
			expect(playback.frame).toBe(4);
		});

		test('setScrubPosition is a no-op outside scrub mode', () => {
			const playback = new PlaybackController({ frames: 5, playback: 'loop' });
			playback.setScrubPosition(1);
			expect(playback.frame).toBe(0);
		});

		test('advance() always returns true and does not change frame', () => {
			const playback = new PlaybackController({ frames: 5, playback: 'scrub' });
			playback.setScrubPosition(0.5);
			expect(playback.advance()).toBe(true);
			expect(playback.frame).toBe(2);
		});
	});

	describe('setLinearProgress', () => {
		test('loop: maps progress directly to frame index, never finishes', () => {
			const playback = new PlaybackController({ frames: 4, playback: 'loop' });
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
			const playback = new PlaybackController({ frames: 4, playback: 'once' });
			playback.setLinearProgress(0);
			expect(playback.frame).toBe(0);
			expect(playback.isFinished).toBe(false);
			playback.setLinearProgress(1);
			expect(playback.frame).toBe(3);
			expect(playback.isFinished).toBe(true);
		});

		test('reverse: flips the linear index and finishes at progress 1', () => {
			const playback = new PlaybackController({ frames: 4, playback: 'reverse' });
			playback.setLinearProgress(0);
			expect(playback.frame).toBe(3);
			expect(playback.isFinished).toBe(false);
			playback.setLinearProgress(1);
			expect(playback.frame).toBe(0);
			expect(playback.isFinished).toBe(true);
		});

		test('pingpong: progress 0 starts at frame 0, 0.5 lands on the last frame, 1 returns to frame 0 and finishes', () => {
			const playback = new PlaybackController({ frames: 4, playback: 'pingpong' });
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
			const playback = new PlaybackController({ frames: 5, playback: 'pingpong' });
			playback.setLinearProgress(0.2); // position 1.6 of span 8 (forward leg)
			expect(playback.frame).toBe(2);
			playback.setLinearProgress(0.6); // position 4.8 of span 8 (backward leg)
			expect(playback.frame).toBe(3);
		});

		test('clamps out-of-range progress values', () => {
			const playback = new PlaybackController({ frames: 4, playback: 'loop' });
			playback.setLinearProgress(-0.5);
			expect(playback.frame).toBe(0);
			playback.setLinearProgress(1.5);
			expect(playback.frame).toBe(3);
		});

		test('throws for random and shuffle modes rather than silently no-oping', () => {
			const randomPlayback = new PlaybackController({ frames: 4, playback: 'random' });
			expect(() => randomPlayback.setLinearProgress(0.5)).toThrow();

			const shufflePlayback = new PlaybackController({ frames: 4, playback: 'shuffle' });
			expect(() => shufflePlayback.setLinearProgress(0.5)).toThrow();
		});
	});

	describe('playbackMode', () => {
		test('playbackMode getter returns constructor mode', () => {
			expect(new PlaybackController({ frames: 2, playback: 'shuffle' }).playbackMode).toBe('shuffle');
		});
	});
});
