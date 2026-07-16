import { describe, expect, test } from 'vitest';
import { parseFrontMatter, serializeFrontMatter } from '../lib/frontMatter.js';

describe('frontMatter', () => {
	test('round-trips meta and body', () => {
		const original = serializeFrontMatter({ title: 'Note On Reference', pages: 12, unofficial: true }, '# Body\n\nText.');
		const { meta, body } = parseFrontMatter(original);
		expect(meta.title).toBe('Note On Reference');
		expect(meta.pages).toBe(12);
		expect(meta.unofficial).toBe(true);
		expect(body).toContain('# Body');
	});

	test('skips undefined and empty values when serializing', () => {
		const text = serializeFrontMatter({ title: 'X', docId: undefined, version: '' }, 'body');
		expect(text).not.toContain('docId');
		expect(text).not.toContain('version');
	});

	test('handles documents without front-matter', () => {
		const { meta, body } = parseFrontMatter('# Just a doc\n\nContent.');
		expect(meta).toEqual({});
		expect(body).toBe('# Just a doc\n\nContent.');
	});

	test('keeps colons inside values intact', () => {
		const { meta } = parseFrontMatter('---\nsource: https://example.com/spec.pdf\n---\nbody');
		expect(meta.source).toBe('https://example.com/spec.pdf');
	});
});
