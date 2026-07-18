import { describe, test, expect } from 'vitest';
import { isValidClipId, editClipPath, resolveClipEditRoute } from '../src/js/clipEditorRoute.js';

describe('clipEditorRoute', () => {
	test('isValidClipId accepts uuid-style and legacy ids', () => {
		expect(isValidClipId('neon-skull')).toBe(true);
		expect(isValidClipId('c1-n0-v0')).toBe(true);
		expect(isValidClipId('a1b2c3d4-e5f6-7890-abcd-ef1234567890')).toBe(true);
	});

	test('isValidClipId rejects malformed ids', () => {
		expect(isValidClipId('')).toBe(false);
		expect(isValidClipId('../evil')).toBe(false);
		expect(isValidClipId('123')).toBe(false);
		expect(isValidClipId('-leading')).toBe(false);
	});

	test('editClipPath encodes the clip id', () => {
		expect(editClipPath('neon-skull')).toBe('/clip/edit/neon-skull');
		expect(editClipPath('a/b')).toBe('/clip/edit/a%2Fb');
	});

	test('resolveClipEditRoute returns new for empty id', () => {
		expect(resolveClipEditRoute('')).toEqual({ action: 'new' });
		expect(resolveClipEditRoute(null)).toEqual({ action: 'new' });
	});

	test('resolveClipEditRoute returns edit for valid id', () => {
		expect(resolveClipEditRoute('neon-skull')).toEqual({ action: 'edit', clipId: 'neon-skull' });
	});

	test('resolveClipEditRoute returns invalid with message for bad id', () => {
		const result = resolveClipEditRoute('../evil');
		expect(result.action).toBe('invalid');
		expect(result.message).toMatch(/Invalid clip ID/i);
	});
});
