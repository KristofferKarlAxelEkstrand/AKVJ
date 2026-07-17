import { describe, it, expect, beforeAll } from 'vitest';
import { transformMdnWebMidi } from '../../lib/transformers/mdnWebMidiTransformer.js';
import path from 'node:path';

const MARKDOWN_PATH = path.resolve('data/web-midi-midiinput-mdn.md');

let result;

beforeAll(async () => {
	result = await transformMdnWebMidi(MARKDOWN_PATH);
});

describe('MIDIInput MDN Transformer', () => {
	it('should produce a result object', () => {
		expect(result).toBeDefined();
		expect(typeof result).toBe('object');
	});

	describe('Metadata', () => {
		it('should have correct metadata from frontmatter', () => {
			expect(result.metadata.title).toContain('MIDIInput');
			expect(result.metadata.protocol).toBe('web-midi');
		});
	});

	describe('Description', () => {
		it('should mention MIDIInput interface', () => {
			expect(result.description).toContain('MIDIInput');
		});

		it('should mention receiving messages', () => {
			expect(result.description).toContain('receives');
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
		it('should have 0 instance properties (inherits from MIDIPort)', () => {
			expect(result.instance_properties).toHaveLength(0);
		});
	});

	describe('Instance Methods', () => {
		it('should have 0 instance methods (inherits from MIDIPort)', () => {
			expect(result.instance_methods).toHaveLength(0);
		});
	});

	describe('Events', () => {
		it('should have at least 1 event', () => {
			expect(result.events.length).toBeGreaterThanOrEqual(1);
		});

		it('should include midimessage event', () => {
			const allEvents = result.events.join(' ');
			expect(allEvents).toContain('midimessage');
		});

		it('should mention receiving a MIDI message', () => {
			const allEvents = result.events.join(' ');
			expect(allEvents).toContain('MIDI message');
		});
	});

	describe('Examples', () => {
		it('should have at least 1 example', () => {
			expect(result.examples.length).toBeGreaterThanOrEqual(1);
		});

		it('should include onmidimessage in example', () => {
			const allExamples = result.examples.join('\n');
			expect(allExamples).toContain('onmidimessage');
		});

		it('should include console.log in example', () => {
			const allExamples = result.examples.join('\n');
			expect(allExamples).toContain('console.log');
		});
	});

	describe('Specifications', () => {
		it('should reference Web MIDI API', () => {
			expect(result.specifications.length).toBeGreaterThanOrEqual(1);
			expect(result.specifications[0]).toContain('Web MIDI API');
		});

		it('should reference midiinput-interface', () => {
			expect(result.specifications[0]).toContain('midiinput');
		});
	});

	describe('Summary', () => {
		it('should have counts', () => {
			expect(result.summary.event_count).toBeGreaterThanOrEqual(1);
			expect(result.summary.example_count).toBeGreaterThanOrEqual(1);
		});
	});
});
