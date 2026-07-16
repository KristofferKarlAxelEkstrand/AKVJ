import { describe, it, expect, beforeAll } from 'vitest';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { transformSpMidi } from '../../lib/transformers/spMidiTransformer.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

describe('SP-MIDI (RP-034/RP-035) Transformer', () => {
	let result;

	beforeAll(async () => {
		const docPath = path.resolve(__dirname, '../../data/spmidi-all-1-0b.md');
		result = await transformSpMidi(docPath);
	});

	it('should produce correct metadata', () => {
		expect(result.metadata.title).toBe('Scalable Polyphony MIDI (SP-MIDI) Specification and Device Profiles');
		expect(result.metadata.doc_id).toBe('RP-034/RP-035');
		expect(result.metadata.protocol).toBe('midi1');
		expect(result.metadata.version).toBe('1.0b');
		expect(result.metadata.date).toBe('2004-11-15');
	});

	describe('Terminology', () => {
		it('should have 8 terms', () => {
			expect(result.terminology).toHaveLength(8);
			expect(result.summary.terminology_count).toBe(8);
		});

		it('should parse Note', () => {
			const term = result.terminology.find(t => t.term === 'Note');
			expect(term).toBeDefined();
		});

		it('should parse Channel Masking', () => {
			const term = result.terminology.find(t => t.term === 'Channel Masking');
			expect(term).toBeDefined();
		});

		it('should parse Maximum Instantaneous Polyphony (MIP)', () => {
			const term = result.terminology.find(t => t.term === 'Maximum Instantaneous Polyphony (MIP)');
			expect(term).toBeDefined();
		});
	});

	describe('MIP Message Syntax', () => {
		it('should have syntax lines', () => {
			expect(result.mip_message_syntax.length).toBeGreaterThan(0);
			expect(result.summary.mip_message_syntax_line_count).toBeGreaterThan(0);
		});

		it('should include Universal Realtime SysEx header', () => {
			const header = result.mip_message_syntax.find(s => s.includes('UNIVERSAL REALTIME'));
			expect(header).toBeDefined();
		});

		it('should include sub-ID 0B for SP-MIDI', () => {
			const subId = result.mip_message_syntax.find(s => s.includes('0B') && s.includes('Scalable Polyphony'));
			expect(subId).toBeDefined();
		});

		it('should include sub-ID 01 for MIP Message', () => {
			const subId = result.mip_message_syntax.find(s => s.includes('01') && s.includes('MIP Message'));
			expect(subId).toBeDefined();
		});
	});

	describe('References', () => {
		it('should have 14 references (7 per part)', () => {
			expect(result.references).toHaveLength(14);
			expect(result.summary.reference_count).toBe(14);
		});

		it('should parse reference 1 as MIDI 1.0 Detailed Spec', () => {
			const ref = result.references.find(r => r.ref_id === 1);
			expect(ref).toBeDefined();
			expect(ref.description).toContain('MIDI 1.0 Detailed Specification');
		});

		it('should parse reference 7', () => {
			const refs7 = result.references.filter(r => r.ref_id === 7);
			expect(refs7.length).toBe(2);
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
			expect(inst.key_range).toBe('21–108');
		});

		it('should parse program 33 as Acoustic Bass', () => {
			const inst = result.melody_sound_set.find(m => m.program === 33);
			expect(inst.timbre).toBe('Acoustic Bass');
			expect(inst.key_range).toBe('28–55');
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

	describe('Minimum Melodic Sounds', () => {
		it('should have 13 entries', () => {
			expect(result.minimum_melodic_sounds).toHaveLength(13);
			expect(result.summary.minimum_melodic_count).toBe(13);
		});

		it('should parse Acoustic Grand Piano', () => {
			const sound = result.minimum_melodic_sounds.find(m => m.program === 1);
			expect(sound.timbre).toBe('Acoustic Grand Piano');
			expect(sound.key_range).toBe('21–108');
		});

		it('should parse Steel Drums', () => {
			const sound = result.minimum_melodic_sounds.find(m => m.program === 115);
			expect(sound.timbre).toBe('Steel Drums');
		});
	});

	describe('Minimum Percussion Sounds', () => {
		it('should have 13 entries', () => {
			expect(result.minimum_percussion_sounds).toHaveLength(13);
			expect(result.summary.minimum_percussion_count).toBe(13);
		});

		it('should parse Bass Drum', () => {
			const sound = result.minimum_percussion_sounds.find(p => p.note === 36);
			expect(sound.instrument).toBe('Bass Drum');
			expect(sound.pan).toBe(64);
		});

		it('should parse Claves', () => {
			const sound = result.minimum_percussion_sounds.find(p => p.note === 75);
			expect(sound.instrument).toBe('Claves');
			expect(sound.pan).toBe(84);
		});
	});

	describe('Required MIDI Messages', () => {
		it('should have entries', () => {
			expect(result.required_midi_messages.length).toBeGreaterThan(30);
			expect(result.summary.required_midi_message_count).toBeGreaterThan(30);
		});

		it('should parse Note On/Note Off as required', () => {
			const msg = result.required_midi_messages.find(m => m.message.includes('Note On'));
			expect(msg).toBeDefined();
			expect(msg.required).toBe(true);
		});

		it('should parse Channel Volume as required', () => {
			const msg = result.required_midi_messages.find(m => m.message.includes('Channel Volume'));
			expect(msg).toBeDefined();
			expect(msg.required).toBe(true);
		});

		it('should parse Portamento Time as not required', () => {
			const msg = result.required_midi_messages.find(m => m.message.includes('Portamento Time'));
			expect(msg).toBeDefined();
			expect(msg.required).toBe(false);
		});

		it('should parse Pitch Bend as required', () => {
			const msg = result.required_midi_messages.find(m => m.message === 'Pitch Bend');
			expect(msg).toBeDefined();
			expect(msg.required).toBe(true);
		});

		it('should parse RPN Pitch Bend Sensitivity as required', () => {
			const msg = result.required_midi_messages.find(m => m.message.includes('Pitch Bend Sensitivity'));
			expect(msg).toBeDefined();
			expect(msg.required).toBe(true);
		});
	});

	describe('Summary Counts', () => {
		it('should have all correct counts', () => {
			const s = result.summary;
			expect(s.terminology_count).toBe(8);
			expect(s.mip_message_syntax_line_count).toBe(9);
			expect(s.reference_count).toBe(14);
			expect(s.melody_sound_count).toBe(128);
			expect(s.percussion_sound_count).toBe(47);
			expect(s.minimum_melodic_count).toBe(13);
			expect(s.minimum_percussion_count).toBe(13);
		});
	});
});
