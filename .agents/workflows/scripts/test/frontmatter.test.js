import { describe, it, expect } from 'vitest';
import { splitFrontmatter, renderFrontmatter } from '../lib/frontmatter.js';

/**
 * `lib/frontmatter.js` deliberately avoids a full YAML dependency. These
 * assertions pin the edge cases the workflow relies on: CRLF imports from
 * Windows editors, empty block-list keys, quoted inline list items, and
 * clean rendering of sparse objects.
 */
describe('frontmatter', () => {
	it('handles CRLF endings and a trailing --- with no newline', () => {
		const { data, body, hasFrontmatter } = splitFrontmatter('---\r\nfoo: bar\r\n---');

		expect(hasFrontmatter).toBe(true);
		expect(data.foo).toBe('bar');
		expect(body).toBe('');
	});

	it('treats a block-list key with no items as an empty string', () => {
		const { data } = splitFrontmatter('---\nempty:\n---\n\nbody\n');

		expect(data.empty).toBe('');
		expect(data.empty).not.toEqual([]);
	});

	it('renderFrontmatter skips undefined, null, and empty-string values', () => {
		const rendered = renderFrontmatter({
			a: 'x',
			b: '',
			c: null,
			d: undefined,
			e: ['one', 'two'],
			f: 0
		});
		const lines = rendered.split('\n');

		expect(lines).toContain('a: x');
		expect(lines).toContain('e: [one, two]');
		expect(lines).toContain('f: 0');
		expect(lines).not.toContain(expect.stringMatching(/^b:\s*$/));
		expect(lines).not.toContain(expect.stringMatching(/^c:/));
		expect(lines).not.toContain(expect.stringMatching(/^d:/));
	});

	it('keeps quoted inline list items intact', () => {
		const { data } = splitFrontmatter('---\nlist: [plain, "two words", \'three words\']\n---\n');

		expect(data.list).toEqual(['plain', 'two words', 'three words']);
	});
});
