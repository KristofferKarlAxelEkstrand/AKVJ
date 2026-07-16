import { describe, it, expect, beforeAll } from 'vitest';
import path from 'node:path';
import { transformSysexIds } from '../../lib/transformers/sysexIdTransformer.js';

describe('SysEx ID Table Transformer', () => {
	let result;

	beforeAll(async () => {
		const docPath = path.resolve(__dirname, '../../data/sysex-id-table-midi-org.md');
		result = await transformSysexIds(docPath);
	});

	it('should produce correct metadata', () => {
		expect(result.metadata.title).toBe('SysEx ID Table');
		expect(result.metadata.version).toBe('1.0.0');
		expect(result.metadata.source).toBe('sysex-id-table-midi-org.md');
	});

	it('should have 5 groups', () => {
		expect(result.groups).toHaveLength(5);
	});

	it('should not have any empty groups', () => {
		for (const group of result.groups) {
			expect(group.entries.length).toBeGreaterThan(0);
		}
	});

	describe('Group 0: Assigned Manufacturer MIDI SysEx ID Numbers', () => {
		const group = () => result.groups[0];

		it('should have correct name and id_type', () => {
			expect(group().name).toBe('Assigned Manufacturer MIDI SysEx ID Numbers');
			expect(group().id_type).toBe('one_byte');
		});

		it('should have 66 entries (64 single + 2 ranges)', () => {
			expect(group().entries).toHaveLength(66);
		});

		it('should parse 00H as first entry with id field', () => {
			const first = group().entries[0];
			expect(first.id_hex).toBe('00H');
			expect(first.id).toBe('00');
			expect(first.company).toBe('[Used for ID Extensions]');
			expect(first.id_range).toBeUndefined();
			expect(first.id_bytes).toBeUndefined();
		});

		it('should parse 01H (Sequential Circuits)', () => {
			const entry = group().entries.find(e => e.id === '01');
			expect(entry).toBeDefined();
			expect(entry.company).toBe('Sequential Circuits');
		});

		it('should parse 3FH (Quasimidi) as last single-byte entry', () => {
			const entry = group().entries.find(e => e.id === '3F');
			expect(entry).toBeDefined();
			expect(entry.company).toBe('Quasimidi');
		});

		it('should parse 40H to 5FH range with id_range field', () => {
			const range = group().entries.find(e => e.id_range);
			expect(range).toBeDefined();
			expect(range.id_hex).toBe('40H to 5FH');
			expect(range.id_range).toEqual(['40', '5F']);
			expect(range.company).toBe('[Assigned by AMEI for Japanese Manufacturers]');
			expect(range.id).toBeUndefined();
		});

		it('should parse 60H to 7FH range as last entry', () => {
			const last = group().entries[65];
			expect(last.id_hex).toBe('60H to 7FH');
			expect(last.id_range).toEqual(['60', '7F']);
			expect(last.company).toBe('[Reserved for Other Uses]');
		});

		it('should have all entries with either id or id_range', () => {
			for (const entry of group().entries) {
				expect(entry.id_hex).toBeDefined();
				expect(entry.company).toBeTruthy();
				expect(entry.id_bytes).toBeUndefined();
				if (!entry.id_range) {
					expect(entry.id).toBeDefined();
				}
			}
		});
	});

	describe('Group 1: Standard Three-Byte IDs', () => {
		const group = () => result.groups[1];

		it('should have correct name and id_type', () => {
			expect(group().name).toBe('Standard Three-Byte IDs');
			expect(group().id_type).toBe('three_byte');
		});

		it('should have 377 entries', () => {
			expect(group().entries).toHaveLength(377);
		});

		it('should parse first entry (00H 00H 01H, Time/Warner Interactive)', () => {
			const first = group().entries[0];
			expect(first.id_hex).toBe('00H 00H 01H');
			expect(first.id_bytes).toEqual(['00', '00', '01']);
			expect(first.company).toBe('Time/Warner Interactive');
			expect(first.id).toBeUndefined();
			expect(first.id_range).toBeUndefined();
		});

		it('should parse last entry (00H 02H 7AH, Walrus Audio)', () => {
			const last = group().entries[group().entries.length - 1];
			expect(last.id_hex).toBe('00H 02H 7AH');
			expect(last.id_bytes).toEqual(['00', '02', '7A']);
			expect(last.company).toBe('Walrus Audio');
		});

		it('should preserve duplicate 00H 00H 01H entries from source', () => {
			const dups = group().entries.filter(e => e.id_hex === '00H 00H 01H');
			expect(dups).toHaveLength(2);
			expect(dups[0].company).toBe('Time/Warner Interactive');
			expect(dups[1].company).toBe('Time/Warner Interactive');
		});

		it('should parse 00H 01H 05H (M-Audio)', () => {
			const entry = group().entries.find(e => e.id_hex === '00H 01H 05H');
			expect(entry).toBeDefined();
			expect(entry.company).toBe('M-Audio (Midiman)');
		});

		it('should parse 00H 01H 06H (PreSonus)', () => {
			const entry = group().entries.find(e => e.id_hex === '00H 01H 06H');
			expect(entry).toBeDefined();
			expect(entry.company).toBe('PreSonus');
		});

		it('should parse 00H 02H 0DH (Google)', () => {
			const entry = group().entries.find(e => e.id_hex === '00H 02H 0DH');
			expect(entry).toBeDefined();
			expect(entry.company).toBe('Google');
		});

		it('should have all entries with id_bytes and no id or id_range', () => {
			for (const entry of group().entries) {
				expect(entry.id_hex).toBeDefined();
				expect(entry.id_bytes).toBeDefined();
				expect(entry.id_bytes).toHaveLength(3);
				expect(entry.company).toBeTruthy();
				expect(entry.id).toBeUndefined();
				expect(entry.id_range).toBeUndefined();
			}
		});
	});

	describe('Group 2: European & Asian Group', () => {
		const group = () => result.groups[2];

		it('should have correct name and id_type', () => {
			expect(group().name).toBe('European & Asian Group');
			expect(group().id_type).toBe('three_byte');
		});

		it('should have 312 entries', () => {
			expect(group().entries).toHaveLength(312);
		});

		it('should parse first entry (00H 20H 00H, Dream SAS)', () => {
			const first = group().entries[0];
			expect(first.id_hex).toBe('00H 20H 00H');
			expect(first.id_bytes).toEqual(['00', '20', '00']);
			expect(first.company).toBe('Dream SAS');
		});

		it('should parse last entry (00H 22H 39H, Audio System Germany)', () => {
			const last = group().entries[group().entries.length - 1];
			expect(last.id_hex).toBe('00H 22H 39H');
			expect(last.company).toBe('Audio System Germany');
		});

		it('should parse 00H 20H 6BH (Arturia)', () => {
			const entry = group().entries.find(e => e.id_hex === '00H 20H 6BH');
			expect(entry).toBeDefined();
			expect(entry.company).toBe('Arturia');
		});

		it('should parse 00H 21H 09H (Native Instruments)', () => {
			const entry = group().entries.find(e => e.id_hex === '00H 21H 09H');
			expect(entry).toBeDefined();
			expect(entry.company).toBe('Native Instruments');
		});

		it('should parse 00H 21H 1DH (Ableton)', () => {
			const entry = group().entries.find(e => e.id_hex === '00H 21H 1DH');
			expect(entry).toBeDefined();
			expect(entry.company).toBe('Ableton');
		});
	});

	describe('Group 3: Japanese (AMEI) Group', () => {
		const group = () => result.groups[3];

		it('should have correct name and id_type', () => {
			expect(group().name).toBe('Japanese (AMEI) Group');
			expect(group().id_type).toBe('mixed');
		});

		it('should have 30 entries (22 one-byte + 8 three-byte)', () => {
			expect(group().entries).toHaveLength(30);
			const oneByte = group().entries.filter(e => e.id);
			const threeByte = group().entries.filter(e => e.id_bytes);
			expect(oneByte).toHaveLength(22);
			expect(threeByte).toHaveLength(8);
		});

		it('should parse 41H (Roland)', () => {
			const entry = group().entries.find(e => e.id === '41');
			expect(entry).toBeDefined();
			expect(entry.id_hex).toBe('41H');
			expect(entry.company).toBe('Roland Corporation');
		});

		it('should parse 43H (Yamaha)', () => {
			const entry = group().entries.find(e => e.id === '43');
			expect(entry).toBeDefined();
			expect(entry.company).toBe('Yamaha Corporation');
		});

		it('should parse 42H (Korg)', () => {
			const entry = group().entries.find(e => e.id === '42');
			expect(entry).toBeDefined();
			expect(entry.company).toBe('Korg Inc.');
		});

		it('should parse 00H 40H 00H (Crimson Technology)', () => {
			const entry = group().entries.find(e => e.id_hex === '00H 40H 00H');
			expect(entry).toBeDefined();
			expect(entry.id_bytes).toEqual(['00', '40', '00']);
			expect(entry.company).toBe('Crimson Technology Inc.');
		});

		it('should parse 00H 40H 06H (Pioneer)', () => {
			const entry = group().entries.find(e => e.id_hex === '00H 40H 06H');
			expect(entry).toBeDefined();
			expect(entry.company).toBe('Pioneer Corporation');
		});
	});

	describe('Group 4: Japanese (AMEI) SysEx Id Holders', () => {
		const group = () => result.groups[4];

		it('should have correct name and id_type', () => {
			expect(group().name).toBe('Japanese (AMEI) SysEx Id Holders');
			expect(group().id_type).toBe('three_byte');
		});

		it('should have 9 entries', () => {
			expect(group().entries).toHaveLength(9);
		});

		it('should parse first entry (00H 48H 00H, sigboost Inc.)', () => {
			const first = group().entries[0];
			expect(first.id_hex).toBe('00H 48H 00H');
			expect(first.id_bytes).toEqual(['00', '48', '00']);
			expect(first.company).toBe('sigboost Inc.');
		});

		it('should parse last entry (00H 48H 08H, NITROPLASMA)', () => {
			const last = group().entries[group().entries.length - 1];
			expect(last.id_hex).toBe('00H 48H 08H');
			expect(last.company).toBe('NITROPLASMA');
		});

		it('should preserve duplicate 00H 48H 00H from source', () => {
			const dups = group().entries.filter(e => e.id_hex === '00H 48H 00H');
			expect(dups).toHaveLength(2);
			expect(dups[0].company).toBe('sigboost Inc.');
			expect(dups[1].company).toBe('Sonicware Co., Ltd.');
		});
	});

	describe('Data integrity', () => {
		it('should not have any hallucinated or dropped data', () => {
			for (const group of result.groups) {
				expect(group.name).toBeTruthy();
				expect(['one_byte', 'three_byte', 'mixed']).toContain(group.id_type);

				for (const entry of group.entries) {
					expect(entry.id_hex).toBeTruthy();
					expect(entry.company).toBeTruthy();

					if (entry.id) {
						expect(entry.id).toMatch(/^[0-9A-F]{2}$/);
					}
					if (entry.id_range) {
						expect(entry.id_range).toHaveLength(2);
						for (const r of entry.id_range) {
							expect(r).toMatch(/^[0-9A-F]{2}$/);
						}
					}
					if (entry.id_bytes) {
						expect(entry.id_bytes).toHaveLength(3);
						for (const b of entry.id_bytes) {
							expect(b).toMatch(/^[0-9A-F]{2}$/);
						}
					}
				}
			}
		});

		it('should have 794 total entries across all groups', () => {
			const total = result.groups.reduce((sum, g) => sum + g.entries.length, 0);
			expect(total).toBe(794);
		});
	});
});
