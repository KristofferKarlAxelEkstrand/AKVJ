import { describe, test, expect } from 'vitest';
import { buildVelocityCache, findVelocityThreshold, resolveAnimationClip } from '../src/js/utils/velocitySelection.js';

describe('findVelocityThreshold', () => {
	test('returns highest threshold not exceeding velocity', () => {
		const velocities = [0, 40, 80];
		expect(findVelocityThreshold(velocities, 30)).toBe(0);
		expect(findVelocityThreshold(velocities, 40)).toBe(40);
		expect(findVelocityThreshold(velocities, 60)).toBe(40);
		expect(findVelocityThreshold(velocities, 127)).toBe(80);
	});

	test('returns null when velocity is below all thresholds', () => {
		expect(findVelocityThreshold([40, 80], 30)).toBe(null);
	});

	test('returns null for empty or missing velocities', () => {
		expect(findVelocityThreshold([], 100)).toBe(null);
		expect(findVelocityThreshold(null, 100)).toBe(null);
	});
});

describe('resolveAnimationClip', () => {
	const notesData = {
		60: { 0: 'clip-low', 64: 'clip-high' }
	};

	test('resolves clip for exact velocity thresholds', () => {
		const cache = buildVelocityCache(notesData);
		expect(resolveAnimationClip(notesData, 60, 0, cache)).toBe('clip-low');
		expect(resolveAnimationClip(notesData, 60, 63, cache)).toBe('clip-low');
		expect(resolveAnimationClip(notesData, 60, 64, cache)).toBe('clip-high');
		expect(resolveAnimationClip(notesData, 60, 127, cache)).toBe('clip-high');
	});

	test('returns null when velocity is below all thresholds', () => {
		const cache = buildVelocityCache(notesData);
		expect(resolveAnimationClip(notesData, 60, -1, cache)).toBe(null);
	});

	test('returns null when note has no clips', () => {
		const cache = buildVelocityCache(notesData);
		expect(resolveAnimationClip(notesData, 61, 100, cache)).toBe(null);
	});

	test('returns null when velocity threshold points to missing clip', () => {
		const cache = buildVelocityCache(notesData);
		const partial = { 60: { 0: 'clip-low' } };
		expect(resolveAnimationClip(partial, 60, 64, cache)).toBe(null);
	});
});
