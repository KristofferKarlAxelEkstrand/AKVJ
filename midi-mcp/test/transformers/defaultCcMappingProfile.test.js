import { describe, it, expect, beforeAll } from 'vitest';
import path from 'node:path';
import { transformDefaultCcMappingProfile } from '../../lib/transformers/defaultCcMappingProfileTransformer.js';

describe('Default Control Change Mapping Profile Transformer', () => {
	let result;

	beforeAll(async () => {
		const docPath = path.resolve(__dirname, '../../data/m2-113-um-default-control-change-mapping-profile.md');
		result = await transformDefaultCcMappingProfile(docPath);
	});

	it('should produce correct metadata', () => {
		expect(result.metadata.title).toBe('Default Control Change Mapping Profile');
		expect(result.metadata.doc_id).toBe('M2-113-UM');
		expect(result.metadata.version).toBe('1.0.0');
		expect(result.metadata.source).toBe('m2-113-um-default-control-change-mapping-profile.md');
	});

	describe('Profile ID bytes', () => {
		it('should have 5 bytes', () => {
			expect(result.profile_id).toHaveLength(5);
			expect(result.summary.profile_id_byte_count).toBe(5);
		});

		it('should parse byte 1 as 0X7E Standard Defined Profile', () => {
			const byte = result.profile_id.find(b => b.byte_number === 1);
			expect(byte).toBeDefined();
			expect(byte.value).toBe('0X7E');
			expect(byte.description).toBe('Standard Defined Profile');
		});

		it('should parse byte 2 as 0X21 Default CC Mapping Profile Number MSB', () => {
			const byte = result.profile_id.find(b => b.byte_number === 2);
			expect(byte).toBeDefined();
			expect(byte.value).toBe('0X21');
			expect(byte.description).toBe('Default Control Change Mapping Profile Number MSB');
		});

		it('should parse byte 3 as 0X00 Default CC Mapping Profile Number LSB', () => {
			const byte = result.profile_id.find(b => b.byte_number === 3);
			expect(byte).toBeDefined();
			expect(byte.value).toBe('0X00');
			expect(byte.description).toBe('Default Control Change Mapping Profile Number LSB');
		});

		it('should parse byte 4 as 0X01 Default CC Mapping Profile Version', () => {
			const byte = result.profile_id.find(b => b.byte_number === 4);
			expect(byte).toBeDefined();
			expect(byte.value).toBe('0X01');
			expect(byte.description).toBe('Default Control Change Mapping Profile Version');
		});

		it('should parse byte 5 as 0XXX Default CC Mapping Profile Level', () => {
			const byte = result.profile_id.find(b => b.byte_number === 5);
			expect(byte).toBeDefined();
			expect(byte.value).toBe('0XXX');
			expect(byte.description).toContain('Level');
		});
	});

	describe('Appendix A: Control Changes', () => {
		it('should have 128 entries', () => {
			expect(result.appendix_a_control_changes).toHaveLength(128);
			expect(result.summary.control_change_count).toBe(128);
		});

		it('should parse CC 0 as Bank Select', () => {
			const cc = result.appendix_a_control_changes.find(c => c.decimal === 0);
			expect(cc).toBeDefined();
			expect(cc.hex).toBe('0X00');
			expect(cc.function).toBe('Bank Select');
			expect(cc.value).toBe('0-127');
			expect(cc.used_as).toBe('MSB');
			expect(cc.reset_value).toBe('Do Not Set');
		});

		it('should parse CC 1 as Modulation Wheel or Lever', () => {
			const cc = result.appendix_a_control_changes.find(c => c.decimal === 1);
			expect(cc).toBeDefined();
			expect(cc.hex).toBe('0X01');
			expect(cc.function).toBe('Modulation Wheel or Lever');
			expect(cc.value).toBe('0-127');
			expect(cc.used_as).toBe('MSB');
			expect(cc.reset_value).toBe('0');
		});

		it('should parse CC 3 as Undefined with Device Specific reset', () => {
			const cc = result.appendix_a_control_changes.find(c => c.decimal === 3);
			expect(cc).toBeDefined();
			expect(cc.reset_value).toBe('Device Specific');
		});

		it('should parse CC 7 as Channel Volume with Do Not Set reset', () => {
			const cc = result.appendix_a_control_changes.find(c => c.decimal === 7);
			expect(cc).toBeDefined();
			expect(cc.function).toContain('Channel Volume');
			expect(cc.value).toBe('0-127');
			expect(cc.used_as).toBe('MSB');
			expect(cc.reset_value).toBe('Do Not Set');
		});

		it('should parse CC 32 as LSB for Control 0 (Bank Select)', () => {
			const cc = result.appendix_a_control_changes.find(c => c.decimal === 32);
			expect(cc).toBeDefined();
			expect(cc.hex).toBe('0X20');
			expect(cc.function).toContain('LSB for Control 0');
			expect(cc.value).toBe('0-127');
			expect(cc.used_as).toBe('LSB');
			expect(cc.reset_value).toBe('Do Not Set');
		});

		it('should parse CC 64 as Damper Pedal with multiline value', () => {
			const cc = result.appendix_a_control_changes.find(c => c.decimal === 64);
			expect(cc).toBeDefined();
			expect(cc.hex).toBe('0X40');
			expect(cc.function).toContain('Damper Pedal');
			expect(cc.value).toContain('≤63 off');
			expect(cc.value).toContain('≥64 on');
			expect(cc.reset_value).toBe('0');
		});

		it('should parse CC 68 as Legato Footswitch with multiline value', () => {
			const cc = result.appendix_a_control_changes.find(c => c.decimal === 68);
			expect(cc).toBeDefined();
			expect(cc.function).toContain('Legato Footswitch');
			expect(cc.value).toContain('≤63 Normal');
			expect(cc.value).toContain('≥64 Legato');
			expect(cc.reset_value).toBe('0');
		});

		it('should parse CC 70 as Sound Controller 1', () => {
			const cc = result.appendix_a_control_changes.find(c => c.decimal === 70);
			expect(cc).toBeDefined();
			expect(cc.hex).toBe('0X46');
			expect(cc.function).toContain('Sound Controller 1');
			expect(cc.function).toContain('Sound Variation');
			expect(cc.value).toBe('0-127');
			expect(cc.used_as).toBe('LSB');
			expect(cc.reset_value).toBe('Do Not Set');
		});

		it('should parse CC 71 as Sound Controller 2 with bare hex', () => {
			const cc = result.appendix_a_control_changes.find(c => c.decimal === 71);
			expect(cc).toBeDefined();
			expect(cc.hex).toBe('0X47');
			expect(cc.function).toContain('Sound Controller 2');
			expect(cc.function).toContain('Timbre');
		});

		it('should parse CC 96 as Data Increment', () => {
			const cc = result.appendix_a_control_changes.find(c => c.decimal === 96);
			expect(cc).toBeDefined();
			expect(cc.hex).toBe('0X60');
			expect(cc.function).toContain('Data Increment');
			expect(cc.value).toBe('N/A');
			expect(cc.reset_value).toBe('Do Not Set');
		});

		it('should parse CC 100 as RPN LSB', () => {
			const cc = result.appendix_a_control_changes.find(c => c.decimal === 100);
			expect(cc).toBeDefined();
			expect(cc.hex).toBe('0X64');
			expect(cc.function).toContain('Registered Parameter Number');
			expect(cc.function).toContain('LSB');
			expect(cc.value).toBe('0-127');
			expect(cc.used_as).toBe('LSB');
			expect(cc.reset_value).toBe('127');
		});

		it('should parse CC 120 as All Sound Off', () => {
			const cc = result.appendix_a_control_changes.find(c => c.decimal === 120);
			expect(cc).toBeDefined();
			expect(cc.hex).toBe('0X78');
			expect(cc.function).toContain('All Sound Off');
			expect(cc.value).toBe('0');
			expect(cc.reset_value).toBe('Do Not Set');
		});

		it('should parse CC 126 as Mono Mode On with Do Not Set reset', () => {
			const cc = result.appendix_a_control_changes.find(c => c.decimal === 126);
			expect(cc).toBeDefined();
			expect(cc.hex).toBe('0X7E');
			expect(cc.function).toContain('Mono Mode On');
			expect(cc.reset_value).toBe('Do Not Set');
		});

		it('should parse CC 127 as Poly Mode On', () => {
			const cc = result.appendix_a_control_changes.find(c => c.decimal === 127);
			expect(cc).toBeDefined();
			expect(cc.hex).toBe('0X7F');
			expect(cc.function).toContain('Poly Mode On');
			expect(cc.value).toBe('0');
			expect(cc.reset_value).toBe('Do Not Set');
		});

		it('should have all entries with decimal 0-127', () => {
			for (let i = 0; i < 128; i++) {
				const cc = result.appendix_a_control_changes.find(c => c.decimal === i);
				expect(cc).toBeDefined();
			}
		});

		it('should have all entries with valid hex', () => {
			for (const cc of result.appendix_a_control_changes) {
				expect(cc.hex).toMatch(/^0X[0-9A-F]{2}$/);
			}
		});

		it('should have all entries with non-empty function', () => {
			for (const cc of result.appendix_a_control_changes) {
				expect(cc.function).toBeTruthy();
			}
		});

		it('should have 63 entries with Device Specific reset', () => {
			const ds = result.appendix_a_control_changes.filter(c => c.reset_value === 'Device Specific');
			expect(ds).toHaveLength(63);
		});

		it('should have no entries with empty reset_value', () => {
			const empty = result.appendix_a_control_changes.filter(c => c.reset_value === '');
			expect(empty).toHaveLength(0);
		});
	});

	describe('Appendix B: Volume curve', () => {
		it('should have 5 entries', () => {
			expect(result.appendix_b_volume_curve).toHaveLength(5);
			expect(result.summary.volume_curve_entry_count).toBe(5);
		});

		it('should parse 127 as 0 dB', () => {
			const entry = result.appendix_b_volume_curve.find(e => e.cc_value === 127);
			expect(entry).toBeDefined();
			expect(entry.amplitude).toBe('0 dB');
			expect(entry.proportional_to).toContain('16129');
		});

		it('should parse 16 as -36.0 dB', () => {
			const entry = result.appendix_b_volume_curve.find(e => e.cc_value === 16);
			expect(entry).toBeDefined();
			expect(entry.amplitude).toBe('-36.0 dB');
		});

		it('should parse 96 as -4.9 dB', () => {
			const entry = result.appendix_b_volume_curve.find(e => e.cc_value === 96);
			expect(entry).toBeDefined();
			expect(entry.amplitude).toBe('-4.9 dB');
		});
	});

	describe('Appendix B: Expression curve', () => {
		it('should have 10 entries', () => {
			expect(result.appendix_b_expression_curve).toHaveLength(10);
			expect(result.summary.expression_curve_entry_count).toBe(10);
		});

		it('should parse 127/127 as 0 dB', () => {
			const entry = result.appendix_b_expression_curve.find(e => e.cc7 === 127 && e.cc11 === 127);
			expect(entry).toBeDefined();
			expect(entry.amplitude).toBe('0 dB');
		});

		it('should parse 127/32 as -23.9 dB', () => {
			const entry = result.appendix_b_expression_curve.find(e => e.cc7 === 127 && e.cc11 === 32);
			expect(entry).toBeDefined();
			expect(entry.amplitude).toBe('-23.9 dB');
		});

		it('should parse 64/64 as -23.8 dB', () => {
			const entry = result.appendix_b_expression_curve.find(e => e.cc7 === 64 && e.cc11 === 64);
			expect(entry).toBeDefined();
			expect(entry.amplitude).toBe('-23.8 dB');
		});
	});

	describe('Revision history', () => {
		it('should have 1 entry', () => {
			expect(result.revision_history).toHaveLength(1);
			expect(result.summary.revision_history_count).toBe(1);
		});

		it('should parse Nov. 26, 2020 v1.0 Initial Version', () => {
			const entry = result.revision_history[0];
			expect(entry.date).toContain('Nov. 26, 2020');
			expect(entry.version).toBe('1.0');
			expect(entry.changes).toBe('Initial Version');
		});
	});

	describe('Notes', () => {
		it('should have 2 notes', () => {
			expect(result.notes).toHaveLength(2);
			expect(result.summary.note_count).toBe(2);
		});

		it('should contain note about Control Change numbers', () => {
			const note = result.notes.find(n => n.includes('Control Change numbers'));
			expect(note).toBeDefined();
		});

		it('should contain note about Registered Parameter Numbers', () => {
			const note = result.notes.find(n => n.includes('Registered Parameter Numbers'));
			expect(note).toBeDefined();
		});
	});

	describe('Summary', () => {
		it('should have correct counts', () => {
			expect(result.summary.profile_id_byte_count).toBe(5);
			expect(result.summary.control_change_count).toBe(128);
			expect(result.summary.volume_curve_entry_count).toBe(5);
			expect(result.summary.expression_curve_entry_count).toBe(10);
			expect(result.summary.revision_history_count).toBe(1);
			expect(result.summary.note_count).toBe(2);
		});
	});
});
