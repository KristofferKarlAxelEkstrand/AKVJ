#!/usr/bin/env node

/**
 * Focused startup smoke test for the Mainframe server only.
 *
 * Spawns `npm run mainframe`, polls both the Vite UI (port 9999)
 * and the API health endpoint (port 7777) for HTTP 200 within 10 seconds,
 * and fails if either doesn't respond in time.
 *
 * Usage:
 *   node mainframe/test/smoke/mainframe-startup.test.js
 *   node mainframe/test/smoke/mainframe-startup.test.js --timeout=15000
 */

import { spawn, execSync } from 'child_process';
import http from 'http';
import { setTimeout as sleep } from 'timers/promises';

const REPO_ROOT = new URL('../../../', import.meta.url).pathname;
const MAINFRAME_UI_URL = 'http://127.0.0.1:9999/';
const MAINFRAME_API_URL = 'http://127.0.0.1:7777/api/health';
const DEFAULT_TIMEOUT_MS = 10000;
const POLL_INTERVAL_MS = 500;
const FETCH_TIMEOUT_MS = 3000;

const args = process.argv.slice(2);
const timeoutArg = args.find(a => a.startsWith('--timeout='));
const timeoutMs = timeoutArg ? Number(timeoutArg.split('=')[1]) : DEFAULT_TIMEOUT_MS;

/**
 * Kill any processes listening on the mainframe ports to avoid EADDRINUSE.
 */
function killStaleProcesses() {
	for (const port of [9999, 7777]) {
		try {
			execSync(`fuser -k ${port}/tcp 2>/dev/null || true`, { stdio: 'ignore' });
		} catch {
			// fuser may not be available or no process on port
		}
	}
	try {
		execSync('pkill -f "concurrently.*mainframe" 2>/dev/null || true', { stdio: 'ignore' });
	} catch {
		// no matching processes
	}
}

/**
 * Poll a URL until it returns HTTP 200 or timeout.
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

/**
 * Kill a process and all its children.
 * @param {import('child_process').ChildProcess} proc
 */
function killProcess(proc) {
	proc.kill('SIGTERM');
	if (proc.pid) {
		try {
			process.kill(-proc.pid, 'SIGTERM');
		} catch {
			// Process group may not exist
		}
	}
}

async function main() {
	const deadline = Date.now() + timeoutMs;
	const processes = [];
	const failures = [];

	killStaleProcesses();
	await sleep(1000);

	try {
		console.log('Starting mainframe dev server...');
		const mainframeProc = spawn('npm', ['run', 'mainframe'], {
			cwd: REPO_ROOT,
			stdio: ['ignore', 'pipe', 'pipe'],
			detached: true
		});
		processes.push(mainframeProc);
		mainframeProc.stdout?.on('data', chunk => process.stdout.write(`[mainframe] ${chunk}`));
		mainframeProc.stderr?.on('data', chunk => process.stderr.write(`[mainframe] ${chunk}`));

		console.log(`\nPolling endpoints (timeout: ${timeoutMs}ms)...`);

		const checks = [
			{ name: 'mainframe UI', url: MAINFRAME_UI_URL },
			{ name: 'mainframe API health', url: MAINFRAME_API_URL }
		];

		const results = await Promise.all(
			checks.map(async check => {
				const ok = await pollUrl(check.url, deadline);
				console.log(`  ${ok ? '\u2713' : '\u2717'} ${check.name} (${check.url})`);
				return { ...check, ok };
			})
		);

		for (const result of results) {
			if (!result.ok) {
				failures.push(`${result.name} did not respond with HTTP 200 within ${timeoutMs}ms`);
			}
		}

		if (failures.length > 0) {
			console.error(`\n\u274c ${failures.length} check(s) failed:`);
			for (const failure of failures) {
				console.error(`  - ${failure}`);
			}
			process.exitCode = 1;
		} else {
			console.log('\n\u2705 All mainframe startup checks passed.');
		}
	} finally {
		for (const proc of processes) {
			killProcess(proc);
		}
		await sleep(500);
		killStaleProcesses();
	}
}

main().catch(error => {
	console.error('Smoke test error:', error);
	process.exit(1);
});
