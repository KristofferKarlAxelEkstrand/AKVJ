import { describe, it, expect, beforeAll } from 'vitest';
import { transformCa26 } from '../../lib/transformers/ca26Transformer.js';
import path from 'node:path';

const MARKDOWN_PATH = path.resolve('data/ca26-rpn05-modulation-depth-range.md');

let result;

beforeAll(async () => {
	result = await transformCa26(MARKDOWN_PATH);
});

describe('CA-026 Modulation Depth Range RPN Transformer', () => {
	it('should produce a result object', () => {
		expect(result).toBeDefined();
		expect(typeof result).toBe('object');
	});

	describe('Metadata', () => {
		it('should have correct metadata from frontmatter', () => {
			expect(result.metadata.title).toContain('Modulation Depth Range');
			expect(result.metadata.doc_id).toBe('CA-026');
			expect(result.metadata.protocol).toBe('midi1');
			expect(result.metadata.pages).toBe(1);
		});
	});

	describe('Approval Info', () => {
		it('should have date of issue', () => {
			expect(result.approval_info.date_of_issue).toBe('3/02/99');
		});

		it('should have originated by MMA', () => {
			expect(result.approval_info.originated_by).toBe('MMA');
		});

		it('should have CA number', () => {
			expect(result.approval_info.ca_number).toBe('26_');
		});

		it('should have related items', () => {
			expect(result.approval_info.related_items).toContain('General MIDI 2');
		});
	});

	describe('Abstract', () => {
		it('should define RPN #05 as Modulation Depth Range', () => {
			expect(result.abstract).toContain('RPN');
			expect(result.abstract).toContain('Modulation Depth Range');
			expect(result.abstract).toContain('Modulation Wheel');
		});
	});

	describe('Background', () => {
		it('should mention modulation depth was never defined', () => {
			expect(result.background).toContain('never been defined');
		});

		it('should mention NRPNs and Sysex as existing methods', () => {
			expect(result.background).toContain('NRPN');
			expect(result.background).toContain('Sysex');
		});
	});

	describe('RPN', () => {
		it('should have RPN number 5', () => {
			expect(result.rpn.rpn_number).toBe(5);
		});

		it('should have LSB 5 and MSB 0', () => {
			expect(result.rpn.lsb).toBe(5);
			expect(result.rpn.msb).toBe(0);
		});

		it('should have name Modulation Depth Range', () => {
			expect(result.rpn.name).toBe('Modulation Depth Range');
		});

		it('should have message format Bn 64 05 65 00', () => {
			expect(result.rpn.message_format).toContain('Bn 64 05 65 00');
		});

		it('should mention Data Entry follow-up', () => {
			expect(result.rpn.follow_up).toContain('Data Entry');
			expect(result.rpn.follow_up).toContain('Increment');
			expect(result.rpn.follow_up).toContain('Decrement');
		});

		it('should mention no default setting', () => {
			expect(result.rpn.default_setting).toContain('default setting');
			expect(result.rpn.default_setting).toContain('manufacturer');
		});
	});

	describe('Comment', () => {
		it('should mention Vibrato as default destination', () => {
			expect(result.comment).toContain('Vibrato');
		});

		it('should mention Controller Destination Setting', () => {
			expect(result.comment).toContain('Controller Destination Setting');
		});
	});

	describe('Summary', () => {
		it('should have RPN number', () => {
			expect(result.summary.rpn_number).toBe(5);
		});
	});
});
