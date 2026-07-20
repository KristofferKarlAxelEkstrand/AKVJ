import { describe, test, expect } from 'vitest';
import { snapToPixel } from '../src/js/utils/snapToPixel.js';

describe('snapToPixel', () => {
	test('floors values properly for canvas rendering', () => {
		expect(snapToPixel(10.9)).toBe(10);
		expect(snapToPixel(-5.1)).toBe(-6);
		expect(snapToPixel(7)).toBe(7);
		expect(snapToPixel(0)).toBe(0);
	});
});
