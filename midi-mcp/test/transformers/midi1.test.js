import { describe, it, expect, beforeAll } from 'vitest';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { transformMidi1 } from '../../lib/transformers/midi1Transformer.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

describe('MIDI 1.0 Detailed Specification Transformer', () => {
	let result;

	beforeAll(async () => {
		const docPath = path.resolve(__dirname, '../../data/m1-midi-1-0-detailed-specification.md');
		result = await transformMidi1(docPath);
	});

	it('should produce correct metadata', () => {
		expect(result.metadata.title).toBe('MIDI 1.0 Detailed Specification');
		expect(result.metadata.doc_id).toBe('M1');
		expect(result.metadata.protocol).toBe('midi1');
		expect(result.metadata.version).toBe('4.2.1');
		expect(result.metadata.date).toBe('1996-02');
	});

	describe('Table I: Status Byte Summary', () => {
		it('should have 11 entries', () => {
			expect(result.status_byte_summary).toHaveLength(11);
			expect(result.summary.status_byte_count).toBe(11);
		});

		it('should parse Note Off as 8nH', () => {
			const entry = result.status_byte_summary.find(e => e.status_hex === '8nH');
			expect(entry.binary).toBe('1000nnnn');
			expect(entry.data_bytes).toBe('2');
			expect(entry.description).toBe('Note Off');
		});

		it('should parse Note On as 9nH with velocity 0 note', () => {
			const entry = result.status_byte_summary.find(e => e.status_hex === '9nH');
			expect(entry.binary).toBe('1001nnnn');
			expect(entry.description).toBe('Note On (a velocity of 0 = Note Off)');
		});

		it('should parse Pitch Bend Change as EnH', () => {
			const entry = result.status_byte_summary.find(e => e.status_hex === 'EnH');
			expect(entry.binary).toBe('1110nnnn');
			expect(entry.data_bytes).toBe('2');
			expect(entry.description).toBe('Pitch bend change');
		});

		it('should parse F0H System Exclusive', () => {
			const entry = result.status_byte_summary.find(e => e.status_hex === 'F0H');
			expect(entry.binary).toBe('11110000');
			expect(entry.data_bytes).toBe('*****');
			expect(entry.description).toBe('System Exclusive');
		});

		it('should parse Channel Mode row with (01111xxx)', () => {
			const entry = result.status_byte_summary.find(e => e.binary === '1011nnnn' && e.data_bytes === '(01111xxx)');
			expect(entry.status_hex).toBe('BnH');
			expect(entry.description).toBe('Selects Channel Mode');
		});

		it('should parse System Common special row', () => {
			const entry = result.status_byte_summary.find(e => e.binary === '11110sss');
			expect(entry.status_hex).toBeNull();
			expect(entry.data_bytes).toBe('0 to 2');
			expect(entry.description).toBe('System Common');
		});

		it('should parse System Real Time special row', () => {
			const entry = result.status_byte_summary.find(e => e.binary === '11111ttt');
			expect(entry.status_hex).toBeNull();
			expect(entry.data_bytes).toBe('0');
			expect(entry.description).toBe('System Real Time');
		});
	});

	describe('Table II: Channel Voice Messages', () => {
		it('should have 7 entries', () => {
			expect(result.channel_voice_messages).toHaveLength(7);
			expect(result.summary.channel_voice_message_count).toBe(7);
		});

		it('should parse Note Off with data bytes and descriptions', () => {
			const entry = result.channel_voice_messages.find(e => e.status_hex === '8nH');
			expect(entry.binary).toBe('1000nnnn');
			expect(entry.data_bytes).toEqual(['0kkkkkkk', '0vvvvvvv']);
			expect(entry.description).toBe('Note Off');
			expect(entry.data_byte_descriptions).toContain('vvvvvvv: note off velocity');
		});

		it('should parse Note On with both velocity descriptions', () => {
			const entry = result.channel_voice_messages.find(e => e.status_hex === '9nH');
			expect(entry.data_byte_descriptions).toContain('vvvvvvv ≠ 0: velocity');
			expect(entry.data_byte_descriptions).toContain('vvvvvvv = 0: note off');
		});

		it('should parse Control Change referencing Table III', () => {
			const entry = result.channel_voice_messages.find(e => e.status_hex === 'BnH');
			expect(entry.description).toBe('Control Change (See Table III)');
		});

		it('should parse Program Change with single data byte', () => {
			const entry = result.channel_voice_messages.find(e => e.status_hex === 'CnH');
			expect(entry.data_bytes).toEqual(['0ppppppp']);
			expect(entry.description).toBe('Program Change');
		});

		it('should parse Pitch Bend Change with MSB and LSB', () => {
			const entry = result.channel_voice_messages.find(e => e.status_hex === 'EnH');
			expect(entry.data_bytes).toEqual(['0vvvvvvv', '0vvvvvvv']);
			expect(entry.description).toBe('Pitch Bend Change MSB Pitch Bend Change LSB');
		});
	});

	describe('Table III: Controller Numbers', () => {
		it('should have 46 entries', () => {
			expect(result.controller_numbers).toHaveLength(46);
			expect(result.summary.controller_number_count).toBe(46);
		});

		it('should parse Bank Select as controller 0', () => {
			const entry = result.controller_numbers.find(e => e.decimal === '0');
			expect(entry.hex).toBe('00H');
			expect(entry.function).toBe('Bank Select');
		});

		it('should parse Modulation wheel as controller 1', () => {
			const entry = result.controller_numbers.find(e => e.decimal === '1');
			expect(entry.hex).toBe('01H');
			expect(entry.function).toBe('Modulation wheel or lever');
		});

		it('should parse Damper pedal as controller 64', () => {
			const entry = result.controller_numbers.find(e => e.decimal === '64');
			expect(entry.hex).toBe('40H');
			expect(entry.function).toBe('Damper pedal (sustain)');
		});

		it('should parse range 14-15 as Undefined', () => {
			const entry = result.controller_numbers.find(e => e.decimal === '14-15');
			expect(entry.hex).toBe('0E-0FH');
			expect(entry.function).toBe('Undefined');
		});

		it('should parse range 120-127 as Reserved for Channel Mode', () => {
			const entry = result.controller_numbers.find(e => e.decimal === '120-127');
			expect(entry.hex).toBe('78-7FH');
			expect(entry.function).toBe('Reserved for Channel Mode Messages');
		});
	});

	describe('Table IIIa: Registered Parameter Numbers', () => {
		it('should have 5 entries', () => {
			expect(result.registered_parameter_numbers).toHaveLength(5);
			expect(result.summary.registered_parameter_number_count).toBe(5);
		});

		it('should parse Pitch Bend Sensitivity', () => {
			const entry = result.registered_parameter_numbers.find(e => e.function === 'Pitch Bend Sensitivity');
			expect(entry.lsb).toBe('00H');
			expect(entry.msb).toBe('00H');
		});

		it('should parse Tuning Bank Select', () => {
			const entry = result.registered_parameter_numbers.find(e => e.function === 'Tuning Bank Select');
			expect(entry.lsb).toBe('04H');
			expect(entry.msb).toBe('00H');
		});
	});

	describe('Table IV: Channel Mode Messages', () => {
		it('should have 8 entries', () => {
			expect(result.channel_mode_messages).toHaveLength(8);
			expect(result.summary.channel_mode_message_count).toBe(8);
		});

		it('should parse All Sound Off as controller 120', () => {
			const entry = result.channel_mode_messages.find(e => e.controller_number === 120);
			expect(entry.description).toBe('All Sound Off');
			expect(entry.values).toEqual(['0']);
		});

		it('should parse Local Control with on/off values', () => {
			const entry = result.channel_mode_messages.find(e => e.controller_number === 122);
			expect(entry.description).toBe('Local Control');
			expect(entry.values).toContain('0, Local Control Off');
			expect(entry.values).toContain('127, Local Control On');
		});

		it('should parse Mono Mode with M value description', () => {
			const entry = result.channel_mode_messages.find(e => e.controller_number === 126);
			expect(entry.description).toBe('Mono Mode On (Poly Mode Off)');
			expect(entry.values[0]).toContain('M, where M is the number of channels');
			expect(entry.values[1]).toContain('0, the number of channels equals the');
		});

		it('should parse Poly Mode On as controller 127', () => {
			const entry = result.channel_mode_messages.find(e => e.controller_number === 127);
			expect(entry.description).toBe('Poly Mode On (Mono Mode Off)');
			expect(entry.values).toEqual(['0']);
		});
	});

	describe('Table V: System Common Messages', () => {
		it('should have 7 entries', () => {
			expect(result.system_common_messages).toHaveLength(7);
			expect(result.summary.system_common_message_count).toBe(7);
		});

		it('should parse MIDI Time Code Quarter Frame', () => {
			const entry = result.system_common_messages.find(e => e.status_hex === 'F1H');
			expect(entry.binary).toBe('11110001');
			expect(entry.data_bytes).toEqual(['0nnndddd']);
			expect(entry.description).toBe('MIDI Time Code Quarter Frame');
			expect(entry.data_byte_descriptions).toContain('nnn: Message Type');
			expect(entry.data_byte_descriptions).toContain('dddd: Values');
		});

		it('should parse Song Position Pointer with LSB and MSB', () => {
			const entry = result.system_common_messages.find(e => e.status_hex === 'F2H');
			expect(entry.data_bytes).toEqual(['0lllllll', '0hhhhhhh']);
			expect(entry.data_byte_descriptions).toContain('lllllll: (Least significant)');
			expect(entry.data_byte_descriptions).toContain('hhhhhhh: (Most significant)');
		});

		it('should parse Undefined F4H with no data bytes', () => {
			const entry = result.system_common_messages.find(e => e.status_hex === 'F4H');
			expect(entry.data_bytes).toEqual([]);
			expect(entry.description).toBe('Undefined');
		});

		it('should parse Tune Request F6H', () => {
			const entry = result.system_common_messages.find(e => e.status_hex === 'F6H');
			expect(entry.data_bytes).toEqual(['none']);
			expect(entry.description).toBe('Tune Request');
		});

		it('should parse EOX F7H', () => {
			const entry = result.system_common_messages.find(e => e.status_hex === 'F7H');
			expect(entry.data_bytes).toEqual(['none']);
			expect(entry.description).toBe('EOX: "End of System Exclusive" flag');
		});
	});

	describe('Table VI: System Real Time Messages', () => {
		it('should have 8 entries', () => {
			expect(result.system_real_time_messages).toHaveLength(8);
			expect(result.summary.system_real_time_message_count).toBe(8);
		});

		it('should parse Timing Clock F8H', () => {
			const entry = result.system_real_time_messages.find(e => e.status_hex === 'F8H');
			expect(entry.binary).toBe('11111000');
			expect(entry.description).toBe('Timing Clock');
		});

		it('should parse Start FAH', () => {
			const entry = result.system_real_time_messages.find(e => e.status_hex === 'FAH');
			expect(entry.description).toBe('Start');
		});

		it('should parse Active Sensing FEH', () => {
			const entry = result.system_real_time_messages.find(e => e.status_hex === 'FEH');
			expect(entry.description).toBe('Active Sensing');
		});

		it('should parse System Reset FFH', () => {
			const entry = result.system_real_time_messages.find(e => e.status_hex === 'FFH');
			expect(entry.description).toBe('System Reset');
		});
	});

	describe('Table VII: System Exclusive Messages', () => {
		it('should have 2 entries', () => {
			expect(result.system_exclusive_messages).toHaveLength(2);
			expect(result.summary.system_exclusive_message_count).toBe(2);
		});

		it('should parse F0H SOX with sub-ID descriptions', () => {
			const entry = result.system_exclusive_messages.find(e => e.status_hex === 'F0H');
			expect(entry.binary).toBe('11110000');
			expect(entry.description).toBe('SOX: Start of System Exclusive Status Byte');
			expect(entry.data_bytes).toContain('0iiiiiii');
			expect(entry.data_bytes).toContain('(00 - 7CH)');
			expect(entry.data_bytes).toContain('(7EH)');
			expect(entry.data_byte_descriptions).toContain('System Exclusive Sub-ID (see note 1)');
			expect(entry.data_byte_descriptions).toContain('Manufacturer Identification');
		});

		it('should parse F7H EOX with no data bytes', () => {
			const entry = result.system_exclusive_messages.find(e => e.status_hex === 'F7H');
			expect(entry.binary).toBe('11110111');
			expect(entry.description).toBe('EOX: End of System Exclusive');
			expect(entry.data_bytes).toEqual([]);
			expect(entry.data_byte_descriptions).toEqual([]);
		});
	});

	describe('Table VIIa: Universal SysEx Non-Real Time', () => {
		it('should have 41 entries', () => {
			expect(result.universal_sysex_non_real_time).toHaveLength(41);
			expect(result.summary.universal_sysex_non_real_time_count).toBe(41);
		});

		it('should parse Sample Dump Header', () => {
			const entry = result.universal_sysex_non_real_time.find(e => e.description === 'Sample Dump Header');
			expect(entry.sub_id_1).toBe('01');
			expect(entry.sub_id_2).toBe('(not used)');
		});

		it('should parse Identity Request', () => {
			const entry = result.universal_sysex_non_real_time.find(e => e.description === 'Identity Request');
			expect(entry).toBeDefined();
			expect(entry.sub_id_1).toBe('01');
			expect(entry.sub_id_2).toBeNull();
		});

		it('should parse General MIDI System On', () => {
			const entry = result.universal_sysex_non_real_time.find(e => e.description === 'General MIDI System On');
			expect(entry).toBeDefined();
			expect(entry.sub_id_1).toBe('01');
			expect(entry.sub_id_2).toBeNull();
		});

		it('should parse ACK handshake', () => {
			const entry = result.universal_sysex_non_real_time.find(e => e.description === 'ACK');
			expect(entry).toBeDefined();
			expect(entry.sub_id_1).toBe('7F');
			expect(entry.sub_id_2).toBe('(not used)');
		});
	});

	describe('Table VIIa: Universal SysEx Real Time', () => {
		it('should have 36 entries', () => {
			expect(result.universal_sysex_real_time).toHaveLength(36);
			expect(result.summary.universal_sysex_real_time_count).toBe(36);
		});

		it('should parse MIDI Time Code Full Message', () => {
			const entry = result.universal_sysex_real_time.find(e => e.description === 'Full Message');
			expect(entry).toBeDefined();
			expect(entry.sub_id_1).toBe('01');
			expect(entry.sub_id_2).toBeNull();
		});

		it('should parse Master Volume', () => {
			const entry = result.universal_sysex_real_time.find(e => e.description === 'Master Volume');
			expect(entry).toBeDefined();
			expect(entry.sub_id_1).toBe('01');
			expect(entry.sub_id_2).toBeNull();
		});

		it('should parse Master Balance', () => {
			const entry = result.universal_sysex_real_time.find(e => e.description === 'Master Balance');
			expect(entry).toBeDefined();
			expect(entry.sub_id_1).toBe('02');
			expect(entry.sub_id_2).toBeNull();
		});
	});

	describe('Table VIIb: Manufacturer ID Numbers', () => {
		it('should have 227 entries', () => {
			expect(result.manufacturer_id_numbers).toHaveLength(227);
			expect(result.summary.manufacturer_id_number_count).toBe(227);
		});

		it('should parse American Group Sequential as 01H', () => {
			const entry = result.manufacturer_id_numbers.find(e => e.manufacturer === 'Sequential');
			expect(entry.region).toBe('american');
			expect(entry.number).toBe('01H');
		});

		it('should parse American Group Moog as 04H', () => {
			const entry = result.manufacturer_id_numbers.find(e => e.manufacturer === 'Moog');
			expect(entry.region).toBe('american');
			expect(entry.number).toBe('04H');
		});

		it('should parse American Group multi-byte ID for Time Warner', () => {
			const entry = result.manufacturer_id_numbers.find(e => e.manufacturer === 'Time Warner Interactive');
			expect(entry.region).toBe('american');
			expect(entry.number).toBe('00H 00H 01H');
		});

		it('should parse European Group Passac as 20H', () => {
			const entry = result.manufacturer_id_numbers.find(e => e.manufacturer === 'Passac');
			expect(entry.region).toBe('european');
			expect(entry.number).toBe('20H');
		});

		it('should parse Japanese Group Kawai as 40H', () => {
			const entry = result.manufacturer_id_numbers.find(e => e.manufacturer === 'Kawai');
			expect(entry.region).toBe('japanese');
			expect(entry.number).toBe('40H');
		});

		it('should parse Japanese Group Roland as 41H', () => {
			const entry = result.manufacturer_id_numbers.find(e => e.manufacturer === 'Roland');
			expect(entry.region).toBe('japanese');
			expect(entry.number).toBe('41H');
		});

		it('should fix OOH OCR errors to 00H', () => {
			const entry = result.manufacturer_id_numbers.find(e => e.manufacturer === 'Spectral Synthesis');
			expect(entry.number).toBe('00H 00H 54H');
		});
	});

	describe('Table VIII: Additional Specification Documents', () => {
		it('should have 5 entries', () => {
			expect(result.additional_spec_documents).toHaveLength(5);
			expect(result.summary.additional_spec_document_count).toBe(5);
		});

		it('should parse MIDI Time Code document', () => {
			const entry = result.additional_spec_documents.find(e => e.title === 'MIDI Time Code');
			expect(entry.description).toBe('Recommended Practice RP004/RP008');
		});

		it('should parse Standard MIDI Files document', () => {
			const entry = result.additional_spec_documents.find(e => e.title === 'Standard MIDI Files');
			expect(entry.description).toBe('Recommended Practice RP001');
		});

		it('should parse General MIDI System Level 1 document', () => {
			const entry = result.additional_spec_documents.find(e => e.title === 'General MIDI System Level 1');
			expect(entry.description).toBe('Recommended Practice RP003');
		});
	});

	describe('SysEx Message Formats (body text)', () => {
		it('should have formats with names and format strings', () => {
			expect(result.sysex_message_formats.length).toBeGreaterThan(0);
			expect(result.summary.sysex_message_format_count).toBe(result.sysex_message_formats.length);
		});

		it('should parse ACK format', () => {
			const entry = result.sysex_message_formats.find(e => e.name === 'ACK');
			expect(entry).toBeDefined();
			expect(entry.format).toContain('F0 7E');
			expect(entry.format).toContain('7F');
			expect(entry.format).toContain('pp F7');
		});

		it('should parse NAK format', () => {
			const entry = result.sysex_message_formats.find(e => e.name === 'NAK');
			expect(entry).toBeDefined();
			expect(entry.format).toContain('7E');
		});

		it('should parse Master Volume format', () => {
			const entry = result.sysex_message_formats.find(e => e.name === 'Master Volume');
			expect(entry).toBeDefined();
			expect(entry.format).toContain('F0 7F');
			expect(entry.format).toContain('04 01');
		});

		it('should parse Turn General MIDI System On', () => {
			const entry = result.sysex_message_formats.find(e => e.name === 'Turn General MIDI System On');
			expect(entry).toBeDefined();
			expect(entry.format).toContain('09 01');
		});

		it('should parse Sample Dump Header with fields', () => {
			const entry = result.sysex_message_formats.find(e => e.format && e.format.includes('01 ss ss ee ff'));
			expect(entry).toBeDefined();
			expect(entry.fields.length).toBeGreaterThan(0);
		});
	});

	describe('Summary', () => {
		it('should have all summary counts matching array lengths', () => {
			expect(result.summary.status_byte_count).toBe(result.status_byte_summary.length);
			expect(result.summary.channel_voice_message_count).toBe(result.channel_voice_messages.length);
			expect(result.summary.controller_number_count).toBe(result.controller_numbers.length);
			expect(result.summary.registered_parameter_number_count).toBe(result.registered_parameter_numbers.length);
			expect(result.summary.channel_mode_message_count).toBe(result.channel_mode_messages.length);
			expect(result.summary.system_common_message_count).toBe(result.system_common_messages.length);
			expect(result.summary.system_real_time_message_count).toBe(result.system_real_time_messages.length);
			expect(result.summary.system_exclusive_message_count).toBe(result.system_exclusive_messages.length);
			expect(result.summary.universal_sysex_non_real_time_count).toBe(result.universal_sysex_non_real_time.length);
			expect(result.summary.universal_sysex_real_time_count).toBe(result.universal_sysex_real_time.length);
			expect(result.summary.manufacturer_id_number_count).toBe(result.manufacturer_id_numbers.length);
			expect(result.summary.additional_spec_document_count).toBe(result.additional_spec_documents.length);
			expect(result.summary.sysex_message_format_count).toBe(result.sysex_message_formats.length);
		});
	});
});
