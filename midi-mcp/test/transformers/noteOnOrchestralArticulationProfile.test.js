import { describe, it, expect, beforeAll } from 'vitest';
import path from 'node:path';
import { transformNoteOnOrchestralArticulationProfile } from '../../lib/transformers/noteOnOrchestralArticulationProfileTransformer.js';

describe('Note-On Orchestral Articulation Profile (M2-123-UM) Transformer', () => {
	let result;

	beforeAll(async () => {
		const docPath = path.resolve(__dirname, '../../data/m2-123-um-note-on-orchestral-articulation-profile.md');
		result = await transformNoteOnOrchestralArticulationProfile(docPath);
	});

	it('should produce correct metadata', () => {
		expect(result.metadata.title).toBe('Note-On Orchestral Articulation Profile');
		expect(result.metadata.doc_id).toBe('M2-123-UM');
		expect(result.metadata.protocol).toBe('midi2');
		expect(result.metadata.version).toBe('1.0');
		expect(result.metadata.date).toBe('2024-04-05');
	});

	describe('Version History', () => {
		it('should have 1 entry', () => {
			expect(result.version_history).toHaveLength(1);
			expect(result.summary.version_history_count).toBe(1);
		});

		it('should parse initial release', () => {
			const entry = result.version_history[0];
			expect(entry.publication_date).toBe('2024-04-05');
			expect(entry.version).toBe('1.0');
			expect(entry.changes).toBe('Initial release');
		});
	});

	describe('Conformance Words (Relating)', () => {
		it('should have 3 entries', () => {
			expect(result.conformance_words.relating_to_conformance).toHaveLength(3);
			expect(result.summary.conformance_relating_count).toBe(3);
		});

		it('should parse shall', () => {
			const entry = result.conformance_words.relating_to_conformance.find(w => w.word === 'shall');
			expect(entry).toBeDefined();
			expect(entry.reserved_for).toBe('Statements of requirement');
		});

		it('should parse should', () => {
			const entry = result.conformance_words.relating_to_conformance.find(w => w.word === 'should');
			expect(entry).toBeDefined();
			expect(entry.reserved_for).toBe('Statements of recommendation');
		});

		it('should parse may', () => {
			const entry = result.conformance_words.relating_to_conformance.find(w => w.word === 'may');
			expect(entry).toBeDefined();
			expect(entry.reserved_for).toBe('Statements of permission');
		});
	});

	describe('Conformance Words (Not Relating)', () => {
		it('should have 4 entries', () => {
			expect(result.conformance_words.not_relating_to_conformance).toHaveLength(4);
			expect(result.summary.conformance_not_relating_count).toBe(4);
		});

		it('should parse must', () => {
			const entry = result.conformance_words.not_relating_to_conformance.find(w => w.word === 'must');
			expect(entry).toBeDefined();
			expect(entry.reserved_for).toBe('Statements of unavoidability');
		});

		it('should parse will', () => {
			const entry = result.conformance_words.not_relating_to_conformance.find(w => w.word === 'will');
			expect(entry).toBeDefined();
			expect(entry.reserved_for).toBe('Statements of fact');
		});

		it('should parse can', () => {
			const entry = result.conformance_words.not_relating_to_conformance.find(w => w.word === 'can');
			expect(entry).toBeDefined();
			expect(entry.reserved_for).toBe('Statements of capability');
		});

		it('should parse might', () => {
			const entry = result.conformance_words.not_relating_to_conformance.find(w => w.word === 'might');
			expect(entry).toBeDefined();
			expect(entry.reserved_for).toBe('Statements of possibility');
		});
	});

	describe('Definitions', () => {
		it('should have 20 entries', () => {
			expect(result.definitions).toHaveLength(20);
			expect(result.summary.definition_count).toBe(20);
		});

		it('should parse AMEI', () => {
			const entry = result.definitions.find(d => d.term === 'AMEI');
			expect(entry).toBeDefined();
			expect(entry.description).toContain('Association of Musical Electronics Industry');
		});

		it('should parse Initiator', () => {
			const entry = result.definitions.find(d => d.term === 'Initiator');
			expect(entry).toBeDefined();
			expect(entry.description).toContain('bidirectional communication');
		});

		it('should parse UMP', () => {
			const entry = result.definitions.find(d => d.term === 'UMP');
			expect(entry).toBeDefined();
			expect(entry.description).toBe('Universal MIDI Packet.');
		});

		it('should parse Profile', () => {
			const entry = result.definitions.find(d => d.term === 'Profile');
			expect(entry).toBeDefined();
			expect(entry.description).toContain('MA/AMEI specification');
		});
	});

	describe('Normative References', () => {
		it('should have 7 entries', () => {
			expect(result.normative_references).toHaveLength(7);
			expect(result.summary.normative_reference_count).toBe(7);
		});

		it('should parse MA01', () => {
			const entry = result.normative_references.find(r => r.ref_id === 'MA01');
			expect(entry).toBeDefined();
			expect(entry.description).toContain('Complete MIDI 1.0');
		});

		it('should parse MA03 (MIDI-CI)', () => {
			const entry = result.normative_references.find(r => r.ref_id === 'MA03');
			expect(entry).toBeDefined();
			expect(entry.description).toContain('MIDI Capability Inquiry');
		});

		it('should parse MA07 (Default CC Mapping)', () => {
			const entry = result.normative_references.find(r => r.ref_id === 'MA07');
			expect(entry).toBeDefined();
			expect(entry.description).toContain('Default Control Change Mapping');
		});
	});

	describe('Profile ID', () => {
		it('should have 5 bytes', () => {
			expect(result.profile_id).toHaveLength(5);
			expect(result.summary.profile_id_byte_count).toBe(5);
		});

		it('should parse Byte 1 as Standard Defined Profile', () => {
			const byte1 = result.profile_id.find(b => b.byte === 1);
			expect(byte1).toBeDefined();
			expect(byte1.value).toBe('0x7E');
			expect(byte1.description).toContain('Standard Defined Profile');
		});

		it('should parse Byte 2 as Profile Bank', () => {
			const byte2 = result.profile_id.find(b => b.byte === 2);
			expect(byte2).toBeDefined();
			expect(byte2.value).toBe('0x21');
			expect(byte2.description).toContain('Bank');
		});

		it('should parse Byte 3 as Profile Number', () => {
			const byte3 = result.profile_id.find(b => b.byte === 3);
			expect(byte3).toBeDefined();
			expect(byte3.value).toBe('0x01');
		});

		it('should parse Byte 5 as Level', () => {
			const byte5 = result.profile_id.find(b => b.byte === 5);
			expect(byte5).toBeDefined();
			expect(byte5.value).toBe('0x01');
			expect(byte5.description).toContain('Level');
		});
	});

	describe('Note On Direction', () => {
		it('should have 4 entries', () => {
			expect(result.note_on.direction).toHaveLength(4);
			expect(result.summary.direction_count).toBe(4);
		});

		it('should parse 0x0 as automatic', () => {
			const entry = result.note_on.direction.find(d => d.value === '0x0');
			expect(entry).toBeDefined();
			expect(entry.description).toContain('automatic');
		});

		it('should parse 0x1 as down stroke', () => {
			const entry = result.note_on.direction.find(d => d.value === '0x1');
			expect(entry).toBeDefined();
			expect(entry.description).toContain('Down stroke');
		});

		it('should parse 0x3 as Reserved', () => {
			const entry = result.note_on.direction.find(d => d.value === '0x3');
			expect(entry).toBeDefined();
			expect(entry.description).toBe('Reserved');
		});
	});

	describe('Note On String Assignment', () => {
		it('should have 8 entries', () => {
			expect(result.note_on.string_assignment).toHaveLength(8);
			expect(result.summary.string_assignment_count).toBe(8);
		});

		it('should parse 0x0 as no assignment', () => {
			const entry = result.note_on.string_assignment.find(s => s.value === '0x0');
			expect(entry).toBeDefined();
			expect(entry.description).toContain('No string assignment');
		});

		it('should parse 0x1 as first string', () => {
			const entry = result.note_on.string_assignment.find(s => s.value === '0x1');
			expect(entry).toBeDefined();
			expect(entry.description).toContain('First string');
		});

		it('should parse 0x7 as other string', () => {
			const entry = result.note_on.string_assignment.find(s => s.value === '0x7');
			expect(entry).toBeDefined();
			expect(entry.description).toContain('Other String');
		});
	});

	describe('Classifications', () => {
		it('should have 11 entries', () => {
			expect(result.note_on.classifications).toHaveLength(11);
			expect(result.summary.classification_count).toBe(11);
		});

		it('should parse N/A 0x00', () => {
			const entry = result.note_on.classifications.find(c => c.attribute_type === '0x00');
			expect(entry).toBeDefined();
			expect(entry.classification_number).toBe('N/A');
			expect(entry.description).toContain('No Attribute Data');
		});

		it('should parse 0x10 as Core Sounds', () => {
			const entry = result.note_on.classifications.find(c => c.attribute_type === '0x10');
			expect(entry).toBeDefined();
			expect(entry.classification_number).toBe('1');
			expect(entry.description).toContain('Core Sounds');
		});

		it('should parse 0x17 as Effects and Noises', () => {
			const entry = result.note_on.classifications.find(c => c.attribute_type === '0x17');
			expect(entry).toBeDefined();
			expect(entry.description).toContain('Effects and Noises');
		});

		it('should parse 0x18-0x19 as Reserved', () => {
			const entry = result.note_on.classifications.find(c => c.attribute_type === '0x18-0x19');
			expect(entry).toBeDefined();
			expect(entry.description).toContain('Reserved');
		});

		it('should parse 0x1A-0x1F as Custom', () => {
			const entry = result.note_on.classifications.find(c => c.attribute_type === '0x1A-0x1F');
			expect(entry).toBeDefined();
			expect(entry.description).toContain('Custom');
		});
	});

	describe('Subclass Tables', () => {
		it('should have 8 tables', () => {
			expect(Object.keys(result.subclass_tables)).toHaveLength(8);
			expect(result.summary.subclass_table_count).toBe(8);
		});

		it('should have 128 total entries (16 per table)', () => {
			expect(result.summary.subclass_total_count).toBe(128);
		});

		it('should have 16 entries in 0x10', () => {
			expect(result.subclass_tables['0x10']).toHaveLength(16);
		});

		it('should have 16 entries in 0x11', () => {
			expect(result.subclass_tables['0x11']).toHaveLength(16);
		});

		it('should have 16 entries in 0x17', () => {
			expect(result.subclass_tables['0x17']).toHaveLength(16);
		});

		it('should parse 0x0 in 0x10 as Normal Sustains', () => {
			const entry = result.subclass_tables['0x10'].find(e => e.subclass === '0x0');
			expect(entry).toBeDefined();
			expect(entry.articulation).toContain('Normal Sustains');
		});

		it('should parse 0x3 in 0x10 as Molto Legato', () => {
			const entry = result.subclass_tables['0x10'].find(e => e.subclass === '0x3');
			expect(entry).toBeDefined();
			expect(entry.articulation).toContain('Molto Legato');
		});

		it('should parse 0xA in 0x11 as Pizzicato', () => {
			const entry = result.subclass_tables['0x11'].find(e => e.subclass === '0xA');
			expect(entry).toBeDefined();
			expect(entry.articulation).toContain('Pizzicato');
		});

		it('should parse 0xF in 0x13 as reserved', () => {
			const entry = result.subclass_tables['0x13'].find(e => e.subclass === '0xF');
			expect(entry).toBeDefined();
		});

		it('should parse 0x0 in 0x17 as Assorted noises', () => {
			const entry = result.subclass_tables['0x17'].find(e => e.subclass === '0x0');
			expect(entry).toBeDefined();
			expect(entry.articulation).toContain('Assorted noises');
		});
	});

	describe('Note Off Attribute Types', () => {
		it('should have 3 entries', () => {
			expect(result.note_off.attribute_types).toHaveLength(3);
			expect(result.summary.note_off_attribute_type_count).toBe(3);
		});

		it('should parse 0x00 as No Attribute Data', () => {
			const entry = result.note_off.attribute_types.find(a => a.attribute_type === '0x00');
			expect(entry).toBeDefined();
			expect(entry.description).toContain('No Attribute Data');
			expect(entry.description).toContain('Receiver');
		});

		it('should parse 0x01 as Manufacturer Specific', () => {
			const entry = result.note_off.attribute_types.find(a => a.attribute_type === '0x01');
			expect(entry).toBeDefined();
			expect(entry.description).toContain('Manufacturer Specific');
		});

		it('should parse 0x10 as Note ending characteristics', () => {
			const entry = result.note_off.attribute_types.find(a => a.attribute_type === '0x10');
			expect(entry).toBeDefined();
			expect(entry.description).toContain('Note ending characteristics');
		});
	});

	describe('Note Off Subclasses', () => {
		it('should have 5 entries', () => {
			expect(result.note_off.subclasses).toHaveLength(5);
			expect(result.summary.note_off_subclass_count).toBe(5);
		});

		it('should parse 0x0 as No Note Off Sample', () => {
			const entry = result.note_off.subclasses.find(s => s.subclass === '0x0');
			expect(entry).toBeDefined();
			expect(entry.description).toContain('No Note Off Sample');
		});

		it('should parse 0x1 as Soft Ending', () => {
			const entry = result.note_off.subclasses.find(s => s.subclass === '0x1');
			expect(entry).toBeDefined();
			expect(entry.description).toBe('Soft Ending');
		});

		it('should parse 0x3 as Pitch Rise', () => {
			const entry = result.note_off.subclasses.find(s => s.subclass === '0x3');
			expect(entry).toBeDefined();
			expect(entry.description).toContain('Pitch Rise');
		});
	});

	describe('Note Off String Assignment', () => {
		it('should have 8 entries', () => {
			expect(result.note_off.string_assignment).toHaveLength(8);
			expect(result.summary.note_off_string_assignment_count).toBe(8);
		});

		it('should parse 0x0 as no assignment', () => {
			const entry = result.note_off.string_assignment.find(s => s.value === '0x0');
			expect(entry).toBeDefined();
			expect(entry.description).toContain('No string assignment');
		});
	});

	describe('Mute Type Ranges', () => {
		it('should have 23 entries', () => {
			expect(result.controllers.mute_type_ranges).toHaveLength(23);
			expect(result.summary.mute_type_range_count).toBe(23);
		});

		it('should parse No Mute range', () => {
			const entry = result.controllers.mute_type_ranges.find(m => m.mute_type === 'No Mute');
			expect(entry).toBeDefined();
			expect(entry.range_start).toBe('0x00000000');
			expect(entry.range_end).toBe('0x07FFFFFF');
		});

		it('should parse Straight mute range', () => {
			const entry = result.controllers.mute_type_ranges.find(m => m.mute_type.includes('Straight mute'));
			expect(entry).toBeDefined();
			expect(entry.range_start).toBe('0x08000000');
		});

		it('should parse Reserved range', () => {
			const entry = result.controllers.mute_type_ranges.find(m => m.mute_type.includes('Reserved'));
			expect(entry).toBeDefined();
			expect(entry.range_start).toBe('0x80000000');
			expect(entry.range_end).toBe('0xCFFFFFFF');
		});

		it('should parse Manufacturer Specific Mute 1', () => {
			const entry = result.controllers.mute_type_ranges.find(m => m.mute_type.includes('Manufacturer Specific Mute 1'));
			expect(entry).toBeDefined();
			expect(entry.range_start).toBe('0xD0000000');
		});
	});

	describe('Playing Position', () => {
		it('should have 3 entries', () => {
			expect(result.controllers.playing_position).toHaveLength(3);
			expect(result.summary.playing_position_count).toBe(3);
		});

		it('should parse 0x00000000 as At the Bridge / At the Center', () => {
			const entry = result.controllers.playing_position.find(p => p.value === '0x00000000');
			expect(entry).toBeDefined();
			expect(entry.bowed_plucked).toBe('At the Bridge');
			expect(entry.drums_cymbals).toBe('At the Center');
		});

		it('should parse 0x80000000 as Default / Normal', () => {
			const entry = result.controllers.playing_position.find(p => p.value === '0x80000000');
			expect(entry).toBeDefined();
			expect(entry.bowed_plucked).toContain('Default');
			expect(entry.drums_cymbals).toContain('Normal Playing Position');
		});

		it('should parse 0xFFFFFFFF as At the Nut / At the Rim', () => {
			const entry = result.controllers.playing_position.find(p => p.value === '0xFFFFFFFF');
			expect(entry).toBeDefined();
			expect(entry.bowed_plucked).toBe('At the Nut');
			expect(entry.drums_cymbals).toBe('At the Rim');
		});
	});

	describe('Optional Features', () => {
		it('should have 6 entries (D0-D4 + D5-D13 Reserved)', () => {
			expect(result.controllers.optional_features).toHaveLength(6);
			expect(result.summary.optional_feature_count).toBe(6);
		});

		it('should parse D0 as Mute Type RC', () => {
			const entry = result.controllers.optional_features.find(f => f.bit === 'D0');
			expect(entry).toBeDefined();
			expect(entry.controller).toContain('RC 0x20/0x22');
			expect(entry.description).toContain('Mute Type');
		});

		it('should parse D1 as Mute Amount RC', () => {
			const entry = result.controllers.optional_features.find(f => f.bit === 'D1');
			expect(entry).toBeDefined();
			expect(entry.controller).toContain('RC 0x20/0x23');
			expect(entry.description).toContain('Mute Amount');
		});

		it('should parse D2 as Playing Position RPNC', () => {
			const entry = result.controllers.optional_features.find(f => f.bit === 'D2');
			expect(entry).toBeDefined();
			expect(entry.controller).toContain('RPNC 0x0C');
			expect(entry.description).toContain('Playing Position');
		});

		it('should parse D3 as Note Off Velocity', () => {
			const entry = result.controllers.optional_features.find(f => f.bit === 'D3');
			expect(entry).toBeDefined();
			expect(entry.controller).toBe('Note Off Velocity');
			expect(entry.description).toContain('Release Time');
		});

		it('should parse D4 as Discovery of Manufacturer Specific Sounds', () => {
			const entry = result.controllers.optional_features.find(f => f.bit === 'D4');
			expect(entry).toBeDefined();
			expect(entry.controller).toContain('Manufacturer Specific Sounds');
			expect(entry.description).toContain('Profile Details Inquiry');
		});

		it('should parse D5-D13 as Reserved', () => {
			const entry = result.controllers.optional_features.find(f => f.bit === 'D5-D13');
			expect(entry).toBeDefined();
			expect(entry.controller).toBe('Reserved');
		});
	});

	describe('Instrument Types', () => {
		it('should have 9 entries', () => {
			expect(result.instrument_types).toHaveLength(9);
			expect(result.summary.instrument_type_count).toBe(9);
		});

		it('should parse Str as Strings', () => {
			const entry = result.instrument_types.find(t => t.abbreviation === 'Str');
			expect(entry).toBeDefined();
			expect(entry.name).toBe('Strings');
		});

		it('should parse Ww as Woodwinds', () => {
			const entry = result.instrument_types.find(t => t.abbreviation === 'Ww');
			expect(entry).toBeDefined();
			expect(entry.name).toBe('Woodwinds');
		});

		it('should parse NoP as Non-Pitched Percussion', () => {
			const entry = result.instrument_types.find(t => t.abbreviation === 'NoP');
			expect(entry).toBeDefined();
			expect(entry.name).toBe('Non-Pitched Percussion');
		});

		it('should parse TuP as Tuned Percussion', () => {
			const entry = result.instrument_types.find(t => t.abbreviation === 'TuP');
			expect(entry).toBeDefined();
			expect(entry.name).toBe('Tuned Percussion');
		});

		it('should parse Chr as Choir / Vocals', () => {
			const entry = result.instrument_types.find(t => t.abbreviation === 'Chr');
			expect(entry).toBeDefined();
			expect(entry.name).toBe('Choir / Vocals');
		});
	});

	describe('Appendix Tables', () => {
		it('should have 8 tables', () => {
			expect(Object.keys(result.appendix_tables)).toHaveLength(8);
			expect(result.summary.appendix_table_count).toBe(8);
		});

		it('should have 128 total entries (16 per table)', () => {
			expect(result.summary.appendix_total_count).toBe(128);
		});

		it('should have 16 entries in 0x10 appendix', () => {
			expect(result.appendix_tables['0x10']).toHaveLength(16);
		});

		it('should have 16 entries in 0x17 appendix', () => {
			expect(result.appendix_tables['0x17']).toHaveLength(16);
		});

		it('should parse 0x0 in 0x10 appendix as Normal Sustains', () => {
			const entry = result.appendix_tables['0x10'].find(e => e.subclass === '0x0');
			expect(entry).toBeDefined();
			expect(entry.articulation).toContain('Normal Sustains');
			expect(entry.applicability.length).toBeGreaterThan(0);
		});

		it('should parse 0x6 in 0x10 appendix as Marcato', () => {
			const entry = result.appendix_tables['0x10'].find(e => e.subclass === '0x6');
			expect(entry).toBeDefined();
			expect(entry.articulation).toContain('Marcato');
		});

		it('should have applicability bullets for 0x0 in 0x10', () => {
			const entry = result.appendix_tables['0x10'].find(e => e.subclass === '0x0');
			expect(entry.applicability.length).toBe(9);
		});
	});

	describe('Summary', () => {
		it('should have correct counts', () => {
			expect(result.summary.version_history_count).toBe(1);
			expect(result.summary.conformance_relating_count).toBe(3);
			expect(result.summary.conformance_not_relating_count).toBe(4);
			expect(result.summary.definition_count).toBe(20);
			expect(result.summary.normative_reference_count).toBe(7);
			expect(result.summary.profile_id_byte_count).toBe(5);
			expect(result.summary.classification_count).toBe(11);
			expect(result.summary.direction_count).toBe(4);
			expect(result.summary.string_assignment_count).toBe(8);
			expect(result.summary.subclass_table_count).toBe(8);
			expect(result.summary.subclass_total_count).toBe(128);
			expect(result.summary.note_off_attribute_type_count).toBe(3);
			expect(result.summary.note_off_subclass_count).toBe(5);
			expect(result.summary.note_off_string_assignment_count).toBe(8);
			expect(result.summary.mute_type_range_count).toBe(23);
			expect(result.summary.playing_position_count).toBe(3);
			expect(result.summary.optional_feature_count).toBe(6);
			expect(result.summary.instrument_type_count).toBe(9);
			expect(result.summary.appendix_table_count).toBe(8);
			expect(result.summary.appendix_total_count).toBe(128);
		});
	});
});
