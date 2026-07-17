import { describe, it, expect, beforeAll } from 'vitest';
import { transformMidiClipFile } from '../../lib/transformers/midiClipFileTransformer.js';
import path from 'node:path';

const MARKDOWN_PATH = path.resolve('data/m2-116-u-midi-clip-file-specification.md');

let result;

beforeAll(async () => {
	result = await transformMidiClipFile(MARKDOWN_PATH);
});

describe('MIDI Clip File Transformer', () => {
	it('should produce a result object', () => {
		expect(result).toBeDefined();
		expect(typeof result).toBe('object');
	});

	describe('Metadata', () => {
		it('should have correct metadata from frontmatter', () => {
			expect(result.metadata.title).toBe('MIDI Clip File Specification (SMF2CLIP)');
			expect(result.metadata.doc_id).toBe('M2-116-U');
			expect(result.metadata.version).toBe('1.0');
			expect(result.metadata.protocol).toBe('midi2');
			expect(result.metadata.pages).toBe(24);
		});
	});

	describe('Version History', () => {
		it('should have 1 version history entry', () => {
			expect(result.version_history).toHaveLength(1);
		});

		it('should parse the initial release', () => {
			const entry = result.version_history[0];
			expect(entry.date).toContain('June 15, 2023');
			expect(entry.version).toBe('1.0');
			expect(entry.changes).toContain('Initial release');
		});
	});

	describe('Definitions', () => {
		it('should have definitions', () => {
			expect(result.definitions.length).toBeGreaterThan(15);
		});

		it('should parse AMEI', () => {
			const entry = result.definitions.find(e => e.term === 'AMEI');
			expect(entry).toBeDefined();
			expect(entry.definition).toContain('Association of Musical Electronics Industry');
		});

		it('should parse UMP', () => {
			const entry = result.definitions.find(e => e.term === 'UMP');
			expect(entry).toBeDefined();
			expect(entry.definition).toContain('Universal MIDI Packet');
		});

		it('should parse MUID', () => {
			const entry = result.definitions.find(e => e.term === 'MUID (MIDI Unique Identifier)');
			expect(entry).toBeDefined();
			expect(entry.definition).toContain('28-bit random number');
		});

		it('should parse Profile', () => {
			const entry = result.definitions.find(e => e.term === 'Profile');
			expect(entry).toBeDefined();
			expect(entry.definition).toContain('set of MIDI messages');
		});
	});

	describe('Conformance Words', () => {
		it('should have 7 conformance words', () => {
			expect(result.conformance_words).toHaveLength(7);
		});

		it('should parse shall as required', () => {
			const entry = result.conformance_words.find(e => e.word === 'shall');
			expect(entry).toBeDefined();
			expect(entry.category).toBe('required');
			expect(entry.reserved_for).toContain('requirement');
		});

		it('should parse should as required', () => {
			const entry = result.conformance_words.find(e => e.word === 'should');
			expect(entry).toBeDefined();
			expect(entry.category).toBe('required');
		});

		it('should parse must as descriptive', () => {
			const entry = result.conformance_words.find(e => e.word === 'must');
			expect(entry).toBeDefined();
			expect(entry.category).toBe('descriptive');
		});

		it('should parse might as descriptive', () => {
			const entry = result.conformance_words.find(e => e.word === 'might');
			expect(entry).toBeDefined();
			expect(entry.category).toBe('descriptive');
		});
	});

	describe('Normative References', () => {
		it('should have 6 references', () => {
			expect(result.normative_references).toHaveLength(6);
		});

		it('should parse [MA01]', () => {
			const entry = result.normative_references.find(e => e.reference === '[MA01]');
			expect(entry).toBeDefined();
			expect(entry.description).toContain('MIDI 1.0 Detailed Specification');
		});

		it('should parse [MA06]', () => {
			const entry = result.normative_references.find(e => e.reference === '[MA06]');
			expect(entry).toBeDefined();
			expect(entry.description).toContain('Universal MIDI Packet');
		});
	});

	describe('SMF Types', () => {
		it('should have 5 SMF types', () => {
			expect(result.smf_types).toHaveLength(5);
		});

		it('should parse Type 0', () => {
			const entry = result.smf_types.find(e => e.name === 'Type 0');
			expect(entry).toBeDefined();
			expect(entry.description).toContain('one track');
		});

		it('should parse Type 1', () => {
			const entry = result.smf_types.find(e => e.name === 'Type 1');
			expect(entry).toBeDefined();
			expect(entry.description).toContain('separate tracks');
		});

		it('should parse MIDI Clip File', () => {
			const entry = result.smf_types.find(e => e.name === 'MIDI Clip File');
			expect(entry).toBeDefined();
			expect(entry.description).toContain('Universal MIDI Packet');
		});

		it('should parse MIDI Container File', () => {
			const entry = result.smf_types.find(e => e.name === 'MIDI Container File');
			expect(entry).toBeDefined();
			expect(entry.description).toContain('complementary');
		});
	});

	describe('File Header', () => {
		it('should have 8 bytes', () => {
			expect(result.file_header.byte_count).toBe(8);
			expect(result.file_header.bytes).toHaveLength(8);
		});

		it('should have format SMF2CLIP', () => {
			expect(result.file_header.format).toBe('SMF2CLIP');
		});

		it('should parse first byte as 0x53 (S)', () => {
			const entry = result.file_header.bytes[0];
			expect(entry.hex).toBe('0x53');
			expect(entry.text).toBe('S');
		});

		it('should parse last byte as 0x50 (P)', () => {
			const entry = result.file_header.bytes[7];
			expect(entry.hex).toBe('0x50');
			expect(entry.text).toBe('P');
		});
	});

	describe('File Structure', () => {
		it('should have 3 sections', () => {
			expect(result.file_structure).toHaveLength(3);
		});

		it('should parse File Header section', () => {
			const entry = result.file_structure.find(e => e.name === 'File Header');
			expect(entry).toBeDefined();
			expect(entry.description).toContain('8 bytes');
		});

		it('should parse Clip Configuration Header section', () => {
			const entry = result.file_structure.find(e => e.name === 'Clip Configuration Header');
			expect(entry).toBeDefined();
			expect(entry.description).toContain('set up a Receiver');
		});

		it('should parse Clip Sequence Data section', () => {
			const entry = result.file_structure.find(e => e.name === 'Clip Sequence Data');
			expect(entry).toBeDefined();
			expect(entry.description).toContain('Universal MIDI Packet');
		});
	});

	describe('Max Times Table', () => {
		it('should have 7 rows', () => {
			expect(result.max_times_table).toHaveLength(7);
		});

		it('should have header row with tick values', () => {
			const header = result.max_times_table[0];
			expect(header.row).toContain('24');
			expect(header.row).toContain('96');
			expect(header.row).toContain('480');
		});
	});

	describe('DCTPQ', () => {
		it('should have a description', () => {
			expect(result.dctpq.description).toBeDefined();
			expect(result.dctpq.description).toContain('Delta Clockstamp Ticks Per Quarter Note');
		});
	});

	describe('DCS', () => {
		it('should have a description', () => {
			expect(result.dcs.description).toBeDefined();
			expect(result.dcs.description).toContain('Delta Clockstamp');
		});
	});

	describe('Clip Configuration Header', () => {
		it('should have sections', () => {
			expect(result.clip_configuration_header.sections.length).toBeGreaterThan(3);
		});

		it('should have Configuration Timing section', () => {
			const entry = result.clip_configuration_header.sections.find(e => e.name.includes('Configuration Timing'));
			expect(entry).toBeDefined();
		});

		it('should have Receiver Configuration by MIDI-CI Profile section', () => {
			const entry = result.clip_configuration_header.sections.find(e => e.name.includes('Receiver Configuration by MIDI-CI'));
			expect(entry).toBeDefined();
		});
	});

	describe('Clip Sequence Data', () => {
		it('should have sections', () => {
			expect(result.clip_sequence_data.sections.length).toBeGreaterThan(3);
		});

		it('should have Start of Clip Message section', () => {
			const entry = result.clip_sequence_data.sections.find(e => e.name.includes('Start of Clip'));
			expect(entry).toBeDefined();
		});

		it('should have End of Clip Message section', () => {
			const entry = result.clip_sequence_data.sections.find(e => e.name.includes('End of Clip'));
			expect(entry).toBeDefined();
		});

		it('should have MIDI Data section', () => {
			const entry = result.clip_sequence_data.sections.find(e => e.name === 'MIDI Data');
			expect(entry).toBeDefined();
		});

		it('should have Pickup Bars section', () => {
			const entry = result.clip_sequence_data.sections.find(e => e.name.includes('Pickup Bars'));
			expect(entry).toBeDefined();
		});
	});

	describe('Useful MIDI Messages', () => {
		it('should have 20 messages', () => {
			expect(result.useful_midi_messages).toHaveLength(20);
		});

		it('should include Set Tempo', () => {
			expect(result.useful_midi_messages).toContain('Set Tempo');
		});

		it('should include Set Time Signature', () => {
			expect(result.useful_midi_messages).toContain('Set Time Signature');
		});

		it('should include Lyrics', () => {
			expect(result.useful_midi_messages).toContain('Lyrics');
		});

		it('should include Project Name', () => {
			expect(result.useful_midi_messages).toContain('Project Name');
		});
	});

	describe('Summary', () => {
		it('should have all summary counts', () => {
			expect(result.summary.version_history_count).toBe(1);
			expect(result.summary.definition_count).toBeGreaterThan(15);
			expect(result.summary.conformance_word_count).toBe(7);
			expect(result.summary.normative_reference_count).toBe(6);
			expect(result.summary.smf_type_count).toBe(5);
			expect(result.summary.file_header_byte_count).toBe(8);
			expect(result.summary.file_structure_section_count).toBe(3);
			expect(result.summary.max_times_table_rows).toBe(7);
			expect(result.summary.useful_midi_message_count).toBe(20);
		});
	});
});
