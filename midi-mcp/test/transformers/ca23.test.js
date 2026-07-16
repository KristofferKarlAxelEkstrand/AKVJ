import { describe, it, expect, beforeAll } from 'vitest';
import path from 'node:path';
import { transformCa23 } from '../../lib/transformers/ca23Transformer.js';

describe('CA-023 Key-Based Instrument Controllers Transformer', () => {
	let result;

	beforeAll(async () => {
		const docPath = path.resolve(__dirname, '../../data/ca23-key-based-instrument-controller-sysex-message.md');
		result = await transformCa23(docPath);
	});

	it('should produce correct metadata', () => {
		expect(result.metadata.title).toBe('Key-Based Instrument Controllers');
		expect(result.metadata.doc_id).toBe('CA-023');
		expect(result.metadata.version).toBe('1.0.0');
		expect(result.metadata.source).toBe('ca23-key-based-instrument-controller-sysex-message.md');
	});

	describe('Message format fields', () => {
		it('should have 7 message format fields', () => {
			expect(result.message_format.fields).toHaveLength(7);
			expect(result.summary.message_field_count).toBe(7);
		});

		it('should have F0 as first field with SysEx header description', () => {
			expect(result.message_format.fields[0].code).toBe('F0');
			expect(result.message_format.fields[0].description).toContain('Universal Real Time SysEx header');
		});

		it('should have <device ID> as second field', () => {
			expect(result.message_format.fields[1].code).toBe('<device ID>');
			expect(result.message_format.fields[1].description).toContain('ID of target device');
		});

		it('should have 0A as sub-ID#1', () => {
			const field = result.message_format.fields.find(f => f.code === '0A');
			expect(field).toBeDefined();
			expect(field.description).toContain('Key-Based Instrument Control');
		});

		it('should have 01 as sub-ID#2', () => {
			const field = result.message_format.fields.find(f => f.code === '01');
			expect(field).toBeDefined();
			expect(field.description).toContain('Basic Message');
		});

		it('should have 0n as MIDI Channel Number', () => {
			const field = result.message_format.fields.find(f => f.code === '0n');
			expect(field).toBeDefined();
			expect(field.description).toContain('MIDI Channel');
		});

		it('should have kk as Key number', () => {
			const field = result.message_format.fields.find(f => f.code === 'kk');
			expect(field).toBeDefined();
			expect(field.description).toContain('Key number');
		});

		it('should have [nn,vv] as Controller Number and Value', () => {
			const field = result.message_format.fields.find(f => f.code === '[nn,vv]');
			expect(field).toBeDefined();
			expect(field.description).toContain('Controller Number and Value');
		});
	});

	describe('Controllers table', () => {
		it('should have 15 controllers', () => {
			expect(result.controllers).toHaveLength(15);
			expect(result.summary.controller_count).toBe(15);
		});

		it('should parse CC#7 Note Volume', () => {
			const ctrl = result.controllers.find(c => c.cc_number === '7');
			expect(ctrl).toBeDefined();
			expect(ctrl.hex_code).toBe('07H');
			expect(ctrl.name).toBe('Note Volume');
			expect(ctrl.value_range).toBe('00H-40H-7FH');
			expect(ctrl.absolute).toBe(false);
			expect(ctrl.redefined).toBe(false);
		});

		it('should parse CC#10 Pan as absolute', () => {
			const ctrl = result.controllers.find(c => c.cc_number === '10');
			expect(ctrl).toBeDefined();
			expect(ctrl.hex_code).toBe('0AH');
			expect(ctrl.name).toBe('Pan');
			expect(ctrl.value_range).toBe('00H-7FH');
			expect(ctrl.absolute).toBe(true);
		});

		it('should parse CC#33-63 LSB for range', () => {
			const ctrl = result.controllers.find(c => c.cc_number === '33-63');
			expect(ctrl).toBeDefined();
			expect(ctrl.hex_code).toBe('21-3FH');
			expect(ctrl.name).toBe('LSB for');
			expect(ctrl.value_range).toBe('01H-1FH');
		});

		it('should parse CC#71 Timbre/Harmonic Intensity', () => {
			const ctrl = result.controllers.find(c => c.cc_number === '71');
			expect(ctrl).toBeDefined();
			expect(ctrl.hex_code).toBe('47H');
			expect(ctrl.name).toBe('Timbre/Harmonic Intensity');
		});

		it('should parse CC#72 Release Time', () => {
			const ctrl = result.controllers.find(c => c.cc_number === '72');
			expect(ctrl).toBeDefined();
			expect(ctrl.name).toBe('Release Time');
		});

		it('should parse CC#73 Attack Time', () => {
			const ctrl = result.controllers.find(c => c.cc_number === '73');
			expect(ctrl).toBeDefined();
			expect(ctrl.name).toBe('Attack Time');
		});

		it('should parse CC#74 Brightness', () => {
			const ctrl = result.controllers.find(c => c.cc_number === '74');
			expect(ctrl).toBeDefined();
			expect(ctrl.name).toBe('Brightness');
		});

		it('should parse CC#75 Decay Time', () => {
			const ctrl = result.controllers.find(c => c.cc_number === '75');
			expect(ctrl).toBeDefined();
			expect(ctrl.name).toBe('Decay Time');
		});

		it('should parse CC#76 Vibrato Rate', () => {
			const ctrl = result.controllers.find(c => c.cc_number === '76');
			expect(ctrl).toBeDefined();
			expect(ctrl.name).toBe('Vibrato Rate');
		});

		it('should parse CC#77 Vibrato Depth', () => {
			const ctrl = result.controllers.find(c => c.cc_number === '77');
			expect(ctrl).toBeDefined();
			expect(ctrl.name).toBe('Vibrato Depth');
		});

		it('should parse CC#78 Vibrato Delay', () => {
			const ctrl = result.controllers.find(c => c.cc_number === '78');
			expect(ctrl).toBeDefined();
			expect(ctrl.name).toBe('Vibrato Delay');
		});

		it('should parse CC#91 Reverb Send as absolute', () => {
			const ctrl = result.controllers.find(c => c.cc_number === '91');
			expect(ctrl).toBeDefined();
			expect(ctrl.hex_code).toBe('5BH');
			expect(ctrl.name).toBe('Reverb Send');
			expect(ctrl.absolute).toBe(true);
		});

		it('should parse CC#93 Chorus Send as absolute', () => {
			const ctrl = result.controllers.find(c => c.cc_number === '93');
			expect(ctrl).toBeDefined();
			expect(ctrl.hex_code).toBe('5DH');
			expect(ctrl.name).toBe('Chorus Send');
			expect(ctrl.absolute).toBe(true);
		});

		it('should parse CC#120 Fine Tuning as redefined', () => {
			const ctrl = result.controllers.find(c => c.cc_number === '120');
			expect(ctrl).toBeDefined();
			expect(ctrl.hex_code).toBe('78H');
			expect(ctrl.name).toBe('Fine Tuning');
			expect(ctrl.redefined).toBe(true);
		});

		it('should parse CC#121 Coarse Tuning as redefined', () => {
			const ctrl = result.controllers.find(c => c.cc_number === '121');
			expect(ctrl).toBeDefined();
			expect(ctrl.hex_code).toBe('79H');
			expect(ctrl.name).toBe('Coarse Tuning');
			expect(ctrl.redefined).toBe(true);
		});
	});

	describe('Notes', () => {
		it('should have notes', () => {
			expect(result.notes.length).toBeGreaterThan(0);
			expect(result.summary.note_count).toBe(result.notes.length);
		});

		it('should contain footnote about absolute/relative values', () => {
			const note = result.notes.find(n => n.includes('Depending on the recommended practice'));
			expect(note).toBeDefined();
		});

		it('should contain footnote about redefined parameters', () => {
			const note = result.notes.find(n => n.includes('78H and 79H'));
			expect(note).toBeDefined();
		});

		it('should contain note about excluded controllers', () => {
			const note = result.notes.find(n => n.includes('Bank Select'));
			expect(note).toBeDefined();
		});

		it('should contain note about 40H default', () => {
			const note = result.notes.find(n => n.includes('40H'));
			expect(note).toBeDefined();
		});
	});

	describe('Data integrity', () => {
		it('should have all message fields with code and description', () => {
			for (const field of result.message_format.fields) {
				expect(field.code).toBeTruthy();
				expect(field.description).toBeTruthy();
			}
		});

		it('should have all controllers with required fields', () => {
			for (const ctrl of result.controllers) {
				expect(ctrl.cc_number).toBeTruthy();
				expect(ctrl.hex_code).toMatch(/H$/);
				expect(ctrl.name).toBeTruthy();
				expect(ctrl.value_range).toMatch(/H$/);
				expect(ctrl.absolute).toBeTypeOf('boolean');
				expect(ctrl.redefined).toBeTypeOf('boolean');
			}
		});
	});
});
