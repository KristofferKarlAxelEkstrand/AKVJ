import { describe, it, expect } from 'vitest';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { REPO_ROOT, DEFAULT_WORKFLOW } from '../root.js';

/**
 * `root.js` exports the absolute repo root and the default workflow name.
 * Tests here anchor the constant to the known filesystem layout so a moved
 * script directory is caught immediately.
 */
describe('root', () => {
	it('resolves REPO_ROOT three levels above the scripts directory', () => {
		const testDir = path.dirname(fileURLToPath(import.meta.url));
		const scriptsDir = path.resolve(testDir, '..');
		const expectedRoot = path.resolve(scriptsDir, '../../..');

		expect(REPO_ROOT).toBe(expectedRoot);
		expect(path.basename(REPO_ROOT)).toBe('AKVJ');
	});

	it('uses developer-team as the default workflow', () => {
		expect(DEFAULT_WORKFLOW).toBe('developer-team');
	});
});
