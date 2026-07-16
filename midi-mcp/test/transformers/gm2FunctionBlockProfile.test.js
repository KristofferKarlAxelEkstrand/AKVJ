import { describe, it, expect, beforeAll } from 'vitest';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { transformGm2FunctionBlockProfile } from '../../lib/transformers/gm2FunctionBlockProfileTransformer.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

describe('GM2 Function Block Profile (M2-118-UM) Transformer', () => {
	let result;

	beforeAll(async () => {
		const docPath = path.resolve(__dirname, '../../data/m2-118-um-general-midi-2-function-block-profile.md');
		result = await transformGm2FunctionBlockProfile(docPath);
	});

	it('should produce correct metadata', () => {
		expect(result.metadata.title).toBe('General MIDI 2 Function Block Profile');
		expect(result.metadata.doc_id).toBe('M2-118-UM');
		expect(result.metadata.protocol).toBe('midi2');
		expect(result.metadata.version).toBe('1.0.0');
		expect(result.metadata.date).toBe('2024-01-24');
	});

	describe('Version History', () => {
		it('should have 1 entry', () => {
			expect(result.version_history).toHaveLength(1);
			expect(result.summary.version_history_count).toBe(1);
		});

		it('should parse initial release', () => {
			const entry = result.version_history[0];
			expect(entry.publication_date).toBe('2024-01-24');
			expect(entry.version).toBe('1.0');
			expect(entry.changes).toBe('Initial release');
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

		it('should parse MA07 (General MIDI 2)', () => {
			const entry = result.normative_references.find(r => r.ref_id === 'MA07');
			expect(entry).toBeDefined();
			expect(entry.description).toContain('General MIDI 2');
		});

		it('should parse MA04 (Common Rules for Profiles)', () => {
			const entry = result.normative_references.find(r => r.ref_id === 'MA04');
			expect(entry).toBeDefined();
			expect(entry.description).toContain('Common Rules');
		});
	});

	describe('Definitions', () => {
		it('should have 26 entries', () => {
			expect(result.definitions).toHaveLength(26);
			expect(result.summary.definition_count).toBe(26);
		});

		it('should parse Function Block', () => {
			const entry = result.definitions.find(d => d.term === 'Function Block');
			expect(entry).toBeDefined();
			expect(entry.description).toContain('UMP Endpoint');
		});

		it('should parse GM2', () => {
			const entry = result.definitions.find(d => d.term === 'GM2');
			expect(entry).toBeDefined();
			expect(entry.description).toBe('General MIDI 2.');
		});

		it('should parse GM2 Profile', () => {
			const entry = result.definitions.find(d => d.term === 'GM2 Profile');
			expect(entry).toBeDefined();
			expect(entry.description).toContain('MIDI-CI Profile');
		});

		it('should parse Device ID', () => {
			const entry = result.definitions.find(d => d.term === 'Device ID');
			expect(entry).toBeDefined();
			expect(entry.description).toContain('one-byte field');
		});

		it('should parse UMP Endpoint', () => {
			const entry = result.definitions.find(d => d.term === 'UMP Endpoint');
			expect(entry).toBeDefined();
			expect(entry.description).toContain('UMP Format');
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

		it('should parse may as permission', () => {
			const entry = result.conformance_words.relating_to_conformance.find(w => w.word === 'may');
			expect(entry.reserved_for).toBe('Statements of permission');
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

		it('should parse can as capability', () => {
			const entry = result.conformance_words.not_relating_to_conformance.find(w => w.word === 'can');
			expect(entry.reserved_for).toBe('Statements of capability');
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

		it('should parse Byte 2 as GM2 Profile Bank', () => {
			const byte2 = result.profile_id.find(b => b.byte === 2);
			expect(byte2.value).toBe('0x00');
			expect(byte2.description).toBe('General MIDI 2 Profile Bank');
		});

		it('should parse Byte 3 as GM2 Profile Number', () => {
			const byte3 = result.profile_id.find(b => b.byte === 3);
			expect(byte3.value).toBe('0x00');
			expect(byte3.description).toBe('General MIDI 2 Profile Number');
		});

		it('should parse Byte 4 as GM2 Profile Version', () => {
			const byte4 = result.profile_id.find(b => b.byte === 4);
			expect(byte4.value).toBe('0x01');
			expect(byte4.description).toBe('General MIDI 2 Profile Version');
		});

		it('should parse Byte 5 as GM2 Profile Level', () => {
			const byte5 = result.profile_id.find(b => b.byte === 5);
			expect(byte5.value).toBe('0x01');
			expect(byte5.description).toBe('General MIDI 2 Profile Level');
		});
	});

	describe('Summary Counts', () => {
		it('should have all correct counts', () => {
			const s = result.summary;
			expect(s.version_history_count).toBe(1);
			expect(s.normative_reference_count).toBe(7);
			expect(s.definition_count).toBe(26);
			expect(s.conformance_relating_count).toBe(3);
			expect(s.conformance_not_relating_count).toBe(4);
			expect(s.profile_id_byte_count).toBe(5);
		});
	});
});
