import { describe, it, expect, beforeAll } from 'vitest';
import { transformRp21 } from '../../lib/transformers/rp21Transformer.js';
import path from 'node:path';

const MARKDOWN_PATH = path.resolve('data/rp21.md');

let result;

beforeAll(async () => {
	result = await transformRp21(MARKDOWN_PATH);
});

describe('RP-021 Sound Controller Defaults Transformer', () => {
	it('should produce a result object', () => {
		expect(result).toBeDefined();
		expect(typeof result).toBe('object');
	});

	describe('Metadata', () => {
		it('should have correct metadata from frontmatter', () => {
			expect(result.metadata.title).toContain('RP-021');
			expect(result.metadata.title).toContain('Sound Controller Defaults');
			expect(result.metadata.doc_id).toBe('RP-021');
			expect(result.metadata.protocol).toBe('midi1');
			expect(result.metadata.pages).toBe(1);
		});
	});

	describe('Sound Controllers', () => {
		it('should have 10 sound controllers (CC 70-79)', () => {
			expect(result.sound_controllers).toHaveLength(10);
		});

		it('should parse CC70 Sound Controller 1', () => {
			const entry = result.sound_controllers.find(e => e.cc_number === 70);
			expect(entry).toBeDefined();
			expect(entry.cc_hex).toBe('0x46');
			expect(entry.control_function).toBe('Sound Controller 1');
			expect(entry.default_name).toContain('Sound Variation');
		});

		it('should parse CC75 Sound Controller 6 (new default)', () => {
			const entry = result.sound_controllers.find(e => e.cc_number === 75);
			expect(entry).toBeDefined();
			expect(entry.cc_hex).toBe('0x4B');
			expect(entry.control_function).toBe('Sound Controller 6');
			expect(entry.default_name).toBe('Decay Time');
		});

		it('should parse CC76 Sound Controller 7', () => {
			const entry = result.sound_controllers.find(e => e.cc_number === 76);
			expect(entry).toBeDefined();
			expect(entry.default_name).toBe('Vibrato Rate');
		});

		it('should parse CC79 Sound Controller 10 as undefined', () => {
			const entry = result.sound_controllers.find(e => e.cc_number === 79);
			expect(entry).toBeDefined();
			expect(entry.default_name).toBe('undefined');
		});

		it('should mark unchanged items with asterisk in name', () => {
			const entry = result.sound_controllers.find(e => e.cc_number === 70);
			expect(entry.default_name).toContain('*');
		});
	});

	describe('Comments', () => {
		it('should have comments', () => {
			expect(result.comments.length).toBeGreaterThanOrEqual(2);
		});

		it('should mention Controller Destination Setting', () => {
			const allComments = result.comments.join(' ');
			expect(allComments).toContain('Controller Destination Setting');
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
		it('should have counts', () => {
			expect(result.summary.sound_controller_count).toBe(10);
			expect(result.summary.comment_count).toBeGreaterThanOrEqual(2);
		});
	});
});
