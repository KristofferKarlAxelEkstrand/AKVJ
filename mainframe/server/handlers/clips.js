import fs from 'fs/promises';
import path from 'path';
import { isValidClipId, SAFE_PNG_NAME } from '../../shared/clipId.js';
import { clipDir, resolveSafeSpritePath, projectRawAssetsRoot, projectKeyMapPath } from '../paths.js';
import { createClipFromFrames, recompileClip, updateClipFromFrames } from '../spritesheet.js';
import { loadClipFrameBuffers } from '../frameLoad.js';
import { durationsMsToFrameRates } from '../../shared/frameTiming.js';
import { readBody, sendJson } from '../httpUtils.js';
import { parseClipFramesBody } from '../clipFramesBody.js';
import { listClips, activeProjectId, clipsRootFor } from '../clipCatalog.js';
import { flattenKeyMap, nestMappingEntries, assertValidFlatMapping } from '../mappingService.js';

/**
 * @param {string} [projectId]
 */
export async function readMapping(projectId) {
	const id = projectId ?? (await activeProjectId());
	try {
		const raw = await fs.readFile(projectKeyMapPath(id), 'utf8');
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
 * @param {unknown} mapping
 * @param {string} [projectId]
 */
export async function writeMapping(mapping, projectId) {
	const id = projectId ?? (await activeProjectId());
	const readyClips = new Set((await listClips(id)).filter(clip => clip.pipelineReady).map(clip => clip.clipId));
	assertValidFlatMapping(mapping, readyClips);
	const keyMap = nestMappingEntries(mapping);
	await fs.mkdir(await clipsRootFor(id), { recursive: true });
	await fs.writeFile(projectKeyMapPath(id), `${JSON.stringify(keyMap, null, '\t')}\n`);
}

export async function handleGetClips(_req, res) {
	sendJson(res, 200, { clips: await listClips() });
}

export async function handleGetMapping(_req, res) {
	sendJson(res, 200, { mapping: await readMapping() });
}

export async function handlePutMapping(req, res) {
	try {
		const body = JSON.parse((await readBody(req)).toString('utf8') || '{}');
		await writeMapping(body.mapping ?? body);
		sendJson(res, 200, { ok: true, mapping: await readMapping() });
	} catch (error) {
		sendJson(res, error.statusCode || 400, { error: error.message });
	}
}

async function resolveSpriteName(clipId, projectId) {
	const metaPath = path.join(clipDir(clipId, projectId), 'meta.json');
	try {
		const meta = JSON.parse(await fs.readFile(metaPath, 'utf8'));
		return meta.png || 'sprite.png';
	} catch {
		return 'sprite.png';
	}
}

export async function serveSprite(_req, res, url) {
	const clipId = decodeURIComponent(url.pathname.slice('/api/clips/'.length, -'/sprite'.length));
	if (!isValidClipId(clipId)) {
		sendJson(res, 400, { error: 'Invalid clipId' });
		return;
	}
	const projectId = await activeProjectId();
	const pngName = await resolveSpriteName(clipId, projectId);
	const spritePath = resolveSafeSpritePath(clipId, pngName, projectId);
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

export async function handleGetClipFrames(_req, res, url) {
	const clipId = decodeURIComponent(url.pathname.slice('/api/clips/'.length, -'/frames'.length));
	if (!isValidClipId(clipId)) {
		sendJson(res, 400, { error: 'Invalid clipId' });
		return;
	}
	try {
		const projectId = await activeProjectId();
		const result = await loadClipFrameBuffers(clipId, projectId);
		sendJson(res, 200, {
			ok: true,
			clipId,
			source: result.source,
			meta: result.meta,
			durationsMs: result.durationsMs,
			frames: result.frames.map(frame => `data:image/png;base64,${frame.toString('base64')}`)
		});
	} catch (error) {
		const status = /not found/i.test(error.message) ? 404 : 400;
		sendJson(res, status, { error: error.message });
	}
}

export async function handlePutClipFrames(req, res, url) {
	const clipId = decodeURIComponent(url.pathname.slice('/api/clips/'.length, -'/frames'.length));
	if (!isValidClipId(clipId)) {
		sendJson(res, 400, { error: 'Invalid clipId' });
		return;
	}
	const body = JSON.parse((await readBody(req)).toString('utf8') || '{}');
	const parsed = parseClipFramesBody(body);
	if (!parsed.frameBuffers) {
		sendJson(res, 400, { error: 'Cannot save with zero frames' });
		return;
	}
	try {
		const projectId = await activeProjectId();
		const result = await updateClipFromFrames({
			clipId,
			frameBuffers: parsed.frameBuffers,
			role: parsed.role,
			targetWidth: parsed.targetWidth,
			targetHeight: parsed.targetHeight,
			scaleMode: parsed.scaleMode,
			name: parsed.name,
			playback: parsed.playback,
			frameRate: parsed.frameRate,
			frameRatesForFrames: parsed.frameRatesForFrames,
			retrigger: parsed.retrigger,
			triggerType: parsed.triggerType,
			triggerGroup: parsed.triggerGroup,
			bitDepth: parsed.bitDepth,
			frameDurationBeats: parsed.frameDurationBeats,
			sync: parsed.sync,
			syncLength: parsed.syncLength,
			syncBeats: parsed.syncBeats,
			beatsPerBar: parsed.beatsPerBar,
			syncOptionalMeta: true,
			projectId
		});
		sendJson(res, 200, { ok: true, ...result });
	} catch (error) {
		const status = /not found/i.test(error.message) ? 404 : 400;
		sendJson(res, status, { error: error.message });
	}
}

export async function handlePostClips(req, res) {
	const body = JSON.parse((await readBody(req)).toString('utf8') || '{}');
	const clipId = typeof body.clipId === 'string' ? body.clipId.trim() : '';
	if (!clipId) {
		sendJson(res, 400, { error: 'clipId is required' });
		return;
	}
	if (!isValidClipId(clipId)) {
		sendJson(res, 400, { error: 'Invalid clipId' });
		return;
	}
	const parsed = parseClipFramesBody(body);
	if (!parsed.frameBuffers) {
		sendJson(res, 400, { error: 'frames must be a non-empty array of base64 image strings (PNG, JPG, or GIF)' });
		return;
	}
	try {
		const projectId = await activeProjectId();
		const result = await createClipFromFrames({
			clipId,
			frameBuffers: parsed.frameBuffers,
			role: parsed.role,
			targetWidth: parsed.targetWidth,
			targetHeight: parsed.targetHeight,
			scaleMode: parsed.scaleMode,
			name: parsed.name,
			playback: parsed.playback,
			frameRate: parsed.frameRate,
			frameRatesForFrames: parsed.frameRatesForFrames,
			retrigger: parsed.retrigger,
			triggerType: parsed.triggerType,
			triggerGroup: parsed.triggerGroup,
			bitDepth: parsed.bitDepth,
			frameDurationBeats: parsed.frameDurationBeats,
			sync: parsed.sync,
			syncLength: parsed.syncLength,
			syncBeats: parsed.syncBeats,
			beatsPerBar: parsed.beatsPerBar,
			syncOptionalMeta: true,
			projectId
		});
		sendJson(res, 201, { ok: true, ...result });
	} catch (error) {
		sendJson(res, 400, { error: error.message });
	}
}

export async function handleRecompileClip(req, res, url) {
	const clipId = decodeURIComponent(url.pathname.slice('/api/clips/'.length, -'/recompile'.length));
	if (!isValidClipId(clipId)) {
		sendJson(res, 400, { error: 'Invalid clipId' });
		return;
	}
	const projectId = await activeProjectId();
	const targetDir = clipDir(clipId, projectId);
	try {
		await fs.access(targetDir);
	} catch {
		sendJson(res, 404, { error: `Clip "${clipId}" not found` });
		return;
	}
	const body = JSON.parse((await readBody(req)).toString('utf8') || '{}');
	const { targetWidth, targetHeight, name, playback, frameRate, role, frameDurations } = body;
	let { scaleMode } = body;
	if (!scaleMode) {
		try {
			const meta = JSON.parse(await fs.readFile(path.join(targetDir, 'meta.json'), 'utf8'));
			scaleMode = meta.scaleMode;
		} catch {
			// keep undefined — spritesheet defaults to fit
		}
	}
	const frameRatesForFrames = Array.isArray(frameDurations) && frameDurations.length > 0 ? durationsMsToFrameRates(frameDurations) : undefined;
	try {
		const result = await recompileClip({ clipId, targetWidth, targetHeight, scaleMode, name, playback, frameRate, frameRatesForFrames, role, projectId });
		sendJson(res, 200, { ok: true, ...result });
	} catch (error) {
		sendJson(res, 400, { error: error.message });
	}
}

export async function handleDeleteClip(_req, res, url) {
	const clipId = decodeURIComponent(url.pathname.slice('/api/clips/'.length));
	if (!isValidClipId(clipId)) {
		sendJson(res, 400, { error: 'Invalid clipId' });
		return;
	}
	const projectId = await activeProjectId();
	const targetDir = clipDir(clipId, projectId);
	try {
		await fs.access(targetDir);
	} catch {
		sendJson(res, 404, { error: `Clip "${clipId}" not found` });
		return;
	}
	await fs.rm(targetDir, { recursive: true });
	await fs.rm(path.join(projectRawAssetsRoot(projectId), clipId), { recursive: true, force: true });
	sendJson(res, 200, { ok: true, clipId });
}

const EDITABLE_META_FIELDS = new Set([
	'name',
	'frames',
	'framesPerRow',
	'playback',
	'loop',
	'retrigger',
	'frameRatesForFrames',
	'frameDurationBeats',
	'bitDepth',
	'role',
	'png',
	'triggerType',
	'triggerGroup',
	'scaleMode',
	'frameWidth',
	'frameHeight',
	'sync',
	'syncLength',
	'syncBeats',
	'beatsPerBar'
]);

export async function handlePutClipMeta(req, res, url) {
	const clipId = decodeURIComponent(url.pathname.slice('/api/clips/'.length));
	if (!isValidClipId(clipId)) {
		sendJson(res, 400, { error: 'Invalid clipId' });
		return;
	}
	const projectId = await activeProjectId();
	const targetDir = clipDir(clipId, projectId);
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
		if (!EDITABLE_META_FIELDS.has(key)) {
			continue;
		}
		if (value === null) {
			delete updatedMeta[key];
		} else {
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
