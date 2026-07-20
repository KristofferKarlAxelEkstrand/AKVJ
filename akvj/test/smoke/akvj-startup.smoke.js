// @vitest-environment node

/**
 * Server startup smoke test for the AKVJ dev server.
 *
 * Spawns `npm run akvj`, polls http://127.0.0.1:8888 for HTTP 200
 * within 10 seconds, and fails if the server doesn't respond in time.
 *
 * Excluded from the normal vitest run via vitest.config.js exclude list.
 * Run manually with:
 *   npx vitest run --config akvj/vitest.config.js akvj/test/smoke/akvj-startup.smoke.js
 */

import { describe, it, expect, afterAll } from 'vitest';
import { spawn } from 'child_process';
import { pollUrl } from '../../../mainframe/test/smoke/pollUrl.js';

const REPO_ROOT = new URL('../../../', import.meta.url).pathname;
const AKVJ_URL = 'http://127.0.0.1:8888/';
const TIMEOUT_MS = 10000;
const POLL_INTERVAL_MS = 500;
const FETCH_TIMEOUT_MS = 3000;

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

	it(
		'responds with HTTP 200 within 10 seconds',
		async () => {
			const deadline = Date.now() + TIMEOUT_MS;

			const akvjProc = spawn('npm', ['run', 'akvj'], {
				cwd: REPO_ROOT,
				stdio: ['ignore', 'pipe', 'pipe'],
				detached: true
			});
			processes.push(akvjProc);

			akvjProc.stdout?.on('data', chunk => process.stdout.write(`[akvj] ${chunk}`));
			akvjProc.stderr?.on('data', chunk => process.stderr.write(`[akvj] ${chunk}`));

			const ok = await pollUrl(AKVJ_URL, deadline, {
				pollIntervalMs: POLL_INTERVAL_MS,
				fetchTimeoutMs: FETCH_TIMEOUT_MS
			});
			expect(ok, `AKVJ dev server did not respond with HTTP 200 at ${AKVJ_URL} within ${TIMEOUT_MS}ms`).toBe(true);
		},
		TIMEOUT_MS + 5000
	);
});
