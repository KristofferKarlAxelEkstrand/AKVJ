import { describe, it, expect, beforeAll } from 'vitest';
import path from 'node:path';
import { transformMidiImplementationChartV2 } from '../../lib/transformers/midiImplementationChartV2Transformer.js';

describe('MIDI Implementation Chart V2 (RP-028) Transformer', () => {
	let result;

	beforeAll(async () => {
		const docPath = path.resolve(__dirname, '../../data/midi-chart-v2.md');
		result = await transformMidiImplementationChartV2(docPath);
	});

	it('should produce correct metadata', () => {
		expect(result.metadata.title).toBe('MIDI Implementation Chart V2');
		expect(result.metadata.doc_id).toBe('RP-028');
		expect(result.metadata.protocol).toBe('midi1');
		expect(result.metadata.source).toBe('midi-chart-v2.md');
	});

	describe('Function Descriptions', () => {
		it('should have 29 entries', () => {
			expect(result.function_descriptions).toHaveLength(29);
			expect(result.summary.function_description_count).toBe(29);
		});

		it('should parse MIDI channels', () => {
			const entry = result.function_descriptions.find(f => f.function_name === 'MIDI channels');
			expect(entry).toBeDefined();
			expect(entry.description).toContain('range of MIDI channels');
		});

		it('should parse Note numbers', () => {
			const entry = result.function_descriptions.find(f => f.function_name === 'Note numbers');
			expect(entry).toBeDefined();
			expect(entry.description).toContain('transmitted or recognized notes');
		});

		it('should parse Bank Select response', () => {
			const entry = result.function_descriptions.find(f => f.function_name === 'Bank Select response');
			expect(entry).toBeDefined();
			expect(entry.description).toContain('Bank Select');
		});

		it('should parse MIDI Clock', () => {
			const entry = result.function_descriptions.find(f => f.function_name === 'MIDI Clock');
			expect(entry).toBeDefined();
			expect(entry.description).toContain('MIDI Clock');
		});

		it('should parse General MIDI', () => {
			const entry = result.function_descriptions.find(f => f.function_name === 'General MIDI');
			expect(entry).toBeDefined();
			expect(entry.description).toContain('General MIDI');
		});

		it('should parse SP-MIDI', () => {
			const entry = result.function_descriptions.find(f => f.function_name === 'SP-MIDI');
			expect(entry).toBeDefined();
			expect(entry.description).toContain('Scalable Polyphony');
		});
	});

	describe('Chart Template', () => {
		it('should have 3 sections', () => {
			expect(result.chart_template.sections).toHaveLength(3);
			expect(result.summary.chart_section_count).toBe(3);
		});

		it('should have 59 total items', () => {
			expect(result.summary.chart_item_count).toBe(59);
		});

		it('should parse section 1 as Basic Information with 42 items', () => {
			const section = result.chart_template.sections.find(s => s.section_number === 1);
			expect(section).toBeDefined();
			expect(section.section_title).toBe('Basic Information');
			expect(section.items.length).toBe(42);
		});

		it('should parse section 2 as MIDI Timing and Synchronization with 10 items', () => {
			const section = result.chart_template.sections.find(s => s.section_number === 2);
			expect(section).toBeDefined();
			expect(section.section_title).toBe('MIDI Timing and Synchronization');
			expect(section.items.length).toBe(10);
		});

		it('should parse section 3 as Extensions Compatibility with 7 items', () => {
			const section = result.chart_template.sections.find(s => s.section_number === 3);
			expect(section).toBeDefined();
			expect(section.section_title).toBe('Extensions Compatibility');
			expect(section.items.length).toBe(7);
		});

		it('should contain MIDI channels in section 1 items', () => {
			const section = result.chart_template.sections.find(s => s.section_number === 1);
			expect(section.items.some(i => i.includes('MIDI channels'))).toBe(true);
		});

		it('should contain RPN 05 in section 1 items', () => {
			const section = result.chart_template.sections.find(s => s.section_number === 1);
			expect(section.items.some(i => i.includes('RPN 05'))).toBe(true);
		});
	});

	describe('Control Number Tables', () => {
		it('should have 2 tables', () => {
			expect(result.control_number_tables).toHaveLength(2);
			expect(result.summary.control_number_table_count).toBe(2);
		});

		it('should have 72 total entries', () => {
			expect(result.summary.control_number_entry_count).toBe(72);
		});

		it('should have 32 entries in first table (page 2)', () => {
			expect(result.control_number_tables[0].entries).toHaveLength(32);
		});

		it('should have 40 entries in second table (page 3)', () => {
			expect(result.control_number_tables[1].entries).toHaveLength(40);
		});

		it('should parse CC#0 as Bank Select (MSB)', () => {
			const entry = result.control_number_tables[0].entries.find(e => e.control_number === 0);
			expect(entry).toBeDefined();
			expect(entry.function).toBe('Bank Select (MSB)');
		});

		it('should parse CC#1 as Modulation Wheel (MSB)', () => {
			const entry = result.control_number_tables[0].entries.find(e => e.control_number === 1);
			expect(entry).toBeDefined();
			expect(entry.function).toBe('Modulation Wheel (MSB)');
		});

		it('should parse CC#7 as Channel Volume (MSB)', () => {
			const entry = result.control_number_tables[0].entries.find(e => e.control_number === 7);
			expect(entry).toBeDefined();
			expect(entry.function).toBe('Channel Volume (MSB)');
		});

		it('should parse CC#64 as Sustain Pedal', () => {
			const entry = result.control_number_tables[1].entries.find(e => e.control_number === 64);
			expect(entry).toBeDefined();
			expect(entry.function).toBe('Sustain Pedal');
		});

		it('should parse CC#120 as All Sound Off', () => {
			const entry = result.control_number_tables[1].entries.find(e => e.control_number === 120);
			expect(entry).toBeDefined();
			expect(entry.function).toBe('All Sound Off');
		});

		it('should parse CC#127 as Poly Mode On', () => {
			const entry = result.control_number_tables[1].entries.find(e => e.control_number === 127);
			expect(entry).toBeDefined();
			expect(entry.function).toBe('Poly Mode On');
		});
	});

	describe('Summary', () => {
		it('should have correct counts', () => {
			expect(result.summary.function_description_count).toBe(29);
			expect(result.summary.chart_section_count).toBe(3);
			expect(result.summary.chart_item_count).toBe(59);
			expect(result.summary.control_number_table_count).toBe(2);
			expect(result.summary.control_number_entry_count).toBe(72);
		});
	});
});
