import { describe, it, expect, beforeAll } from 'vitest';
import path from 'node:path';
import { transformControlChangeMessages } from '../../lib/transformers/controlChangeMessagesTransformer.js';

describe('MIDI 1.0 Control Change Messages Transformer', () => {
	let result;

	beforeAll(async () => {
		const docPath = path.resolve(__dirname, '../../data/midi-1-0-control-change-messages-data-bytes-midi-org.md');
		result = await transformControlChangeMessages(docPath);
	});

	it('should produce correct metadata', () => {
		expect(result.metadata.title).toBe('MIDI 1.0 Control Change Messages (Data Bytes)');
		expect(result.metadata.doc_id).toBe('CC-MESSAGES');
		expect(result.metadata.version).toBe('1.0.0');
		expect(result.metadata.source).toBe('midi-1-0-control-change-messages-data-bytes-midi-org.md');
	});

	describe('Table 3: Control Changes', () => {
		it('should have 128 entries', () => {
			expect(result.table_3_control_changes).toHaveLength(128);
			expect(result.summary.control_change_count).toBe(128);
		});

		it('should parse CC 0 (Bank Select)', () => {
			const cc = result.table_3_control_changes.find(c => c.decimal === 0);
			expect(cc).toBeDefined();
			expect(cc.binary).toBe('00000000');
			expect(cc.hex).toBe('00');
			expect(cc.function).toBe('Bank Select');
			expect(cc.value).toBe('0-127');
			expect(cc.used_as).toBe('MSB');
		});

		it('should parse CC 1 (Modulation Wheel)', () => {
			const cc = result.table_3_control_changes.find(c => c.decimal === 1);
			expect(cc).toBeDefined();
			expect(cc.hex).toBe('01');
			expect(cc.function).toBe('Modulation Wheel or Lever');
			expect(cc.used_as).toBe('MSB');
		});

		it('should parse CC 6 (Data Entry MSB)', () => {
			const cc = result.table_3_control_changes.find(c => c.decimal === 6);
			expect(cc).toBeDefined();
			expect(cc.function).toBe('Data Entry MSB');
		});

		it('should parse CC 7 (Channel Volume)', () => {
			const cc = result.table_3_control_changes.find(c => c.decimal === 7);
			expect(cc).toBeDefined();
			expect(cc.function).toBe('Channel Volume (formerly Main Volume)');
		});

		it('should parse CC 10 (Pan)', () => {
			const cc = result.table_3_control_changes.find(c => c.decimal === 10);
			expect(cc).toBeDefined();
			expect(cc.hex).toBe('0A');
			expect(cc.function).toBe('Pan');
		});

		it('should parse CC 32 (Bank Select LSB)', () => {
			const cc = result.table_3_control_changes.find(c => c.decimal === 32);
			expect(cc).toBeDefined();
			expect(cc.hex).toBe('20');
			expect(cc.function).toBe('LSB for Control 0 (Bank Select)');
			expect(cc.used_as).toBe('LSB');
		});

		it('should parse CC 64 (Damper Pedal)', () => {
			const cc = result.table_3_control_changes.find(c => c.decimal === 64);
			expect(cc).toBeDefined();
			expect(cc.hex).toBe('40');
			expect(cc.function).toBe('Damper Pedal on/off (Sustain)');
			expect(cc.value).toBe('≤63 off, ≥64 on');
		});

		it('should parse CC 96 (Data Increment)', () => {
			const cc = result.table_3_control_changes.find(c => c.decimal === 96);
			expect(cc).toBeDefined();
			expect(cc.hex).toBe('60');
			expect(cc.function).toContain('Data Increment');
		});

		it('should parse CC 97 (Data Decrement)', () => {
			const cc = result.table_3_control_changes.find(c => c.decimal === 97);
			expect(cc).toBeDefined();
			expect(cc.function).toContain('Data Decrement');
		});

		it('should parse CC 100 (RPN LSB)', () => {
			const cc = result.table_3_control_changes.find(c => c.decimal === 100);
			expect(cc).toBeDefined();
			expect(cc.function).toContain('Registered Parameter Number');
			expect(cc.function).toContain('LSB');
		});

		it('should parse CC 101 (RPN MSB)', () => {
			const cc = result.table_3_control_changes.find(c => c.decimal === 101);
			expect(cc).toBeDefined();
			expect(cc.function).toContain('Registered Parameter Number');
			expect(cc.function).toContain('MSB');
		});

		it('should parse CC 120 (All Sound Off)', () => {
			const cc = result.table_3_control_changes.find(c => c.decimal === 120);
			expect(cc).toBeDefined();
			expect(cc.hex).toBe('78');
			expect(cc.function).toContain('All Sound Off');
			expect(cc.function).toContain('Channel Mode Message');
		});

		it('should parse CC 123 (All Notes Off)', () => {
			const cc = result.table_3_control_changes.find(c => c.decimal === 123);
			expect(cc).toBeDefined();
			expect(cc.function).toContain('All Notes Off');
		});

		it('should parse CC 127 (Poly Mode On)', () => {
			const cc = result.table_3_control_changes.find(c => c.decimal === 127);
			expect(cc).toBeDefined();
			expect(cc.hex).toBe('7F');
			expect(cc.function).toContain('Poly Mode On');
		});

		it('should have sequential decimal numbers 0-127', () => {
			for (let i = 0; i < 128; i++) {
				expect(result.table_3_control_changes[i].decimal).toBe(i);
			}
		});
	});

	describe('Table 3a: RPN Entries', () => {
		it('should have 20 entries', () => {
			expect(result.table_3a_rpn_entries).toHaveLength(20);
			expect(result.summary.rpn_entry_count).toBe(20);
		});

		it('should parse 00H as Pitch Bend Sensitivity', () => {
			const rpn = result.table_3a_rpn_entries.find(r => r.parameter_number === '00H' && r.description.includes('Pitch Bend'));
			expect(rpn).toBeDefined();
			expect(rpn.description).toContain('Pitch Bend Sensitivity');
		});

		it('should parse 01H as Channel Fine Tuning', () => {
			const rpn = result.table_3a_rpn_entries.find(r => r.parameter_number === '01H');
			expect(rpn).toBeDefined();
			expect(rpn.description).toContain('Channel Fine Tuning');
		});

		it('should parse 02H as Channel Coarse Tuning', () => {
			const rpn = result.table_3a_rpn_entries.find(r => r.parameter_number === '02H');
			expect(rpn).toBeDefined();
			expect(rpn.description).toContain('Channel Coarse Tuning');
		});

		it('should parse 03H as Tuning Program Change', () => {
			const rpn = result.table_3a_rpn_entries.find(r => r.parameter_number === '03H');
			expect(rpn).toBeDefined();
			expect(rpn.description).toContain('Tuning Program Change');
		});

		it('should parse 04H as Tuning Bank Select', () => {
			const rpn = result.table_3a_rpn_entries.find(r => r.parameter_number === '04H');
			expect(rpn).toBeDefined();
			expect(rpn.description).toContain('Tuning Bank Select');
		});

		it('should parse 05H as Modulation Depth Range', () => {
			const rpn = result.table_3a_rpn_entries.find(r => r.parameter_number === '05H');
			expect(rpn).toBeDefined();
			expect(rpn.description).toContain('Modulation Depth Range');
		});

		it('should parse 06H as MPE Configuration', () => {
			const rpn = result.table_3a_rpn_entries.find(r => r.parameter_number === '06H');
			expect(rpn).toBeDefined();
			expect(rpn.description).toContain('MPE');
		});

		it('should parse 3DH (61) as Three Dimensional Sound Controllers', () => {
			const rpn = result.table_3a_rpn_entries.find(r => r.parameter_number === '3DH (61)');
			expect(rpn).toBeDefined();
			expect(rpn.description).toContain('Three Dimensional Sound Controllers');
		});

		it('should parse 3D sub-entry 00H as AZIMUTH ANGLE', () => {
			const rpn = result.table_3a_rpn_entries.find(r => r.parameter_number === '00H' && r.description.includes('AZIMUTH'));
			expect(rpn).toBeDefined();
			expect(rpn.description).toContain('AZIMUTH ANGLE');
		});

		it('should parse 3D sub-entry 08H as ROLL ANGLE', () => {
			const rpn = result.table_3a_rpn_entries.find(r => r.parameter_number === '08H');
			expect(rpn).toBeDefined();
			expect(rpn.description).toContain('ROLL ANGLE');
		});

		it('should parse 7FH as Null Function Number', () => {
			const rpn = result.table_3a_rpn_entries.find(r => r.parameter_number === '7FH');
			expect(rpn).toBeDefined();
			expect(rpn.description).toContain('Null Function Number');
		});
	});

	describe('Data integrity', () => {
		it('should have all CC entries with decimal, binary, hex, function, value, used_as', () => {
			for (const cc of result.table_3_control_changes) {
				expect(cc.decimal).toBeGreaterThanOrEqual(0);
				expect(cc.decimal).toBeLessThanOrEqual(127);
				expect(cc.binary).toMatch(/^[01]{8}$/);
				expect(cc.hex).toMatch(/^[0-9A-F]{2}$/);
				expect(cc.function).toBeTruthy();
				expect(cc.value).toBeTruthy();
				expect(cc.used_as).toBeTruthy();
			}
		});

		it('should have all RPN entries with parameter_number and description', () => {
			for (const rpn of result.table_3a_rpn_entries) {
				expect(rpn.parameter_number).toBeTruthy();
				expect(rpn.description).toBeTruthy();
			}
		});

		it('should have correct hex values matching decimal numbers', () => {
			for (const cc of result.table_3_control_changes) {
				expect(parseInt(cc.hex, 16)).toBe(cc.decimal);
			}
		});
	});
});
