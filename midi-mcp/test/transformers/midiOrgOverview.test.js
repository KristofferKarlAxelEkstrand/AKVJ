import { describe, it, expect, beforeAll } from 'vitest';
import { transformMidiOrgOverview } from '../../lib/transformers/midiOrgOverviewTransformer.js';
import path from 'node:path';

const FILES = [
	{ path: path.resolve('data/key-based-instrument-controllers-midi-org.md'), title: 'Key-Based Instrument Controllers', file: 'ca23' },
	{ path: path.resolve('data/modulation-depth-range-rpn-midi-org.md'), title: 'Modulation Depth Range RPN', file: 'ca26' },
	{ path: path.resolve('data/global-parameter-control-midi-org.md'), title: 'Global Parameter Control', file: 'ca24' }
];

const results = {};

beforeAll(async () => {
	for (const f of FILES) {
		results[f.title] = await transformMidiOrgOverview(f.path);
	}
});

describe('MIDI.org Overview Transformer', () => {
	for (const f of FILES) {
		describe(f.title, () => {
			it('should produce a result object', () => {
				expect(results[f.title]).toBeDefined();
				expect(typeof results[f.title]).toBe('object');
			});

			it('should have correct metadata title', () => {
				expect(results[f.title].metadata.title).toBe(f.title);
			});

			it('should have protocol midi1', () => {
				expect(results[f.title].metadata.protocol).toBe('midi1');
			});

			it('should have a description', () => {
				expect(results[f.title].description.length).toBeGreaterThan(20);
			});

			it('should have download file info', () => {
				expect(results[f.title].download_file.file_name).toContain(f.file);
			});

			it('should have category Addenda', () => {
				expect(results[f.title].download_file.category).toBe('Addenda');
			});

			it('should have file size', () => {
				expect(results[f.title].download_file.file_size).toMatch(/KB/);
			});

			it('should have summary flags set', () => {
				expect(results[f.title].summary.has_description).toBe(true);
				expect(results[f.title].summary.has_download_file).toBe(true);
			});
		});
	}

	describe('Key-Based Instrument Controllers specific', () => {
		it('should mention key-based performance control', () => {
			expect(results['Key-Based Instrument Controllers'].description).toContain('key-based');
		});
	});

	describe('Modulation Depth Range RPN specific', () => {
		it('should mention RPN #05', () => {
			expect(results['Modulation Depth Range RPN'].description).toContain('RPN');
			expect(results['Modulation Depth Range RPN'].description).toContain('Modulation');
		});
	});

	describe('Global Parameter Control specific', () => {
		it('should mention Universal Real-Time SysEx', () => {
			expect(results['Global Parameter Control'].description).toContain('Universal Real-Time');
			expect(results['Global Parameter Control'].description).toContain('System Exclusive');
		});
	});
});
