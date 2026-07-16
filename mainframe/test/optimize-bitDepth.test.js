import { describe, test, expect, vi } from 'vitest';
import { getTargetBitDepth } from '../scripts/clips/lib/optimize.js';

describe('getTargetBitDepth', () => {
	test('uses explicit bitDepth when valid', () => {
		expect(getTargetBitDepth('any-clip', { bitDepth: 4 })).toBe(4);
		expect(getTargetBitDepth('any-clip', { bitDepth: 1, role: 'bitmask' })).toBe(1);
	});

	test('defaults bitmask role to 1-bit', () => {
		expect(getTargetBitDepth('mask-clip', { role: 'bitmask' })).toBe(1);
	});

	test('returns null for regular clips', () => {
		expect(getTargetBitDepth('neon-skull', {})).toBeNull();
		expect(getTargetBitDepth('neon-skull', null)).toBeNull();
	});

	test('ignores invalid bitDepth and falls through to role', () => {
		const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
		expect(getTargetBitDepth('mask-clip', { bitDepth: 3, role: 'bitmask' })).toBe(1);
		expect(warn).toHaveBeenCalled();
		warn.mockRestore();
	});
});
