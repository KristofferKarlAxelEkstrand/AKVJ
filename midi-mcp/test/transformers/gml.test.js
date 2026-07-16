import { describe, it, expect, beforeAll } from 'vitest';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { transformGml } from '../../lib/transformers/gmlTransformer.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

describe('GML (RP-033) Transformer', () => {
	let result;

	beforeAll(async () => {
		const docPath = path.resolve(__dirname, '../../data/gml-v1.md');
		result = await transformGml(docPath);
	});

	it('should produce correct metadata', () => {
		expect(result.metadata.title).toBe('General MIDI Lite And Guidelines for Use In Mobile Applications');
		expect(result.metadata.doc_id).toBe('RP-033');
		expect(result.metadata.protocol).toBe('midi1');
		expect(result.metadata.version).toBe('1.0');
		expect(result.metadata.date).toBe('2001-10-05');
	});

	describe('Technical Terms', () => {
		it('should have 20 terms', () => {
			expect(result.technical_terms).toHaveLength(20);
			expect(result.summary.technical_terms_count).toBe(20);
		});

		it('should parse MIDI term', () => {
			const term = result.technical_terms.find(t => t.term.startsWith('MIDI'));
			expect(term).toBeDefined();
		});

		it('should parse Velocity term', () => {
			const term = result.technical_terms.find(t => t.term.startsWith('Velocity'));
			expect(term).toBeDefined();
		});

		it('should parse Note Stealing term', () => {
			const term = result.technical_terms.find(t => t.term.startsWith('Note Stealing'));
			expect(term).toBeDefined();
		});

		it('should parse Chase term', () => {
			const term = result.technical_terms.find(t => t.term.startsWith('Chase'));
			expect(term).toBeDefined();
		});
	});

	describe('Control Change Messages', () => {
		it('should have 5 CC messages', () => {
			expect(result.control_change_messages).toHaveLength(5);
			expect(result.summary.control_change_count).toBe(5);
		});

		it('should parse CC#1 Modulation Depth', () => {
			const cc = result.control_change_messages.find(c => c.cc_number === 1);
			expect(cc.name).toBe('Modulation Depth');
		});

		it('should parse CC#7 Channel Volume', () => {
			const cc = result.control_change_messages.find(c => c.cc_number === 7);
			expect(cc.name).toBe('Channel Volume');
		});

		it('should parse CC#10 Pan', () => {
			const cc = result.control_change_messages.find(c => c.cc_number === 10);
			expect(cc.name).toBe('Pan');
		});

		it('should parse CC#11 Expression', () => {
			const cc = result.control_change_messages.find(c => c.cc_number === 11);
			expect(cc.name).toBe('Expression');
		});

		it('should parse CC#64 Hold 1 (Damper)', () => {
			const cc = result.control_change_messages.find(c => c.cc_number === 64);
			expect(cc.name).toBe('Hold 1 (Damper)');
		});
	});

	describe('RPN Messages', () => {
		it('should have 1 RPN', () => {
			expect(result.rpn_messages).toHaveLength(1);
			expect(result.summary.rpn_count).toBe(1);
		});

		it('should parse Pitch Bend Sensitivity', () => {
			const rpn = result.rpn_messages[0];
			expect(rpn.rpn).toBe('00H/00H');
			expect(rpn.name).toBe('Pitch Bend Sensitivity');
		});
	});

	describe('Channel Mode Messages', () => {
		it('should have 3 channel mode messages', () => {
			expect(result.channel_mode_messages).toHaveLength(3);
			expect(result.summary.channel_mode_count).toBe(3);
		});

		it('should parse CC#120 All Sound Off', () => {
			const cm = result.channel_mode_messages.find(c => c.cc_number === 120);
			expect(cm.name).toBe('All Sound Off');
		});

		it('should parse CC#121 Reset All Controllers', () => {
			const cm = result.channel_mode_messages.find(c => c.cc_number === 121);
			expect(cm.name).toBe('Reset All Controllers');
		});

		it('should parse CC#123 All Notes Off', () => {
			const cm = result.channel_mode_messages.find(c => c.cc_number === 123);
			expect(cm.name).toBe('All Notes Off');
		});
	});

	describe('Reset All Controllers Table', () => {
		it('should have 6 entries', () => {
			expect(result.reset_all_controllers_table).toHaveLength(6);
			expect(result.summary.reset_all_controllers_count).toBe(6);
		});

		it('should parse Modulation reset', () => {
			const entry = result.reset_all_controllers_table.find(e => e.controller === 1);
			expect(entry.message).toBe('Modulation');
			expect(entry.value).toBe('00H');
			expect(entry.comment).toBe('OFF');
		});

		it('should parse Expression reset', () => {
			const entry = result.reset_all_controllers_table.find(e => e.controller === 11);
			expect(entry.message).toBe('Expression');
			expect(entry.value).toBe('7FH');
			expect(entry.comment).toBe('MAX');
		});

		it('should parse Pitch Bend reset', () => {
			const entry = result.reset_all_controllers_table.find(e => e.controller === null);
			expect(entry.message).toBe('Pitch Bend Change');
			expect(entry.value).toBe('40H/00H');
			expect(entry.comment).toBe('Center');
		});
	});

	describe('Melody Sound Set', () => {
		it('should have 128 instruments', () => {
			expect(result.melody_sound_set).toHaveLength(128);
			expect(result.summary.melody_sound_count).toBe(128);
		});

		it('should parse program 1 as Acoustic Grand Piano', () => {
			const inst = result.melody_sound_set.find(m => m.program === 1);
			expect(inst.timbre).toBe('Acoustic Grand Piano');
			expect(inst.key_range).toBe('21-108');
		});

		it('should parse program 33 as Acoustic Bass', () => {
			const inst = result.melody_sound_set.find(m => m.program === 33);
			expect(inst.timbre).toBe('Acoustic Bass');
			expect(inst.key_range).toBe('28-55');
		});

		it('should parse program 128 as Gunshot', () => {
			const inst = result.melody_sound_set.find(m => m.program === 128);
			expect(inst.timbre).toBe('Gunshot');
			expect(inst.key_range).toBe('*');
		});

		it('should parse program 57 as Trumpet', () => {
			const inst = result.melody_sound_set.find(m => m.program === 57);
			expect(inst.timbre).toBe('Trumpet');
		});
	});

	describe('Percussion Sound Set', () => {
		it('should have 47 entries', () => {
			expect(result.percussion_sound_set).toHaveLength(47);
			expect(result.summary.percussion_sound_count).toBe(47);
		});

		it('should parse note 35 as Acoustic Bass Drum pan=64', () => {
			const perc = result.percussion_sound_set.find(p => p.note === 35);
			expect(perc.timbre).toBe('Acoustic Bass Drum');
			expect(perc.pan).toBe(64);
		});

		it('should parse note 56 as Cowbell pan=84', () => {
			const perc = result.percussion_sound_set.find(p => p.note === 56);
			expect(perc.timbre).toBe('Cowbell');
			expect(perc.pan).toBe(84);
		});

		it('should parse note 57 as Crash Cymbal 2 pan=44', () => {
			const perc = result.percussion_sound_set.find(p => p.note === 57);
			expect(perc.timbre).toBe('Crash Cymbal 2');
			expect(perc.pan).toBe(44);
		});

		it('should parse note 81 as Open Triangle [EXC5] pan=24', () => {
			const perc = result.percussion_sound_set.find(p => p.note === 81);
			expect(perc.timbre).toBe('Open Triangle [EXC5]');
			expect(perc.pan).toBe(24);
		});

		it('should parse note 50 as High Tom pan=94', () => {
			const perc = result.percussion_sound_set.find(p => p.note === 50);
			expect(perc.timbre).toBe('High Tom');
			expect(perc.pan).toBe(94);
		});
	});

	describe('Channel Assignments', () => {
		it('should have 3 assignments', () => {
			expect(result.channel_assignments).toHaveLength(3);
			expect(result.summary.channel_assignment_count).toBe(3);
		});

		it('should parse channel 1 as Main-Melody', () => {
			const ch = result.channel_assignments.find(c => c.channel === 1);
			expect(ch.recommended_part).toBe('Main-Melody');
		});

		it('should parse channel 2 as Sub-Melody', () => {
			const ch = result.channel_assignments.find(c => c.channel === 2);
			expect(ch.recommended_part).toBe('Sub-Melody');
		});

		it('should parse channel 3 as Bass', () => {
			const ch = result.channel_assignments.find(c => c.channel === 3);
			expect(ch.recommended_part).toBe('Bass');
		});
	});

	describe('Set-Up Bar Events', () => {
		it('should have 3 events', () => {
			expect(result.set_up_bar_events).toHaveLength(3);
			expect(result.summary.set_up_bar_event_count).toBe(3);
		});

		it('should parse Beat meta-event', () => {
			const evt = result.set_up_bar_events.find(e => e.description.includes('Beat'));
			expect(evt).toBeDefined();
			expect(evt.time_index).toBe('1 1 000');
		});

		it('should parse Set Tempo meta-event', () => {
			const evt = result.set_up_bar_events.find(e => e.description.includes('Set Tempo'));
			expect(evt).toBeDefined();
			expect(evt.time_index).toBe('1 1 000');
		});

		it('should parse GM1 System On sysex', () => {
			const evt = result.set_up_bar_events.find(e => e.description.includes('GM1 System On'));
			expect(evt).toBeDefined();
			expect(evt.time_index).toBe('1 1 000');
		});
	});

	describe('References', () => {
		it('should have 1 reference', () => {
			expect(result.references).toHaveLength(1);
			expect(result.summary.reference_count).toBe(1);
		});

		it('should parse MIDI 1.0 Detailed Specification reference', () => {
			expect(result.references[0]).toContain('The Complete MIDI 1.0 Detailed Specification');
		});
	});

	describe('Summary Counts', () => {
		it('should have all correct counts', () => {
			const s = result.summary;
			expect(s.technical_terms_count).toBe(20);
			expect(s.control_change_count).toBe(5);
			expect(s.rpn_count).toBe(1);
			expect(s.channel_mode_count).toBe(3);
			expect(s.reset_all_controllers_count).toBe(6);
			expect(s.melody_sound_count).toBe(128);
			expect(s.percussion_sound_count).toBe(47);
			expect(s.channel_assignment_count).toBe(3);
			expect(s.set_up_bar_event_count).toBe(3);
			expect(s.reference_count).toBe(1);
		});
	});
});
