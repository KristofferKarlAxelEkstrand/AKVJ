import fs from 'fs/promises';
import path from 'path';
import sharp from 'sharp';
import { clipDir, rawAssetsDir, isValidClipId, DEFAULT_PROJECT_ID } from './paths.js';
import { DEFAULT_TARGET_WIDTH, DEFAULT_TARGET_HEIGHT, DEFAULT_FRAME_RATE, normalizeFrameBuffers, assertReadableFrames, resizeFrames, buildComposites, renderSpriteSheet, resolveTargetDimensions, resolveFrameRate, resolvePlayback, resolveFramesPerRow } from '../scripts/clips/lib/spritesheet-core.js';
import { resolveScaleMode } from '../shared/frameFit.js';

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
 * @param {string} [options.scaleMode='fit'] - fit | cover | stretch | none
 * @param {string} [options.name] - Human-readable clip name
 * @param {string} [options.playback='loop'] - Playback mode
 * @param {number} [options.frameRate=12] - Default frame rate (FPS)
 * @param {Record<string, number>} [options.frameRatesForFrames] - Per-frame FPS (from ms durations)
 * @returns {Promise<{clipId: string, frames: number, framesPerRow: number}>}
 */
export async function createClipFromFrames({ clipId, frameBuffers, role, targetWidth, targetHeight, scaleMode, name, playback, frameRate, frameRatesForFrames, retrigger, triggerType, triggerGroup, bitDepth, frameDurationBeats, sync, syncLength, syncBeats, beatsPerBar, syncOptionalMeta, projectId = DEFAULT_PROJECT_ID }) {
	if (!isValidClipId(clipId)) {
		throw new Error('Invalid clipId');
	}
	if (!Array.isArray(frameBuffers) || frameBuffers.length === 0) {
		throw new Error('At least one frame image is required');
	}

	const { targetWidth: resolvedTargetWidth, targetHeight: resolvedTargetHeight } = resolveTargetDimensions(targetWidth, targetHeight);
	const resolvedScaleMode = resolveScaleMode(scaleMode);
	const resolvedFrameRate = resolveFrameRate(frameRate);
	const resolvedPlayback = resolvePlayback(playback);

	const normalizedFrames = await normalizeFrameBuffers(sharp, frameBuffers);
	await assertReadableFrames(sharp, normalizedFrames);
	await storeRawAssets(clipId, normalizedFrames, projectId);

	const resizedBuffers = await resizeFrames(sharp, normalizedFrames, resolvedTargetWidth, resolvedTargetHeight, resolvedScaleMode);
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
			frameRatesForFrames,
			scaleMode: resolvedScaleMode,
			frameWidth: resolvedTargetWidth,
			frameHeight: resolvedTargetHeight,
			retrigger,
			triggerType,
			triggerGroup,
			bitDepth,
			frameDurationBeats,
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
export async function recompileClip({ clipId, targetWidth, targetHeight, scaleMode, name, playback, frameRate, frameRatesForFrames, role, projectId = DEFAULT_PROJECT_ID }) {
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

	const { targetWidth: resolvedTargetWidth, targetHeight: resolvedTargetHeight } = resolveTargetDimensions(targetWidth, targetHeight);
	const resolvedScaleMode = resolveScaleMode(scaleMode ?? 'fit');
	const resolvedFrameRate = resolveFrameRate(frameRate);
	const resolvedPlayback = resolvePlayback(playback);

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
			frameRatesForFrames,
			scaleMode: resolvedScaleMode,
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
 * @param {Record<string, number>} [options.frameRatesForFrames]
 * @param {string} [options.role]
 * @returns {Promise<{clipId: string, frames: number, framesPerRow: number}>}
 */
export async function updateClipFromFrames({ clipId, frameBuffers, targetWidth, targetHeight, scaleMode, name, playback, frameRate, frameRatesForFrames, role, retrigger, triggerType, triggerGroup, bitDepth, frameDurationBeats, sync, syncLength, syncBeats, beatsPerBar, syncOptionalMeta, projectId = DEFAULT_PROJECT_ID }) {
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

	const { targetWidth: resolvedTargetWidth, targetHeight: resolvedTargetHeight } = resolveTargetDimensions(targetWidth, targetHeight);
	const resolvedScaleMode = resolveScaleMode(scaleMode);
	const resolvedFrameRate = resolveFrameRate(frameRate);
	const resolvedPlayback = resolvePlayback(playback);

	const normalizedFrames = await normalizeFrameBuffers(sharp, frameBuffers);
	await assertReadableFrames(sharp, normalizedFrames);
	await replaceRawAssets(clipId, normalizedFrames, projectId);

	const resizedBuffers = await resizeFrames(sharp, normalizedFrames, resolvedTargetWidth, resolvedTargetHeight, resolvedScaleMode);
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
			frameRatesForFrames,
			scaleMode: resolvedScaleMode,
			frameWidth: resolvedTargetWidth,
			frameHeight: resolvedTargetHeight,
			retrigger,
			triggerType,
			triggerGroup,
			bitDepth,
			frameDurationBeats,
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

async function writeClipFiles(clipId, clipOptions, sheet, frames, framesPerRow, projectId = DEFAULT_PROJECT_ID) {
	const dir = clipDir(clipId, projectId);
	try {
		await fs.access(dir);
		throw new Error(`Clip "${clipId}" already exists`);
	} catch (error) {
		if (error.code !== 'ENOENT') {
			throw error;
		}
	}
	await fs.mkdir(dir, { recursive: true });
	await fs.writeFile(path.join(dir, 'sprite.png'), sheet);

	const meta = buildClipMeta(clipOptions, frames, framesPerRow);
	await fs.writeFile(path.join(dir, 'meta.json'), `${JSON.stringify(meta, null, '\t')}\n`);
}

/**
 * Overwrite existing clip files (sprite.png + meta.json) during recompilation.
 * Preserves existing meta fields not managed by the recompile config.
 */
async function overwriteClipFiles(clipId, clipOptions, sheet, frames, framesPerRow, projectId = DEFAULT_PROJECT_ID) {
	const dir = clipDir(clipId, projectId);
	await fs.mkdir(dir, { recursive: true });
	await fs.writeFile(path.join(dir, 'sprite.png'), sheet);

	let existingMeta = {};
	try {
		existingMeta = JSON.parse(await fs.readFile(path.join(dir, 'meta.json'), 'utf8'));
	} catch {
		// No existing meta — start fresh
	}
	const newMeta = buildClipMeta(clipOptions, frames, framesPerRow);
	const mergedMeta = syncOptionalMetaFields({ ...existingMeta, ...newMeta }, newMeta, clipOptions);
	await fs.writeFile(path.join(dir, 'meta.json'), `${JSON.stringify(mergedMeta, null, '\t')}\n`);
}

function buildClipMeta(clipOptions, frames, framesPerRow) {
	const frameRatesForFrames = clipOptions.frameRatesForFrames && typeof clipOptions.frameRatesForFrames === 'object' && !Array.isArray(clipOptions.frameRatesForFrames) ? clipOptions.frameRatesForFrames : { 0: clipOptions.frameRate || DEFAULT_FRAME_RATE };
	const meta = {
		png: 'sprite.png',
		frames,
		framesPerRow,
		playback: clipOptions.playback || 'loop',
		retrigger: typeof clipOptions.retrigger === 'boolean' ? clipOptions.retrigger : true,
		frameRatesForFrames,
		scaleMode: resolveScaleMode(clipOptions.scaleMode),
		frameWidth: clipOptions.frameWidth || DEFAULT_TARGET_WIDTH,
		frameHeight: clipOptions.frameHeight || DEFAULT_TARGET_HEIGHT
	};
	if (clipOptions.name) {
		meta.name = clipOptions.name;
	}
	if (typeof clipOptions.triggerType === 'string' && clipOptions.triggerType) {
		meta.triggerType = clipOptions.triggerType;
	}
	if (clipOptions.triggerGroup !== null && clipOptions.triggerGroup !== undefined && String(clipOptions.triggerGroup).trim()) {
		meta.triggerGroup = String(clipOptions.triggerGroup).trim();
	}
	if (clipOptions.frameDurationBeats !== null && clipOptions.frameDurationBeats !== undefined) {
		meta.frameDurationBeats = clipOptions.frameDurationBeats;
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
	if ('frameDurationBeats' in newMeta) {
		mergedMeta.frameDurationBeats = newMeta.frameDurationBeats;
	} else {
		delete mergedMeta.frameDurationBeats;
	}
	applySyncedTimingFields(mergedMeta, newMeta, clipOptions);
	if (newMeta.role === 'bitmask') {
		mergedMeta.role = 'bitmask';
		mergedMeta.bitDepth = newMeta.bitDepth;
	} else {
		delete mergedMeta.role;
		delete mergedMeta.bitDepth;
	}
	return mergedMeta;
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
