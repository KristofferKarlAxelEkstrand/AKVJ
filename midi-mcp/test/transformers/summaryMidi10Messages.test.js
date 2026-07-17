import { describe, it, expect, beforeAll } from 'vitest';
import { transformSummaryMidi10Messages } from '../../lib/transformers/summaryMidi10MessagesTransformer.js';
import path from 'node:path';

const MARKDOWN_PATH = path.resolve('data/summary-of-midi-1-0-messages-midi-org.md');

let result;

beforeAll(async () => {
	result = await transformSummaryMidi10Messages(MARKDOWN_PATH);
});

describe('Summary of MIDI 1.0 Messages Transformer', () => {
	it('should produce a result object', () => {
		expect(result).toBeDefined();
		expect(typeof result).toBe('object');
	});

	describe('Metadata', () => {
		it('should have correct metadata from frontmatter', () => {
			expect(result.metadata.title).toContain('MIDI 1.0');
			expect(result.metadata.protocol).toBe('midi1');
		});
	});

	describe('Description', () => {
		it('should mention the table', () => {
			expect(result.description).toContain('table');
		});

		it('should have a warning', () => {
			expect(result.warning).toContain('WARNING');
		});
	});

	describe('Categories', () => {
		it('should have 4 categories', () => {
			expect(result.categories).toHaveLength(4);
		});

		it('should have Channel Voice Messages', () => {
			const cv = result.categories.find(c => c.name.includes('Channel Voice'));
			expect(cv).toBeDefined();
		});

		it('should have Channel Mode Messages', () => {
			const cm = result.categories.find(c => c.name.includes('Channel Mode'));
			expect(cm).toBeDefined();
		});

		it('should have System Common Messages', () => {
			const sc = result.categories.find(c => c.name.includes('System Common'));
			expect(sc).toBeDefined();
		});

		it('should have System Real-Time Messages', () => {
			const srt = result.categories.find(c => c.name.includes('System Real-Time'));
			expect(srt).toBeDefined();
		});
	});

	describe('Channel Voice Messages', () => {
		it('should have 7 messages', () => {
			const cv = result.categories.find(c => c.name.includes('Channel Voice'));
			expect(cv.messages).toHaveLength(7);
		});

		it('should include Note Off (1000nnnn)', () => {
			const cv = result.categories.find(c => c.name.includes('Channel Voice'));
			const noteOff = cv.messages.find(m => m.status.includes('1000'));
			expect(noteOff).toBeDefined();
			expect(noteOff.description).toContain('Note Off');
		});

		it('should include Note On (1001nnnn)', () => {
			const cv = result.categories.find(c => c.name.includes('Channel Voice'));
			const noteOn = cv.messages.find(m => m.status.includes('1001'));
			expect(noteOn).toBeDefined();
			expect(noteOn.description).toContain('Note On');
		});

		it('should include Program Change (1100nnnn)', () => {
			const cv = result.categories.find(c => c.name.includes('Channel Voice'));
			const pc = cv.messages.find(m => m.status.includes('1100'));
			expect(pc).toBeDefined();
			expect(pc.description).toContain('Program Change');
		});

		it('should include Pitch Bend (1110nnnn)', () => {
			const cv = result.categories.find(c => c.name.includes('Channel Voice'));
			const pb = cv.messages.find(m => m.status.includes('1110'));
			expect(pb).toBeDefined();
			expect(pb.description).toContain('Pitch Bend');
		});
	});

	describe('Channel Mode Messages', () => {
		it('should have at least 1 message entry', () => {
			const cm = result.categories.find(c => c.name.includes('Channel Mode'));
			expect(cm.messages.length).toBeGreaterThanOrEqual(1);
		});

		it('should include All Sound Off', () => {
			const cm = result.categories.find(c => c.name.includes('Channel Mode'));
			const allMessages = cm.messages.map(m => m.description).join(' ');
			expect(allMessages).toContain('All Sound Off');
		});

		it('should include Reset All Controllers', () => {
			const cm = result.categories.find(c => c.name.includes('Channel Mode'));
			const allMessages = cm.messages.map(m => m.description).join(' ');
			expect(allMessages).toContain('Reset All Controllers');
		});

		it('should include All Notes Off', () => {
			const cm = result.categories.find(c => c.name.includes('Channel Mode'));
			const allMessages = cm.messages.map(m => m.description).join(' ');
			expect(allMessages).toContain('All Notes Off');
		});
	});

	describe('System Common Messages', () => {
		it('should have 8 messages', () => {
			const sc = result.categories.find(c => c.name.includes('System Common'));
			expect(sc.messages).toHaveLength(8);
		});

		it('should include System Exclusive (11110000)', () => {
			const sc = result.categories.find(c => c.name.includes('System Common'));
			const sysex = sc.messages.find(m => m.status.includes('11110000'));
			expect(sysex).toBeDefined();
			expect(sysex.description).toContain('System Exclusive');
		});

		it('should include Song Select (11110011)', () => {
			const sc = result.categories.find(c => c.name.includes('System Common'));
			const ss = sc.messages.find(m => m.status.includes('11110011'));
			expect(ss).toBeDefined();
			expect(ss.description).toContain('Song Select');
		});

		it('should include Tune Request (11110110)', () => {
			const sc = result.categories.find(c => c.name.includes('System Common'));
			const tr = sc.messages.find(m => m.status.includes('11110110'));
			expect(tr).toBeDefined();
			expect(tr.description).toContain('Tune Request');
		});
	});

	describe('System Real-Time Messages', () => {
		it('should have 8 messages', () => {
			const srt = result.categories.find(c => c.name.includes('System Real-Time'));
			expect(srt.messages).toHaveLength(8);
		});

		it('should include Timing Clock (11111000)', () => {
			const srt = result.categories.find(c => c.name.includes('System Real-Time'));
			const tc = srt.messages.find(m => m.status.includes('11111000'));
			expect(tc).toBeDefined();
			expect(tc.description).toContain('Timing Clock');
		});

		it('should include Active Sensing (11111110)', () => {
			const srt = result.categories.find(c => c.name.includes('System Real-Time'));
			const as = srt.messages.find(m => m.status.includes('11111110'));
			expect(as).toBeDefined();
			expect(as.description).toContain('Active Sensing');
		});

		it('should include Reset (11111111)', () => {
			const srt = result.categories.find(c => c.name.includes('System Real-Time'));
			const reset = srt.messages.find(m => m.status.includes('11111111'));
			expect(reset).toBeDefined();
			expect(reset.description).toContain('Reset');
		});
	});

	describe('Summary', () => {
		it('should have category count 4', () => {
			expect(result.summary.category_count).toBe(4);
		});

		it('should have total message count', () => {
			expect(result.summary.total_messages).toBeGreaterThanOrEqual(20);
		});
	});
});
