import { describe, it, expect, beforeAll } from 'vitest';
import { transformRp54 } from '../../lib/transformers/rp54Transformer.js';
import path from 'node:path';

const MARKDOWN_PATH = path.resolve('data/rp54-specification-for-use-of-trs-connectors-with-midi-devices.md');

let result;

beforeAll(async () => {
	result = await transformRp54(MARKDOWN_PATH);
});

describe('RP-054 TRS Connectors with MIDI Devices Transformer', () => {
	it('should produce a result object', () => {
		expect(result).toBeDefined();
		expect(typeof result).toBe('object');
	});

	describe('Metadata', () => {
		it('should have correct metadata from frontmatter', () => {
			expect(result.metadata.title).toContain('TRS');
			expect(result.metadata.doc_id).toBe('RP-054');
			expect(result.metadata.protocol).toBe('midi1');
			expect(result.metadata.pages).toBe(2);
		});
	});

	describe('Abstract', () => {
		it('should mention TRS connectors and wiring', () => {
			expect(result.abstract).toContain('TRS');
			expect(result.abstract).toContain('wire');
		});

		it('should mention device circuitry and cable specifications', () => {
			expect(result.abstract).toContain('circuitry');
			expect(result.abstract).toContain('cable');
		});
	});

	describe('Background', () => {
		it('should mention smaller hardware devices', () => {
			expect(result.background).toContain('smaller');
		});

		it('should mention DIN connectors', () => {
			expect(result.background).toContain('DIN');
		});

		it('should mention interoperability', () => {
			expect(result.background).toContain('interoperability');
		});
	});

	describe('Details', () => {
		it('should have 3 detail items', () => {
			expect(result.details).toHaveLength(3);
		});

		it('should have Pin-out Correspondence as detail 1', () => {
			const d1 = result.details.find(e => e.step === 1);
			expect(d1).toBeDefined();
			expect(d1.title).toContain('Pin-out');
		});

		it('should have Connector Size as detail 2', () => {
			const d2 = result.details.find(e => e.step === 2);
			expect(d2).toBeDefined();
			expect(d2.title).toContain('Connector Size');
			expect(d2.description).toContain('2.5mm');
		});

		it('should have Cables as detail 3', () => {
			const d3 = result.details.find(e => e.step === 3);
			expect(d3).toBeDefined();
			expect(d3.title).toContain('Cables');
			expect(d3.description).toContain('shielded');
		});
	});

	describe('Notes', () => {
		it('should have notes', () => {
			expect(result.notes.length).toBeGreaterThanOrEqual(3);
		});

		it('should mention protection circuitry', () => {
			const allNotes = result.notes.join(' ');
			expect(allNotes).toContain('protection');
		});

		it('should mention adapter cable max length', () => {
			const allNotes = result.notes.join(' ');
			expect(allNotes).toContain('2 meters');
		});

		it('should mention twisted pair requirement', () => {
			const allNotes = result.notes.join(' ');
			expect(allNotes).toContain('twisted pair');
		});
	});

	describe('Approval', () => {
		it('should have originated by MMA', () => {
			expect(result.approval.originated_by).toBe('MMA');
		});

		it('should have MMA approval date', () => {
			expect(result.approval.mma_date).toBe('06/08/2018');
		});

		it('should have AMEI approval date', () => {
			expect(result.approval.amei_date).toBe('07/18/2018');
		});

		it('should have related items', () => {
			expect(result.approval.related_items).toContain('Electrical Specification');
		});
	});

	describe('Summary', () => {
		it('should have counts', () => {
			expect(result.summary.detail_count).toBe(3);
			expect(result.summary.note_count).toBeGreaterThanOrEqual(3);
		});
	});
});
