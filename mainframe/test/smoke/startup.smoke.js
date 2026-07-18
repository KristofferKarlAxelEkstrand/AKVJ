#!/usr/bin/env node

/**
 * Startup smoke test for akvj and mainframe servers.
 *
 * Spawns both dev servers, polls their URLs for HTTP 200,
 * and fails if either doesn't respond within the timeout.
 *
 * Usage:
 *   node mainframe/test/smoke/startup.smoke.js
 *   node mainframe/test/smoke/startup.smoke.js --timeout=15000
 */

import { spawn, execSync } from 'child_process';
import { setTimeout as sleep } from 'timers/promises';
import { pollUrl } from './pollUrl.js';

const REPO_ROOT = new URL('../../../', import.meta.url).pathname;
const AKVJ_URL = 'http://127.0.0.1:8888/';
const MAINFRAME_UI_URL = 'http://127.0.0.1:9999/';
const MAINFRAME_API_URL = 'http://127.0.0.1:7777/api/health';
const DEFAULT_TIMEOUT_MS = 30000;
const POLL_INTERVAL_MS = 500;
const FETCH_TIMEOUT_MS = 5000;

const args = process.argv.slice(2);
const timeoutArg = args.find(a => a.startsWith('--timeout='));
const timeoutMs = timeoutArg ? Number(timeoutArg.split('=')[1]) : DEFAULT_TIMEOUT_MS;

/**
 * Kill any processes listening on the target ports to avoid EADDRINUSE.
 * Uses fuser to kill by port number, since Vite's port is set in config
 * (not visible in the process command line for pkill pattern matching).
 */
function killStaleProcesses() {
	const ports = [8888, 9999, 7777];
	for (const port of ports) {
		try {
			execSync(`fuser -k ${port}/tcp 2>/dev/null || true`, { stdio: 'ignore' });
		} catch {
			// fuser may not be available or no process on port — that's fine
		}
	}
	// Also kill any lingering concurrently/clips:watch processes
	try {
		execSync('pkill -f "concurrently.*mainframe" 2>/dev/null || true', { stdio: 'ignore' });
		execSync('pkill -f "clips:watch" 2>/dev/null || true', { stdio: 'ignore' });
	} catch {
		// pkill may fail if no processes match — that's fine
	}
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
		// Start akvj
		console.log('Starting akvj dev server...');
		const akvjProc = spawn('npm', ['run', 'akvj'], {
			cwd: REPO_ROOT,
			stdio: ['ignore', 'pipe', 'pipe'],
			detached: true
		});
		processes.push(akvjProc);
		akvjProc.stdout?.on('data', chunk => process.stdout.write(`[akvj] ${chunk}`));
		akvjProc.stderr?.on('data', chunk => process.stderr.write(`[akvj] ${chunk}`));

		// Start mainframe
		console.log('Starting mainframe dev server...');
		const mainframeProc = spawn('npm', ['run', 'mainframe'], {
			cwd: REPO_ROOT,
			stdio: ['ignore', 'pipe', 'pipe'],
			detached: true
		});
		processes.push(mainframeProc);
		mainframeProc.stdout?.on('data', chunk => process.stdout.write(`[mainframe] ${chunk}`));
		mainframeProc.stderr?.on('data', chunk => process.stderr.write(`[mainframe] ${chunk}`));

		// Poll all endpoints in parallel
		console.log(`\nPolling endpoints (timeout: ${timeoutMs}ms)...`);

		const checks = [
			{ name: 'akvj UI', url: AKVJ_URL },
			{ name: 'mainframe UI', url: MAINFRAME_UI_URL },
			{ name: 'mainframe API health', url: MAINFRAME_API_URL }
		];

		const results = await Promise.all(
			checks.map(async check => {
				const ok = await pollUrl(check.url, deadline, {
					pollIntervalMs: POLL_INTERVAL_MS,
					fetchTimeoutMs: FETCH_TIMEOUT_MS
				});
				console.log(`  ${ok ? '✓' : '✗'} ${check.name} (${check.url})`);
				return { ...check, ok };
			})
		);

		for (const result of results) {
			if (!result.ok) {
				failures.push(`${result.name} did not respond with HTTP 200 within ${timeoutMs}ms`);
			}
		}

		if (failures.length > 0) {
			console.error(`\n❌ ${failures.length} check(s) failed:`);
			for (const failure of failures) {
				console.error(`  - ${failure}`);
			}
			process.exitCode = 1;
		} else {
			console.log('\n✅ All server startup checks passed.');
		}
	} finally {
		for (const proc of processes) {
			killProcess(proc);
		}
		// Wait briefly for processes to exit, then force-kill by port
		await sleep(500);
		killStaleProcesses();
	}
}

main().catch(error => {
	console.error('Smoke test error:', error);
	process.exit(1);
});
