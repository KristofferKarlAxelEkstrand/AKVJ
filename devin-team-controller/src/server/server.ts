#!/usr/bin/env node
/**
 * Devin Team Controller — Standalone Daemon
 *
 * A pure Node.js server for centralized control and monitoring of the AKVJ developer team.
 * Runs entirely in Node.js with no extension dependencies.
 *
 * Usage:
 *   node dist/server/server.js [workspace-root]
 *
 * Then open http://localhost:3333 in a browser.
 * Agent logs: ~/.devin-team-controller.log
 */

import http from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { Application } from '../Application.js';
import { createRequestHandler } from './routes.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ── Config ────────────────────────────────────────────────────────────────────

const PORT = parseInt(process.env.TEAM_DASHBOARD_PORT ?? '3333', 10);

let WORKSPACE_ROOT = process.argv[2] ?? process.cwd();
if (path.basename(WORKSPACE_ROOT) === 'devin-team-controller') {
	WORKSPACE_ROOT = path.dirname(WORKSPACE_ROOT);
}

const TEAM_DIR = path.join(WORKSPACE_ROOT, '.agents', 'workflows', 'developer-team');
const PUBLIC_DIR = path.join(__dirname, '../../public');

console.log(`Workspace: ${WORKSPACE_ROOT}`);
console.log(`Team dir:  ${TEAM_DIR}`);

// ── Application and SSE broadcast ─────────────────────────────────────────────

const application = new Application({ workspaceRoot: WORKSPACE_ROOT });

const sseClients = new Set<http.ServerResponse>();

application.eventBus.onDashboard(event => broadcast('dashboard', event.dashboard));
application.eventBus.onTeamStatus(event => broadcast('team-status', { running: event.running }));
application.eventBus.onActivity(event =>
	broadcast('activity', {
		timestamp: event.timestamp,
		role: event.role,
		type: event.activityType,
		detail: event.detail
	})
);
application.eventBus.onStatusChange(event => broadcast('agent-status', { role: event.role, status: event.status }));
application.eventBus.onUpdate(event => broadcast('agent-update', { role: event.role, update: event.update }));
application.eventBus.onFileChange(event => broadcast('file-change', { folder: event.folder, filename: event.filename }));

function broadcast(event: string, data: unknown): void {
	const msg = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
	for (const res of sseClients) {
		try {
			res.write(msg);
		} catch {
			sseClients.delete(res);
		}
	}
}

// ── HTTP server ───────────────────────────────────────────────────────────────

const requestHandler = createRequestHandler({
	application,
	teamDir: TEAM_DIR,
	publicDir: PUBLIC_DIR,
	addSseClient: res => sseClients.add(res),
	removeSseClient: res => sseClients.delete(res)
});

const server = http.createServer(requestHandler);

// ── Boot ──────────────────────────────────────────────────────────────────────

(async () => {
	try {
		await application.initialize();
	} catch (err) {
		console.error('[boot] Failed to initialize application:', (err as Error).message);
	}

	server.listen(PORT, '0.0.0.0', () => {
		console.log('');
		console.log(`  Team Dashboard → http://localhost:${PORT}`);
		console.log('');
		console.log('  Press Ctrl+C to stop.');
	});

	server.on('error', err => {
		console.error('[server] HTTP server error:', (err as Error).message);
		process.exit(1);
	});

	process.on('SIGINT', async () => {
		console.log('\nShutting down...');
		for (const res of sseClients) {
			try {
				res.end();
			} catch {
				/* ignore */
			}
		}
		sseClients.clear();
		await application.shutdown();
		server.close(() => process.exit(0));
	});
})();
