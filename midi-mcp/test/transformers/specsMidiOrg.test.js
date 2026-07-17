import { describe, it, expect, beforeAll } from 'vitest';
import { transformSpecsMidiOrg } from '../../lib/transformers/specsMidiOrgTransformer.js';
import path from 'node:path';

const MARKDOWN_PATH = path.resolve('data/specs-midi-org.md');

let result;

beforeAll(async () => {
	result = await transformSpecsMidiOrg(MARKDOWN_PATH);
});

describe('Specs MIDI.org Index Transformer', () => {
	it('should produce a result object', () => {
		expect(result).toBeDefined();
		expect(typeof result).toBe('object');
	});

	describe('Metadata', () => {
		it('should have correct metadata from frontmatter', () => {
			expect(result.metadata.title).toBe('Specs');
			expect(result.metadata.protocol).toBe('general');
		});
	});

	describe('Description', () => {
		it('should mention MIDI Association', () => {
			expect(result.description).toContain('MIDI Association');
		});

		it('should mention Specifications', () => {
			expect(result.description).toContain('Specifications');
		});
	});

	describe('Reference Tables', () => {
		it('should have 6 reference tables', () => {
			expect(result.reference_tables).toHaveLength(6);
		});

		it('should include Summary of MIDI 1.0 Messages', () => {
			expect(result.reference_tables).toContain('Summary of MIDI 1.0 Messages');
		});

		it('should include Standards that Incorporate MIDI', () => {
			expect(result.reference_tables).toContain('Standards that Incorporate MIDI');
		});

		it('should include DLS Proprietary Chunk IDs', () => {
			expect(result.reference_tables).toContain('DLS Proprietary Chunk IDs');
		});
	});

	describe('Spec Categories', () => {
		it('should have 4 spec categories', () => {
			expect(result.spec_categories).toHaveLength(4);
		});

		it('should include MIDI 2.0 category', () => {
			const m20 = result.spec_categories.find(c => c.name === 'MIDI 2.0');
			expect(m20).toBeDefined();
			expect(m20.description).toContain('extension of MIDI 1.0');
		});

		it('should include MIDI 1.0 category', () => {
			const m10 = result.spec_categories.find(c => c.name === 'MIDI 1.0');
			expect(m10).toBeDefined();
			expect(m10.description).toContain('1983');
		});

		it('should include MIDI Transports category', () => {
			const trans = result.spec_categories.find(c => c.name === 'MIDI Transports');
			expect(trans).toBeDefined();
			expect(trans.description).toContain('5-Pin DIN');
		});

		it('should include File Formats category with 4 formats', () => {
			const ff = result.spec_categories.find(c => c.name === 'File Formats');
			expect(ff).toBeDefined();
			expect(ff.file_formats).toHaveLength(4);
			expect(ff.file_formats).toContain('Standard MIDI Files');
			expect(ff.file_formats).toContain('DLS: Downloadable Sounds');
			expect(ff.file_formats).toContain('XMF: eXtensible Music Format');
		});
	});

	describe('Summary', () => {
		it('should have counts', () => {
			expect(result.summary.reference_table_count).toBe(6);
			expect(result.summary.spec_category_count).toBe(4);
		});
	});
});
