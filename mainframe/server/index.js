#!/usr/bin/env node
/**
 * Lightweight Mainframe API — Node http/fs only (no Express).
 * Serves clip bucket + key-map.json read/write and sprite ingestion.
 */
import http from 'http';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { spawn } from 'child_process';
import { CLIPS_DIR, KEY_MAP_PATH, REPO_ROOT, isValidClipId, clipDir, resolveSafeSpritePath } from './paths.js';
import { createClipFromFrames, recompileClip } from './spritesheet.js';

const PORT = Number(process.env.MAINFRAME_API_PORT) || 7777;
const ALLOWED_ORIGINS = new Set(['http://localhost:9999', 'http://127.0.0.1:9999', 'http://localhost:8888', 'http://127.0.0.1:8888']);
/** Max JSON body for uploads / key-map writes (32 MiB). */
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
	res.setHeader('Access-Control-Allow-Methods', 'GET, PUT, POST, DELETE, OPTIONS');
	res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

/**
 * Whether a clip folder has enough metadata + sprite to pass the pipeline.
 * @param {object} meta
 * @param {boolean} hasSprite
 * @returns {boolean}
 */
function isPipelineReadyClip(meta, hasSprite) {
	if (!hasSprite || !meta) {
		return false;
	}
	const pngName = meta.png ? path.basename(meta.png) : '';
	if (meta.png && !SAFE_PNG_NAME.test(pngName)) {
		return false;
	}
	const frameCount = meta.frames ?? meta.numberOfFrames;
	return Number.isInteger(frameCount) && frameCount >= 1 && Number.isInteger(meta.framesPerRow) && meta.framesPerRow >= 1;
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
	const clipEntries = entries.filter(entry => entry.isDirectory() && isValidClipId(entry.name));
	const clips = await Promise.all(clipEntries.map(entry => buildClipEntry(entry.name)));
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
 * Read key-map.json (nested {channel: {note: {velocity: clipId}}})
 * and convert to a flat array for the mainframe UI.
 * @returns {Promise<Array<{channel: number, note: number, velocity: number, clipId: string}>>}
 */
async function readMapping() {
	try {
		const raw = await fs.readFile(KEY_MAP_PATH, 'utf8');
		const keyMap = JSON.parse(raw);
		if (!keyMap || typeof keyMap !== 'object' || Array.isArray(keyMap)) {
			return [];
		}
		return flattenKeyMap(keyMap);
	} catch (error) {
		if (error.code === 'ENOENT') {
			return [];
		}
		throw error;
	}
}

/**
 * Convert nested {channel: {note: {velocity: clipId}}} to flat array.
 * @param {Object} keyMap
 * @returns {Array<{channel: number, note: number, velocity: number, clipId: string}>}
 */
function flattenKeyMap(keyMap) {
	const entries = [];
	for (const [channel, notes] of Object.entries(keyMap)) {
		if (!notes || typeof notes !== 'object' || Array.isArray(notes)) {
			continue;
		}
		for (const [note, velocities] of Object.entries(notes)) {
			if (!velocities || typeof velocities !== 'object' || Array.isArray(velocities)) {
				continue;
			}
			for (const [velocity, clipId] of Object.entries(velocities)) {
				entries.push({
					channel: Number(channel),
					note: Number(note),
					velocity: Number(velocity),
					clipId
				});
			}
		}
	}
	return entries;
}

/**
 * Convert flat mapping array to nested {channel: {note: {velocity: clipId}}}.
 * @param {Array<{channel: number, note: number, velocity: number, clipId: string}>} entries
 * @returns {Object}
 */
function nestMappingEntries(entries) {
	const keyMap = {};
	for (const entry of entries) {
		const channelKey = String(entry.channel);
		const noteKey = String(entry.note);
		const velocityKey = String(entry.velocity);
		keyMap[channelKey] ??= {};
		keyMap[channelKey][noteKey] ??= {};
		keyMap[channelKey][noteKey][velocityKey] = entry.clipId;
	}
	return keyMap;
}

/**
 * @param {unknown} mapping
 */
async function writeMapping(mapping) {
	if (!Array.isArray(mapping)) {
		throw new Error('mapping must be a JSON array');
	}

	const readyClips = new Set((await listClips()).filter(clip => clip.pipelineReady).map(clip => clip.clipId));
	const seenSlots = new Set();

	mapping.forEach((entry, index) => {
		validateMappingEntry(entry, index, readyClips, seenSlots);
	});

	const keyMap = nestMappingEntries(mapping);
	await fs.mkdir(CLIPS_DIR, { recursive: true });
	await fs.writeFile(KEY_MAP_PATH, `${JSON.stringify(keyMap, null, '\t')}\n`);
}

function validateMappingEntry(entry, index, readyClips, seenSlots) {
	if (!Number.isInteger(entry?.channel) || entry.channel < 1 || entry.channel > 16 || !Number.isInteger(entry?.note) || entry.note < 0 || entry.note > 127 || !Number.isInteger(entry?.velocity) || entry.velocity < 0 || entry.velocity > 127 || !isValidClipId(entry.clipId)) {
		throw new Error(`Mapping[${index}]: needs channel (1–16), note/velocity (0–127), and a valid clipId`);
	}
	if (!readyClips.has(entry.clipId)) {
		throw new Error(`Mapping[${index}]: clipId "${entry.clipId}" is missing or incomplete (needs meta.json + sprite + frames/framesPerRow)`);
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
		const child = spawn(process.execPath, ['mainframe/scripts/clips/index.js'], {
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
	if (req.method === 'DELETE' && url.pathname.startsWith('/api/clips/')) {
		await handleDeleteClip(req, res, url);
		return;
	}
	if (req.method === 'PUT' && url.pathname.startsWith('/api/clips/') && !url.pathname.endsWith('/sprite')) {
		await handlePutClipMeta(req, res, url);
		return;
	}
	if (req.method === 'POST' && url.pathname.startsWith('/api/clips/') && url.pathname.endsWith('/recompile')) {
		await handleRecompileClip(req, res, url);
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
	let spriteData;
	try {
		spriteData = await fs.readFile(spritePath);
	} catch (error) {
		if (error.code === 'ENOENT') {
			sendJson(res, 404, { error: `Sprite "${pngName}" not found for clip "${clipId}"` });
			return;
		}
		throw error;
	}
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
	const { clipId, role, frames, targetWidth, targetHeight, name, playback, frameRate } = body;
	if (!isValidClipId(clipId)) {
		sendJson(res, 400, { error: 'Invalid clipId' });
		return;
	}
	if (!Array.isArray(frames) || frames.length === 0) {
		sendJson(res, 400, { error: 'frames must be a non-empty array of base64 PNG strings' });
		return;
	}
	const frameBuffers = frames.map(frame => Buffer.from(String(frame).replace(/^data:image\/\w+;base64,/, ''), 'base64'));
	try {
		const result = await createClipFromFrames({ clipId, frameBuffers, role, targetWidth, targetHeight, name, playback, frameRate });
		sendJson(res, 201, { ok: true, ...result });
	} catch (error) {
		sendJson(res, 400, { error: error.message });
	}
}

async function handleRecompileClip(req, res, url) {
	const clipId = decodeURIComponent(url.pathname.slice('/api/clips/'.length, -'/recompile'.length));
	if (!isValidClipId(clipId)) {
		sendJson(res, 400, { error: 'Invalid clipId' });
		return;
	}
	const targetDir = clipDir(clipId);
	try {
		await fs.access(targetDir);
	} catch {
		sendJson(res, 404, { error: `Clip "${clipId}" not found` });
		return;
	}
	const body = JSON.parse((await readBody(req)).toString('utf8') || '{}');
	const { targetWidth, targetHeight, name, playback, frameRate, role } = body;
	try {
		const result = await recompileClip({ clipId, targetWidth, targetHeight, name, playback, frameRate, role });
		sendJson(res, 200, { ok: true, ...result });
	} catch (error) {
		sendJson(res, 400, { error: error.message });
	}
}

async function handleDeleteClip(_req, res, url) {
	const clipId = decodeURIComponent(url.pathname.slice('/api/clips/'.length));
	if (!isValidClipId(clipId)) {
		sendJson(res, 400, { error: 'Invalid clipId' });
		return;
	}
	const targetDir = clipDir(clipId);
	try {
		await fs.access(targetDir);
	} catch {
		sendJson(res, 404, { error: `Clip "${clipId}" not found` });
		return;
	}
	await fs.rm(targetDir, { recursive: true });
	sendJson(res, 200, { ok: true, clipId });
}

const EDITABLE_META_FIELDS = new Set(['name', 'frames', 'framesPerRow', 'playback', 'loop', 'retrigger', 'frameRatesForFrames', 'frameDurationBeats', 'bitDepth', 'role', 'png', 'triggerType', 'triggerGroup']);

async function handlePutClipMeta(req, res, url) {
	const clipId = decodeURIComponent(url.pathname.slice('/api/clips/'.length));
	if (!isValidClipId(clipId)) {
		sendJson(res, 400, { error: 'Invalid clipId' });
		return;
	}
	const targetDir = clipDir(clipId);
	try {
		await fs.access(targetDir);
	} catch {
		sendJson(res, 404, { error: `Clip "${clipId}" not found` });
		return;
	}
	const body = JSON.parse((await readBody(req)).toString('utf8') || '{}');
	const currentMetaPath = path.join(targetDir, 'meta.json');
	let currentMeta;
	try {
		currentMeta = JSON.parse(await fs.readFile(currentMetaPath, 'utf8'));
	} catch (error) {
		if (error.code === 'ENOENT') {
			sendJson(res, 404, { error: `Clip "${clipId}" has no meta.json` });
			return;
		}
		sendJson(res, 400, { error: `Clip "${clipId}" has invalid meta.json: ${error.message}` });
		return;
	}
	const updatedMeta = { ...currentMeta };
	for (const [key, value] of Object.entries(body)) {
		if (EDITABLE_META_FIELDS.has(key)) {
			updatedMeta[key] = value;
		}
	}
	if (updatedMeta.png !== currentMeta.png && !SAFE_PNG_NAME.test(path.basename(String(updatedMeta.png)))) {
		sendJson(res, 400, { error: 'Invalid png filename in meta' });
		return;
	}
	await fs.writeFile(currentMetaPath, `${JSON.stringify(updatedMeta, null, '\t')}\n`);
	sendJson(res, 200, { ok: true, clipId, meta: updatedMeta });
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
	server.listen(PORT, '127.0.0.1', () => {
		console.log(`AKVJ mainframe API listening on http://127.0.0.1:${PORT}`);
	});
}
