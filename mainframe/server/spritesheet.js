import fs from 'fs/promises';
import path from 'path';
import sharp from 'sharp';
import { clipDir, rawAssetsDir, isValidClipId, DEFAULT_PROJECT_ID } from './paths.js';
import { DEFAULT_TARGET_WIDTH, DEFAULT_TARGET_HEIGHT, DEFAULT_FRAME_RATE, normalizeFrameBuffers, assertReadableFrames, resizeFrames, buildComposites, renderSpriteSheet, resolveCompileOptions, resolveFramesPerRow } from '../shared/spritesheetCore.js';
import { resolveScaleMode } from '../shared/frameFit.js';
import { resolvePlacement, DEFAULT_SCALING, SCALING_MODES } from '../shared/clipSchema.js';
import { durationsMsToFrameRates } from '../shared/frameTiming.js';
import { validateMetaFields } from '../scripts/clips/lib/validate/meta.js';
import { writeJsonAtomic } from './writeJsonAtomic.js';

/**
 * Build a horizontal/grid spritesheet from image frame buffers and write clip folder.
 * Accepts PNG, JPG, or GIF (still = first page). Mixed source sizes are fitted per scaleMode.
 * Stores PNG frames in clips/.raw-assets/{clipId}/ before processing.
 * @param {Object} options
 * @param {string} options.clipId
 * @param {Buffer[]} options.frameBuffers - Original image buffers (any dimensions)
 * @param {string} [options.role]
 * @param {number} [options.targetWidth=240] - Resize frames to this width before compositing
 * @param {number} [options.targetHeight=135] - Resize frames to this height before compositing
 * @param {string} [options.scaleMode='fit'] - fit | cover | stretch | none | pattern
 * @param {string} [options.name] - Human-readable clip name
 * @param {string} [options.playback='loop'] - Playback mode
 * @param {number} [options.frameRate=12] - Default frame rate (FPS)
 * @param {number[]} [options.frameDurationsMs] - Per-frame ms (source of truth when present)
 * @param {Record<string, number>} [options.frameRatesForFrames] - Per-frame FPS (legacy / derived from ms)
 * @returns {Promise<{clipId: string, frames: number, framesPerRow: number}>}
 */
export async function createClipFromFrames({ clipId, frameBuffers, role, targetWidth, targetHeight, scaleMode, scaling, name, playback, frameRate, frameDurationsMs, frameRatesForFrames, retrigger, triggerType, triggerGroup, bitDepth, sync, syncLength, syncBeats, beatsPerBar, syncOptionalMeta, placement, frameBakeConfigs, projectId = DEFAULT_PROJECT_ID }) {
	if (!isValidClipId(clipId)) {
		throw new Error('Invalid clipId');
	}
	if (!Array.isArray(frameBuffers) || frameBuffers.length === 0) {
		throw new Error('At least one frame image is required');
	}

	const { targetWidth: resolvedTargetWidth, targetHeight: resolvedTargetHeight, scaleMode: resolvedScaleMode, frameRate: resolvedFrameRate, playback: resolvedPlayback } = resolveCompileOptions({ targetWidth, targetHeight, scaleMode, frameRate, playback });
	const scaleModeOrBakeConfigs = Array.isArray(frameBakeConfigs) ? frameBakeConfigs : scaleMode;

	const normalizedFrames = await normalizeFrameBuffers(sharp, frameBuffers);
	await assertReadableFrames(sharp, normalizedFrames);
	await storeRawAssets(clipId, normalizedFrames, projectId);

	const resizedBuffers = await resizeFrames(sharp, normalizedFrames, resolvedTargetWidth, resolvedTargetHeight, scaleModeOrBakeConfigs);
	const composites = buildComposites(resizedBuffers, resolvedTargetWidth, resolvedTargetHeight);
	const sheet = await renderSpriteSheet(sharp, composites, resolvedTargetWidth, resolvedTargetHeight, resizedBuffers.length);
	const framesPerRow = resolveFramesPerRow(resizedBuffers.length);
	await writeClipFiles(
		clipId,
		{
			role,
			name,
			playback: resolvedPlayback,
			frameRate: resolvedFrameRate,
			frameDurationsMs,
			frameRatesForFrames,
			scaleMode: resolvedScaleMode,
			scaling,
			frameWidth: resolvedTargetWidth,
			frameHeight: resolvedTargetHeight,
			placement,
			retrigger,
			triggerType,
			triggerGroup,
			bitDepth,
			sync,
			syncLength,
			syncBeats,
			beatsPerBar,
			syncOptionalMeta
		},
		sheet,
		resizedBuffers.length,
		framesPerRow,
		projectId
	);
	return { clipId, frames: resizedBuffers.length, framesPerRow };
}

/**
 * Re-compile a clip's sprite sheet from stored raw assets with new config.
 * Overwrites the existing sprite.png and meta.json.
 * @param {Object} options
 * @param {string} options.clipId
 * @param {number} [options.targetWidth=240]
 * @param {number} [options.targetHeight=135]
 * @param {string} [options.scaleMode]
 * @param {string} [options.name] - Updated clip name
 * @param {string} [options.playback='loop']
 * @param {number} [options.frameRate=12]
 * @param {string} [options.role]
 * @returns {Promise<{clipId: string, frames: number, framesPerRow: number}>}
 */
export async function recompileClip({ clipId, targetWidth, targetHeight, scaleMode, scaling, name, playback, frameRate, frameDurationsMs, frameRatesForFrames, role, projectId = DEFAULT_PROJECT_ID }) {
	if (!isValidClipId(clipId)) {
		throw new Error('Invalid clipId');
	}

	const rawDir = rawAssetsDir(clipId, projectId);
	let rawFiles;
	try {
		rawFiles = await fs.readdir(rawDir);
	} catch {
		throw new Error(`No raw assets found for clip "${clipId}"`);
	}

	const pngFiles = rawFiles.filter(file => file.endsWith('.png')).sort();
	if (pngFiles.length === 0) {
		throw new Error(`No raw PNG frames found for clip "${clipId}"`);
	}

	const frameBuffers = await Promise.all(pngFiles.map(file => fs.readFile(path.join(rawDir, file))));

	const { targetWidth: resolvedTargetWidth, targetHeight: resolvedTargetHeight, scaleMode: resolvedScaleMode, frameRate: resolvedFrameRate, playback: resolvedPlayback } = resolveCompileOptions({ targetWidth, targetHeight, scaleMode, frameRate, playback });

	const resizedBuffers = await resizeFrames(sharp, frameBuffers, resolvedTargetWidth, resolvedTargetHeight, resolvedScaleMode);
	const composites = buildComposites(resizedBuffers, resolvedTargetWidth, resolvedTargetHeight);
	const sheet = await renderSpriteSheet(sharp, composites, resolvedTargetWidth, resolvedTargetHeight, resizedBuffers.length);
	const framesPerRow = resolveFramesPerRow(resizedBuffers.length);
	await overwriteClipFiles(
		clipId,
		{
			role,
			name,
			playback: resolvedPlayback,
			frameRate: resolvedFrameRate,
			frameDurationsMs,
			frameRatesForFrames,
			scaleMode: resolvedScaleMode,
			scaling,
			frameWidth: resolvedTargetWidth,
			frameHeight: resolvedTargetHeight
		},
		sheet,
		resizedBuffers.length,
		framesPerRow,
		projectId
	);
	return { clipId, frames: resizedBuffers.length, framesPerRow };
}

/**
 * Replace raw assets and rebuild sprite + meta for an existing clip.
 * Rejects empty frame lists (do not strip the last frame on disk).
 * @param {Object} options
 * @param {string} options.clipId
 * @param {Buffer[]} options.frameBuffers
 * @param {number} [options.targetWidth]
 * @param {number} [options.targetHeight]
 * @param {string} [options.scaleMode]
 * @param {string} [options.name]
 * @param {string} [options.playback]
 * @param {number} [options.frameRate]
 * @param {number[]} [options.frameDurationsMs]
 * @param {Record<string, number>} [options.frameRatesForFrames]
 * @param {string} [options.role]
 * @returns {Promise<{clipId: string, frames: number, framesPerRow: number}>}
 */
export async function updateClipFromFrames({ clipId, frameBuffers, targetWidth, targetHeight, scaleMode, scaling, name, playback, frameRate, frameDurationsMs, frameRatesForFrames, role, retrigger, triggerType, triggerGroup, bitDepth, sync, syncLength, syncBeats, beatsPerBar, syncOptionalMeta, placement, frameBakeConfigs, projectId = DEFAULT_PROJECT_ID }) {
	if (!isValidClipId(clipId)) {
		throw new Error('Invalid clipId');
	}
	if (!Array.isArray(frameBuffers) || frameBuffers.length === 0) {
		throw new Error('At least one frame image is required');
	}

	const targetDir = clipDir(clipId, projectId);
	try {
		await fs.access(targetDir);
	} catch {
		throw new Error(`Clip "${clipId}" not found`);
	}

	const { targetWidth: resolvedTargetWidth, targetHeight: resolvedTargetHeight, scaleMode: resolvedScaleMode, frameRate: resolvedFrameRate, playback: resolvedPlayback } = resolveCompileOptions({ targetWidth, targetHeight, scaleMode, frameRate, playback });
	const scaleModeOrBakeConfigs = Array.isArray(frameBakeConfigs) ? frameBakeConfigs : scaleMode;

	const normalizedFrames = await normalizeFrameBuffers(sharp, frameBuffers);
	await assertReadableFrames(sharp, normalizedFrames);
	await replaceRawAssets(clipId, normalizedFrames, projectId);

	const resizedBuffers = await resizeFrames(sharp, normalizedFrames, resolvedTargetWidth, resolvedTargetHeight, scaleModeOrBakeConfigs);
	const composites = buildComposites(resizedBuffers, resolvedTargetWidth, resolvedTargetHeight);
	const sheet = await renderSpriteSheet(sharp, composites, resolvedTargetWidth, resolvedTargetHeight, resizedBuffers.length);
	const framesPerRow = resolveFramesPerRow(resizedBuffers.length);
	await overwriteClipFiles(
		clipId,
		{
			role,
			name,
			playback: resolvedPlayback,
			frameRate: resolvedFrameRate,
			frameDurationsMs,
			frameRatesForFrames,
			scaleMode: resolvedScaleMode,
			scaling,
			frameWidth: resolvedTargetWidth,
			frameHeight: resolvedTargetHeight,
			placement,
			retrigger,
			triggerType,
			triggerGroup,
			bitDepth,
			sync,
			syncLength,
			syncBeats,
			beatsPerBar,
			syncOptionalMeta
		},
		sheet,
		resizedBuffers.length,
		framesPerRow,
		projectId
	);
	return { clipId, frames: resizedBuffers.length, framesPerRow };
}

/**
 * Store original frame buffers in clips/.raw-assets/{clipId}/ for future re-processing.
 * @param {string} clipId
 * @param {Buffer[]} frameBuffers
 */
async function storeRawAssets(clipId, frameBuffers, projectId = DEFAULT_PROJECT_ID) {
	const rawDir = rawAssetsDir(clipId, projectId);
	await fs.mkdir(rawDir, { recursive: true });
	for (let i = 0; i < frameBuffers.length; i++) {
		const filename = `frame-${String(i).padStart(4, '0')}.png`;
		await fs.writeFile(path.join(rawDir, filename), frameBuffers[i]);
	}
}

/**
 * Clear and rewrite raw assets for a clip.
 * @param {string} clipId
 * @param {Buffer[]} frameBuffers
 */
async function replaceRawAssets(clipId, frameBuffers, projectId = DEFAULT_PROJECT_ID) {
	const rawDir = rawAssetsDir(clipId, projectId);
	await fs.rm(rawDir, { recursive: true, force: true });
	await storeRawAssets(clipId, frameBuffers, projectId);
}

/**
 * Same gate as meta-only PUT — reject invalid meta before sprite/meta land on disk.
 * @param {object} meta
 */
function assertValidClipMeta(meta) {
	const validationErrors = validateMetaFields(meta);
	if (validationErrors.length > 0) {
		throw new Error(validationErrors[0]);
	}
}

async function writeClipFiles(clipId, clipOptions, sheet, frameCount, framesPerRow, projectId = DEFAULT_PROJECT_ID) {
	const dir = clipDir(clipId, projectId);
	try {
		await fs.access(dir);
		throw new Error(`Clip "${clipId}" already exists`);
	} catch (error) {
		if (error.code !== 'ENOENT') {
			throw error;
		}
	}
	const meta = buildClipMeta(clipOptions, frameCount, framesPerRow);
	assertValidClipMeta(meta);

	await fs.mkdir(dir, { recursive: true });
	await fs.writeFile(path.join(dir, 'sprite.png'), sheet);
	await writeJsonAtomic(path.join(dir, 'meta.json'), meta);
}

/**
 * Overwrite existing clip files (sprite.png + meta.json) during recompilation.
 * Preserves existing meta fields not managed by the recompile config.
 */
async function overwriteClipFiles(clipId, clipOptions, sheet, frameCount, framesPerRow, projectId = DEFAULT_PROJECT_ID) {
	const dir = clipDir(clipId, projectId);
	let existingMeta = {};
	try {
		existingMeta = JSON.parse(await fs.readFile(path.join(dir, 'meta.json'), 'utf8'));
	} catch {
		// No existing meta — start fresh
	}
	const newMeta = buildClipMeta(clipOptions, frameCount, framesPerRow);
	const mergedMeta = syncOptionalMetaFields({ ...existingMeta, ...newMeta }, newMeta, clipOptions);
	assertValidClipMeta(mergedMeta);

	await fs.mkdir(dir, { recursive: true });
	await fs.writeFile(path.join(dir, 'sprite.png'), sheet);
	await writeJsonAtomic(path.join(dir, 'meta.json'), mergedMeta);
}

function resolveScaling(scaling) {
	return SCALING_MODES.includes(scaling) ? scaling : DEFAULT_SCALING;
}

function buildClipMeta(clipOptions, frameCount, framesPerRow) {
	const durationsMs = Array.isArray(clipOptions.frameDurationsMs) && clipOptions.frameDurationsMs.length > 0 ? clipOptions.frameDurationsMs.map(ms => Number(ms)) : null;
	const frameRatesForFrames = durationsMs
		? durationsMsToFrameRates(durationsMs)
		: clipOptions.frameRatesForFrames && typeof clipOptions.frameRatesForFrames === 'object' && !Array.isArray(clipOptions.frameRatesForFrames)
			? clipOptions.frameRatesForFrames
			: { 0: clipOptions.frameRate || DEFAULT_FRAME_RATE };
	const meta = {
		png: 'sprite.png',
		frames: frameCount,
		framesPerRow,
		playback: clipOptions.playback || 'loop',
		retrigger: typeof clipOptions.retrigger === 'boolean' ? clipOptions.retrigger : true,
		frameRatesForFrames,
		scaleMode: resolveScaleMode(clipOptions.scaleMode),
		frameWidth: clipOptions.frameWidth || DEFAULT_TARGET_WIDTH,
		frameHeight: clipOptions.frameHeight || DEFAULT_TARGET_HEIGHT,
		placement: resolvePlacement(clipOptions.placement)
	};
	if (durationsMs) {
		meta.frameDurationsMs = durationsMs;
	}
	if (clipOptions.scaling !== undefined) {
		meta.scaling = resolveScaling(clipOptions.scaling);
	}
	if (clipOptions.name) {
		meta.name = clipOptions.name;
	}
	if (typeof clipOptions.triggerType === 'string' && clipOptions.triggerType) {
		meta.triggerType = clipOptions.triggerType;
	}
	if (clipOptions.triggerGroup !== null && clipOptions.triggerGroup !== undefined && String(clipOptions.triggerGroup).trim()) {
		meta.triggerGroup = String(clipOptions.triggerGroup).trim();
	}
	if (clipOptions.sync === 'beat' || clipOptions.sync === 'free') {
		meta.sync = clipOptions.sync;
	}
	if (typeof clipOptions.syncLength === 'string' && clipOptions.syncLength) {
		meta.syncLength = clipOptions.syncLength;
	}
	if (typeof clipOptions.syncBeats === 'number' && clipOptions.syncBeats > 0) {
		meta.syncBeats = clipOptions.syncBeats;
	}
	if (typeof clipOptions.beatsPerBar === 'number' && Number.isInteger(clipOptions.beatsPerBar) && clipOptions.beatsPerBar > 0) {
		meta.beatsPerBar = clipOptions.beatsPerBar;
	}
	if (clipOptions.role === 'bitmask') {
		meta.role = 'bitmask';
		const depth = Number(clipOptions.bitDepth);
		meta.bitDepth = depth === 1 || depth === 2 || depth === 4 || depth === 8 ? depth : 1;
	}
	return meta;
}

/**
 * After merging overwrite meta, clear optional fields the editor explicitly omitted.
 * @param {object} mergedMeta
 * @param {object} newMeta
 * @param {object} clipOptions
 */
function syncOptionalMetaFields(mergedMeta, newMeta, clipOptions) {
	if (!clipOptions.syncOptionalMeta) {
		// Rates-only overwrite (e.g. recompile) must not leave stale ms as load source of truth
		applyFrameDurationFields(mergedMeta, newMeta, clipOptions);
		return mergedMeta;
	}
	mergedMeta.retrigger = newMeta.retrigger;
	if (newMeta.triggerType) {
		mergedMeta.triggerType = newMeta.triggerType;
	} else {
		delete mergedMeta.triggerType;
	}
	if (newMeta.triggerGroup) {
		mergedMeta.triggerGroup = newMeta.triggerGroup;
	} else {
		delete mergedMeta.triggerGroup;
	}
	delete mergedMeta.frameDurationBeats;
	applyFrameDurationFields(mergedMeta, newMeta, clipOptions);
	applySyncedTimingFields(mergedMeta, newMeta, clipOptions);
	if (newMeta.role === 'bitmask') {
		mergedMeta.role = 'bitmask';
		mergedMeta.bitDepth = newMeta.bitDepth;
	} else {
		delete mergedMeta.role;
		delete mergedMeta.bitDepth;
	}
	if (newMeta.placement) {
		mergedMeta.placement = newMeta.placement;
	}
	return mergedMeta;
}

/**
 * Stamp `frameDurationsMs` when the payload provides ms; clear stale ms when only FPS is written.
 * @param {object} mergedMeta
 * @param {object} newMeta
 * @param {object} clipOptions
 */
function applyFrameDurationFields(mergedMeta, newMeta, clipOptions) {
	if (Array.isArray(newMeta.frameDurationsMs) && newMeta.frameDurationsMs.length > 0) {
		mergedMeta.frameDurationsMs = newMeta.frameDurationsMs;
		mergedMeta.frameRatesForFrames = newMeta.frameRatesForFrames;
		return;
	}
	// Explicit rates-only payload — drop stale ms so load cannot prefer old durations
	if (clipOptions.frameRatesForFrames) {
		delete mergedMeta.frameDurationsMs;
	}
}

/**
 * Stamp or clear sync / syncLength / syncBeats / beatsPerBar from editor payloads.
 * @param {object} mergedMeta
 * @param {object} newMeta
 * @param {object} clipOptions
 */
function applySyncedTimingFields(mergedMeta, newMeta, clipOptions) {
	if (clipOptions.sync === 'beat') {
		mergedMeta.sync = 'beat';
		if (newMeta.syncLength) {
			mergedMeta.syncLength = newMeta.syncLength;
		} else {
			delete mergedMeta.syncLength;
		}
		if (typeof newMeta.syncBeats === 'number' && newMeta.syncBeats > 0) {
			mergedMeta.syncBeats = newMeta.syncBeats;
		} else {
			delete mergedMeta.syncBeats;
		}
		if (typeof newMeta.beatsPerBar === 'number' && newMeta.beatsPerBar > 0) {
			mergedMeta.beatsPerBar = newMeta.beatsPerBar;
		} else {
			delete mergedMeta.beatsPerBar;
		}
		return;
	}
	if (clipOptions.sync === 'free') {
		mergedMeta.sync = 'free';
		delete mergedMeta.syncLength;
		delete mergedMeta.syncBeats;
		delete mergedMeta.beatsPerBar;
		return;
	}
	// Legacy create without sync in payload — leave existing sync fields alone on overwrite
	if (newMeta.sync) {
		mergedMeta.sync = newMeta.sync;
	}
}
