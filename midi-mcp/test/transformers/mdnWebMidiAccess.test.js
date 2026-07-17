import { describe, it, expect, beforeAll } from 'vitest';
import { transformMdnWebMidi } from '../../lib/transformers/mdnWebMidiTransformer.js';
import path from 'node:path';

const MARKDOWN_PATH = path.resolve('data/web-midi-midiaccess-mdn.md');

let result;

beforeAll(async () => {
	result = await transformMdnWebMidi(MARKDOWN_PATH);
});

describe('MIDIAccess MDN Transformer', () => {
	it('should produce a result object', () => {
		expect(result).toBeDefined();
		expect(typeof result).toBe('object');
	});

	describe('Metadata', () => {
		it('should have correct metadata from frontmatter', () => {
			expect(result.metadata.title).toContain('MIDIAccess');
			expect(result.metadata.protocol).toBe('web-midi');
		});
	});

	describe('Description', () => {
		it('should mention MIDIAccess interface', () => {
			expect(result.description).toContain('MIDIAccess');
		});

		it('should mention input and output devices', () => {
			expect(result.description).toContain('input');
			expect(result.description).toContain('output');
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
		it('should not have a constructor', () => {
			expect(result.constructor).toBeNull();
		});
	});

	describe('Instance Properties', () => {
		it('should have 3 instance properties', () => {
			expect(result.instance_properties).toHaveLength(3);
		});

		it('should include inputs property', () => {
			const inputs = result.instance_properties.find(p => p.name === 'inputs');
			expect(inputs).toBeDefined();
			expect(inputs.modifiers).toContain('Read only');
			expect(inputs.description).toContain('MIDIInputMap');
		});

		it('should include outputs property', () => {
			const outputs = result.instance_properties.find(p => p.name === 'outputs');
			expect(outputs).toBeDefined();
			expect(outputs.modifiers).toContain('Read only');
			expect(outputs.description).toContain('MIDIOutputMap');
		});

		it('should include sysexEnabled property', () => {
			const sysex = result.instance_properties.find(p => p.name === 'sysexEnabled');
			expect(sysex).toBeDefined();
			expect(sysex.modifiers).toContain('Read only');
			expect(sysex.description).toContain('boolean');
		});
	});

	describe('Events', () => {
		it('should have at least 1 event', () => {
			expect(result.events.length).toBeGreaterThanOrEqual(1);
		});

		it('should include statechange event', () => {
			const allEvents = result.events.join(' ');
			expect(allEvents).toContain('statechange');
		});

		it('should mention port changes', () => {
			const allEvents = result.events.join(' ');
			expect(allEvents).toContain('port');
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

		it('should include inputs and outputs in example', () => {
			const allExamples = result.examples.join('\n');
			expect(allExamples).toContain('inputs');
			expect(allExamples).toContain('outputs');
		});
	});

	describe('Specifications', () => {
		it('should reference Web MIDI API', () => {
			expect(result.specifications.length).toBeGreaterThanOrEqual(1);
			expect(result.specifications[0]).toContain('Web MIDI API');
		});

		it('should reference midiaccess-interface', () => {
			expect(result.specifications[0]).toContain('midiaccess');
		});
	});

	describe('Summary', () => {
		it('should have counts', () => {
			expect(result.summary.instance_property_count).toBe(3);
			expect(result.summary.event_count).toBeGreaterThanOrEqual(1);
			expect(result.summary.example_count).toBeGreaterThanOrEqual(1);
		});
	});
});
