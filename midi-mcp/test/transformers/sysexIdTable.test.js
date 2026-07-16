import { describe, it, expect, beforeAll } from 'vitest';
import path from 'node:path';
import { transformSysexIdTable } from '../../lib/transformers/sysexIdTableTransformer.js';

describe('SysEx ID Table Transformer', () => {
	let result;

	beforeAll(async () => {
		const docPath = path.resolve(__dirname, '../../data/sysex-id-table-midi-org.md');
		result = await transformSysexIdTable(docPath);
	});

	it('should produce correct metadata', () => {
		expect(result.metadata.title).toBe('SysEx ID Table');
		expect(result.metadata.doc_id).toBe('SYSEX-ID-TABLE');
		expect(result.metadata.version).toBe('1.0.0');
		expect(result.metadata.source).toBe('sysex-id-table-midi-org.md');
	});

	describe('1-byte IDs', () => {
		it('should have 66 entries', () => {
			expect(result.one_byte_ids).toHaveLength(66);
			expect(result.summary.one_byte_count).toBe(66);
		});

		it('should parse 00H as [Used for ID Extensions]', () => {
			const entry = result.one_byte_ids.find(e => e.id === '00H');
			expect(entry).toBeDefined();
			expect(entry.company_name).toBe('[Used for ID Extensions]');
		});

		it('should parse 01H as Sequential Circuits', () => {
			const entry = result.one_byte_ids.find(e => e.id === '01H');
			expect(entry).toBeDefined();
			expect(entry.company_name).toBe('Sequential Circuits');
		});

		it('should parse 04H as Moog Music', () => {
			const entry = result.one_byte_ids.find(e => e.id === '04H');
			expect(entry).toBeDefined();
			expect(entry.company_name).toBe('Moog Music');
		});

		it('should parse 0FH as Ensoniq', () => {
			const entry = result.one_byte_ids.find(e => e.id === '0FH');
			expect(entry).toBeDefined();
			expect(entry.company_name).toBe('Ensoniq');
		});

		it('should parse 11H as Apple', () => {
			const entry = result.one_byte_ids.find(e => e.id === '11H');
			expect(entry).toBeDefined();
			expect(entry.company_name).toBe('Apple');
		});

		it('should parse 18H as E-mu', () => {
			const entry = result.one_byte_ids.find(e => e.id === '18H');
			expect(entry).toBeDefined();
			expect(entry.company_name).toBe('E-mu');
		});

		it('should parse 3FH as Quasimidi', () => {
			const entry = result.one_byte_ids.find(e => e.id === '3FH');
			expect(entry).toBeDefined();
			expect(entry.company_name).toBe('Quasimidi');
		});

		it('should parse range entry 40H to 5FH', () => {
			const entry = result.one_byte_ids.find(e => e.id === '40H to 5FH');
			expect(entry).toBeDefined();
			expect(entry.company_name).toContain('AMEI');
			expect(entry.company_name).toContain('Japanese');
		});

		it('should parse range entry 60H to 7FH', () => {
			const entry = result.one_byte_ids.find(e => e.id === '60H to 7FH');
			expect(entry).toBeDefined();
			expect(entry.company_name).toContain('Reserved');
		});
	});

	describe('3-byte IDs', () => {
		it('should have 689 entries', () => {
			expect(result.three_byte_ids).toHaveLength(689);
			expect(result.summary.three_byte_count).toBe(689);
		});

		it('should parse 00H 00H 01H as Time/Warner Interactive', () => {
			const entry = result.three_byte_ids.find(e => e.id === '00H 00H 01H');
			expect(entry).toBeDefined();
			expect(entry.company_name).toBe('Time/Warner Interactive');
		});

		it('should parse 00H 00H 0EH as Alesis Studio Electronics', () => {
			const entry = result.three_byte_ids.find(e => e.id === '00H 00H 0EH');
			expect(entry).toBeDefined();
			expect(entry.company_name).toBe('Alesis Studio Electronics');
		});

		it('should parse 00H 20H 21H as Creative ATC / E-mu', () => {
			const entry = result.three_byte_ids.find(e => e.id === '00H 20H 21H');
			expect(entry).toBeDefined();
			expect(entry.company_name).toBe('Creative ATC / E-mu');
		});

		it('should parse 00H 21H 1DH as Ableton', () => {
			const entry = result.three_byte_ids.find(e => e.id === '00H 21H 1DH');
			expect(entry).toBeDefined();
			expect(entry.company_name).toBe('Ableton');
		});

		it('should parse last entry 00H 22H 39H as Audio System Germany', () => {
			const last = result.three_byte_ids[result.three_byte_ids.length - 1];
			expect(last.id).toBe('00H 22H 39H');
			expect(last.company_name).toBe('Audio System Germany');
		});
	});

	describe('Japanese AMEI Group', () => {
		it('should have 30 entries', () => {
			expect(result.japanese_amei_group).toHaveLength(30);
			expect(result.summary.japanese_amei_group_count).toBe(30);
		});

		it('should parse 40H as Kawai', () => {
			const entry = result.japanese_amei_group.find(e => e.id === '40H');
			expect(entry).toBeDefined();
			expect(entry.company_name).toContain('Kawai');
		});

		it('should parse 41H as Roland', () => {
			const entry = result.japanese_amei_group.find(e => e.id === '41H');
			expect(entry).toBeDefined();
			expect(entry.company_name).toContain('Roland');
		});

		it('should parse 42H as Korg', () => {
			const entry = result.japanese_amei_group.find(e => e.id === '42H');
			expect(entry).toBeDefined();
			expect(entry.company_name).toContain('Korg');
		});

		it('should parse 43H as Yamaha', () => {
			const entry = result.japanese_amei_group.find(e => e.id === '43H');
			expect(entry).toBeDefined();
			expect(entry.company_name).toContain('Yamaha');
		});

		it('should parse 4CH as Sony', () => {
			const entry = result.japanese_amei_group.find(e => e.id === '4CH');
			expect(entry).toBeDefined();
			expect(entry.company_name).toContain('Sony');
		});

		it('should parse 00H 40H 06H as Pioneer', () => {
			const entry = result.japanese_amei_group.find(e => e.id === '00H 40H 06H');
			expect(entry).toBeDefined();
			expect(entry.company_name).toContain('Pioneer');
		});
	});

	describe('Japanese AMEI SysEx Holders', () => {
		it('should have 9 entries', () => {
			expect(result.japanese_amei_sysex_holders).toHaveLength(9);
			expect(result.summary.japanese_amei_sysex_holders_count).toBe(9);
		});

		it('should parse 00H 48H 00H as sigboost', () => {
			const entry = result.japanese_amei_sysex_holders.find(e => e.id === '00H 48H 00H');
			expect(entry).toBeDefined();
			expect(entry.company_name).toContain('sigboost');
		});

		it('should parse 00H 48H 08H as NITROPLASMA', () => {
			const entry = result.japanese_amei_sysex_holders.find(e => e.id === '00H 48H 08H');
			expect(entry).toBeDefined();
			expect(entry.company_name).toBe('NITROPLASMA');
		});
	});

	describe('Summary and data integrity', () => {
		it('should have correct total', () => {
			expect(result.summary.total).toBe(794);
		});

		it('should have all 1-byte entries with id and company_name', () => {
			for (const entry of result.one_byte_ids) {
				expect(entry.id).toMatch(/[0-9A-F]{2}H/);
				expect(entry.company_name).toBeTruthy();
			}
		});

		it('should have all 3-byte entries with 3 hex groups in id', () => {
			for (const entry of result.three_byte_ids) {
				const hexCount = (entry.id.match(/[0-9A-F]{2}H/g) || []).length;
				expect(hexCount).toBe(3);
				expect(entry.company_name).toBeTruthy();
			}
		});

		it('should have all Japanese AMEI Group entries with id and company_name', () => {
			for (const entry of result.japanese_amei_group) {
				expect(entry.id).toBeTruthy();
				expect(entry.company_name).toBeTruthy();
			}
		});

		it('should have all Japanese AMEI SysEx Holders entries with 3 hex groups', () => {
			for (const entry of result.japanese_amei_sysex_holders) {
				const hexCount = (entry.id.match(/[0-9A-F]{2}H/g) || []).length;
				expect(hexCount).toBe(3);
				expect(entry.company_name).toBeTruthy();
			}
		});
	});
});
