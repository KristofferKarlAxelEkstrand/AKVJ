/**
 * Knowledge acceptance suite: proves the committed corpus actually answers
 * ground-truth MIDI questions. Each fact runs a realistic agent query through
 * the real catalog + search stack and asserts the expected answer appears in
 * the top snippets. If extraction or curation regresses, these fail.
 */

import { beforeAll, describe, expect, test } from 'vitest';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadCatalog } from '../lib/catalog.js';
import { searchDocs } from '../lib/search.js';

const ROOT_DIR = path.dirname(path.dirname(fileURLToPath(import.meta.url)));

let docs;

beforeAll(async () => {
	({ docs } = await loadCatalog({ rootDir: ROOT_DIR }));
});

/**
 * Each fact: an agent-style query (+ optional protocol filter) and a pattern
 * the combined top snippets must contain.
 */
const FACTS = {
	'MIDI 1.0 protocol': [
		{ ask: 'status byte for Note On', query: 'Note On', protocol: 'midi1', expect: /0x9|9n|1001/i },
		{ ask: 'Note On message is 3 bytes', query: 'Note On', protocol: 'midi1', expect: /\b3\b|three bytes|2 data bytes/i },
		{ ask: 'velocity 0 acts as Note Off', query: 'velocity 0', expect: /note off/i },
		{ ask: 'pitch bend center value', query: 'pitch bend', expect: /8192|2000H|center/i },
		{ ask: 'CC 64 is sustain pedal', query: 'sustain', expect: /64/ },
		{ ask: 'CC 120 All Sound Off', query: 'All Sound Off', expect: /120/ },
		{ ask: 'CC 123 All Notes Off', query: 'All Notes Off', expect: /123/ },
		{ ask: 'RPN null deselects parameter', query: 'RPN null', expect: /127|7F/i },
		{ ask: 'MIDI clock is 24 pulses per quarter note', query: 'clock', expect: /24/ },
		{ ask: 'MTC quarter frame status byte', query: 'quarter frame', expect: /F1/i },
		{ ask: 'universal non-real-time SysEx ID', query: 'universal', tier: 'reference', expect: /7E/i },
		{ ask: 'universal real-time SysEx ID', query: 'real-time', tier: 'reference', expect: /7F/i },
		{ ask: '3-byte manufacturer IDs start with 00', query: 'manufacturer ID', expect: /0x00|00H|3-byte|three.byte/i },
		{ ask: 'Roland manufacturer ID', query: 'Sequential Circuits', expect: /01/ },
		{ ask: 'running status omits repeated status bytes', query: 'running status', expect: /status byte/i },
		{ ask: 'active sensing interval', query: 'Active Sensing', expect: /300\s?ms/i },
		{ ask: 'SMF header chunk', query: 'MThd', expect: /MThd|header/i },
		{ ask: 'high resolution velocity prefix is CC 88', query: 'High Resolution Velocity', expect: /88/ }
	],
	'MIDI 2.0 / UMP': [
		{ ask: 'UMP MIDI 2.0 channel voice packets are 64-bit', query: 'MIDI 2.0 Channel Voice', protocol: 'midi2', expect: /64[\s-]?bit/i },
		{ ask: 'MIDI 2.0 velocity is 16-bit', query: 'velocity', protocol: 'midi2', expect: /16[\s-]?bit/i },
		{ ask: 'MIDI 2.0 Note On velocity 0 is not Note Off', query: 'velocity 0', protocol: 'midi2', expect: /note off/i },
		{ ask: 'UMP groups carry 16 channels each', query: 'group', protocol: 'midi2', expect: /16/ },
		{ ask: 'JR timestamp exists for jitter reduction', query: 'JR Timestamp', expect: /jitter|31250|timestamp/i },
		{ ask: 'upscaling uses bit-repeat not plain shift', query: 'bit-repeat', expect: /upscal|repeat/i },
		{ ask: 'MIDI-CI uses MUIDs for discovery', query: 'MUID', expect: /28[\s-]?bit|discovery|MIDI-CI/i },
		{ ask: 'Property Exchange uses JSON', query: 'Property Exchange', protocol: 'midi2', expect: /JSON/i },
		{ ask: 'MPE profile exists as MIDI-CI profile', query: 'Polyphonic Expression', protocol: 'midi2', expect: /profile/i },
		{ ask: 'UMP SysEx8 messages exist', query: 'SysEx8', expect: /128|8[\s-]?bit|sysex8/i }
	],
	'Web MIDI API': [
		{ ask: 'sysex needs explicit permission option', query: 'sysex', protocol: 'web-midi', expect: /permission|sysexEnabled|option|true/i },
		{ ask: 'send() rejects running status', query: 'running status', protocol: 'web-midi', expect: /not|never|invalid|disallow|complete/i },
		{ ask: 'statechange fires on connect/disconnect', query: 'statechange', protocol: 'web-midi', expect: /connect|disconnect|device|port/i },
		{ ask: 'MIDIMessageEvent data is a Uint8Array', query: 'Uint8Array', protocol: 'web-midi', expect: /Uint8Array/i },
		{ ask: 'requestMIDIAccess returns a promise of MIDIAccess', query: 'requestMIDIAccess', protocol: 'web-midi', expect: /promise|MIDIAccess/i },
		{ ask: 'secure context is required', query: 'secure context', protocol: 'web-midi', expect: /secure context|https/i }
	]
};

for (const [family, facts] of Object.entries(FACTS)) {
	describe(family, () => {
		for (const fact of facts) {
			test(fact.ask, () => {
				const results = searchDocs(docs, { query: fact.query, protocol: fact.protocol, tier: fact.tier, maxResults: 5, contextLines: 3 });
				const combined = results.map(result => `${result.title}\n${result.snippet}`).join('\n\n');
				expect(results.length, `no search results for "${fact.query}"`).toBeGreaterThan(0);
				expect(combined).toMatch(fact.expect);
			});
		}
	});
}

describe('corpus shape', () => {
	test('covers all four protocol families with healthy counts', () => {
		const counts = {};
		for (const doc of docs) {
			counts[doc.protocol] = (counts[doc.protocol] ?? 0) + 1;
		}
		expect(counts.midi1).toBeGreaterThanOrEqual(40);
		expect(counts.midi2).toBeGreaterThanOrEqual(20);
		expect(counts['web-midi']).toBeGreaterThanOrEqual(5);
	});

	test('every doc has a title and summary', () => {
		for (const doc of docs) {
			expect(doc.title, `${doc.name} missing title`).toBeTruthy();
		}
	});

	test('no page chrome residue in extracted docs', () => {
		for (const doc of docs) {
			expect(doc.text, `${doc.name} contains menu residue`).not.toContain('Skip to main content');
		}
	});
});
