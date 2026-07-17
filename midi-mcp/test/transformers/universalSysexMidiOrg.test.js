import { describe, it, expect, beforeAll } from 'vitest';
import { transformUniversalSysexMidiOrg } from '../../lib/transformers/universalSysexMidiOrgTransformer.js';
import path from 'node:path';

const MARKDOWN_PATH = path.resolve('data/midi-1-0-universal-system-exclusive-messages-midi-org.md');

let result;

beforeAll(async () => {
	result = await transformUniversalSysexMidiOrg(MARKDOWN_PATH);
});

describe('Universal SysEx MIDI.org Transformer', () => {
	it('should produce a result object', () => {
		expect(result).toBeDefined();
		expect(typeof result).toBe('object');
	});

	describe('Metadata', () => {
		it('should have correct metadata from frontmatter', () => {
			expect(result.metadata.title).toContain('Universal System Exclusive');
			expect(result.metadata.protocol).toBe('midi1');
		});
	});

	describe('Description', () => {
		it('should mention Universal System Exclusive Messages', () => {
			expect(result.description).toContain('Universal System Exclusive');
		});

		it('should have a warning', () => {
			expect(result.warning).toContain('WARNING');
		});
	});

	describe('Categories', () => {
		it('should have 2 categories', () => {
			expect(result.categories).toHaveLength(2);
		});

		it('should have Non-Real Time category', () => {
			const nrt = result.categories.find(c => c.name.includes('Non-Real Time'));
			expect(nrt).toBeDefined();
		});

		it('should have Real Time category', () => {
			const rt = result.categories.find(c => c.name.includes('Real Time'));
			expect(rt).toBeDefined();
		});
	});

	describe('Non-Real Time Entries', () => {
		it('should have multiple entries', () => {
			const nrt = result.categories.find(c => c.name.includes('Non-Real Time'));
			expect(nrt.entries.length).toBeGreaterThanOrEqual(10);
		});

		it('should include Sample Dump Header (01)', () => {
			const nrt = result.categories.find(c => c.name.includes('Non-Real Time'));
			const entry = nrt.entries.find(e => e.sub_id_1 === '01');
			expect(entry).toBeDefined();
			expect(entry.description).toContain('Sample Dump Header');
		});

		it('should include MIDI Time Code (04) with sub-entries', () => {
			const nrt = result.categories.find(c => c.name.includes('Non-Real Time'));
			const mtc = nrt.entries.find(e => e.sub_id_1 === '04');
			expect(mtc).toBeDefined();
			expect(mtc.sub_entries.length).toBeGreaterThanOrEqual(5);
		});

		it('should include Sample Dump Extensions (05) with sub-entries', () => {
			const nrt = result.categories.find(c => c.name.includes('Non-Real Time'));
			const sde = nrt.entries.find(e => e.sub_id_1 === '05');
			expect(sde).toBeDefined();
			expect(sde.sub_entries.length).toBeGreaterThanOrEqual(5);
		});

		it('should include General MIDI (09) with sub-entries', () => {
			const nrt = result.categories.find(c => c.name.includes('Non-Real Time'));
			const gm = nrt.entries.find(e => e.sub_id_1 === '09');
			expect(gm).toBeDefined();
			expect(gm.sub_entries.length).toBeGreaterThanOrEqual(2);
		});

		it('should include End of File (7B)', () => {
			const nrt = result.categories.find(c => c.name.includes('Non-Real Time'));
			const eof = nrt.entries.find(e => e.sub_id_1 === '7B');
			expect(eof).toBeDefined();
			expect(eof.description).toContain('End of File');
		});

		it('should include ACK (7F)', () => {
			const nrt = result.categories.find(c => c.name.includes('Non-Real Time'));
			const ack = nrt.entries.find(e => e.sub_id_1 === '7F');
			expect(ack).toBeDefined();
			expect(ack.description).toContain('ACK');
		});
	});

	describe('Real Time Entries', () => {
		it('should have multiple entries', () => {
			const rt = result.categories.find(c => c.name.startsWith('Real Time'));
			expect(rt.entries.length).toBeGreaterThanOrEqual(10);
		});

		it('should include MIDI Time Code (01) with sub-entries', () => {
			const rt = result.categories.find(c => c.name.startsWith('Real Time'));
			const mtc = rt.entries.find(e => e.sub_id_1 === '01');
			expect(mtc).toBeDefined();
			expect(mtc.sub_entries.length).toBeGreaterThanOrEqual(2);
		});

		it('should include Device Control (04) with Master Volume', () => {
			const rt = result.categories.find(c => c.name.startsWith('Real Time'));
			const dc = rt.entries.find(e => e.sub_id_1 === '04');
			expect(dc).toBeDefined();
			const vol = dc.sub_entries.find(s => s.description.includes('Master Volume'));
			expect(vol).toBeDefined();
		});

		it('should include MIDI Tuning Standard (08) with Single Note Tuning Change', () => {
			const rt = result.categories.find(c => c.name.startsWith('Real Time'));
			const mts = rt.entries.find(e => e.sub_id_1 === '08');
			expect(mts).toBeDefined();
			const snt = mts.sub_entries.find(s => s.description.includes('Single Note'));
			expect(snt).toBeDefined();
		});

		it('should include Controller Destination Setting (09)', () => {
			const rt = result.categories.find(c => c.name.startsWith('Real Time'));
			const cds = rt.entries.find(e => e.sub_id_1 === '09');
			expect(cds).toBeDefined();
			expect(cds.description).toContain('Controller Destination');
		});

		it('should include Key-based Instrument Control (0A)', () => {
			const rt = result.categories.find(c => c.name.startsWith('Real Time'));
			const kic = rt.entries.find(e => e.sub_id_1 === '0A');
			expect(kic).toBeDefined();
			expect(kic.description).toContain('Key-based');
		});
	});

	describe('Summary', () => {
		it('should have category count 2', () => {
			expect(result.summary.category_count).toBe(2);
		});

		it('should have total entry count', () => {
			expect(result.summary.total_entries).toBeGreaterThanOrEqual(20);
		});
	});
});
