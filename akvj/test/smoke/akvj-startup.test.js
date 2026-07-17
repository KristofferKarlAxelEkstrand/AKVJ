// @vitest-environment node

/**
 * Server startup smoke test for the AKVJ dev server.
 *
 * Spawns `npm run akvj`, polls http://127.0.0.1:8888 for HTTP 200
 * within 10 seconds, and fails if the server doesn't respond in time.
 *
 * Excluded from the normal vitest run via vitest.config.js exclude list.
 * Run manually with:
 *   npx vitest run --config akvj/vitest.config.js akvj/test/smoke/akvj-startup.test.js
 */

import { describe, it, expect, afterAll } from 'vitest';
import { spawn } from 'child_process';
import http from 'http';
import { setTimeout as sleep } from 'timers/promises';

const REPO_ROOT = new URL('../../../', import.meta.url).pathname;
const AKVJ_URL = 'http://127.0.0.1:8888/';
const TIMEOUT_MS = 10000;
const POLL_INTERVAL_MS = 500;
const FETCH_TIMEOUT_MS = 3000;

/**
 * Poll a URL until it returns HTTP 200 or the deadline is reached.
 * @param {string} url
 * @param {number} deadline
 * @returns {Promise<boolean>}
 */
async function pollUrl(url, deadline) {
	while (Date.now() < deadline) {
		try {
			const ok = await new Promise((resolve, reject) => {
				const req = http.get(url, { timeout: FETCH_TIMEOUT_MS }, res => {
					res.resume();
					resolve(res.statusCode === 200);
				});
				req.on('error', reject);
				req.on('timeout', () => {
					req.destroy();
					reject(new Error('request timeout'));
				});
			});
			if (ok) {
				return true;
			}
		} catch {
			// Server not ready yet, keep polling
		}
		await sleep(POLL_INTERVAL_MS);
	}
	return false;
}

describe('AKVJ server startup', () => {
	const processes = [];

	afterAll(() => {
		for (const proc of processes) {
			proc.kill('SIGTERM');
			if (proc.pid) {
				try {
					process.kill(-proc.pid, 'SIGTERM');
				} catch {
					// Process group may not exist
				}
			}
		}
	});

	it('responds with HTTP 200 within 10 seconds', async () => {
		const deadline = Date.now() + TIMEOUT_MS;

		const akvjProc = spawn('npm', ['run', 'akvj'], {
			cwd: REPO_ROOT,
			stdio: ['ignore', 'pipe', 'pipe'],
			detached: true
		});
		processes.push(akvjProc);

		akvjProc.stdout?.on('data', chunk => process.stdout.write(`[akvj] ${chunk}`));
		akvjProc.stderr?.on('data', chunk => process.stderr.write(`[akvj] ${chunk}`));

		const ok = await pollUrl(AKVJ_URL, deadline);
		expect(ok, `AKVJ dev server did not respond with HTTP 200 at ${AKVJ_URL} within ${TIMEOUT_MS}ms`).toBe(true);
	}, TIMEOUT_MS + 5000);
});
