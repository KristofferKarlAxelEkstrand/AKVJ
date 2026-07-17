import { describe, it, expect, beforeAll } from 'vitest';
import { transformMdnWebMidi } from '../../lib/transformers/mdnWebMidiTransformer.js';
import path from 'node:path';

const MARKDOWN_PATH = path.resolve('data/web-midi-midimessageevent-mdn.md');

let result;

beforeAll(async () => {
	result = await transformMdnWebMidi(MARKDOWN_PATH);
});

describe('MIDIMessageEvent MDN Transformer', () => {
	it('should produce a result object', () => {
		expect(result).toBeDefined();
		expect(typeof result).toBe('object');
	});

	describe('Metadata', () => {
		it('should have correct metadata from frontmatter', () => {
			expect(result.metadata.title).toContain('MIDIMessageEvent');
			expect(result.metadata.protocol).toBe('web-midi');
		});
	});

	describe('Description', () => {
		it('should mention MIDIMessageEvent interface', () => {
			expect(result.description).toContain('MIDIMessageEvent');
		});

		it('should mention midimessage event', () => {
			expect(result.description).toContain('midimessage');
		});

		it('should mention MIDIInput', () => {
			expect(result.description).toContain('MIDIInput');
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
		it('should have MIDIMessageEvent constructor', () => {
			expect(result.constructor).toBeDefined();
			expect(result.constructor.name).toBe('MIDIMessageEvent');
		});

		it('should have constructor description', () => {
			expect(result.constructor.description).toContain('MIDIMessageEvent');
		});
	});

	describe('Instance Properties', () => {
		it('should have 1 instance property', () => {
			expect(result.instance_properties).toHaveLength(1);
		});

		it('should have data property', () => {
			const data = result.instance_properties.find(p => p.name === 'data');
			expect(data).toBeDefined();
		});

		it('should mention Uint8Array in data description', () => {
			const data = result.instance_properties.find(p => p.name === 'data');
			expect(data.description).toContain('Uint8Array');
		});
	});

	describe('Instance Methods', () => {
		it('should have 0 instance methods (inherits from Event)', () => {
			expect(result.instance_methods).toHaveLength(0);
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

		it('should include onmidimessage in example', () => {
			const allExamples = result.examples.join('\n');
			expect(allExamples).toContain('onmidimessage');
		});
	});

	describe('Specifications', () => {
		it('should reference Web MIDI API', () => {
			expect(result.specifications.length).toBeGreaterThanOrEqual(1);
			expect(result.specifications[0]).toContain('Web MIDI API');
		});

		it('should reference midimessageevent-interface', () => {
			expect(result.specifications[0]).toContain('midimessageevent');
		});
	});

	describe('Summary', () => {
		it('should have counts', () => {
			expect(result.summary.instance_property_count).toBe(1);
			expect(result.summary.example_count).toBeGreaterThanOrEqual(1);
		});
	});
});
