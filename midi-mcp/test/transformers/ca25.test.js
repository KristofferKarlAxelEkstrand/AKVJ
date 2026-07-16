import { describe, it, expect, beforeAll } from 'vitest';
import path from 'node:path';
import { transformCa25 } from '../../lib/transformers/ca25Transformer.js';

describe('CA-025 Master Fine/Coarse Tuning Transformer', () => {
	let result;

	beforeAll(async () => {
		const docPath = path.resolve(__dirname, '../../data/ca25-master-fine-coarse-tuning-sysex-message.md');
		result = await transformCa25(docPath);
	});

	it('should produce correct metadata', () => {
		expect(result.metadata.title).toBe('Master Fine/Coarse Tuning');
		expect(result.metadata.doc_id).toBe('CA-025');
		expect(result.metadata.version).toBe('1.0.0');
		expect(result.metadata.source).toBe('ca25-master-fine-coarse-tuning-sysex-message.md');
	});

	describe('Master Fine Tuning message format', () => {
		it('should have 6 fields', () => {
			expect(result.master_fine_tuning.fields).toHaveLength(6);
			expect(result.summary.fine_tuning_field_count).toBe(6);
		});

		it('should have correct message template', () => {
			expect(result.master_fine_tuning.message).toBe('F0 7F <device ID> 04 03 lsb msb F7');
		});

		it('should have F0 7F as first field', () => {
			expect(result.master_fine_tuning.fields[0].code).toBe('F0');
			expect(result.master_fine_tuning.fields[0].description).toContain('Universal Real Time SysEx header');
		});

		it('should have <device ID> as second field', () => {
			expect(result.master_fine_tuning.fields[1].code).toBe('<device ID>');
			expect(result.master_fine_tuning.fields[1].description).toContain('ID of target device');
		});

		it('should have 04 as sub-ID#1 Device Control', () => {
			const field = result.master_fine_tuning.fields.find(f => f.code === '04' && f.description.includes('Device Control'));
			expect(field).toBeDefined();
		});

		it('should have 03 as sub-ID#2 Master Fine Tuning', () => {
			const field = result.master_fine_tuning.fields.find(f => f.code === '03' && f.description.includes('Master Fine Tuning'));
			expect(field).toBeDefined();
		});

		it('should have lsb msb as tuning value field', () => {
			const field = result.master_fine_tuning.fields.find(f => f.code === 'lsb');
			expect(field).toBeDefined();
			expect(field.description).toContain('fine tuning value');
		});

		it('should have F7 EOX as last field', () => {
			const last = result.master_fine_tuning.fields[result.master_fine_tuning.fields.length - 1];
			expect(last.code).toBe('F7');
			expect(last.description).toBe('EOX');
		});
	});

	describe('Master Fine Tuning table', () => {
		it('should have 3 entries', () => {
			expect(result.master_fine_tuning.tuning_table).toHaveLength(3);
			expect(result.summary.fine_tuning_table_count).toBe(3);
		});

		it('should parse 00 00 as minimum displacement', () => {
			const entry = result.master_fine_tuning.tuning_table.find(e => e.lsb === '00' && e.msb === '00');
			expect(entry).toBeDefined();
			expect(entry.displacement).toContain('-8192');
		});

		it('should parse 00 40 as center (zero displacement)', () => {
			const entry = result.master_fine_tuning.tuning_table.find(e => e.lsb === '00' && e.msb === '40');
			expect(entry).toBeDefined();
			expect(entry.displacement).toContain('*0');
		});

		it('should parse 7F 7F as maximum displacement', () => {
			const entry = result.master_fine_tuning.tuning_table.find(e => e.lsb === '7F' && e.msb === '7F');
			expect(entry).toBeDefined();
			expect(entry.displacement).toContain('+8191');
		});
	});

	describe('Master Coarse Tuning message format', () => {
		it('should have 6 fields', () => {
			expect(result.master_coarse_tuning.fields).toHaveLength(6);
			expect(result.summary.coarse_tuning_field_count).toBe(6);
		});

		it('should have correct message template', () => {
			expect(result.master_coarse_tuning.message).toBe('F0 7F <device ID> 04 04 00 msb F7');
		});

		it('should have F0 7F as first field', () => {
			expect(result.master_coarse_tuning.fields[0].code).toBe('F0');
			expect(result.master_coarse_tuning.fields[0].description).toContain('Universal Real Time SysEx header');
		});

		it('should have 04 as sub-ID#1 Device Control', () => {
			const field = result.master_coarse_tuning.fields.find(f => f.code === '04' && f.description.includes('Device Control'));
			expect(field).toBeDefined();
		});

		it('should have 04 as sub-ID#2 Master Coarse Tuning', () => {
			const field = result.master_coarse_tuning.fields.find(f => f.code === '04' && f.description.includes('Master Coarse Tuning'));
			expect(field).toBeDefined();
		});

		it('should have 00 msb as tuning value field', () => {
			const field = result.master_coarse_tuning.fields.find(f => f.code === '00');
			expect(field).toBeDefined();
			expect(field.description).toContain('coarse tuning value');
		});

		it('should have F7 EOX as last field', () => {
			const last = result.master_coarse_tuning.fields[result.master_coarse_tuning.fields.length - 1];
			expect(last.code).toBe('F7');
			expect(last.description).toBe('EOX');
		});
	});

	describe('Master Coarse Tuning table', () => {
		it('should have 3 entries', () => {
			expect(result.master_coarse_tuning.tuning_table).toHaveLength(3);
			expect(result.summary.coarse_tuning_table_count).toBe(3);
		});

		it('should parse 00 00 as minimum displacement', () => {
			const entry = result.master_coarse_tuning.tuning_table.find(e => e.lsb === '00' && e.msb === '00');
			expect(entry).toBeDefined();
			expect(entry.displacement).toContain('-64');
		});

		it('should parse 00 40 as center (zero displacement)', () => {
			const entry = result.master_coarse_tuning.tuning_table.find(e => e.lsb === '00' && e.msb === '40');
			expect(entry).toBeDefined();
			expect(entry.displacement).toContain('*0');
		});

		it('should parse 00 7F as maximum displacement', () => {
			const entry = result.master_coarse_tuning.tuning_table.find(e => e.lsb === '00' && e.msb === '7F');
			expect(entry).toBeDefined();
			expect(entry.displacement).toContain('+63');
		});
	});

	describe('Notes', () => {
		it('should have notes', () => {
			expect(result.notes.length).toBeGreaterThan(0);
			expect(result.summary.note_count).toBe(result.notes.length);
		});

		it('should contain note about total displacement for fine tuning', () => {
			const note = result.notes.find(n => n.includes('total displacement'));
			expect(note).toBeDefined();
		});

		it('should contain note about LSB always being 0 for coarse tuning', () => {
			const note = result.notes.find(n => n.includes('LSB is always 0'));
			expect(note).toBeDefined();
		});

		it('should contain note about key-based instruments', () => {
			const note = result.notes.find(n => n.includes('Key-based Instruments'));
			expect(note).toBeDefined();
		});
	});

	describe('Data integrity', () => {
		it('should have all fine tuning fields with code and description', () => {
			for (const field of result.master_fine_tuning.fields) {
				expect(field.code).toBeTruthy();
				expect(field.description).toBeTruthy();
			}
		});

		it('should have all coarse tuning fields with code and description', () => {
			for (const field of result.master_coarse_tuning.fields) {
				expect(field.code).toBeTruthy();
				expect(field.description).toBeTruthy();
			}
		});

		it('should have all fine tuning table entries with lsb, msb, displacement', () => {
			for (const entry of result.master_fine_tuning.tuning_table) {
				expect(entry.lsb).toMatch(/^[0-9A-F]{2}$/);
				expect(entry.msb).toMatch(/^[0-9A-F]{2}$/);
				expect(entry.displacement).toBeTruthy();
			}
		});

		it('should have all coarse tuning table entries with lsb, msb, displacement', () => {
			for (const entry of result.master_coarse_tuning.tuning_table) {
				expect(entry.lsb).toMatch(/^[0-9A-F]{2}$/);
				expect(entry.msb).toMatch(/^[0-9A-F]{2}$/);
				expect(entry.displacement).toBeTruthy();
			}
		});
	});
});
