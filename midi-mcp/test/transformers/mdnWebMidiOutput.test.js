import { describe, it, expect, beforeAll } from 'vitest';
import { transformMdnWebMidi } from '../../lib/transformers/mdnWebMidiTransformer.js';
import path from 'node:path';

const MARKDOWN_PATH = path.resolve('data/web-midi-midioutput-mdn.md');

let result;

beforeAll(async () => {
	result = await transformMdnWebMidi(MARKDOWN_PATH);
});

describe('MIDIOutput MDN Transformer', () => {
	it('should produce a result object', () => {
		expect(result).toBeDefined();
		expect(typeof result).toBe('object');
	});

	describe('Metadata', () => {
		it('should have correct metadata from frontmatter', () => {
			expect(result.metadata.title).toContain('MIDIOutput');
			expect(result.metadata.protocol).toBe('web-midi');
		});
	});

	describe('Description', () => {
		it('should mention MIDIOutput interface', () => {
			expect(result.description).toContain('MIDIOutput');
		});

		it('should mention queue', () => {
			expect(result.description).toContain('queue');
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
		it('should have 2 instance methods', () => {
			expect(result.instance_methods).toHaveLength(2);
		});

		it('should include send method', () => {
			const send = result.instance_methods.find(m => m.name === 'send');
			expect(send).toBeDefined();
			expect(send.description).toContain('Queues');
		});

		it('should include clear method', () => {
			const clear = result.instance_methods.find(m => m.name === 'clear');
			expect(clear).toBeDefined();
			expect(clear.description).toContain('Clears');
		});
	});

	describe('Examples', () => {
		it('should have at least 1 example', () => {
			expect(result.examples.length).toBeGreaterThanOrEqual(1);
		});

		it('should include send() call in example', () => {
			const allExamples = result.examples.join('\n');
			expect(allExamples).toContain('send');
		});

		it('should include note on message in example', () => {
			const allExamples = result.examples.join('\n');
			expect(allExamples).toContain('0x90');
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
			expect(result.summary.instance_method_count).toBe(2);
			expect(result.summary.example_count).toBeGreaterThanOrEqual(1);
		});
	});
});
