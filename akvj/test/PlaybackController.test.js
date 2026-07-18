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

	describe('finish / clearFinished / playbackMode', () => {
		test('finish and clearFinished toggle isFinished', () => {
			const playback = new PlaybackController({ frames: 3, playback: 'loop' });
			expect(playback.isFinished).toBe(false);
			playback.finish();
			expect(playback.isFinished).toBe(true);
			playback.clearFinished();
			expect(playback.isFinished).toBe(false);
		});

		test('playbackMode getter returns constructor mode', () => {
			expect(new PlaybackController({ frames: 2, playback: 'shuffle' }).playbackMode).toBe('shuffle');
		});
	});
});
