import { describe, it, expect, beforeAll } from 'vitest';
import { transformRp32 } from '../../lib/transformers/rp32Transformer.js';
import path from 'node:path';

const MARKDOWN_PATH = path.resolve('data/rp32-xmf-patch-prefix-meta-event.md');

let result;

beforeAll(async () => {
	result = await transformRp32(MARKDOWN_PATH);
});

describe('RP-032 XMF Patch Type Prefix Meta-Event Transformer', () => {
	it('should produce a result object', () => {
		expect(result).toBeDefined();
		expect(typeof result).toBe('object');
	});

	describe('Metadata', () => {
		it('should have correct metadata from frontmatter', () => {
			expect(result.metadata.title).toContain('XMF Patch Type Prefix');
			expect(result.metadata.doc_id).toBe('RP-032');
			expect(result.metadata.protocol).toBe('midi1');
			expect(result.metadata.pages).toBe(1);
		});
	});

	describe('Abstract', () => {
		it('should mention XMF Type 0 and Type 1', () => {
			expect(result.abstract).toContain('XMF');
			expect(result.abstract).toContain('DLS');
		});
	});

	describe('Meta Event', () => {
		it('should have correct name', () => {
			expect(result.meta_event.name).toBe('XMF Patch Type Prefix Meta-Event');
		});

		it('should have format FF 60', () => {
			expect(result.meta_event.format).toContain('FF 60');
		});

		it('should have meta event type 0x60', () => {
			expect(result.meta_event.meta_event_type).toBe('0x60');
		});
	});

	describe('Params', () => {
		it('should have 3 params', () => {
			expect(result.params).toHaveLength(3);
		});

		it('should parse 0x01 General MIDI 1', () => {
			const entry = result.params.find(e => e.param === '0x01');
			expect(entry).toBeDefined();
			expect(entry.name).toContain('General MIDI 1');
			expect(entry.syntax).toContain('FF 60 01 01');
		});

		it('should parse 0x02 General MIDI 2', () => {
			const entry = result.params.find(e => e.param === '0x02');
			expect(entry).toBeDefined();
			expect(entry.name).toContain('General MIDI 2');
			expect(entry.syntax).toContain('FF 60 01 02');
		});

		it('should parse 0x03 DLS', () => {
			const entry = result.params.find(e => e.param === '0x03');
			expect(entry).toBeDefined();
			expect(entry.name).toContain('DLS');
			expect(entry.syntax).toContain('FF 60 01 03');
		});
	});

	describe('Usage Rules', () => {
		it('should have usage rules', () => {
			expect(result.usage_rules.length).toBeGreaterThanOrEqual(2);
		});

		it('should mention default GM1', () => {
			const allRules = result.usage_rules.join(' ');
			expect(allRules).toContain('General MIDI 1');
			expect(allRules).toContain('default');
		});

		it('should mention first message only', () => {
			const allRules = result.usage_rules.join(' ');
			expect(allRules).toContain('first message');
		});
	});

	describe('SysEx Relationship', () => {
		it('should mention GM1/GM2 System On and DLS', () => {
			expect(result.sysex_relationship).toContain('GM1 System On');
			expect(result.sysex_relationship).toContain('GM2 System On');
			expect(result.sysex_relationship).toContain('DLS');
		});

		it('should mention ignoring SysEx', () => {
			expect(result.sysex_relationship).toContain('ignored');
		});
	});

	describe('Summary', () => {
		it('should have counts', () => {
			expect(result.summary.param_count).toBe(3);
			expect(result.summary.usage_rule_count).toBeGreaterThanOrEqual(2);
		});
	});
});
