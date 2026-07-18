#!/usr/bin/env node
/**
 * Lightweight Mainframe API — Node http/fs only (no Express).
 * Thin entry: CORS, routing, boot migration.
 */
import http from 'http';
import path from 'path';
import { fileURLToPath } from 'url';
import { migrateFlatClipsToDefaultProject } from './migrateClipsToProjects.js';
import { applyCors, sendJson } from './httpUtils.js';
import { routeRequest } from './routes/router.js';

const PORT = Number(process.env.MAINFRAME_API_PORT) || 7777;

export function createMainframeServer() {
	return http.createServer(async (req, res) => {
		applyCors(req, res);

		if (req.method === 'OPTIONS') {
			res.writeHead(204);
			res.end();
			return;
		}

		const url = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`);

		try {
			await routeRequest(req, res, url);
		} catch (error) {
			console.error(error);
			sendJson(res, 500, { error: error.message || 'Server error' });
		}
	});
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
	const server = createMainframeServer();
	server.on('error', error => {
		if (error.code === 'EADDRINUSE') {
			console.error(`Port ${PORT} is already in use. Stop the other process or set MAINFRAME_API_PORT.`);
			process.exit(1);
		}
		throw error;
	});
	(async () => {
		try {
			const migration = await migrateFlatClipsToDefaultProject();
			if (migration.migrated) {
				console.log(`Migrated ${migration.clipCount} clip(s) into projects/default/clips`);
			}
		} catch (error) {
			console.error('Clip migration failed:', error);
			process.exit(1);
		}
		server.listen(PORT, '127.0.0.1', () => {
			console.log(`AKVJ mainframe API listening on http://127.0.0.1:${PORT}`);
		});
	})();
}
