import { describe, expect, test } from 'vitest';
import { searchDocs } from '../lib/search.js';

function makeDoc({ name, title = name, protocol = 'midi1', tier = 'spec', text }) {
	return { name, title, protocol, tier, text, lines: text.split('\n') };
}

const docs = [
	makeDoc({
		name: 'spec-doc',
		title: 'MIDI 1.0 Detailed Specification',
		tier: 'spec',
		text: ['## Page 1', 'Intro text about MIDI.', '## Page 2', 'The Note On message starts a note.', 'Velocity byte follows the note number.', '## Page 3', 'Note On with velocity zero acts as Note Off.'].join('\n')
	}),
	makeDoc({
		name: 'reference-doc',
		title: 'Status Byte Quick Reference',
		tier: 'reference',
		text: ['# Status Bytes', '| 0x9n | Note On | 3 bytes |', '| 0x8n | Note Off | 3 bytes |'].join('\n')
	}),
	makeDoc({
		name: 'midi2-doc',
		title: 'UMP Specification',
		protocol: 'midi2',
		tier: 'spec',
		text: ['## Page 1', 'MIDI 2.0 Note On has 16-bit velocity.'].join('\n')
	})
];

describe('searchDocs', () => {
	test('is case-insensitive and returns snippets with anchors', () => {
		const results = searchDocs(docs, { query: 'note on' });
		expect(results.length).toBeGreaterThan(0);
		const specHit = results.find(result => result.doc === 'spec-doc');
		expect(specHit.anchor).toBe('Page 2');
		expect(specHit.snippet).toContain('Note On message');
	});

	test('ranks reference tier above spec tier', () => {
		const results = searchDocs(docs, { query: 'Note On' });
		expect(results[0].tier).toBe('reference');
		expect(results[0].doc).toBe('reference-doc');
	});

	test('filters by protocol', () => {
		const results = searchDocs(docs, { query: 'Note On', protocol: 'midi2' });
		expect(results.every(result => result.protocol === 'midi2')).toBe(true);
		expect(results[0].doc).toBe('midi2-doc');
	});

	test('filters by tier', () => {
		const results = searchDocs(docs, { query: 'Note On', tier: 'spec' });
		expect(results.every(result => result.tier === 'spec')).toBe(true);
	});

	test('respects maxResults', () => {
		const results = searchDocs(docs, { query: 'Note', maxResults: 2 });
		expect(results.length).toBe(2);
	});

	test('includes context lines around the match', () => {
		const results = searchDocs(docs, { query: 'Velocity byte', contextLines: 1 });
		expect(results[0].snippet).toContain('Note On message');
		expect(results[0].snippet).toContain('Velocity byte follows');
	});

	test('ranks exact table-cell definitions above higher-density prose', () => {
		const proseDocs = [makeDoc({ name: 'chatty', tier: 'reference', text: ['Note On is great.', 'Note On again.', 'Note On thrice.'].join('\n') }), makeDoc({ name: 'defining', tier: 'reference', text: ['# Table', '| 0x9n | Note On | 3 |'].join('\n') })];
		const results = searchDocs(proseDocs, { query: 'Note On' });
		expect(results[0].doc).toBe('defining');
	});

	test('returns empty for empty query or no matches', () => {
		expect(searchDocs(docs, { query: '' })).toEqual([]);
		expect(searchDocs(docs, { query: 'zzz-not-there' })).toEqual([]);
	});
});
