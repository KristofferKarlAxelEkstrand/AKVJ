import { describe, it, expect, beforeAll } from 'vitest';
import { transformMdnWebMidi } from '../../lib/transformers/mdnWebMidiTransformer.js';
import path from 'node:path';

const MARKDOWN_PATH = path.resolve('data/web-midi-midiconnectionevent-mdn.md');

let result;

beforeAll(async () => {
	result = await transformMdnWebMidi(MARKDOWN_PATH);
});

describe('MIDIConnectionEvent MDN Transformer', () => {
	it('should produce a result object', () => {
		expect(result).toBeDefined();
		expect(typeof result).toBe('object');
	});

	describe('Metadata', () => {
		it('should have correct metadata from frontmatter', () => {
			expect(result.metadata.title).toContain('MIDIConnectionEvent');
			expect(result.metadata.protocol).toBe('web-midi');
		});
	});

	describe('Description', () => {
		it('should mention MIDIConnectionEvent interface', () => {
			expect(result.description).toContain('MIDIConnectionEvent');
		});

		it('should mention statechange event', () => {
			expect(result.description).toContain('statechange');
		});

		it('should mention port connect/disconnect', () => {
			expect(result.description).toContain('port');
		});
	});

	describe('Availability', () => {
		it('should note limited availability', () => {
			expect(result.availability).toContain('Limited');
		});
	});

	describe('Secure Context', () => {
		it('should be a secure context', () => {
			expect(result.secure_context).toBe(true);
		});
	});

	describe('Constructor', () => {
		it('should have MIDIConnectionEvent constructor', () => {
			expect(result.constructor).toBeDefined();
			expect(result.constructor.name).toBe('MIDIConnectionEvent');
		});

		it('should have constructor description', () => {
			expect(result.constructor.description).toContain('MIDIConnectionEvent');
		});
	});

	describe('Instance Properties', () => {
		it('should have 1 instance property', () => {
			expect(result.instance_properties).toHaveLength(1);
		});

		it('should have port property', () => {
			const port = result.instance_properties.find(p => p.name === 'port');
			expect(port).toBeDefined();
			expect(port.modifiers).toContain('Read only');
		});

		it('should have port description mentioning MIDIPort', () => {
			const port = result.instance_properties.find(p => p.name === 'port');
			expect(port.description).toContain('MIDIPort');
		});
	});

	describe('Examples', () => {
		it('should have at least 1 example', () => {
			expect(result.examples.length).toBeGreaterThanOrEqual(1);
		});

		it('should include requestMIDIAccess in example', () => {
			const allExamples = result.examples.join('\n');
			expect(allExamples).toContain('requestMIDIAccess');
		});

		it('should include onstatechange in example', () => {
			const allExamples = result.examples.join('\n');
			expect(allExamples).toContain('onstatechange');
		});
	});

	describe('Specifications', () => {
		it('should reference Web MIDI API', () => {
			expect(result.specifications.length).toBeGreaterThanOrEqual(1);
			expect(result.specifications[0]).toContain('Web MIDI API');
		});
	});

	describe('Summary', () => {
		it('should have counts', () => {
			expect(result.summary.instance_property_count).toBe(1);
			expect(result.summary.example_count).toBeGreaterThanOrEqual(1);
		});
	});
});
