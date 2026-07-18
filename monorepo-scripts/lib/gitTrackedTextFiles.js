import { execSync } from 'node:child_process';

/**
 * List git-tracked text files via `git grep -Il ""`.
 * @returns {string[]} Relative paths from repo root
 */
export function getTrackedTextFiles() {
	let output;
	try {
		output = execSync('git grep -Il ""', {
			encoding: 'utf8',
			stdio: ['ignore', 'pipe', 'pipe']
		});
	} catch (error) {
		const stderr = String(error.stderr || error.message || '');
		if (/not a git repository/i.test(stderr) || error.status === 128) {
			throw new Error('This check must be run inside a git repository (git grep failed).', { cause: error });
		}
		// git grep exits 1 when there are no matches — treat as empty list
		if (error.status === 1 && !stderr.trim()) {
			return [];
		}
		throw new Error(`Failed to list tracked text files via git grep: ${stderr.trim() || error.message}`, { cause: error });
	}
	return output
		.split('\n')
		.map(line => line.trim())
		.filter(Boolean);
}
