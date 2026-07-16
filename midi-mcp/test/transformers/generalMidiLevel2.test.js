import { describe, it, expect, beforeAll } from 'vitest';
import path from 'node:path';
import { transformGeneralMidiLevel2 } from '../../lib/transformers/generalMidiLevel2Transformer.js';

describe('General MIDI Level 2 (RP-024) Transformer', () => {
	let result;

	beforeAll(async () => {
		const docPath = path.resolve(__dirname, '../../data/general-midi-level-2-07-2-6-1-2a.md');
		result = await transformGeneralMidiLevel2(docPath);
	});

	it('should produce correct metadata', () => {
		expect(result.metadata.title).toBe('General MIDI Level 2');
		expect(result.metadata.doc_id).toBe('RP-024');
		expect(result.metadata.protocol).toBe('midi1');
		expect(result.metadata.source).toBe('general-midi-level-2-07-2-6-1-2a.md');
		expect(result.metadata.version).toBe('1.2a');
	});

	describe('Control Change Messages', () => {
		it('should have 22 entries', () => {
			expect(result.control_change_messages).toHaveLength(22);
			expect(result.summary.control_change_count).toBe(22);
		});

		it('should parse Bank Select (cc#0/32)', () => {
			const entry = result.control_change_messages.find(c => c.cc_number === '0/32');
			expect(entry).toBeDefined();
			expect(entry.name).toContain('Bank Select');
		});

		it('should parse Channel Volume (cc#7) with default 100', () => {
			const entry = result.control_change_messages.find(c => c.cc_number === '7');
			expect(entry).toBeDefined();
			expect(entry.name).toContain('Channel Volume');
			expect(entry.default_value).toContain('100');
		});

		it('should parse Filter Resonance (cc#71)', () => {
			const entry = result.control_change_messages.find(c => c.cc_number === '71');
			expect(entry).toBeDefined();
			expect(entry.name).toContain('Filter Resonance');
		});

		it('should parse Pan (cc#10) with default 64', () => {
			const entry = result.control_change_messages.find(c => c.cc_number === '10');
			expect(entry).toBeDefined();
			expect(entry.default_value).toContain('64');
		});

		it('should parse Expression (cc#11) with default 127', () => {
			const entry = result.control_change_messages.find(c => c.cc_number === '11');
			expect(entry).toBeDefined();
			expect(entry.default_value).toContain('127');
		});

		it('should parse Reverb Send Level (cc#91)', () => {
			const entry = result.control_change_messages.find(c => c.cc_number === '91');
			expect(entry).toBeDefined();
			expect(entry.name).toContain('Reverb Send');
		});

		it('should parse Portamento Time (cc#5) with default 0', () => {
			const entry = result.control_change_messages.find(c => c.cc_number === '5');
			expect(entry).toBeDefined();
			expect(entry.default_value).toBe('0');
		});
	});

	describe('RPN Entries', () => {
		it('should have 5 entries', () => {
			expect(result.rpn_entries).toHaveLength(5);
			expect(result.summary.rpn_count).toBe(5);
		});

		it('should parse Pitch Bend Sensitivity', () => {
			const entry = result.rpn_entries.find(e => e.name.includes('Pitch Bend Sensitivity'));
			expect(entry).toBeDefined();
			expect(entry.rpn_value).toBe('00H/00H');
			expect(entry.default_value).toContain('2 semitones');
		});

		it('should parse Channel Fine Tuning', () => {
			const entry = result.rpn_entries.find(e => e.name.includes('Channel Fine'));
			expect(entry).toBeDefined();
			expect(entry.rpn_value).toBe('00H/01H');
		});

		it('should parse RPN NULL', () => {
			const entry = result.rpn_entries.find(e => e.name.includes('RPN NULL'));
			expect(entry).toBeDefined();
			expect(entry.rpn_value).toBe('7FH/7FH');
		});
	});

	describe('Channel Mode Messages', () => {
		it('should have 7 entries', () => {
			expect(result.channel_mode_messages).toHaveLength(7);
			expect(result.summary.channel_mode_count).toBe(7);
		});

		it('should parse All Sound Off (cc#120)', () => {
			const entry = result.channel_mode_messages.find(m => m.cc_number === 120);
			expect(entry).toBeDefined();
			expect(entry.name).toBe('All Sound Off');
		});

		it('should parse Reset All Controllers (cc#121)', () => {
			const entry = result.channel_mode_messages.find(m => m.cc_number === 121);
			expect(entry).toBeDefined();
			expect(entry.name).toBe('Reset All Controllers');
		});

		it('should parse All Notes Off (cc#123)', () => {
			const entry = result.channel_mode_messages.find(m => m.cc_number === 123);
			expect(entry).toBeDefined();
			expect(entry.name).toBe('All Notes Off');
		});

		it('should parse Mono Mode On (cc#126) with default 1', () => {
			const entry = result.channel_mode_messages.find(m => m.cc_number === 126);
			expect(entry).toBeDefined();
			expect(entry.default_value).toBe('1');
		});
	});

	describe('Reset All Controllers Table', () => {
		it('should have 10 entries', () => {
			expect(result.reset_all_controllers).toHaveLength(10);
			expect(result.summary.reset_all_controllers_count).toBe(10);
		});

		it('should parse Modulation reset to 0 (off)', () => {
			const entry = result.reset_all_controllers.find(e => e.name === 'Modulation');
			expect(entry).toBeDefined();
			expect(entry.cc_number).toBe(1);
			expect(entry.reset_value).toBe('0 (off)');
		});

		it('should parse Expression reset to 7FH (maximum)', () => {
			const entry = result.reset_all_controllers.find(e => e.name === 'Expression');
			expect(entry).toBeDefined();
			expect(entry.reset_value).toBe('7FH (maximum)');
		});

		it('should parse RPN LSB reset to 7FH (null)', () => {
			const entry = result.reset_all_controllers.find(e => e.name === 'RPN LSB');
			expect(entry).toBeDefined();
			expect(entry.reset_value).toBe('7FH (null)');
		});

		it('should parse Channel pressure with null cc_number', () => {
			const entry = result.reset_all_controllers.find(e => e.name === 'Channel pressure');
			expect(entry).toBeDefined();
			expect(entry.cc_number).toBeNull();
			expect(entry.reset_value).toBe('0 (off)');
		});
	});

	describe('Reverb Types', () => {
		it('should have 6 entries', () => {
			expect(result.reverb_types).toHaveLength(6);
			expect(result.summary.reverb_type_count).toBe(6);
		});

		it('should parse Small Room (type 0)', () => {
			const entry = result.reverb_types.find(t => t.type_number === 0);
			expect(entry).toBeDefined();
			expect(entry.name).toBe('Small Room');
		});

		it('should parse Large Hall (type 4)', () => {
			const entry = result.reverb_types.find(t => t.type_number === 4);
			expect(entry).toBeDefined();
			expect(entry.name).toBe('Large Hall');
		});

		it('should parse Plate (type 8)', () => {
			const entry = result.reverb_types.find(t => t.type_number === 8);
			expect(entry).toBeDefined();
			expect(entry.name).toBe('Plate');
		});
	});

	describe('Reverb Time Defaults', () => {
		it('should have 6 entries', () => {
			expect(result.reverb_time_defaults).toHaveLength(6);
			expect(result.summary.reverb_time_default_count).toBe(6);
		});

		it('should parse type 0 with value 44 (1.1s)', () => {
			const entry = result.reverb_time_defaults.find(t => t.reverb_type === 0);
			expect(entry).toBeDefined();
			expect(entry.value).toBe(44);
			expect(entry.time).toBe('1.1s');
		});

		it('should parse type 4 with value 64 (1.8s)', () => {
			const entry = result.reverb_time_defaults.find(t => t.reverb_type === 4);
			expect(entry).toBeDefined();
			expect(entry.value).toBe(64);
			expect(entry.time).toBe('1.8s');
		});
	});

	describe('Chorus Types', () => {
		it('should have 6 entries', () => {
			expect(result.chorus_types).toHaveLength(6);
			expect(result.summary.chorus_type_count).toBe(6);
		});

		it('should parse Chorus 1 (type 0)', () => {
			const entry = result.chorus_types.find(c => c.type_number === 0);
			expect(entry).toBeDefined();
			expect(entry.name).toBe('Chorus 1');
			expect(entry.feedback).toContain('0%');
		});

		it('should parse Flanger (type 5)', () => {
			const entry = result.chorus_types.find(c => c.type_number === 5);
			expect(entry).toBeDefined();
			expect(entry.name).toBe('Flanger');
			expect(entry.feedback).toContain('86%');
		});

		it('should parse Chorus 3 (type 2) as default', () => {
			const entry = result.chorus_types.find(c => c.type_number === 2);
			expect(entry).toBeDefined();
			expect(entry.name).toBe('Chorus 3');
		});
	});

	describe('Controller Destination Parameters', () => {
		it('should have 12 entries (6 params × 2 sections)', () => {
			expect(result.controller_destination_parameters).toHaveLength(12);
			expect(result.summary.controller_destination_param_count).toBe(12);
		});

		it('should parse Pitch Control (param 0)', () => {
			const entry = result.controller_destination_parameters.find(p => p.param_number === 0);
			expect(entry).toBeDefined();
			expect(entry.param_name).toBe('Pitch Control');
			expect(entry.default_value).toBe('40H');
		});

		it('should parse LFO Amplitude Depth (param 5)', () => {
			const entry = result.controller_destination_parameters.find(p => p.param_number === 5);
			expect(entry).toBeDefined();
			expect(entry.param_name).toBe('LFO Amplitude Depth');
			expect(entry.default_value).toBe('0');
		});
	});

	describe('Key-Based Instrument Controllers', () => {
		it('should have 4 entries', () => {
			expect(result.key_based_controllers).toHaveLength(4);
			expect(result.summary.key_based_controller_count).toBe(4);
		});

		it('should parse Volume (cc#7)', () => {
			const entry = result.key_based_controllers.find(k => k.cc_number === 7);
			expect(entry).toBeDefined();
			expect(entry.name).toBe('Volume');
			expect(entry.default_value).toBe('40H');
		});

		it('should parse Pan (cc#10)', () => {
			const entry = result.key_based_controllers.find(k => k.cc_number === 10);
			expect(entry).toBeDefined();
			expect(entry.name).toBe('Pan');
		});

		it('should parse Reverb Send Level (cc#91)', () => {
			const entry = result.key_based_controllers.find(k => k.cc_number === 91);
			expect(entry).toBeDefined();
			expect(entry.name).toBe('Reverb Send Level');
		});
	});

	describe('GM2 Sound Set', () => {
		it('should have 256 entries', () => {
			expect(result.gm2_sound_set).toHaveLength(256);
			expect(result.summary.gm2_sound_set_count).toBe(256);
		});

		it('should parse first entry as Acoustic Grand Piano', () => {
			expect(result.gm2_sound_set[0].timbre_name).toBe('Acoustic Grand Piano');
			expect(result.gm2_sound_set[0].program_number).toBe(1);
			expect(result.gm2_sound_set[0].category).toBe('Piano');
		});

		it('should parse last entry as Explosion', () => {
			const last = result.gm2_sound_set[result.gm2_sound_set.length - 1];
			expect(last.timbre_name).toBe('Explosion');
			expect(last.program_number).toBe(128);
		});

		it('should have multiple categories', () => {
			const categories = [...new Set(result.gm2_sound_set.map(s => s.category))];
			expect(categories.length).toBeGreaterThan(10);
			expect(categories).toContain('Piano');
			expect(categories).toContain('Brass');
			expect(categories).toContain('SFX');
		});

		it('should parse variation entries with bank LSB', () => {
			const variations = result.gm2_sound_set.filter(s => s.bank_lsb !== '00H');
			expect(variations.length).toBeGreaterThan(0);
		});
	});

	describe('Percussion Sets', () => {
		it('should have entries from 9 sets', () => {
			const setNames = [...new Set(result.percussion_sets.map(p => p.set_name))];
			expect(setNames).toHaveLength(9);
			expect(setNames).toContain('STANDARD');
			expect(setNames).toContain('POWER');
			expect(setNames).toContain('JAZZ');
			expect(setNames).toContain('ELECTRONIC');
			expect(setNames).toContain('ANALOG');
			expect(setNames).toContain('BRUSH');
			expect(setNames).toContain('ORCHESTRA');
			expect(setNames).toContain('SFX');
			expect(setNames).toContain('ROOM');
		});

		it('should parse Acoustic Bass Drum in STANDARD set', () => {
			const entry = result.percussion_sets.find(p => p.set_name === 'STANDARD' && p.note_number === 35);
			expect(entry).toBeDefined();
			expect(entry.instrument).toBe('Acoustic Bass Drum');
		});

		it('should parse Power Kick Drum in POWER set', () => {
			const entry = result.percussion_sets.find(p => p.set_name === 'POWER' && p.note_number === 36);
			expect(entry).toBeDefined();
			expect(entry.instrument).toBe('Power Kick Drum');
		});
	});

	describe('GM System Messages', () => {
		it('should have 3 entries', () => {
			expect(result.gm_system_messages).toHaveLength(3);
			expect(result.summary.gm_system_message_count).toBe(3);
		});

		it('should parse GM2 System On', () => {
			const entry = result.gm_system_messages.find(g => g.section === 1);
			expect(entry).toBeDefined();
			expect(entry.name).toBe('GM2 System On');
			expect(entry.sysex_bytes.length).toBeGreaterThan(0);
		});

		it('should parse GM1 System On', () => {
			const entry = result.gm_system_messages.find(g => g.section === 2);
			expect(entry).toBeDefined();
			expect(entry.name).toContain('GM1 System On');
		});

		it('should parse GM System Off', () => {
			const entry = result.gm_system_messages.find(g => g.section === 3);
			expect(entry).toBeDefined();
			expect(entry.name).toBe('GM System Off');
		});
	});

	describe('Summary', () => {
		it('should have correct counts', () => {
			expect(result.summary.control_change_count).toBe(22);
			expect(result.summary.rpn_count).toBe(5);
			expect(result.summary.channel_mode_count).toBe(7);
			expect(result.summary.reset_all_controllers_count).toBe(10);
			expect(result.summary.reverb_type_count).toBe(6);
			expect(result.summary.reverb_time_default_count).toBe(6);
			expect(result.summary.chorus_type_count).toBe(6);
			expect(result.summary.controller_destination_param_count).toBe(12);
			expect(result.summary.key_based_controller_count).toBe(4);
			expect(result.summary.gm2_sound_set_count).toBe(256);
			expect(result.summary.gm_system_message_count).toBe(3);
		});
	});
});
