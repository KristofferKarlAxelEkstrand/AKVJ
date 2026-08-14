import { describe, expect, it } from 'vitest';
import { slugifyPathSegment } from '../shared/slugify.js';

describe('slugifyPathSegment', () => {
	it('slugifies with hyphens and folds diacritics', () => {
		expect(slugifyPathSegment('My really nice clip')).toBe('my-really-nice-clip');
		expect(slugifyPathSegment('Jag \u00e4r b\u00e4st')).toBe('jag-ar-bast');
		expect(slugifyPathSegment('København Æblegrød straße')).toBe(
			'kobenhavn-aeblegrod-strasse',
		);
		expect(slugifyPathSegment('Neon Skull!')).toBe('neon-skull');
	});

	it('collapses whitespace and trims hyphens', () => {
		expect(slugifyPathSegment('  my   clip  ')).toBe('my-clip');
		expect(slugifyPathSegment('a -- b')).toBe('a-b');
	});

	it('treats underscores as word separators', () => {
		expect(slugifyPathSegment('A_B-C')).toBe('a-b-c');
	});

	it('strips disallowed characters', () => {
		expect(slugifyPathSegment('hello@world')).toBe('helloworld');
	});

	it('returns an empty string for empty input', () => {
		expect(slugifyPathSegment('')).toBe('');
		expect(slugifyPathSegment(null)).toBe('');
		expect(slugifyPathSegment(undefined)).toBe('');
	});
});
