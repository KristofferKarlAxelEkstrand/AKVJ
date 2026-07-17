import { describe, it, expect, beforeAll } from 'vitest';
import { transformRp23 } from '../../lib/transformers/rp23Transformer.js';
import path from 'node:path';

const MARKDOWN_PATH = path.resolve('data/rp23.md');

let result;

beforeAll(async () => {
	result = await transformRp23(MARKDOWN_PATH);
});

describe('RP-023 Renaming of CC91 and CC93 Transformer', () => {
	it('should produce a result object', () => {
		expect(result).toBeDefined();
		expect(typeof result).toBe('object');
	});

	describe('Metadata', () => {
		it('should have correct metadata from frontmatter', () => {
			expect(result.metadata.title).toContain('RP-023');
			expect(result.metadata.title).toContain('CC91');
			expect(result.metadata.doc_id).toBe('RP-023');
			expect(result.metadata.protocol).toBe('midi1');
			expect(result.metadata.pages).toBe(1);
		});
	});

	describe('CC Renames', () => {
		it('should have 2 CC renames', () => {
			expect(result.cc_renames).toHaveLength(2);
		});

		it('should parse CC91 rename', () => {
			const entry = result.cc_renames.find(e => e.cc_number === 91);
			expect(entry).toBeDefined();
			expect(entry.cc_hex).toBe('0x5B');
			expect(entry.old_name).toBe('Effect 1 Depth');
			expect(entry.new_name).toBe('Reverb Send Level');
		});

		it('should parse CC93 rename', () => {
			const entry = result.cc_renames.find(e => e.cc_number === 93);
			expect(entry).toBeDefined();
			expect(entry.cc_hex).toBe('0x5D');
			expect(entry.old_name).toBe('Effect 3 Depth');
			expect(entry.new_name).toBe('Chorus Send Level');
		});
	});

	describe('Note', () => {
		it('should have a note about actual response', () => {
			expect(result.note).toContain('actual response');
			expect(result.note).toContain('General MIDI');
		});
	});

	describe('Approval', () => {
		it('should have MMA approval date', () => {
			expect(result.approval.mma_date).toBe('02/99');
		});

		it('should have AMEI approval date', () => {
			expect(result.approval.amei_date).toBe('05/99');
		});

		it('should have copyright', () => {
			expect(result.approval.copyright).toContain('1999');
		});
	});

	describe('Summary', () => {
		it('should have CC rename count', () => {
			expect(result.summary.cc_rename_count).toBe(2);
		});
	});
});
