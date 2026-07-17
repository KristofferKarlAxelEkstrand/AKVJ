import { describe, it, expect, beforeAll } from 'vitest';
import { transformMmc } from '../../lib/transformers/mmcTransformer.js';
import path from 'node:path';

const MARKDOWN_PATH = path.resolve('data/rp-013-v1-0-midi-machine-control-specification-96-1-4.md');

let result;

beforeAll(async () => {
	result = await transformMmc(MARKDOWN_PATH);
});

describe('MMC Transformer', () => {
	it('should produce a result object', () => {
		expect(result).toBeDefined();
		expect(typeof result).toBe('object');
	});

	describe('Metadata', () => {
		it('should have correct metadata', () => {
			expect(result.metadata.title).toBe('MIDI Machine Control');
			expect(result.metadata.doc_id).toBe('RP-013');
			expect(result.metadata.protocol).toBe('midi1');
			expect(result.metadata.version).toBe('1.0');
		});
	});

	describe('Message Types', () => {
		it('should have 10 message types', () => {
			expect(result.message_types).toHaveLength(10);
		});

		it('should parse Comm type', () => {
			const entry = result.message_types.find(e => e.abbreviation === 'Comm');
			expect(entry).toBeDefined();
			expect(entry.description).toContain('communications');
		});

		it('should parse Ctrl type', () => {
			const entry = result.message_types.find(e => e.abbreviation === 'Ctrl');
			expect(entry).toBeDefined();
			expect(entry.description).toContain('transport');
		});

		it('should parse I/O type', () => {
			const entry = result.message_types.find(e => e.abbreviation === 'I/O');
			expect(entry).toBeDefined();
			expect(entry.description).toContain('READ and WRITE');
		});

		it('should parse Time type', () => {
			const entry = result.message_types.find(e => e.abbreviation === 'Time');
			expect(entry).toBeDefined();
			expect(entry.description).toContain('time code');
		});
	});

	describe('Abbreviations', () => {
		it('should have 6 abbreviations', () => {
			expect(result.abbreviations).toHaveLength(6);
		});

		it('should parse ATR', () => {
			const entry = result.abbreviations.find(e => e.abbreviation === 'ATR');
			expect(entry).toBeDefined();
			expect(entry.description).toContain('Audio Tape Recorder');
		});

		it('should parse MMC', () => {
			const entry = result.abbreviations.find(e => e.abbreviation === 'MMC');
			expect(entry).toBeDefined();
			expect(entry.description).toContain('MIDI Machine Control');
		});

		it('should parse RW', () => {
			const entry = result.abbreviations.find(e => e.abbreviation === 'RW');
			expect(entry).toBeDefined();
			expect(entry.description).toContain('READ/WRITE');
		});
	});

	describe('Commands Index', () => {
		it('should have commands', () => {
			expect(result.commands.length).toBeGreaterThan(15);
		});

		it('should parse 01 as STOP', () => {
			const entry = result.commands.find(e => e.hex === '01');
			expect(entry).toBeDefined();
			expect(entry.name).toContain('STOP');
			expect(entry.type).toBe('Ctrl');
		});

		it('should parse 02 as PLAY', () => {
			const entry = result.commands.find(e => e.hex === '02');
			expect(entry).toBeDefined();
			expect(entry.name).toContain('PLAY');
		});

		it('should parse 0A as EJECT', () => {
			const entry = result.commands.find(e => e.hex === '0A');
			expect(entry).toBeDefined();
			expect(entry.name).toContain('EJECT');
		});

		it('should parse 42 as READ', () => {
			const entry = result.commands.find(e => e.hex === '42');
			expect(entry).toBeDefined();
			expect(entry.name).toContain('READ');
		});

		it('should parse 7F as RESUME', () => {
			const entry = result.commands.find(e => e.hex === '7F');
			expect(entry).toBeDefined();
			expect(entry.name).toContain('RESUME');
		});
	});

	describe('Information Fields Index', () => {
		it('should have information fields', () => {
			expect(result.information_fields.length).toBeGreaterThan(10);
		});

		it('should parse 01 as SELECTED TIME CODE', () => {
			const entry = result.information_fields.find(e => e.hex === '01');
			expect(entry).toBeDefined();
			expect(entry.name).toContain('SELECTED TIME CODE');
		});

		it('should parse 40 as SIGNATURE', () => {
			const entry = result.information_fields.find(e => e.hex === '40');
			expect(entry).toBeDefined();
			expect(entry.name).toContain('SIGNATURE');
		});
	});

	describe('Command Descriptions', () => {
		it('should have command descriptions', () => {
			expect(result.command_descriptions.length).toBeGreaterThan(20);
		});

		it('should parse 01 STOP with description', () => {
			const entry = result.command_descriptions.find(e => e.hex === '01' && e.name === 'STOP');
			expect(entry).toBeDefined();
			expect(entry.description.length).toBeGreaterThan(10);
		});

		it('should parse 02 PLAY with description', () => {
			const entry = result.command_descriptions.find(e => e.hex === '02' && e.name === 'PLAY');
			expect(entry).toBeDefined();
			expect(entry.description).toContain('playback');
		});

		it('should parse 42 READ with description', () => {
			const entry = result.command_descriptions.find(e => e.hex === '42' && e.name === 'READ');
			expect(entry).toBeDefined();
			expect(entry.description.length).toBeGreaterThan(10);
		});

		it('should parse 7C WAIT with description', () => {
			const entry = result.command_descriptions.find(e => e.hex === '7C' && e.name === 'WAIT');
			expect(entry).toBeDefined();
			expect(entry.description.length).toBeGreaterThan(10);
		});
	});

	describe('Field Descriptions', () => {
		it('should have field descriptions', () => {
			expect(result.field_descriptions.length).toBeGreaterThan(30);
		});

		it('should parse 01 SELECTED TIME CODE with description', () => {
			const entry = result.field_descriptions.find(e => e.hex === '01' && e.name === 'SELECTED TIME CODE');
			expect(entry).toBeDefined();
			expect(entry.description.length).toBeGreaterThan(10);
		});

		it('should parse 06 GENERATOR TIME CODE', () => {
			const entry = result.field_descriptions.find(e => e.hex === '06' && e.name.includes('GENERATOR'));
			expect(entry).toBeDefined();
		});
	});

	describe('Summary', () => {
		it('should have all summary counts', () => {
			expect(result.summary.message_type_count).toBe(10);
			expect(result.summary.abbreviation_count).toBe(6);
			expect(result.summary.command_count).toBeGreaterThan(15);
			expect(result.summary.information_field_count).toBeGreaterThan(10);
			expect(result.summary.command_description_count).toBeGreaterThan(20);
			expect(result.summary.field_description_count).toBeGreaterThan(30);
		});
	});
});
