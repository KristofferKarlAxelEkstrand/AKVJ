import { describe, it, expect, beforeAll } from 'vitest';
import path from 'node:path';
import { transformCa28 } from '../../lib/transformers/ca28Transformer.js';

describe('CA-028 Extension 00-01 to File Reference SysEx Transformer', () => {
	let result;

	beforeAll(async () => {
		const docPath = path.resolve(__dirname, '../../data/ca28.md');
		result = await transformCa28(docPath);
	});

	it('should produce correct metadata', () => {
		expect(result.metadata.title).toBe('Extension 00-01 to File Reference SysEx Message');
		expect(result.metadata.doc_id).toBe('CA-028');
		expect(result.metadata.version).toBe('1.0.0');
		expect(result.metadata.source).toBe('ca28.md');
	});

	describe('Extension data format', () => {
		it('should have 4 fields', () => {
			expect(result.extension_data.fields).toHaveLength(4);
			expect(result.summary.extension_data_field_count).toBe(4);
		});

		it('should have correct format template', () => {
			expect(result.extension_data.format).toBe('<ext-ID#1> <ext-ID#2> <len> <extension-data>');
		});

		it('should have <ext-ID#1> field', () => {
			const field = result.extension_data.fields.find(f => f.name === '<ext-ID#1>');
			expect(field).toBeDefined();
			expect(field.description).toContain('Extension Specifier #1');
		});

		it('should have <ext-ID#2> field', () => {
			const field = result.extension_data.fields.find(f => f.name === '<ext-ID#2>');
			expect(field).toBeDefined();
			expect(field.description).toContain('Extension Specifier #2');
		});

		it('should have <len> field with full multiline description', () => {
			const field = result.extension_data.fields.find(f => f.name === '<len>');
			expect(field).toBeDefined();
			expect(field.description).toContain('Two 7-bit bytes');
			expect(field.description).toContain('combined byte count');
			expect(field.description).toContain('<dst-bank>');
			expect(field.description).toContain('<flags>');
			expect(field.description).toContain('EOX');
		});

		it('should have <data> field', () => {
			const field = result.extension_data.fields.find(f => f.name === '<data>');
			expect(field).toBeDefined();
			expect(field.description).toContain('Data specific');
		});
	});

	describe('Map entire file format', () => {
		it('should have 5 fields', () => {
			expect(result.map_entire_file.fields).toHaveLength(5);
			expect(result.summary.map_entire_file_field_count).toBe(5);
		});

		it('should have correct format template', () => {
			expect(result.map_entire_file.format).toBe('<ext-ID#1> <ext-ID#2> <len> <dst-bank> <flags>');
		});

		it('should have <ext-ID#1> with value 00', () => {
			const field = result.map_entire_file.fields.find(f => f.name === '<ext-ID#1>');
			expect(field).toBeDefined();
			expect(field.description).toContain('00');
		});

		it('should have <ext-ID#2> with value 01', () => {
			const field = result.map_entire_file.fields.find(f => f.name === '<ext-ID#2>');
			expect(field).toBeDefined();
			expect(field.description).toContain('01');
		});

		it('should have <len> field referencing size of at least 3', () => {
			const field = result.map_entire_file.fields.find(f => f.name === '<len>');
			expect(field).toBeDefined();
			expect(field.description).toContain('at least 3');
		});

		it('should have <dst-bank> field with MSB first', () => {
			const field = result.map_entire_file.fields.find(f => f.name === '<dst-bank>');
			expect(field).toBeDefined();
			expect(field.description).toContain('Two 7-bit bytes');
			expect(field.description).toContain('MSB first');
			expect(field.description).toContain('CC0');
		});

		it('should have <flags> field as bit field', () => {
			const field = result.map_entire_file.fields.find(f => f.name === '<flags>');
			expect(field).toBeDefined();
			expect(field.description).toContain('7-bit byte');
			expect(field.description).toContain('Bit field');
		});
	});

	describe('Bit flags', () => {
		it('should have 2 bit flag entries', () => {
			expect(result.bit_flags).toHaveLength(2);
			expect(result.summary.bit_flag_count).toBe(2);
		});

		it('should parse bit 0 as Source Drum flag', () => {
			const flag = result.bit_flags.find(f => f.bits === '0');
			expect(flag).toBeDefined();
			expect(flag.description).toContain('Source Drum flag');
			expect(flag.description).toContain('drum bank');
		});

		it('should parse bits 1-6 as Undefined', () => {
			const flag = result.bit_flags.find(f => f.bits === '1-6');
			expect(flag).toBeDefined();
			expect(flag.description).toContain('Undefined');
			expect(flag.description).toContain('0');
		});
	});

	describe('Data integrity', () => {
		it('should have all extension data fields with name and description', () => {
			for (const field of result.extension_data.fields) {
				expect(field.name).toMatch(/^<.+>$/);
				expect(field.description).toBeTruthy();
			}
		});

		it('should have all map entire file fields with name and description', () => {
			for (const field of result.map_entire_file.fields) {
				expect(field.name).toMatch(/^<.+>$/);
				expect(field.description).toBeTruthy();
			}
		});

		it('should have all bit flags with bits and description', () => {
			for (const flag of result.bit_flags) {
				expect(flag.bits).toBeTruthy();
				expect(flag.description).toBeTruthy();
			}
		});

		it('should not have duplicate field names in extension data', () => {
			const names = result.extension_data.fields.map(f => f.name);
			const unique = new Set(names);
			expect(unique.size).toBe(names.length);
		});

		it('should not have duplicate field names in map entire file', () => {
			const names = result.map_entire_file.fields.map(f => f.name);
			const unique = new Set(names);
			expect(unique.size).toBe(names.length);
		});
	});
});
