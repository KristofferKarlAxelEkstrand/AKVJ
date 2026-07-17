import { describe, it, expect, beforeAll } from 'vitest';
import { transformMidiTuningUpdated } from '../../lib/transformers/midiTuningUpdatedTransformer.js';
import path from 'node:path';

const MARKDOWN_PATH = path.resolve('data/midi-tuning-updated-specification-midi-org.md');

let result;

beforeAll(async () => {
	result = await transformMidiTuningUpdated(MARKDOWN_PATH);
});

describe('MIDI Tuning Updated Specification Transformer', () => {
	it('should produce a result object', () => {
		expect(result).toBeDefined();
		expect(typeof result).toBe('object');
	});

	describe('Metadata', () => {
		it('should have correct metadata from frontmatter', () => {
			expect(result.metadata.title).toContain('MIDI Tuning');
			expect(result.metadata.protocol).toBe('midi1');
		});
	});

	describe('Description', () => {
		it('should mention microtunings', () => {
			expect(result.description).toContain('microtunings');
		});

		it('should mention real-time performance', () => {
			expect(result.description).toContain('real-time');
		});
	});

	describe('Incorporates', () => {
		it('should have 3 incorporated specs', () => {
			expect(result.incorporates).toHaveLength(3);
		});

		it('should include CA-020', () => {
			const ca20 = result.incorporates.find(e => e.includes('CA-020'));
			expect(ca20).toBeDefined();
			expect(ca20).toContain('Bank/Dump');
		});

		it('should include CA-021/RP-020', () => {
			const ca21 = result.incorporates.find(e => e.includes('CA-021'));
			expect(ca21).toBeDefined();
			expect(ca21).toContain('Scale/Octave');
		});

		it('should include RP-020 defaults', () => {
			const rp20 = result.incorporates.find(e => e.includes('Defaults'));
			expect(rp20).toBeDefined();
			expect(rp20).toContain('RP-020');
		});
	});

	describe('Message Types', () => {
		it('should have 3 message types', () => {
			expect(result.message_types).toHaveLength(3);
		});

		it('should include Bulk Tuning Dump Request', () => {
			const req = result.message_types.find(e => e.includes('Dump Request'));
			expect(req).toBeDefined();
			expect(req).toContain('non-real-time');
		});

		it('should include Bulk Tuning Dump', () => {
			const dump = result.message_types.find(e => e.includes('Bulk Tuning Dump') && !e.includes('Request'));
			expect(dump).toBeDefined();
			expect(dump).toContain('non-real-time');
		});

		it('should include Single-note Tuning Change', () => {
			const change = result.message_types.find(e => e.includes('Single-note'));
			expect(change).toBeDefined();
			expect(change).toContain('real-time');
		});
	});

	describe('Scale/Octave Tuning Description', () => {
		it('should mention cent offsets', () => {
			expect(result.scale_octave_tuning_description).toContain('cent');
		});

		it('should mention equal-tempered half-step', () => {
			expect(result.scale_octave_tuning_description).toContain('equal-tempered');
		});
	});

	describe('Download File', () => {
		it('should have file name', () => {
			expect(result.download_file.file_name).toContain('MIDI Tuning');
		});

		it('should have category Addenda', () => {
			expect(result.download_file.category).toBe('Addenda');
		});

		it('should have file size', () => {
			expect(result.download_file.file_size).toMatch(/KB/);
		});
	});

	describe('Summary', () => {
		it('should have counts', () => {
			expect(result.summary.incorporates_count).toBe(3);
			expect(result.summary.message_type_count).toBe(3);
		});
	});
});
