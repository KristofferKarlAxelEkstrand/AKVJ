/**
 * Run heavy UI vitest with a raised worker-start timeout and retries.
 *
 * Vitest 4.1 hardcodes pool-runner START_TIMEOUT at 60s. jsdom env boot for the
 * heavy suite is often 45–55s here and exceeds 60s under concurrent load, failing
 * before any test runs (`Timeout waiting for worker to respond`). That constant
 * is not exposed in config — raise it in the installed vitest chunk for this
 * process tree, then run with retries as a second safety net.
 */
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const mainframeRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const vitestRoot = path.resolve(mainframeRoot, '../node_modules/vitest');
const maxAttempts = Math.max(1, Number(process.env.HEAVY_UI_TEST_ATTEMPTS || 3));
const startTimeoutMs = Math.max(60_000, Number(process.env.HEAVY_UI_START_TIMEOUT_MS || 180_000));
const vitestCli = path.join(vitestRoot, 'vitest.mjs');
const extraArgs = process.argv.slice(2);

/**
 * Raise Vitest's hardcoded worker start timeout when still at the 60s default.
 * Idempotent: skips if already patched or pattern missing (version drift).
 * @returns {boolean} whether a file was modified
 */
function raiseVitestStartTimeout() {
	const chunksDir = path.join(vitestRoot, 'dist/chunks');
	if (!fs.existsSync(chunksDir)) {
		console.error('[heavy-ui] vitest chunks dir missing; cannot raise START_TIMEOUT');
		return false;
	}
	const files = fs.readdirSync(chunksDir).filter(name => name.startsWith('cli-api.') && name.endsWith('.js'));
	let patched = false;
	for (const name of files) {
		const filePath = path.join(chunksDir, name);
		const original = fs.readFileSync(filePath, 'utf8');
		if (!original.includes('const START_TIMEOUT = ')) {
			continue;
		}
		// Always pin to the requested timeout (handles re-runs after npm install).
		const next = original.replace(/const START_TIMEOUT = [^;]+;/, `const START_TIMEOUT = ${startTimeoutMs};`);
		if (next === original) {
			continue;
		}
		fs.writeFileSync(filePath, next);
		console.error(`[heavy-ui] raised START_TIMEOUT to ${startTimeoutMs}ms in ${name}`);
		patched = true;
	}
	if (!patched) {
		console.error('[heavy-ui] START_TIMEOUT already at target or pattern not found');
	}
	return patched;
}

/**
 * @returns {Promise<number>}
 */
function runOnce() {
	return new Promise(resolve => {
		const child = spawn(process.execPath, [vitestCli, 'run', '--config', 'vitest.ui.heavy.config.js', ...extraArgs], {
			cwd: mainframeRoot,
			stdio: 'inherit',
			env: process.env
		});
		child.on('error', error => {
			console.error('[heavy-ui] failed to spawn vitest:', error);
			resolve(1);
		});
		child.on('exit', (code, signal) => {
			if (signal) {
				console.error(`[heavy-ui] vitest killed by ${signal}`);
				resolve(1);
				return;
			}
			resolve(code ?? 1);
		});
	});
}

raiseVitestStartTimeout();

let exitCode = 1;
for (let attempt = 1; attempt <= maxAttempts; attempt++) {
	if (maxAttempts > 1) {
		console.error(`[heavy-ui] attempt ${attempt}/${maxAttempts}`);
	}
	exitCode = await runOnce();
	if (exitCode === 0) {
		process.exit(0);
	}
	if (attempt < maxAttempts) {
		console.error(`[heavy-ui] attempt ${attempt} failed (exit ${exitCode}); retrying…`);
	}
}

process.exit(exitCode);
