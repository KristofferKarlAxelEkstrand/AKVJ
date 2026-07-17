import { describe, it, expect, beforeAll } from 'vitest';
import { transformCa31 } from '../../lib/transformers/ca31Transformer.js';
import path from 'node:path';

const MARKDOWN_PATH = path.resolve('data/ca31.md');

let result;

beforeAll(async () => {
	result = await transformCa31(MARKDOWN_PATH);
});

describe('CA-031 CC#88 High Resolution Velocity Prefix Transformer', () => {
	it('should produce a result object', () => {
		expect(result).toBeDefined();
		expect(typeof result).toBe('object');
	});

	describe('Metadata', () => {
		it('should have correct metadata from frontmatter', () => {
			expect(result.metadata.title).toContain('CC #88');
			expect(result.metadata.title).toContain('High Resolution Velocity Prefix');
			expect(result.metadata.doc_id).toBe('CA-031');
			expect(result.metadata.protocol).toBe('midi1');
			expect(result.metadata.pages).toBe(1);
		});
	});

	describe('Abstract', () => {
		it('should define CC 88 as High Resolution Velocity Prefix', () => {
			expect(result.abstract).toContain('Controller 88');
			expect(result.abstract).toContain('High Resolution Velocity Prefix');
			expect(result.abstract).toContain('Note On');
		});
	});

	describe('Background', () => {
		it('should mention 14-bit resolution', () => {
			expect(result.background).toContain('14-bit');
			expect(result.background).toContain('compatibility');
		});
	});

	describe('Controller Message', () => {
		it('should have CC number 88 (0x58)', () => {
			expect(result.controller_message.cc_number).toBe(88);
			expect(result.controller_message.cc_hex).toBe('0x58');
		});

		it('should have message format Bn 58 vv', () => {
			expect(result.controller_message.format).toBe('Bn 58 vv');
		});

		it('should have name', () => {
			expect(result.controller_message.name).toContain('HIGH-RESOLUTION VELOCITY PREFIX');
		});

		it('should describe vv as lower 7 bits', () => {
			expect(result.controller_message.value_description).toContain('lower 7 bits');
		});
	});

	describe('Usage Rules', () => {
		it('should have usage rules', () => {
			expect(result.usage_rules.length).toBeGreaterThanOrEqual(3);
		});

		it('should mention Running Status compatibility', () => {
			const allRules = result.usage_rules.join(' ');
			expect(allRules).toContain('Running Status');
		});

		it('should mention 14-bit velocity range', () => {
			const allRules = result.usage_rules.join(' ');
			expect(allRules).toContain('0080H');
			expect(allRules).toContain('3FFFH');
		});
	});

	describe('Compatibility', () => {
		it('should mention backward compatibility', () => {
			expect(result.compatibility).toContain('ignore');
			expect(result.compatibility).toContain('7 bits');
		});
	});

	describe('Summary', () => {
		it('should have usage rule count', () => {
			expect(result.summary.usage_rule_count).toBeGreaterThanOrEqual(3);
		});
	});
});
