import { describe, it, expect, beforeAll } from 'vitest';
import { transformSmf } from '../../lib/transformers/smfTransformer.js';
import path from 'node:path';

const MARKDOWN_PATH = path.resolve('data/rp-001-v1-0-standard-midi-files-specification-96-1-4.md');

let result;

beforeAll(async () => {
	result = await transformSmf(MARKDOWN_PATH);
});

describe('SMF Transformer', () => {
	it('should produce a result object', () => {
		expect(result).toBeDefined();
		expect(typeof result).toBe('object');
	});

	describe('Metadata', () => {
		it('should have correct metadata', () => {
			expect(result.metadata.title).toBe('Standard MIDI Files 1.0');
			expect(result.metadata.doc_id).toBe('RP-001');
			expect(result.metadata.protocol).toBe('midi1');
			expect(result.metadata.version).toBe('1.0');
		});
	});

	describe('Variable-Length Examples', () => {
		it('should have 12 examples', () => {
			expect(result.variable_length_examples).toHaveLength(12);
		});

		it('should parse 00000000 as 00', () => {
			const entry = result.variable_length_examples.find(e => e.number_hex === '00000000');
			expect(entry).toBeDefined();
			expect(entry.representation_hex).toBe('00');
		});

		it('should parse 0000007F as 7F', () => {
			const entry = result.variable_length_examples.find(e => e.number_hex === '0000007F');
			expect(entry).toBeDefined();
			expect(entry.representation_hex).toBe('7F');
		});

		it('should parse 00000080 as 81 00', () => {
			const entry = result.variable_length_examples.find(e => e.number_hex === '00000080');
			expect(entry).toBeDefined();
			expect(entry.representation_hex).toBe('81 00');
		});

		it('should parse 0FFFFFFF as FF FF FF 7F', () => {
			const entry = result.variable_length_examples.find(e => e.number_hex === '0FFFFFFF');
			expect(entry).toBeDefined();
			expect(entry.representation_hex).toBe('FF FF FF 7F');
		});
	});

	describe('File Formats', () => {
		it('should have 3 formats', () => {
			expect(result.file_formats).toHaveLength(3);
		});

		it('should parse format 0 as single multi-channel track', () => {
			const fmt0 = result.file_formats.find(e => e.format === 0);
			expect(fmt0).toBeDefined();
			expect(fmt0.description).toContain('single multi-channel track');
		});

		it('should parse format 1 as simultaneous tracks', () => {
			const fmt1 = result.file_formats.find(e => e.format === 1);
			expect(fmt1).toBeDefined();
			expect(fmt1.description).toContain('simultaneous tracks');
		});

		it('should parse format 2 as sequentially independent patterns', () => {
			const fmt2 = result.file_formats.find(e => e.format === 2);
			expect(fmt2).toBeDefined();
			expect(fmt2.description).toContain('sequentially independent');
		});
	});

	describe('Division Formats', () => {
		it('should have 2 division formats', () => {
			expect(result.division_formats).toHaveLength(2);
		});

		it('should parse metrical division', () => {
			const metrical = result.division_formats.find(e => e.type === 'metrical');
			expect(metrical).toBeDefined();
			expect(metrical.description).toContain('ticks per quarter-note');
		});

		it('should parse SMPTE division', () => {
			const smpte = result.division_formats.find(e => e.type === 'smpte');
			expect(smpte).toBeDefined();
			expect(smpte.description).toContain('ticks per frame');
		});
	});

	describe('Meta-Events', () => {
		it('should have 15 meta-events', () => {
			expect(result.meta_events).toHaveLength(15);
		});

		it('should parse FF 00 as Sequence Number', () => {
			const seq = result.meta_events.find(e => e.ff_type === '00');
			expect(seq).toBeDefined();
			expect(seq.name).toBe('Sequence Number');
			expect(seq.syntax).toContain('FF 00 02 ssss');
		});

		it('should parse FF 01 as Text Event', () => {
			const text = result.meta_events.find(e => e.ff_type === '01');
			expect(text).toBeDefined();
			expect(text.name).toBe('Text Event');
		});

		it('should parse FF 2F as End of Track', () => {
			const eot = result.meta_events.find(e => e.ff_type === '2F');
			expect(eot).toBeDefined();
			expect(eot.name).toBe('End of Track');
		});

		it('should parse FF 51 as Set Tempo', () => {
			const tempo = result.meta_events.find(e => e.ff_type === '51');
			expect(tempo).toBeDefined();
			expect(tempo.name).toContain('Set Tempo');
		});

		it('should parse FF 58 as Time Signature', () => {
			const ts = result.meta_events.find(e => e.ff_type === '58');
			expect(ts).toBeDefined();
			expect(ts.name).toBe('Time Signature');
		});

		it('should parse FF 59 as Key Signature', () => {
			const ks = result.meta_events.find(e => e.ff_type === '59');
			expect(ks).toBeDefined();
			expect(ks.name).toBe('Key Signature');
		});

		it('should parse FF 7F as Sequencer-Specific Meta-Event', () => {
			const ss = result.meta_events.find(e => e.ff_type === '7F');
			expect(ss).toBeDefined();
			expect(ss.name).toContain('Sequencer-Specific');
		});

		it('should have descriptions for meta-events', () => {
			result.meta_events.forEach(e => {
				expect(e.description.length).toBeGreaterThan(0);
			});
		});
	});

	describe('Example Events', () => {
		it('should have example events', () => {
			expect(result.example_events.length).toBeGreaterThan(10);
		});

		it('should include delta_time for each entry', () => {
			result.example_events.forEach(e => {
				expect(typeof e.delta_time).toBe('number');
			});
		});
	});

	describe('Summary', () => {
		it('should have all summary counts', () => {
			expect(result.summary.variable_length_example_count).toBe(12);
			expect(result.summary.file_format_count).toBe(3);
			expect(result.summary.division_format_count).toBe(2);
			expect(result.summary.meta_event_count).toBe(15);
			expect(result.summary.example_event_count).toBeGreaterThan(10);
		});
	});
});
