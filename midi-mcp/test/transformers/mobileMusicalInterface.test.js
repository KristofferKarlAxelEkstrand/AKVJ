import { describe, it, expect, beforeAll } from 'vitest';
import path from 'node:path';
import { transformMobileMusicalInterface } from '../../lib/transformers/mobileMusicalInterfaceTransformer.js';

describe('Mobile Musical Interface (RP-048/amd1) Transformer', () => {
	let result;

	beforeAll(async () => {
		const docPath = path.resolve(__dirname, '../../data/rp48amd1-spec.md');
		result = await transformMobileMusicalInterface(docPath);
	});

	it('should produce correct metadata', () => {
		expect(result.metadata.title).toBe('Mobile Musical Interface Specification');
		expect(result.metadata.doc_id).toBe('RP-048/amd1');
		expect(result.metadata.protocol).toBe('midi1');
		expect(result.metadata.source).toBe('rp48amd1-spec.md');
	});

	describe('Numeric Keypad Melodic Assignments', () => {
		it('should have 6 assignments', () => {
			expect(result.numeric_keypad_melodic_assignments).toHaveLength(6);
			expect(result.summary.melodic_assignment_count).toBe(6);
		});

		it('should have 12 entries each', () => {
			for (const assignment of result.numeric_keypad_melodic_assignments) {
				expect(assignment.entries).toHaveLength(12);
			}
		});

		it('should parse Default with Root on key 1', () => {
			const def = result.numeric_keypad_melodic_assignments[0];
			expect(def.name).toContain('Default');
			expect(def.entries[0].key).toBe('1');
			expect(def.entries[0].value).toBe('Root');
		});

		it('should parse Default with 12th on key #', () => {
			const def = result.numeric_keypad_melodic_assignments[0];
			expect(def.entries[11].key).toBe('#');
			expect(def.entries[11].value).toBe('12th');
		});

		it('should parse Option 1 with 4th(Oct Down) on key 1', () => {
			const opt1 = result.numeric_keypad_melodic_assignments[1];
			expect(opt1.name).toContain('Option 1');
			expect(opt1.entries[0].value).toBe('4th(Oct Down)');
		});
	});

	describe('Numeric Keypad Drum Assignments', () => {
		it('should have 4 assignments', () => {
			expect(result.numeric_keypad_drum_assignments).toHaveLength(4);
			expect(result.summary.drum_assignment_count).toBe(4);
		});

		it('should have 12 entries each', () => {
			for (const assignment of result.numeric_keypad_drum_assignments) {
				expect(assignment.entries).toHaveLength(12);
			}
		});

		it('should parse Drum Set 1 with Crash Cymbal 1 on key 1', () => {
			const ds1 = result.numeric_keypad_drum_assignments[0];
			expect(ds1.name).toContain('Drum Set 1');
			expect(ds1.entries[0].key).toBe('1');
			expect(ds1.entries[0].value).toBe('Crash Cymbal 1');
		});

		it('should parse Drum Set 1 with Bass Drum 1 on key *', () => {
			const ds1 = result.numeric_keypad_drum_assignments[0];
			const bass = ds1.entries.find(e => e.key === '*');
			expect(bass.value).toBe('Bass Drum 1');
		});

		it('should parse Percussion Set 2 with Open Triangle on key #', () => {
			const ps2 = result.numeric_keypad_drum_assignments[3];
			expect(ps2.name).toContain('Percussion Set 2');
			expect(ps2.entries[11].value).toBe('Open Triangle');
		});
	});

	describe('GM1 Drum Division', () => {
		it('should have 47 entries', () => {
			expect(result.gm1_drum_division).toHaveLength(47);
			expect(result.summary.gm1_drum_division_count).toBe(47);
		});

		it('should parse key 35 as Acoustic Bass Drum', () => {
			const entry = result.gm1_drum_division[0];
			expect(entry.key_number).toBe(35);
			expect(entry.instrument).toBe('Acoustic Bass Drum');
		});

		it('should parse key 36 as Bass Drum 1', () => {
			const entry = result.gm1_drum_division[1];
			expect(entry.key_number).toBe(36);
			expect(entry.instrument).toBe('Bass Drum 1');
		});

		it('should parse key 81 as Open Triangle', () => {
			const entry = result.gm1_drum_division.find(e => e.key_number === 81);
			expect(entry).toBeDefined();
			expect(entry.instrument).toBe('Open Triangle');
		});
	});

	describe('Directional Pad Melodic', () => {
		it('should have 8 entries', () => {
			expect(result.directional_pad_melodic).toHaveLength(8);
			expect(result.summary.directional_pad_melodic_count).toBe(8);
		});

		it('should contain halftone up entry', () => {
			expect(result.directional_pad_melodic.some(d => d.includes('Halftone up'))).toBe(true);
		});

		it('should contain octave up entry', () => {
			expect(result.directional_pad_melodic.some(d => d.includes('Octave up'))).toBe(true);
		});
	});

	describe('Directional Pad Drum', () => {
		it('should have entries', () => {
			expect(result.directional_pad_drum.length).toBeGreaterThan(0);
			expect(result.summary.directional_pad_drum_count).toBeGreaterThan(0);
		});

		it('should contain volume accent entry', () => {
			expect(result.directional_pad_drum.some(d => d.includes('Volume accent'))).toBe(true);
		});

		it('should contain change drum set entry', () => {
			expect(result.directional_pad_drum.some(d => d.includes('Change drum set'))).toBe(true);
		});
	});

	describe('Center Octave Table', () => {
		it('should have 128 entries', () => {
			expect(result.center_octave_table).toHaveLength(128);
			expect(result.summary.center_octave_count).toBe(128);
		});

		it('should parse PC#0 as Acoustic Grand Piano with center 0', () => {
			const entry = result.center_octave_table[0];
			expect(entry.pc_number).toBe(0);
			expect(entry.instrument).toBe('Acoustic Grand Piano');
			expect(entry.center_octave).toBe('0');
		});

		it('should parse PC#8 as Celesta with center +2', () => {
			const entry = result.center_octave_table.find(e => e.pc_number === 8);
			expect(entry).toBeDefined();
			expect(entry.instrument).toBe('Celesta');
			expect(entry.center_octave).toBe('+2');
		});

		it('should parse PC#127 as Gunshot with center 0', () => {
			const entry = result.center_octave_table.find(e => e.pc_number === 127);
			expect(entry).toBeDefined();
			expect(entry.instrument).toBe('Gunshot');
			expect(entry.center_octave).toBe('0');
		});
	});

	describe('Recommended Settings', () => {
		it('should have 7 settings', () => {
			expect(result.recommended_settings).toHaveLength(7);
			expect(result.summary.recommended_setting_count).toBe(7);
		});

		it('should parse Instrument type with default Melodic', () => {
			const setting = result.recommended_settings[0];
			expect(setting.setting_number).toBe(1);
			expect(setting.setting_name).toBe('Instrument type');
			expect(setting.default_value).toBe('Melodic');
		});

		it('should parse Root key with default 0 (=C)', () => {
			const setting = result.recommended_settings.find(s => s.setting_number === 3);
			expect(setting.setting_name).toBe('Root key');
			expect(setting.default_value).toBe('0 (=C)');
		});

		it('should parse Scale with default Major', () => {
			const setting = result.recommended_settings.find(s => s.setting_number === 5);
			expect(setting.setting_name).toBe('Scale');
			expect(setting.default_value).toBe('Major');
		});

		it('should parse Program number with range 0～127', () => {
			const setting = result.recommended_settings.find(s => s.setting_number === 6);
			expect(setting.setting_name).toBe('Program number');
			expect(setting.range).toContain('0');
			expect(setting.range).toContain('127');
			expect(setting.default_value).toBe('0');
		});
	});

	describe('Summary', () => {
		it('should have correct counts', () => {
			expect(result.summary.melodic_assignment_count).toBe(6);
			expect(result.summary.drum_assignment_count).toBe(4);
			expect(result.summary.gm1_drum_division_count).toBe(47);
			expect(result.summary.center_octave_count).toBe(128);
			expect(result.summary.recommended_setting_count).toBe(7);
		});
	});
});
