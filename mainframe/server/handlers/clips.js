import fs from 'fs/promises';
import path from 'path';
import { isValidClipId, SAFE_PNG_NAME } from '../../shared/clipId.js';
import { clipDir, resolveSafeSpritePath, projectRawAssetsRoot, projectKeyMapPath } from '../paths.js';
import { createClipFromFrames, recompileClip, updateClipFromFrames } from '../spritesheet.js';
import { loadClipFrameBuffers } from '../frameLoad.js';
import { durationsMsToFrameRates } from '../../shared/frameTiming.js';
import { sendJson, parseJsonBody } from '../httpUtils.js';
import { parseClipFramesBody } from '../clipFramesBody.js';
import { validateMetaFields } from '../../scripts/clips/lib/validate/meta.js';
import { listClips } from '../clipCatalog.js';
import { getActiveProjectId } from '../projects.js';
import { flattenKeyMap, nestMappingEntries } from '../../shared/mappingService.js';
import { writeJsonAtomic } from '../writeJsonAtomic.js';

/**
 * Flat mapping entries for the active (or given) project. Used when pruning deleted clips.
 * @param {string} [projectId]
 * @returns {Promise<object[]>}
 */
export async function readFlatMapping(projectId) {
	const id = projectId ?? (await getActiveProjectId());
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

export async function handleGetClips(_req, res) {
	sendJson(res, 200, { clips: await listClips() });
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

export async function handleGetClipSprite(_req, res, url) {
	const clipId = decodeURIComponent(url.pathname.slice('/api/clips/'.length, -'/sprite'.length));
	if (!isValidClipId(clipId)) {
		sendJson(res, 400, { error: 'Invalid clipId' });
		return;
	}
	const projectId = await getActiveProjectId();
	const pngName = await resolveSpriteName(clipId, projectId);
	const spritePath = resolveSafeSpritePath(clipId, pngName, projectId);
	let spriteBuffer;
	try {
		spriteBuffer = await fs.readFile(spritePath);
	} catch (error) {
		if (error.code === 'ENOENT') {
			sendJson(res, 404, { error: `Sprite "${pngName}" not found for clip "${clipId}"` });
			return;
		}
		throw error;
	}
	res.writeHead(200, {
		'Content-Type': 'image/png',
		'Content-Length': spriteBuffer.length,
		'Cache-Control': 'no-store'
	});
	res.end(spriteBuffer);
}

export async function handleGetClipFrames(_req, res, url) {
	const clipId = decodeURIComponent(url.pathname.slice('/api/clips/'.length, -'/frames'.length));
	if (!isValidClipId(clipId)) {
		sendJson(res, 400, { error: 'Invalid clipId' });
		return;
	}
	try {
		const projectId = await getActiveProjectId();
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
	const body = await parseJsonBody(req, res);
	if (body === null) {
		return;
	}
	const parsed = parseClipFramesBody(body);
	if (!parsed.frameBuffers) {
		sendJson(res, 400, { error: 'Cannot save with zero frames' });
		return;
	}
	try {
		const projectId = await getActiveProjectId();
		const result = await updateClipFromFrames({
			clipId,
			frameBuffers: parsed.frameBuffers,
			role: parsed.role,
			targetWidth: parsed.targetWidth,
			targetHeight: parsed.targetHeight,
			scaleMode: parsed.scaleMode,
			scaling: parsed.scaling,
			name: parsed.name,
			playback: parsed.playback,
			frameRate: parsed.frameRate,
			frameDurationsMs: parsed.frameDurationsMs,
			frameRatesForFrames: parsed.frameRatesForFrames,
			retrigger: parsed.retrigger,
			triggerType: parsed.triggerType,
			triggerGroup: parsed.triggerGroup,
			bitDepth: parsed.bitDepth,
			sync: parsed.sync,
			syncLength: parsed.syncLength,
			syncBeats: parsed.syncBeats,
			beatsPerBar: parsed.beatsPerBar,
			placement: parsed.placement,
			frameBakeConfigs: parsed.frameBakeConfigs,
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
	const body = await parseJsonBody(req, res);
	if (body === null) {
		return;
	}
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
		const projectId = await getActiveProjectId();
		const result = await createClipFromFrames({
			clipId,
			frameBuffers: parsed.frameBuffers,
			role: parsed.role,
			targetWidth: parsed.targetWidth,
			targetHeight: parsed.targetHeight,
			scaleMode: parsed.scaleMode,
			scaling: parsed.scaling,
			name: parsed.name,
			playback: parsed.playback,
			frameRate: parsed.frameRate,
			frameDurationsMs: parsed.frameDurationsMs,
			frameRatesForFrames: parsed.frameRatesForFrames,
			retrigger: parsed.retrigger,
			triggerType: parsed.triggerType,
			triggerGroup: parsed.triggerGroup,
			bitDepth: parsed.bitDepth,
			sync: parsed.sync,
			syncLength: parsed.syncLength,
			syncBeats: parsed.syncBeats,
			beatsPerBar: parsed.beatsPerBar,
			placement: parsed.placement,
			frameBakeConfigs: parsed.frameBakeConfigs,
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
	const projectId = await getActiveProjectId();
	const clipDirectory = clipDir(clipId, projectId);
	try {
		await fs.access(clipDirectory);
	} catch {
		sendJson(res, 404, { error: `Clip "${clipId}" not found` });
		return;
	}
	const body = await parseJsonBody(req, res);
	if (body === null) {
		return;
	}
	const { targetWidth, targetHeight, name, playback, frameRate, role, frameDurationsMs } = body;
	let { scaleMode, scaling } = body;
	if (!scaleMode || scaling === undefined) {
		try {
			const meta = JSON.parse(await fs.readFile(path.join(clipDirectory, 'meta.json'), 'utf8'));
			scaleMode = scaleMode || meta.scaleMode;
			scaling = scaling !== undefined ? scaling : meta.scaling;
		} catch {
			// keep undefined — spritesheet defaults to fit / nearest
		}
	}
	const durationsMs = Array.isArray(frameDurationsMs) && frameDurationsMs.length > 0 ? frameDurationsMs.map(ms => Number(ms)) : undefined;
	const frameRatesForFrames = durationsMs ? durationsMsToFrameRates(durationsMs) : undefined;
	try {
		const result = await recompileClip({ clipId, targetWidth, targetHeight, scaleMode, scaling, name, playback, frameRate, frameDurationsMs: durationsMs, frameRatesForFrames, role, projectId });
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
	const projectId = await getActiveProjectId();
	const clipDirectory = clipDir(clipId, projectId);
	try {
		await fs.access(clipDirectory);
	} catch {
		sendJson(res, 404, { error: `Clip "${clipId}" not found` });
		return;
	}
	await fs.rm(clipDirectory, { recursive: true });
	await fs.rm(path.join(projectRawAssetsRoot(projectId), clipId), { recursive: true, force: true });

	const mapping = await readFlatMapping(projectId);
	const remaining = mapping.filter(entry => entry.clipId !== clipId);
	if (remaining.length !== mapping.length) {
		const keyMap = nestMappingEntries(remaining);
		await writeJsonAtomic(projectKeyMapPath(projectId), keyMap);
	}

	sendJson(res, 200, { ok: true, clipId });
}

const EDITABLE_META_FIELDS = new Set(['name', 'frames', 'framesPerRow', 'playback', 'retrigger', 'frameRatesForFrames', 'frameDurationsMs', 'bitDepth', 'role', 'png', 'triggerType', 'triggerGroup', 'scaleMode', 'scaling', 'frameWidth', 'frameHeight', 'placement', 'sync', 'syncLength', 'syncBeats', 'beatsPerBar']);

export async function handlePutClipMeta(req, res, url) {
	const clipId = decodeURIComponent(url.pathname.slice('/api/clips/'.length));
	if (!isValidClipId(clipId)) {
		sendJson(res, 400, { error: 'Invalid clipId' });
		return;
	}
	const projectId = await getActiveProjectId();
	const clipDirectory = clipDir(clipId, projectId);
	try {
		await fs.access(clipDirectory);
	} catch {
		sendJson(res, 404, { error: `Clip "${clipId}" not found` });
		return;
	}
	const body = await parseJsonBody(req, res);
	if (body === null) {
		return;
	}
	const currentMetaPath = path.join(clipDirectory, 'meta.json');
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
	// frameDurationsMs is load source of truth — rates-only edits must clear stale ms
	if (Object.hasOwn(body, 'frameRatesForFrames') && !Object.hasOwn(body, 'frameDurationsMs')) {
		delete updatedMeta.frameDurationsMs;
	}
	if (Array.isArray(body.frameDurationsMs) && body.frameDurationsMs.length > 0) {
		updatedMeta.frameDurationsMs = body.frameDurationsMs.map(ms => Number(ms));
		updatedMeta.frameRatesForFrames = durationsMsToFrameRates(updatedMeta.frameDurationsMs);
	}
	const validationErrors = validateMetaFields(updatedMeta);
	if (validationErrors.length > 0) {
		sendJson(res, 400, { error: validationErrors[0] });
		return;
	}
	if (updatedMeta.png !== currentMeta.png && !SAFE_PNG_NAME.test(String(updatedMeta.png))) {
		sendJson(res, 400, { error: 'Invalid png filename in meta' });
		return;
	}
	await writeJsonAtomic(currentMetaPath, updatedMeta);
	sendJson(res, 200, { ok: true, clipId, meta: updatedMeta });
}
