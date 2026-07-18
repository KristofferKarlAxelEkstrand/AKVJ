import http from 'node:http';
import fsp from 'node:fs/promises';
import path from 'node:path';
import { AGENT_CONFIGS } from '../types/agents.js';
import type { AgentRole } from '../types/agents.js';
import type { Application } from '../Application.js';

const VALID_ROLES = new Set<AgentRole>(AGENT_CONFIGS.map(c => c.role));

export interface RequestHandlerOptions {
	application: Application;
	teamDir: string;
	publicDir: string;
	addSseClient: (res: http.ServerResponse) => void;
	removeSseClient: (res: http.ServerResponse) => void;
}

export function createRequestHandler(options: RequestHandlerOptions): (req: http.IncomingMessage, res: http.ServerResponse) => Promise<void> {
	const { application, teamDir, publicDir, addSseClient, removeSseClient } = options;

	return async (req, res) => {
		try {
			res.setHeader('Access-Control-Allow-Origin', '*');

			if (req.url === '/events') {
				res.writeHead(200, {
					'Content-Type': 'text/event-stream',
					'Cache-Control': 'no-cache',
					Connection: 'keep-alive'
				});
				res.flushHeaders();
				addSseClient(res);

				req.on('close', () => {
					removeSseClient(res);
					try {
						res.end();
					} catch {
						/* ignore */
					}
				});

				const dashboard = await application.getDashboard();
				res.write(`event: dashboard\ndata: ${JSON.stringify(dashboard)}\n\n`);
				res.write(`event: team-status\ndata: ${JSON.stringify({ running: application.isRunning() })}\n\n`);
				return;
			}

			if (req.url === '/api/dashboard') {
				const data = await application.getDashboard();
				jsonResponse(res, 200, data);
				return;
			}

			if (req.url === '/api/start' && req.method === 'POST') {
				const result = await application.start();
				jsonResponse(res, result.ok ? 200 : 400, result);
				return;
			}

			if (req.url === '/api/stop' && req.method === 'POST') {
				const result = await application.stop();
				jsonResponse(res, result.ok ? 200 : 400, result);
				return;
			}

			if (req.url === '/api/compose' && req.method === 'POST') {
				const body = await readBody(req);
				const payload = JSON.parse(body);
				const { role, text } = payload;

				if (!role || !VALID_ROLES.has(role)) {
					jsonResponse(res, 400, { ok: false, error: 'Invalid or missing role' });
					return;
				}
				if (!text || typeof text !== 'string') {
					jsonResponse(res, 400, { ok: false, error: 'Missing or invalid text' });
					return;
				}

				const state = application.getAgentState(role);
				if (state?.status === 'idle' || state?.status === 'busy') {
					try {
						await application.sendPrompt(role, text);
						jsonResponse(res, 200, { ok: true, via: 'acp' });
						return;
					} catch {
						/* fall through to file-based */
					}
				}

				try {
					const slackDir = path.join(teamDir, 'slack', role);
					await fsp.mkdir(slackDir, { recursive: true });
					const timestamp = Date.now();
					const filename = `[TASK]-compose-${timestamp}.md`;
					const filePath = path.join(slackDir, filename);
					await fsp.writeFile(filePath, `# Message from Dashboard\n\n${text}\n`, 'utf-8');
					jsonResponse(res, 200, { ok: true, via: 'file', filename });
				} catch (err) {
					jsonResponse(res, 500, { ok: false, error: (err as Error).message });
				}
				return;
			}

			if (req.url === '/api/check-inbox' && req.method === 'POST') {
				if (!application.isRunning()) {
					jsonResponse(res, 400, { ok: false, error: 'Team not running' });
					return;
				}

				const inboxDir = path.join(teamDir, 'inbox');
				try {
					const entries = await fsp.readdir(inboxDir, { withFileTypes: true });
					const mdFiles = entries.filter(entry => entry.isFile() && entry.name.endsWith('.md'));

					if (mdFiles.length === 0) {
						jsonResponse(res, 200, { ok: true, message: 'Inbox is empty', count: 0 });
						return;
					}

					await application.sendPrompt('team-lead', `Please process all files in the inbox directory. There are ${mdFiles.length} files that need to be processed and triaged.`);
					jsonResponse(res, 200, { ok: true, message: 'Team-lead triggered to process inbox', count: mdFiles.length });
				} catch (err) {
					jsonResponse(res, 500, { ok: false, error: (err as Error).message });
				}
				return;
			}

			if (req.url === '/style.css') {
				await serveStaticFile(path.join(publicDir, 'css', 'style.css'), res, 'text/css');
				return;
			}

			if (req.url === '/main.js') {
				await serveStaticFile(path.join(publicDir, 'js', 'main.js'), res, 'application/javascript');
				return;
			}

			if (req.url === '/' || req.url === '/index.html') {
				await serveStaticFile(path.join(publicDir, 'index.html'), res, 'text/html');
				return;
			}

			res.writeHead(404);
			res.end('Not found');
		} catch (err) {
			console.error('[routes] Unhandled request error:', (err as Error).message);
			if (!res.headersSent) {
				jsonResponse(res, 500, { ok: false, error: 'Internal server error' });
			} else {
				res.end();
			}
		}
	};
}

function jsonResponse(res: http.ServerResponse, statusCode: number, payload: unknown): void {
	res.writeHead(statusCode, { 'Content-Type': 'application/json' });
	res.end(JSON.stringify(payload));
}

async function serveStaticFile(filePath: string, res: http.ServerResponse, contentType: string): Promise<void> {
	try {
		const content = await fsp.readFile(filePath);
		res.writeHead(200, { 'Content-Type': contentType });
		res.end(content);
	} catch {
		res.writeHead(404);
		res.end('Not found');
	}
}

function readBody(req: http.IncomingMessage, maxBytes = 1_000_000): Promise<string> {
	return new Promise((resolve, reject) => {
		let body = '';
		let size = 0;
		req.on('data', chunk => {
			size += chunk.length;
			if (size > maxBytes) {
				reject(new Error('Request body too large'));
				return;
			}
			body += chunk;
		});
		req.on('end', () => resolve(body));
		req.on('error', reject);
	});
}
