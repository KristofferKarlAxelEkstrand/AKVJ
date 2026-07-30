import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const REPO_ROOT = path.resolve(__dirname, '..');

const MAINFRAME_JS = path.join(REPO_ROOT, 'mainframe/src/js');
const MAINFRAME_ENTRY_URL = 'http://127.0.0.1:9999/js/AkvjMainframe.js';
const MAINFRAME_PORTS = [9999, 7777];
const PORT_FREE_WAIT_MS = 8000;
const PORT_POLL_MS = 200;

/**
 * PIDs listening on a TCP port (Linux `ss`). Empty when nothing is bound.
 * @param {number} port
 * @returns {number[]}
 */
export function pidsListeningOnPort(port) {
	try {
		const out = execFileSync('ss', ['-tlnp', `sport = :${port}`], {
			encoding: 'utf8',
			stdio: ['ignore', 'pipe', 'ignore']
		});
		const pids = new Set();
		for (const match of out.matchAll(/pid=(\d+)/g)) {
			pids.add(Number(match[1]));
		}
		return [...pids];
	} catch {
		return [];
	}
}

/**
 * @param {number} port
 */
export function freePort(port) {
	for (const pid of pidsListeningOnPort(port)) {
		try {
			process.kill(pid, 'SIGTERM');
		} catch {
			// already gone
		}
	}
}

/**
 * @param {number[]} ports
 * @param {number} [timeoutMs]
 */
export async function freePortsAndWait(ports, timeoutMs = PORT_FREE_WAIT_MS) {
	for (const port of ports) {
		freePort(port);
	}
	const deadline = Date.now() + timeoutMs;
	while (Date.now() < deadline) {
		if (ports.every(port => pidsListeningOnPort(port).length === 0)) {
			return;
		}
		await new Promise(resolve => setTimeout(resolve, PORT_POLL_MS));
	}
	for (const port of ports) {
		for (const pid of pidsListeningOnPort(port)) {
			try {
				process.kill(pid, 'SIGKILL');
			} catch {
				// already gone
			}
		}
	}
}

/**
 * Served Vite module paths like `/js/Foo.js` that have no matching file under mainframe/src/js.
 * @param {string} transformedSource
 * @returns {string[]}
 */
export function missingMainframeModules(transformedSource) {
	const missing = [];
	for (const match of transformedSource.matchAll(/\/js\/([A-Za-z0-9_-]+\.js)/g)) {
		const fileName = match[1];
		if (!fs.existsSync(path.join(MAINFRAME_JS, fileName))) {
			missing.push(fileName);
		}
	}
	return [...new Set(missing)];
}

/**
 * @param {string} [entryUrl]
 * @returns {Promise<string[]|null>} missing module basenames, or null if the server is not up
 */
export async function probeStaleMainframeModules(entryUrl = MAINFRAME_ENTRY_URL) {
	let response;
	try {
		response = await fetch(entryUrl, { signal: AbortSignal.timeout(2000) });
	} catch {
		return null;
	}
	if (!response.ok) {
		return null;
	}
	const body = await response.text();
	return missingMainframeModules(body);
}

/**
 * If a long-lived mainframe Vite is still transforming deleted modules (e.g. after a CE rename),
 * free its ports so Playwright's webServer can start a fresh process.
 */
export async function clearStaleMainframeDevServer() {
	const missing = await probeStaleMainframeModules();
	if (missing === null) {
		return { action: 'none', reason: 'mainframe not running' };
	}
	if (missing.length === 0) {
		return { action: 'none', reason: 'mainframe module graph matches disk' };
	}
	console.warn(`[e2e] Stale mainframe Vite still imports missing modules (${missing.join(', ')}); freeing ports ${MAINFRAME_PORTS.join(', ')}`);
	await freePortsAndWait(MAINFRAME_PORTS);
	return { action: 'freed', missing };
}

export default async function globalSetup() {
	await clearStaleMainframeDevServer();
}
