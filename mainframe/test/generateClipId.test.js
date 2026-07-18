import { describe, expect, it } from 'vitest';
import { generateClipId, slugifyClipName } from '../src/js/generateClipId.js';
import { isValidClipId } from '../shared/clipId.js';

describe('slugifyClipName', () => {
	it('slugifies with hyphens and folds diacritics', () => {
		expect(slugifyClipName('My really nice clip')).toBe('my-really-nice-clip');
		expect(slugifyClipName('Jag är bäst')).toBe('jag-ar-bast');
		expect(slugifyClipName('Neon Skull!')).toBe('neon-skull');
	});

	it('collapses whitespace and trims hyphens', () => {
		expect(slugifyClipName('  my   clip  ')).toBe('my-clip');
		expect(slugifyClipName('a -- b')).toBe('a-b');
	});

	it('strips disallowed characters', () => {
		expect(slugifyClipName('A_B-C')).toBe('ab-c');
		expect(slugifyClipName('hello@world')).toBe('helloworld');
	});
});

describe('generateClipId', () => {
	it('returns a 4-character alphanumeric id when no name is given', () => {
		const id = generateClipId();
		expect(id).toHaveLength(4);
		expect(id).toMatch(/^[a-z0-9]+$/);
		expect(isValidClipId(id)).toBe(true);
	});

	it('never returns an all-digit id for the random path', () => {
		const random = () => 0.99;
		for (let i = 0; i < 40; i++) {
			expect(generateClipId({ random })).not.toMatch(/^\d+$/);
			expect(isValidClipId(generateClipId({ random }))).toBe(true);
		}
	});

	it('avoids existing random ids by regenerating / growing length', () => {
		const first = generateClipId({ random: () => 0 });
		const second = generateClipId({ existingIds: [first], random: () => 0, maxAttemptsPerLength: 3 });
		expect(second).not.toBe(first);
		expect(isValidClipId(second)).toBe(true);
	});

	it('derives the full slug from a clip name', () => {
		expect(generateClipId({ name: 'Neon Skull' })).toBe('neon-skull');
		expect(generateClipId({ name: 'My really nice clip' })).toBe('my-really-nice-clip');
		expect(generateClipId({ name: 'Jag är bäst' })).toBe('jag-ar-bast');
	});

	it('appends -2, -3, … on name-slug collisions', () => {
		expect(generateClipId({ name: 'My clip', existingIds: ['my-clip'] })).toBe('my-clip-2');
		expect(generateClipId({ name: 'my  clip', existingIds: ['my-clip', 'my-clip-2'] })).toBe('my-clip-3');
	});

	it('accepts clip objects from mainframeState.clips as existingIds', () => {
		const id = generateClipId({
			name: 'Taken',
			existingIds: [{ clipId: 'taken' }]
		});
		expect(id).toBe('taken-2');
	});

	it('prefixes all-digit slugs so the id stays valid', () => {
		expect(generateClipId({ name: '1234' })).toBe('id-1234');
		expect(isValidClipId(generateClipId({ name: '9999' }))).toBe(true);
	});
});
