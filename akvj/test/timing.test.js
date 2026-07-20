import { describe, test, expect } from 'vitest';
import { MS_PER_MINUTE, msPerBeat } from '../src/js/utils/timing.js';

describe('timing helpers', () => {
	test('MS_PER_MINUTE is exactly 60000', () => {
		expect(MS_PER_MINUTE).toBe(60000);
	});

	test('msPerBeat calculates milliseconds correctly', () => {
		expect(msPerBeat(60)).toBe(1000);
		expect(msPerBeat(120)).toBe(500);
		expect(msPerBeat(100)).toBe(600);
	});
});
