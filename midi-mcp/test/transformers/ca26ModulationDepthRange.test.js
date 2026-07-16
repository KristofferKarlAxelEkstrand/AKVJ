import { describe, it, expect, beforeAll } from 'vitest';
import path from 'node:path';
import { transformCa26ModulationDepthRange } from '../../lib/transformers/ca26ModulationDepthRangeTransformer.js';

describe('Modulation Depth Range RPN (CA-026) Transformer', () => {
	let result;

	beforeAll(async () => {
		const docPath = path.resolve(__dirname, '../../data/ca26-rpn05-modulation-depth-range.md');
		result = await transformCa26ModulationDepthRange(docPath);
	});

	it('should produce correct metadata', () => {
		expect(result.metadata.title).toBe('Modulation Depth Range RPN');
		expect(result.metadata.doc_id).toBe('26');
		expect(result.metadata.protocol).toBe('midi1');
		expect(result.metadata.source).toBe('ca26-rpn05-modulation-depth-range.md');
		expect(result.metadata.date_of_issue).toBe('3/02/99');
		expect(result.metadata.originated_by).toBe('MMA');
		expect(result.metadata.reference).toContain('TSBB');
		expect(result.metadata.reference).toContain('152');
		expect(result.metadata.related_items).toContain('MIDI 1.0');
	});

	it('should have a non-empty abstract', () => {
		expect(result.abstract).toContain('Registered Parameter Number');
		expect(result.abstract).toContain('RPN');
		expect(result.abstract).toContain('#05');
		expect(result.abstract).toContain('Modulation Wheel');
	});

	it('should have a non-empty background', () => {
		expect(result.background).toContain('Modulation Depth Range');
		expect(result.background).toContain('NRPNs');
		expect(result.background).toContain('Sysex');
	});

	describe('RPN Entries', () => {
		it('should have 1 entry', () => {
			expect(result.rpn_entries).toHaveLength(1);
			expect(result.summary.rpn_entry_count).toBe(1);
		});

		it('should parse LSB=05, MSB=00 as Modulation Depth Range', () => {
			const entry = result.rpn_entries[0];
			expect(entry.lsb).toBe('05');
			expect(entry.msb).toBe('00');
			expect(entry.function).toBe('Modulation Depth Range');
		});
	});

	describe('Message Format', () => {
		it('should have correct message format', () => {
			expect(result.message_format).not.toBeNull();
			expect(result.message_format.raw).toBe('Bn 64 05 65 00');
			expect(result.message_format.status_byte).toBe('Bn');
			expect(result.message_format.bytes).toEqual(['Bn', '64', '05', '65', '00']);
		});

		it('should have description with channel info', () => {
			expect(result.message_format.description).toContain('MIDI channel');
		});

		it('should report has_message_format as true', () => {
			expect(result.summary.has_message_format).toBe(true);
		});
	});

	describe('Details', () => {
		it('should have 3 details', () => {
			expect(result.details).toHaveLength(3);
			expect(result.summary.detail_count).toBe(3);
		});

		it('should contain detail about Data Entry follow-up', () => {
			const detail = result.details.find(d => d.includes('Data Entry'));
			expect(detail).toBeDefined();
			expect(detail).toContain('Increment');
			expect(detail).toContain('Decrement');
		});

		it('should contain detail about no default setting', () => {
			const detail = result.details.find(d => d.includes('Neither default'));
			expect(detail).toBeDefined();
			expect(detail).toContain('manufacturer');
		});

		it('should contain detail about destination parameter', () => {
			const detail = result.details.find(d => d.includes('destination parameter'));
			expect(detail).toBeDefined();
			expect(detail).toContain('Vibrato');
		});
	});

	describe('Summary', () => {
		it('should have correct counts', () => {
			expect(result.summary.rpn_entry_count).toBe(1);
			expect(result.summary.has_message_format).toBe(true);
			expect(result.summary.detail_count).toBe(3);
		});
	});
});
