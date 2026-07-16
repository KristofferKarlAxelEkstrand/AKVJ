#!/usr/bin/env node
/**
 * Lightweight Admin API — Node http/fs only (no Express).
 * Serves clip bucket + set-mapping.json read/write and sprite ingestion.
 */
import http from 'http';
import fs from 'fs/promises';
import path from 'path';
import { spawn } from 'child_process';
import { CLIPS_DIR, SET_MAPPING_PATH, REPO_ROOT, isValidClipId, clipDir, resolveSafeSpritePath } from './paths.js';
import { createClipFromFrames } from './spritesheet.js';

const PORT = Number(process.env.ADMIN_API_PORT) || 8787;
const ALLOWED_ORIGINS = new Set(['http://localhost:5174', 'http://127.0.0.1:5174', 'http://localhost:5173', 'http://127.0.0.1:5173']);
/** Max JSON body for uploads / mapping writes (32 MiB). */
const MAX_BODY_BYTES = 32 * 1024 * 1024;
const SAFE_PNG_NAME = /^[a-zA-Z0-9][a-zA-Z0-9._-]*\.png$/i;

/**
 * @param {http.IncomingMessage} req
 * @param {number} [maxBytes]
 * @returns {Promise<Buffer>}
 */
function readBody(req, maxBytes = MAX_BODY_BYTES) {
	return new Promise((resolve, reject) => {
		const chunks = [];
		let total = 0;
		req.on('data', chunk => {
			total += chunk.length;
			if (total > maxBytes) {
				reject(new Error(`Request body exceeds ${maxBytes} bytes`));
				req.destroy();
				return;
			}
			chunks.push(chunk);
		});
		req.on('end', () => resolve(Buffer.concat(chunks)));
		req.on('error', reject);
	});
}

/**
 * @param {http.ServerResponse} res
 * @param {number} status
 * @param {unknown} payload
 * @param {Record<string, string>} [headers]
 */
function sendJson(res, status, payload, headers = {}) {
	const body = JSON.stringify(payload);
	res.writeHead(status, {
		'Content-Type': 'application/json; charset=utf-8',
		'Content-Length': Buffer.byteLength(body),
		...headers
	});
	res.end(body);
}

/**
 * @param {http.IncomingMessage} req
 * @param {http.ServerResponse} res
 */
function applyCors(req, res) {
	const origin = req.headers.origin;
	if (origin && ALLOWED_ORIGINS.has(origin)) {
		res.setHeader('Access-Control-Allow-Origin', origin);
		res.setHeader('Vary', 'Origin');
	}
	res.setHeader('Access-Control-Allow-Methods', 'GET, PUT, POST, OPTIONS');
	res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

/**
 * Whether a clip folder has enough metadata + sprite to pass the pipeline.
 * @param {object} meta
 * @param {boolean} hasSprite
 * @returns {boolean}
 */
function isPipelineReadyClip(meta, hasSprite) {
	return hasSprite && meta && typeof meta.png === 'string' && SAFE_PNG_NAME.test(path.basename(meta.png)) && Number.isInteger(meta.numberOfFrames) && meta.numberOfFrames >= 1 && Number.isInteger(meta.framesPerRow) && meta.framesPerRow >= 1;
}

/**
 * @returns {Promise<Array<{clipId: string, meta: object, hasSprite: boolean, pipelineReady: boolean}>>}
 */
async function readClipDirectories() {
	try {
		return await fs.readdir(CLIPS_DIR, { withFileTypes: true });
	} catch (error) {
		if (error.code === 'ENOENT') {
			return [];
		}
		throw error;
	}
}

async function listClips() {
	const entries = await readClipDirectories();
	const clips = [];
	for (const entry of entries) {
		if (!entry.isDirectory() || !isValidClipId(entry.name)) {
			continue;
		}
		clips.push(await buildClipEntry(entry.name));
	}
	clips.sort((a, b) => a.clipId.localeCompare(b.clipId));
	return clips;
}

async function buildClipEntry(clipId) {
	const dir = path.join(CLIPS_DIR, clipId);
	const meta = await readClipMeta(dir);
	const hasSprite = await checkSpriteExists(dir, meta);
	return {
		clipId,
		meta,
		hasSprite,
		pipelineReady: isPipelineReadyClip(meta, hasSprite)
	};
}

async function readClipMeta(dir) {
	try {
		return JSON.parse(await fs.readFile(path.join(dir, 'meta.json'), 'utf8'));
	} catch {
		return {};
	}
}

async function checkSpriteExists(dir, meta) {
	const pngCandidate = typeof meta.png === 'string' ? path.basename(meta.png) : 'sprite.png';
	if (!SAFE_PNG_NAME.test(pngCandidate)) {
		return false;
	}
	try {
		await fs.access(path.join(dir, pngCandidate));
		return true;
	} catch {
		return false;
	}
}

/**
 * @returns {Promise<Array>}
 */
async function readMapping() {
	try {
		const raw = await fs.readFile(SET_MAPPING_PATH, 'utf8');
		const parsedMapping = JSON.parse(raw);
		return Array.isArray(parsedMapping) ? parsedMapping : [];
	} catch (error) {
		if (error.code === 'ENOENT') {
			return [];
		}
		throw error;
	}
}

/**
 * @param {unknown} mapping
 */
async function writeMapping(mapping) {
	if (!Array.isArray(mapping)) {
		throw new Error('set-mapping.json must be a JSON array');
	}

	const readyClips = new Set((await listClips()).filter(clip => clip.pipelineReady).map(clip => clip.clipId));
	const seenSlots = new Set();

	mapping.forEach((entry, index) => {
		validateMappingEntry(entry, index, readyClips, seenSlots);
	});

	await fs.mkdir(CLIPS_DIR, { recursive: true });
	await fs.writeFile(SET_MAPPING_PATH, `${JSON.stringify(mapping, null, '\t')}\n`);
}

function validateMappingEntry(entry, index, readyClips, seenSlots) {
	if (!Number.isInteger(entry?.channel) || entry.channel < 1 || entry.channel > 16 || !Number.isInteger(entry?.note) || entry.note < 0 || entry.note > 127 || !Number.isInteger(entry?.velocity) || entry.velocity < 0 || entry.velocity > 127 || !isValidClipId(entry.clipId)) {
		throw new Error(`Mapping[${index}]: needs channel (1–16), note/velocity (0–127), and a valid clipId`);
	}
	if (!readyClips.has(entry.clipId)) {
		throw new Error(`Mapping[${index}]: clipId "${entry.clipId}" is missing or incomplete (needs meta.json + sprite + numberOfFrames/framesPerRow)`);
	}
	const slotKey = `${entry.channel}/${entry.note}/${entry.velocity}`;
	if (seenSlots.has(slotKey)) {
		throw new Error(`Mapping[${index}]: duplicate MIDI slot ${slotKey}`);
	}
	seenSlots.add(slotKey);
}

/**
 * @returns {Promise<{ok: boolean, output: string}>}
 */
function runPipeline() {
	return new Promise(resolve => {
		const child = spawn(process.execPath, ['vj-server/scripts/clips/index.js'], {
			cwd: REPO_ROOT,
			env: process.env
		});
		let output = '';
		child.stdout.on('data', chunk => {
			output += chunk.toString();
		});
		child.stderr.on('data', chunk => {
			output += chunk.toString();
		});
		child.on('close', code => {
			resolve({ ok: code === 0, output, code });
		});
	});
}

const server = http.createServer(async (req, res) => {
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

const EXACT_ROUTES = {
	'GET /api/health': handleGetHealth,
	'GET /api/clips': handleGetClips,
	'GET /api/mapping': handleGetMapping,
	'PUT /api/mapping': handlePutMapping,
	'POST /api/clips': handlePostClips,
	'POST /api/pipeline': handlePostPipeline
};

async function routeRequest(req, res, url) {
	const routeKey = `${req.method} ${url.pathname}`;
	const handler = EXACT_ROUTES[routeKey];
	if (handler) {
		await handler(req, res);
		return;
	}
	if (req.method === 'GET' && url.pathname.startsWith('/api/clips/') && url.pathname.endsWith('/sprite')) {
		await serveSprite(req, res, url);
		return;
	}
	sendJson(res, 404, { error: 'Not found' });
}

function handleGetHealth(_req, res) {
	sendJson(res, 200, { ok: true });
}

async function handleGetClips(_req, res) {
	sendJson(res, 200, { clips: await listClips() });
}

async function handleGetMapping(_req, res) {
	sendJson(res, 200, { mapping: await readMapping() });
}

async function handlePostPipeline(_req, res) {
	const result = await runPipeline();
	sendJson(res, result.ok ? 200 : 500, result);
}

async function resolveSpriteName(clipId) {
	const metaPath = path.join(clipDir(clipId), 'meta.json');
	try {
		const meta = JSON.parse(await fs.readFile(metaPath, 'utf8'));
		return meta.png || 'sprite.png';
	} catch {
		return 'sprite.png';
	}
}

async function serveSprite(_req, res, url) {
	const clipId = decodeURIComponent(url.pathname.slice('/api/clips/'.length, -'/sprite'.length));
	if (!isValidClipId(clipId)) {
		sendJson(res, 400, { error: 'Invalid clipId' });
		return;
	}
	const pngName = await resolveSpriteName(clipId);
	const spritePath = resolveSafeSpritePath(clipId, pngName);
	const spriteData = await fs.readFile(spritePath);
	res.writeHead(200, {
		'Content-Type': 'image/png',
		'Content-Length': spriteData.length,
		'Cache-Control': 'no-store'
	});
	res.end(spriteData);
}

async function handlePutMapping(req, res) {
	const body = JSON.parse((await readBody(req)).toString('utf8') || '{}');
	await writeMapping(body.mapping ?? body);
	sendJson(res, 200, { ok: true, mapping: await readMapping() });
}

async function handlePostClips(req, res) {
	const body = JSON.parse((await readBody(req)).toString('utf8') || '{}');
	const { clipId, role, frames } = body;
	if (!isValidClipId(clipId)) {
		sendJson(res, 400, { error: 'Invalid clipId' });
		return;
	}
	if (!Array.isArray(frames) || frames.length === 0) {
		sendJson(res, 400, { error: 'frames must be a non-empty array of base64 PNG strings' });
		return;
	}
	const frameBuffers = frames.map(frame => Buffer.from(String(frame).replace(/^data:image\/\w+;base64,/, ''), 'base64'));
	const result = await createClipFromFrames({ clipId, frameBuffers, role });
	sendJson(res, 201, { ok: true, ...result });
}

server.listen(PORT, '127.0.0.1', () => {
	console.log(`AKVJ admin API listening on http://127.0.0.1:${PORT}`);
});
