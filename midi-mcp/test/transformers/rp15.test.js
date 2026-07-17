import { describe, it, expect, beforeAll } from 'vitest';
import { transformRp15 } from '../../lib/transformers/rp15Transformer.js';
import path from 'node:path';

const MARKDOWN_PATH = path.resolve('data/rp15.md');

let result;

beforeAll(async () => {
	result = await transformRp15(MARKDOWN_PATH);
});

describe('RP-015 Response to Reset All Controllers Transformer', () => {
	it('should produce a result object', () => {
		expect(result).toBeDefined();
		expect(typeof result).toBe('object');
	});

	describe('Metadata', () => {
		it('should have correct metadata from frontmatter', () => {
			expect(result.metadata.doc_id).toBe('RP-015');
			expect(result.metadata.protocol).toBe('midi1');
			expect(result.metadata.pages).toBe(1);
		});
	});

	describe('Description', () => {
		it('should mention MIDI 1.0 and Reset All Controllers', () => {
			expect(result.description).toContain('MIDI 1.0');
			expect(result.description).toContain('Reset All Controllers');
		});

		it('should mention Controller #121', () => {
			expect(result.description).toContain('121');
		});
	});

	describe('Spec Quote', () => {
		it('should contain the specification quote', () => {
			expect(result.spec_quote).toContain('Reset All Controllers');
			expect(result.spec_quote).toContain('ideal initial state');
		});
	});

	describe('Background', () => {
		it('should mention Bank Select', () => {
			expect(result.background).toContain('Bank Select');
		});

		it('should mention General MIDI', () => {
			expect(result.background).toContain('General MIDI');
		});
	});

	describe('Details - Reset Actions', () => {
		it('should have 7 reset actions', () => {
			expect(result.details.reset_actions).toHaveLength(7);
		});

		it('should include Set Expression #11 to 127', () => {
			const expr = result.details.reset_actions.find(e => e.includes('Expression'));
			expect(expr).toBeDefined();
			expect(expr).toContain('127');
		});

		it('should include Set Modulation #1 to 0', () => {
			const mod = result.details.reset_actions.find(e => e.includes('Modulation'));
			expect(mod).toBeDefined();
			expect(mod).toContain('0');
		});

		it('should include Set Pedals', () => {
			const pedals = result.details.reset_actions.find(e => e.includes('Pedals'));
			expect(pedals).toBeDefined();
			expect(pedals).toContain('64');
		});

		it('should include RPN/NRPN null value', () => {
			const rpn = result.details.reset_actions.find(e => e.includes('parameter number'));
			expect(rpn).toBeDefined();
			expect(rpn).toContain('127');
		});

		it('should include pitch bender center', () => {
			const pb = result.details.reset_actions.find(e => e.includes('pitch bender'));
			expect(pb).toBeDefined();
			expect(pb).toContain('center');
		});

		it('should include channel pressure reset', () => {
			const cp = result.details.reset_actions.find(e => e.includes('channel pressure'));
			expect(cp).toBeDefined();
		});

		it('should include polyphonic pressure reset', () => {
			const pp = result.details.reset_actions.find(e => e.includes('polyphonic pressure'));
			expect(pp).toBeDefined();
		});
	});

	describe('Details - Do NOT Reset', () => {
		it('should have 8 do-not-reset items', () => {
			expect(result.details.do_not_reset).toHaveLength(8);
		});

		it('should include Bank Select', () => {
			const bs = result.details.do_not_reset.find(e => e.includes('Bank Select'));
			expect(bs).toBeDefined();
		});

		it('should include Volume', () => {
			const vol = result.details.do_not_reset.find(e => e.includes('Volume'));
			expect(vol).toBeDefined();
		});

		it('should include Pan', () => {
			const pan = result.details.do_not_reset.find(e => e.includes('Pan'));
			expect(pan).toBeDefined();
		});

		it('should include Program Change', () => {
			const pc = result.details.do_not_reset.find(e => e.includes('Program Change'));
			expect(pc).toBeDefined();
		});

		it('should include channel mode messages', () => {
			const cm = result.details.do_not_reset.find(e => e.includes('channel mode'));
			expect(cm).toBeDefined();
		});
	});

	describe('Other Controllers Note', () => {
		it('should mention documenting behavior', () => {
			expect(result.details.other_controllers_note).toContain('documented');
		});
	});

	describe('Documentation', () => {
		it('should mention manufacturer documentation', () => {
			expect(result.documentation).toContain('Manufacturers');
		});
	});

	describe('Entering GM1', () => {
		it('should mention GM1 ON SysEx', () => {
			expect(result.entering_gm1).toContain('General MIDI 1');
			expect(result.entering_gm1).toContain('system exclusive');
		});
	});

	describe('Global Controllers', () => {
		it('should mention global controllers', () => {
			expect(result.global_controllers).toContain('global');
		});
	});

	describe('Approval', () => {
		it('should have MMA approval date', () => {
			expect(result.approval.mma_date).toBe('11/98');
		});

		it('should have AMEI approval date', () => {
			expect(result.approval.amei_date).toBe('05/99');
		});
	});

	describe('Summary', () => {
		it('should have counts', () => {
			expect(result.summary.reset_action_count).toBe(7);
			expect(result.summary.do_not_reset_count).toBe(8);
		});
	});
});
