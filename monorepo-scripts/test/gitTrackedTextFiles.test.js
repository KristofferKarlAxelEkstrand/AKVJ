import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';

vi.mock('node:child_process', () => ({
	execSync: vi.fn()
}));

const { execSync } = await import('node:child_process');
const { getTrackedTextFiles } = await import('../lib/gitTrackedTextFiles.js');

describe('getTrackedTextFiles', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	test('parses git grep output into trimmed non-empty paths', () => {
		execSync.mockReturnValue('src/a.js\n\nREADME.md\n  package.json  \n');
		expect(getTrackedTextFiles()).toEqual(['src/a.js', 'README.md', 'package.json']);
		expect(execSync).toHaveBeenCalledWith('git grep -Il ""', expect.objectContaining({ encoding: 'utf8' }));
	});

	test('returns empty list when git grep finds no matches (exit 1)', () => {
		const error = Object.assign(new Error('Command failed: git grep -Il ""'), {
			status: 1,
			stderr: Buffer.alloc(0)
		});
		execSync.mockImplementation(() => {
			throw error;
		});
		expect(getTrackedTextFiles()).toEqual([]);
	});

	test('throws a clear error outside a git repository', () => {
		const error = Object.assign(new Error('fatal'), {
			status: 128,
			stderr: 'fatal: not a git repository'
		});
		execSync.mockImplementation(() => {
			throw error;
		});
		expect(() => getTrackedTextFiles()).toThrow(/must be run inside a git repository/i);
	});
});
