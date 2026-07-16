import { describe, it, expect, beforeAll } from 'vitest';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { transformMpeProfile } from '../../lib/transformers/mpeProfileTransformer.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

describe('MPE Profile (M2-120-UM) Transformer', () => {
	let result;

	beforeAll(async () => {
		const docPath = path.resolve(__dirname, '../../data/m2-120-um-midi-polyphonic-expression-profile.md');
		result = await transformMpeProfile(docPath);
	});

	it('should produce correct metadata', () => {
		expect(result.metadata.title).toBe('MIDI Polyphonic Expression (MPE) Profile');
		expect(result.metadata.doc_id).toBe('M2-120-UM');
		expect(result.metadata.protocol).toBe('midi2');
		expect(result.metadata.version).toBe('2.0.3');
		expect(result.metadata.date).toBe('2024-02-16');
	});

	describe('Version History', () => {
		it('should have 1 entry', () => {
			expect(result.version_history).toHaveLength(1);
			expect(result.summary.version_history_count).toBe(1);
		});

		it('should parse initial release', () => {
			const entry = result.version_history[0];
			expect(entry.publication_date).toBe('2024-02-16');
			expect(entry.version).toBe('2.0.3');
			expect(entry.changes).toBe('Initial Release of MIDI-CI Profile implementation of MPE');
		});
	});

	describe('Normative References', () => {
		it('should have 10 entries', () => {
			expect(result.normative_references).toHaveLength(10);
			expect(result.summary.normative_reference_count).toBe(10);
		});

		it('should parse MA01', () => {
			const entry = result.normative_references.find(r => r.ref_id === 'MA01');
			expect(entry).toBeDefined();
			expect(entry.description).toContain('Complete MIDI 1.0');
		});

		it('should parse MA08 (MPE v1.1)', () => {
			const entry = result.normative_references.find(r => r.ref_id === 'MA08');
			expect(entry).toBeDefined();
			expect(entry.description).toContain('MIDI Polyphonic Expression');
		});

		it('should parse MA10', () => {
			const entry = result.normative_references.find(r => r.ref_id === 'MA10');
			expect(entry).toBeDefined();
			expect(entry.description).toContain('Property Exchange');
		});
	});

	describe('Definitions', () => {
		it('should have 29 entries', () => {
			expect(result.definitions).toHaveLength(29);
			expect(result.summary.definition_count).toBe(29);
		});

		it('should parse 100-Cent Unit', () => {
			const entry = result.definitions.find(d => d.term === '100-Cent Unit');
			expect(entry).toBeDefined();
			expect(entry.description).toContain('one-twelfth of an octave');
		});

		it('should parse Manager Channel', () => {
			const entry = result.definitions.find(d => d.term === 'Manager Channel');
			expect(entry).toBeDefined();
			expect(entry.description).toContain('Zone');
		});

		it('should parse Member Channel', () => {
			const entry = result.definitions.find(d => d.term === 'Member Channel');
			expect(entry).toBeDefined();
			expect(entry.description).toContain('Manager Channel');
		});

		it('should parse Zone', () => {
			const entry = result.definitions.find(d => d.term === 'Zone');
			expect(entry).toBeDefined();
			expect(entry.description).toContain('Contiguous MIDI Channels');
		});

		it('should parse MPE Profile', () => {
			const entry = result.definitions.find(d => d.term === 'MPE Profile');
			expect(entry).toBeDefined();
			expect(entry.description).toContain('MIDI-CI Profile');
		});
	});

	describe('Conformance Words (Relating)', () => {
		it('should have 3 entries', () => {
			expect(result.conformance_words.relating_to_conformance).toHaveLength(3);
			expect(result.summary.conformance_relating_count).toBe(3);
		});

		it('should parse shall, should, may', () => {
			const words = result.conformance_words.relating_to_conformance.map(w => w.word);
			expect(words).toEqual(['shall', 'should', 'may']);
		});

		it('should parse shall as requirement', () => {
			const entry = result.conformance_words.relating_to_conformance.find(w => w.word === 'shall');
			expect(entry.reserved_for).toBe('Statements of requirement');
		});

		it('should parse should as recommendation', () => {
			const entry = result.conformance_words.relating_to_conformance.find(w => w.word === 'should');
			expect(entry.reserved_for).toBe('Statements of recommendation');
		});
	});

	describe('Conformance Words (Not Relating)', () => {
		it('should have 4 entries', () => {
			expect(result.conformance_words.not_relating_to_conformance).toHaveLength(4);
			expect(result.summary.conformance_not_relating_count).toBe(4);
		});

		it('should parse must, will, can, might', () => {
			const words = result.conformance_words.not_relating_to_conformance.map(w => w.word);
			expect(words).toEqual(['must', 'will', 'can', 'might']);
		});

		it('should parse must as unavoidability', () => {
			const entry = result.conformance_words.not_relating_to_conformance.find(w => w.word === 'must');
			expect(entry.reserved_for).toBe('Statements of unavoidability');
		});
	});

	describe('Profile ID', () => {
		it('should have 5 bytes', () => {
			expect(result.profile_id).toHaveLength(5);
			expect(result.summary.profile_id_byte_count).toBe(5);
		});

		it('should parse Byte 1 as Standard Defined Profile', () => {
			const byte1 = result.profile_id.find(b => b.byte === 1);
			expect(byte1.value).toBe('0x7E');
			expect(byte1.description).toBe('Standard Defined Profile');
		});

		it('should parse Byte 2 as MPE Profile Bank', () => {
			const byte2 = result.profile_id.find(b => b.byte === 2);
			expect(byte2.value).toBe('0x31');
			expect(byte2.description).toBe('MPE Profile Bank');
		});

		it('should parse Byte 3 as MPE Profile Number', () => {
			const byte3 = result.profile_id.find(b => b.byte === 3);
			expect(byte3.value).toBe('0x00');
			expect(byte3.description).toBe('MPE Profile Number');
		});

		it('should parse Byte 4 as MPE Profile Version', () => {
			const byte4 = result.profile_id.find(b => b.byte === 4);
			expect(byte4.value).toBe('0x01');
			expect(byte4.description).toBe('MPE Profile Version');
		});

		it('should parse Byte 5 as MPE Profile Level', () => {
			const byte5 = result.profile_id.find(b => b.byte === 5);
			expect(byte5.value).toBe('0x01');
			expect(byte5.description).toBe('MPE Profile Level');
		});
	});

	describe('Channel Response Type Notification', () => {
		it('should have entries', () => {
			expect(result.channel_response_notification.length).toBeGreaterThan(0);
			expect(result.summary.channel_response_notification_count).toBe(result.channel_response_notification.length);
		});

		it('should start with F0 System Exclusive Start', () => {
			const first = result.channel_response_notification[0];
			expect(first.value).toBe('F0');
			expect(first.parameter).toBe('System Exclusive Start');
		});

		it('should end with F7 End Universal System Exclusive', () => {
			const last = result.channel_response_notification[result.channel_response_notification.length - 1];
			expect(last.value).toBe('F7');
			expect(last.parameter).toBe('End Universal System Exclusive');
		});

		it('should contain Profile Specific Data sub-ID', () => {
			const entry = result.channel_response_notification.find(e => e.parameter.includes('Profile Specific Data'));
			expect(entry).toBeDefined();
		});
	});

	describe('Profile Details Inquiry Message', () => {
		it('should have entries', () => {
			expect(result.profile_details_inquiry.length).toBeGreaterThan(0);
			expect(result.summary.profile_details_inquiry_count).toBe(result.profile_details_inquiry.length);
		});

		it('should start with F0', () => {
			expect(result.profile_details_inquiry[0].value).toBe('F0');
		});

		it('should end with F7', () => {
			const last = result.profile_details_inquiry[result.profile_details_inquiry.length - 1];
			expect(last.value).toBe('F7');
		});

		it('should contain Profile Details Inquiry sub-ID', () => {
			const entry = result.profile_details_inquiry.find(e => e.parameter.includes('Profile Details Inquiry'));
			expect(entry).toBeDefined();
		});
	});

	describe('Reply to Profile Details Inquiry Message', () => {
		it('should have entries', () => {
			expect(result.reply_to_profile_details.length).toBeGreaterThan(0);
			expect(result.summary.reply_to_profile_details_count).toBe(result.reply_to_profile_details.length);
		});

		it('should start with F0', () => {
			expect(result.reply_to_profile_details[0].value).toBe('F0');
		});

		it('should end with F7', () => {
			const last = result.reply_to_profile_details[result.reply_to_profile_details.length - 1];
			expect(last.value).toBe('F7');
		});

		it('should contain Features Supported', () => {
			const entry = result.reply_to_profile_details.find(e => e.parameter.includes('Features Supported'));
			expect(entry).toBeDefined();
		});
	});

	describe('Profile Features Supported', () => {
		it('should have 4 bytes', () => {
			expect(result.profile_features_supported).toHaveLength(4);
			expect(result.summary.profile_features_supported_count).toBe(4);
		});

		it('should parse Byte 1 as bitmap with D0 and D1-D6 fields', () => {
			const byte1 = result.profile_features_supported.find(b => b.byte === 1);
			expect(byte1).toBeDefined();
			expect(byte1.fields.length).toBeGreaterThanOrEqual(2);
			expect(byte1.fields[0].value).toBe('D0:');
			expect(byte1.fields[0].description).toContain('Channel Response Type Notification');
			expect(byte1.fields[1].value).toBe('D1-D6:');
			expect(byte1.fields[1].description).toBe('Reserved');
		});

		it('should parse Byte 2 as enum for Pitch Bend', () => {
			const byte2 = result.profile_features_supported.find(b => b.byte === 2);
			expect(byte2).toBeDefined();
			expect(byte2.type).toBe('enum');
			expect(byte2.fields).toHaveLength(2);
			expect(byte2.fields[0].value).toBe('0x00');
			expect(byte2.fields[1].value).toBe('0x01');
		});

		it('should parse Byte 3 as enum for Channel Pressure', () => {
			const byte3 = result.profile_features_supported.find(b => b.byte === 3);
			expect(byte3).toBeDefined();
			expect(byte3.type).toBe('enum');
			expect(byte3.fields).toHaveLength(3);
		});

		it('should parse Byte 4 as enum for Third Dimension', () => {
			const byte4 = result.profile_features_supported.find(b => b.byte === 4);
			expect(byte4).toBeDefined();
			expect(byte4.type).toBe('enum');
			expect(byte4.fields).toHaveLength(3);
		});
	});

	describe('MPE Expression Controllers', () => {
		it('should have 3 entries', () => {
			expect(result.mpe_expression_controllers).toHaveLength(3);
			expect(result.summary.mpe_expression_controller_count).toBe(3);
		});

		it('should parse Pitch Bend', () => {
			const entry = result.mpe_expression_controllers.find(e => e.property === 'Pitch Bend');
			expect(entry).toBeDefined();
			expect(entry.controller).toBe('Pitch Bend');
			expect(entry.alternate_bipolar_controller).toBe('Pitch Bend');
		});

		it('should parse Pressure with RPN 0x20 0x20', () => {
			const entry = result.mpe_expression_controllers.find(e => e.property === 'Pressure');
			expect(entry).toBeDefined();
			expect(entry.controller).toBe('Channel Pressure');
			expect(entry.alternate_bipolar_controller).toContain('0x20');
		});

		it('should parse Third Dimension of Control with RPN 0x20 0x21', () => {
			const entry = result.mpe_expression_controllers.find(e => e.property === 'Third Dimension of Control');
			expect(entry).toBeDefined();
			expect(entry.controller).toBe('Control Change #74');
			expect(entry.alternate_bipolar_controller).toContain('0x21');
		});
	});

	describe('Note On Setup Controllers Example', () => {
		it('should have 4 entries', () => {
			expect(result.note_on_setup_example).toHaveLength(4);
			expect(result.summary.note_on_setup_example_count).toBe(4);
		});

		it('should parse sequence 1 as Pitch Bend', () => {
			const entry = result.note_on_setup_example.find(e => e.sequence === 1);
			expect(entry).toBeDefined();
			expect(entry.description).toBe('Pitch Bend');
			expect(entry.effect).toContain('Quartertone bend');
		});

		it('should parse sequence 2 as Third Dimension of Control', () => {
			const entry = result.note_on_setup_example.find(e => e.sequence === 2);
			expect(entry).toBeDefined();
			expect(entry.description).toBe('Third Dimension of Control.');
			expect(entry.effect).toContain('Control Change #74');
		});

		it('should parse sequence 3 as Channel Pressure', () => {
			const entry = result.note_on_setup_example.find(e => e.sequence === 3);
			expect(entry).toBeDefined();
			expect(entry.description).toBe('Channel Pressure');
			expect(entry.effect).toContain('Set to zero');
		});

		it('should parse sequence 4 as Note On', () => {
			const entry = result.note_on_setup_example.find(e => e.sequence === 4);
			expect(entry).toBeDefined();
			expect(entry.description).toBe('Note On');
			expect(entry.effect).toContain('Middle C');
		});
	});

	describe('Negotiating Steps', () => {
		it('should have 4 steps', () => {
			expect(Object.keys(result.negotiating_steps)).toHaveLength(4);
			expect(result.summary.negotiating_steps_count).toBe(4);
		});

		it('should parse step1 with F0 and F7', () => {
			const step1 = result.negotiating_steps.step1;
			expect(step1).toBeDefined();
			expect(step1.length).toBeGreaterThan(0);
			expect(step1[0].value).toBe('F0');
			expect(step1[step1.length - 1].value).toBe('F7');
		});

		it('should parse step2 with channel count fields', () => {
			const step2 = result.negotiating_steps.step2;
			expect(step2).toBeDefined();
			expect(step2.length).toBeGreaterThan(0);
			const channelsEntry = step2.find(e => e.parameter.includes('Channels currently in use'));
			expect(channelsEntry).toBeDefined();
		});

		it('should parse step3 with Set Profile On', () => {
			const step3 = result.negotiating_steps.step3;
			expect(step3).toBeDefined();
			expect(step3.length).toBeGreaterThan(0);
			const setProfileEntry = step3.find(e => e.parameter.includes('Set Profile On'));
			expect(setProfileEntry).toBeDefined();
		});

		it('should parse step4 with Profile Enabled', () => {
			const step4 = result.negotiating_steps.step4;
			expect(step4).toBeDefined();
			expect(step4.length).toBeGreaterThan(0);
			const enabledEntry = step4.find(e => e.parameter.includes('Profile Enabled'));
			expect(enabledEntry).toBeDefined();
		});
	});

	describe('MIDI Messages Table', () => {
		it('should have raw lines', () => {
			expect(result.midi_messages_table.length).toBeGreaterThan(0);
			expect(result.summary.midi_messages_table_count).toBe(result.midi_messages_table.length);
		});

		it('should contain Registered Controller/RPN #0', () => {
			const entry = result.midi_messages_table.find(l => l.includes('Registered Controller/RPN #0'));
			expect(entry).toBeDefined();
		});

		it('should contain Pitch Bend', () => {
			const entry = result.midi_messages_table.find(l => l === 'Pitch Bend');
			expect(entry).toBeDefined();
		});

		it('should contain Control Change #120', () => {
			const entry = result.midi_messages_table.find(l => l.includes('Control Change #120'));
			expect(entry).toBeDefined();
		});

		it('should contain Note On/Off messages', () => {
			const entry = result.midi_messages_table.find(l => l.includes('Note On/Off messages'));
			expect(entry).toBeDefined();
		});

		it('should contain See Section references', () => {
			const hasSeeSection = result.midi_messages_table.some(l => l.startsWith('See Section'));
			expect(hasSeeSection).toBe(true);
		});
	});

	describe('Summary Counts', () => {
		it('should have all correct counts', () => {
			const s = result.summary;
			expect(s.version_history_count).toBe(1);
			expect(s.normative_reference_count).toBe(10);
			expect(s.definition_count).toBe(29);
			expect(s.conformance_relating_count).toBe(3);
			expect(s.conformance_not_relating_count).toBe(4);
			expect(s.profile_id_byte_count).toBe(5);
			expect(s.channel_response_notification_count).toBe(result.channel_response_notification.length);
			expect(s.profile_details_inquiry_count).toBe(result.profile_details_inquiry.length);
			expect(s.reply_to_profile_details_count).toBe(result.reply_to_profile_details.length);
			expect(s.profile_features_supported_count).toBe(4);
			expect(s.mpe_expression_controller_count).toBe(3);
			expect(s.note_on_setup_example_count).toBe(4);
			expect(s.negotiating_steps_count).toBe(4);
			expect(s.midi_messages_table_count).toBe(result.midi_messages_table.length);
		});
	});
});
