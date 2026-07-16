import { describe, it, expect, beforeAll } from 'vitest';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { transformGm1SystemLevel1 } from '../../lib/transformers/gm1SystemLevel1Transformer.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

describe('GM1 System Level 1 (RP-003) Transformer', () => {
	let result;

	beforeAll(async () => {
		const docPath = path.resolve(__dirname, '../../data/rp-003-general-midi-system-level-1-specification-96-1-4-0-1.md');
		result = await transformGm1SystemLevel1(docPath);
	});

	it('should produce correct metadata', () => {
		expect(result.metadata.title).toBe('General MIDI System Level 1');
		expect(result.metadata.doc_id).toBe('RP-003');
		expect(result.metadata.protocol).toBe('midi1');
		expect(result.metadata.version).toBe('96.1.4');
	});

	describe('Sound Set Groupings', () => {
		it('should have 8 groupings', () => {
			expect(result.sound_set_groupings).toHaveLength(8);
			expect(result.summary.sound_set_grouping_count).toBe(8);
		});

		it('should parse Piano grouping', () => {
			const piano = result.sound_set_groupings.find(g => g.group === 'Piano');
			expect(piano.range_start).toBe(1);
			expect(piano.range_end).toBe(8);
		});

		it('should parse Sound Effects grouping', () => {
			const sfx = result.sound_set_groupings.find(g => g.group_2 === 'Sound Effects');
			expect(sfx.range_start_2).toBe(121);
			expect(sfx.range_end_2).toBe(128);
		});
	});

	describe('Instruments', () => {
		it('should have 128 instruments', () => {
			expect(result.instruments).toHaveLength(128);
			expect(result.summary.instrument_count).toBe(128);
		});

		it('should parse program 1 as Acoustic Grand Piano', () => {
			const inst = result.instruments.find(i => i.program === 1);
			expect(inst.name).toBe('Acoustic Grand Piano');
		});

		it('should parse program 128 as Gunshot', () => {
			const inst = result.instruments.find(i => i.program === 128);
			expect(inst.name).toBe('Gunshot');
		});

		it('should parse program 17 as Drawbar Organ', () => {
			const inst = result.instruments.find(i => i.program === 17);
			expect(inst.name).toBe('Drawbar Organ');
		});

		it('should parse program 81 as Lead 1 (square)', () => {
			const inst = result.instruments.find(i => i.program === 81);
			expect(inst.name).toBe('Lead 1 (square)');
		});
	});

	describe('Percussion Map', () => {
		it('should have 47 percussion sounds', () => {
			expect(result.percussion_map).toHaveLength(47);
			expect(result.summary.percussion_count).toBe(47);
		});

		it('should parse key 35 as Acoustic Bass Drum', () => {
			const perc = result.percussion_map.find(p => p.midi_key === 35);
			expect(perc.drum_sound).toBe('Acoustic Bass Drum');
		});

		it('should parse key 81 as Open Triangle', () => {
			const perc = result.percussion_map.find(p => p.midi_key === 81);
			expect(perc.drum_sound).toBe('Open Triangle');
		});

		it('should parse key 42 as Closed Hi Hat', () => {
			const perc = result.percussion_map.find(p => p.midi_key === 42);
			expect(perc.drum_sound).toBe('Closed Hi Hat');
		});
	});

	describe('Controllers', () => {
		it('should have 7 controllers', () => {
			expect(result.controllers).toHaveLength(7);
			expect(result.summary.controller_count).toBe(7);
		});

		it('should parse controller 1 as Modulation', () => {
			const ctrl = result.controllers.find(c => c.controller === 1);
			expect(ctrl.description).toBe('Modulation');
		});

		it('should parse controller 7 as Volume', () => {
			const ctrl = result.controllers.find(c => c.controller === 7);
			expect(ctrl.description).toBe('Volume');
		});

		it('should parse controller 64 as Sustain', () => {
			const ctrl = result.controllers.find(c => c.controller === 64);
			expect(ctrl.description).toBe('Sustain');
		});

		it('should parse controller 123 as All Notes Off', () => {
			const ctrl = result.controllers.find(c => c.controller === 123);
			expect(ctrl.description).toBe('All Notes Off');
		});
	});

	describe('RPNs', () => {
		it('should have 3 RPNs', () => {
			expect(result.rpns).toHaveLength(3);
			expect(result.summary.rpn_count).toBe(3);
		});

		it('should parse RPN 0 as Pitch Bend Sensitivity', () => {
			const rpn = result.rpns.find(r => r.rpn === 0);
			expect(rpn.description).toBe('Pitch Bend Sensitivity');
		});

		it('should parse RPN 1 as Fine Tuning', () => {
			const rpn = result.rpns.find(r => r.rpn === 1);
			expect(rpn.description).toBe('Fine Tuning');
		});

		it('should parse RPN 2 as Coarse Tuning', () => {
			const rpn = result.rpns.find(r => r.rpn === 2);
			expect(rpn.description).toBe('Coarse Tuning');
		});
	});

	describe('SysEx Messages', () => {
		it('should have 2 messages', () => {
			expect(result.sysex_messages).toHaveLength(2);
			expect(result.summary.sysex_message_count).toBe(2);
		});

		it('should parse GM On message', () => {
			const gmOn = result.sysex_messages.find(s => s.name === 'Turn General MIDI System On');
			expect(gmOn).toBeDefined();
			expect(gmOn.sub_id_1).toBe(9);
			expect(gmOn.sub_id_2).toBe(1);
			expect(gmOn.fields.length).toBeGreaterThan(0);
		});

		it('should parse GM Off message', () => {
			const gmOff = result.sysex_messages.find(s => s.name === 'Turn General MIDI System Off');
			expect(gmOff).toBeDefined();
			expect(gmOff.sub_id_1).toBe(9);
			expect(gmOff.sub_id_2).toBe(2);
			expect(gmOff.fields.length).toBeGreaterThan(0);
		});

		it('should have F0 7E in GM On fields', () => {
			const gmOn = result.sysex_messages.find(s => s.name === 'Turn General MIDI System On');
			const headerField = gmOn.fields.find(f => f.value === 'F0 7E');
			expect(headerField).toBeDefined();
			expect(headerField.description).toContain('Universal Non-Real Time');
		});
	});

	describe('Summary Counts', () => {
		it('should have all correct counts', () => {
			const s = result.summary;
			expect(s.sound_set_grouping_count).toBe(8);
			expect(s.instrument_count).toBe(128);
			expect(s.percussion_count).toBe(47);
			expect(s.controller_count).toBe(7);
			expect(s.rpn_count).toBe(3);
			expect(s.sysex_message_count).toBe(2);
		});
	});
});
