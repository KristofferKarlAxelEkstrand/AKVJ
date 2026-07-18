import { describe, test, expect, vi, afterEach } from 'vitest';
import { failWithOffenders } from '../lib/report.js';

describe('failWithOffenders', () => {
	afterEach(() => {
		vi.restoreAllMocks();
	});

	test('prints headline, bullet list, optional hint, and exits 1', () => {
		const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
		const exitSpy = vi.spyOn(process, 'exit').mockImplementation(() => {});

		failWithOffenders('Found problems:', ['a.js', 'b.js'], 'Run: npm run fix');

		expect(errorSpy.mock.calls.map(call => call[0])).toEqual(['Found problems:', '- a.js', '- b.js', 'Run: npm run fix']);
		expect(exitSpy).toHaveBeenCalledWith(1);
	});

	test('omits hint when not provided', () => {
		const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
		vi.spyOn(process, 'exit').mockImplementation(() => {});

		failWithOffenders('Only headline', ['x.txt']);

		expect(errorSpy.mock.calls.map(call => call[0])).toEqual(['Only headline', '- x.txt']);
	});
});
