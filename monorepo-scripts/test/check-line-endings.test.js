import { describe, test, expect } from 'vitest';
import { normalizeToLF } from '../check-line-endings.js';

describe('normalizeToLF', () => {
	test('converts CRLF to LF', () => {
		expect(normalizeToLF('a\r\nb\r\n')).toBe('a\nb\n');
	});

	test('converts bare CR to LF', () => {
		expect(normalizeToLF('a\rb\r')).toBe('a\nb\n');
	});

	test('preserves LF', () => {
		expect(normalizeToLF('a\nb\n')).toBe('a\nb\n');
	});

	test('handles mixed line endings', () => {
		expect(normalizeToLF('a\r\nb\rc\nd')).toBe('a\nb\nc\nd');
	});
});
