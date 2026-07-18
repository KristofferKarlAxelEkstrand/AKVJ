// @vitest-environment node

import { describe, test, expect, vi, afterEach } from 'vitest';
import { ShuffleState, PingpongState, advanceFrame } from '../src/js/playbackUtils.js';

describe('ShuffleState', () => {
	afterEach(() => {
		vi.restoreAllMocks();
	});

	test('next() returns indices in range and visits all frames before reshuffle', () => {
		vi.spyOn(Math, 'random').mockReturnValue(0);
		const shuffle = new ShuffleState(4);
		const firstCycle = [shuffle.next(), shuffle.next(), shuffle.next(), shuffle.next()];
		expect(firstCycle).toHaveLength(4);
		expect(new Set(firstCycle)).toEqual(new Set([0, 1, 2, 3]));
		for (const frame of firstCycle) {
			expect(frame).toBeGreaterThanOrEqual(0);
			expect(frame).toBeLessThan(4);
		}
		const afterReshuffle = shuffle.next();
		expect(afterReshuffle).toBeGreaterThanOrEqual(0);
		expect(afterReshuffle).toBeLessThan(4);
	});

	test('reset() reshuffles and restarts the cycle', () => {
		vi.spyOn(Math, 'random').mockReturnValue(0);
		const shuffle = new ShuffleState(3);
		shuffle.next();
		shuffle.reset();
		const cycle = [shuffle.next(), shuffle.next(), shuffle.next()];
		expect(new Set(cycle)).toEqual(new Set([0, 1, 2]));
	});

	test('single-frame shuffle always returns 0', () => {
		const shuffle = new ShuffleState(1);
		expect(shuffle.next()).toBe(0);
		expect(shuffle.next()).toBe(0);
	});
});

describe('PingpongState', () => {
	test('bounces forward then reverse at endpoints', () => {
		const pingpong = new PingpongState();
		expect(pingpong.next(0, 4)).toBe(1);
		expect(pingpong.next(1, 4)).toBe(2);
		expect(pingpong.next(2, 4)).toBe(3);
		expect(pingpong.next(3, 4)).toBe(2);
		expect(pingpong.next(2, 4)).toBe(1);
		expect(pingpong.next(1, 4)).toBe(0);
		expect(pingpong.next(0, 4)).toBe(1);
	});

	test('reset() restores forward direction', () => {
		const pingpong = new PingpongState();
		pingpong.next(2, 3);
		pingpong.next(2, 3);
		pingpong.reset();
		expect(pingpong.next(0, 3)).toBe(1);
	});

	test('single-frame pingpong stays on 0', () => {
		const pingpong = new PingpongState();
		expect(pingpong.next(0, 1)).toBe(0);
		expect(pingpong.next(0, 1)).toBe(0);
	});
});

describe('advanceFrame', () => {
	afterEach(() => {
		vi.restoreAllMocks();
	});

	test('reverse wraps downward', () => {
		expect(advanceFrame(0, 4, 'reverse')).toEqual({ frame: 3, finished: false });
		expect(advanceFrame(2, 4, 'reverse')).toEqual({ frame: 1, finished: false });
	});

	test('random picks within range', () => {
		vi.spyOn(Math, 'random').mockReturnValue(0.5);
		expect(advanceFrame(0, 4, 'random')).toEqual({ frame: 2, finished: false });
	});

	test('shuffle uses ShuffleState when provided', () => {
		const shuffleState = { next: vi.fn(() => 7) };
		expect(advanceFrame(0, 8, 'shuffle', shuffleState)).toEqual({ frame: 7, finished: false });
		expect(shuffleState.next).toHaveBeenCalledOnce();
	});

	test('shuffle without state falls back to random', () => {
		vi.spyOn(Math, 'random').mockReturnValue(0.25);
		expect(advanceFrame(0, 4, 'shuffle')).toEqual({ frame: 1, finished: false });
	});

	test('once advances then finishes on last frame', () => {
		expect(advanceFrame(0, 3, 'once')).toEqual({ frame: 1, finished: false });
		expect(advanceFrame(1, 3, 'once')).toEqual({ frame: 2, finished: false });
		expect(advanceFrame(2, 3, 'once')).toEqual({ frame: 2, finished: true });
	});

	test('pingpong uses PingpongState when provided', () => {
		const pingpongState = { next: vi.fn(() => 2) };
		expect(advanceFrame(1, 4, 'pingpong', undefined, pingpongState)).toEqual({ frame: 2, finished: false });
		expect(pingpongState.next).toHaveBeenCalledWith(1, 4);
	});

	test('pingpong without state advances until last frame', () => {
		expect(advanceFrame(0, 3, 'pingpong')).toEqual({ frame: 1, finished: false });
		expect(advanceFrame(1, 3, 'pingpong')).toEqual({ frame: 2, finished: false });
		expect(advanceFrame(2, 3, 'pingpong')).toEqual({ frame: 2, finished: false });
	});

	test('loop and scrub wrap forward', () => {
		expect(advanceFrame(2, 3, 'loop')).toEqual({ frame: 0, finished: false });
		expect(advanceFrame(2, 3, 'scrub')).toEqual({ frame: 0, finished: false });
	});

	test('unknown mode defaults to loop wrap', () => {
		expect(advanceFrame(1, 2, 'unknown')).toEqual({ frame: 0, finished: false });
	});
});
