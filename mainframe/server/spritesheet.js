import fs from 'fs/promises';
import path from 'path';
import sharp from 'sharp';
import { clipDir, rawAssetsDir, isValidClipId } from './paths.js';

/** Default target dimensions for clip frames (AKVJ canvas resolution). */
const DEFAULT_TARGET_WIDTH = 240;
const DEFAULT_TARGET_HEIGHT = 135;

/**
 * Build a horizontal/grid spritesheet from PNG frame buffers and write clip folder.
 * Stores original frames in clips/.raw-assets/{clipId}/ before processing.
 * @param {Object} options
 * @param {string} options.clipId
 * @param {Buffer[]} options.frameBuffers - Original PNG frame buffers (any dimensions)
 * @param {string} [options.role]
 * @param {number} [options.targetWidth=240] - Resize frames to this width before compositing
 * @param {number} [options.targetHeight=135] - Resize frames to this height before compositing
 * @param {string} [options.name] - Human-readable clip name
 * @param {string} [options.playback='loop'] - Playback mode
 * @param {number} [options.frameRate=12] - Default frame rate (FPS)
 * @returns {Promise<{clipId: string, frames: number, framesPerRow: number}>}
 */
export async function createClipFromFrames({ clipId, frameBuffers, role, targetWidth, targetHeight, name, playback, frameRate }) {
	if (!isValidClipId(clipId)) {
		throw new Error('Invalid clipId');
	}
	if (!Array.isArray(frameBuffers) || frameBuffers.length === 0) {
		throw new Error('At least one frame PNG is required');
	}

	const resolvedTargetWidth = Number.isInteger(targetWidth) && targetWidth > 0 ? targetWidth : DEFAULT_TARGET_WIDTH;
	const resolvedTargetHeight = Number.isInteger(targetHeight) && targetHeight > 0 ? targetHeight : DEFAULT_TARGET_HEIGHT;
	const resolvedFrameRate = Number.isFinite(frameRate) && frameRate > 0 ? frameRate : 12;
	const resolvedPlayback = typeof playback === 'string' && playback ? playback : 'loop';

	await validateFrameDimensions(frameBuffers);
	await storeRawAssets(clipId, frameBuffers);

	const resizedBuffers = await resizeFrames(frameBuffers, resolvedTargetWidth, resolvedTargetHeight);
	const composites = buildComposites(resizedBuffers, resolvedTargetWidth, resolvedTargetHeight);
	const sheet = await renderSpriteSheet(sharp, composites, resolvedTargetWidth, resolvedTargetHeight, resizedBuffers.length);
	const framesPerRow = Math.min(resizedBuffers.length, 16);
	await writeClipFiles(clipId, { role, name, playback: resolvedPlayback, frameRate: resolvedFrameRate }, sheet, resizedBuffers.length, framesPerRow);
	return { clipId, frames: resizedBuffers.length, framesPerRow };
}

/**
 * Re-compile a clip's sprite sheet from stored raw assets with new config.
 * Overwrites the existing sprite.png and meta.json.
 * @param {Object} options
 * @param {string} options.clipId
 * @param {number} [options.targetWidth=240]
 * @param {number} [options.targetHeight=135]
 * @param {string} [options.name] - Updated clip name
 * @param {string} [options.playback='loop']
 * @param {number} [options.frameRate=12]
 * @param {string} [options.role]
 * @returns {Promise<{clipId: string, frames: number, framesPerRow: number}>}
 */
export async function recompileClip({ clipId, targetWidth, targetHeight, name, playback, frameRate, role }) {
	if (!isValidClipId(clipId)) {
		throw new Error('Invalid clipId');
	}

	const rawDir = rawAssetsDir(clipId);
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

	const resolvedTargetWidth = Number.isInteger(targetWidth) && targetWidth > 0 ? targetWidth : DEFAULT_TARGET_WIDTH;
	const resolvedTargetHeight = Number.isInteger(targetHeight) && targetHeight > 0 ? targetHeight : DEFAULT_TARGET_HEIGHT;
	const resolvedFrameRate = Number.isFinite(frameRate) && frameRate > 0 ? frameRate : 12;
	const resolvedPlayback = typeof playback === 'string' && playback ? playback : 'loop';

	const resizedBuffers = await resizeFrames(frameBuffers, resolvedTargetWidth, resolvedTargetHeight);
	const composites = buildComposites(resizedBuffers, resolvedTargetWidth, resolvedTargetHeight);
	const sheet = await renderSpriteSheet(sharp, composites, resolvedTargetWidth, resolvedTargetHeight, resizedBuffers.length);
	const framesPerRow = Math.min(resizedBuffers.length, 16);
	await overwriteClipFiles(clipId, { role, name, playback: resolvedPlayback, frameRate: resolvedFrameRate }, sheet, resizedBuffers.length, framesPerRow);
	return { clipId, frames: resizedBuffers.length, framesPerRow };
}

async function validateFrameDimensions(frameBuffers) {
	const metas = await Promise.all(frameBuffers.map(buf => sharp(buf).metadata()));
	const width = metas[0].width;
	const height = metas[0].height;
	if (!width || !height) {
		throw new Error('Could not read frame dimensions');
	}
	for (const meta of metas) {
		if (meta.width !== width || meta.height !== height) {
			throw new Error('All frames must share the same dimensions');
		}
	}
	return { width, height };
}

/**
 * Store original frame buffers in clips/.raw-assets/{clipId}/ for future re-processing.
 * @param {string} clipId
 * @param {Buffer[]} frameBuffers
 */
async function storeRawAssets(clipId, frameBuffers) {
	const rawDir = rawAssetsDir(clipId);
	await fs.mkdir(rawDir, { recursive: true });
	for (let i = 0; i < frameBuffers.length; i++) {
		const filename = `frame-${String(i).padStart(4, '0')}.png`;
		await fs.writeFile(path.join(rawDir, filename), frameBuffers[i]);
	}
}

/**
 * Resize each frame buffer to target dimensions using sharp.
 * @param {Buffer[]} frameBuffers
 * @param {number} targetWidth
 * @param {number} targetHeight
 * @returns {Promise<Buffer[]>}
 */
async function resizeFrames(frameBuffers, targetWidth, targetHeight) {
	return Promise.all(frameBuffers.map(buf => sharp(buf).resize(targetWidth, targetHeight, { fit: 'fill' }).png().toBuffer()));
}

function buildComposites(frameBuffers, width, height) {
	const framesPerRow = Math.min(frameBuffers.length, 16);
	const composites = [];
	for (let i = 0; i < frameBuffers.length; i++) {
		const col = i % framesPerRow;
		const row = Math.floor(i / framesPerRow);
		composites.push({ input: frameBuffers[i], left: col * width, top: row * height });
	}
	return composites;
}

async function renderSpriteSheet(sharp, composites, width, height, frameCount) {
	const framesPerRow = Math.min(frameCount, 16);
	const rows = Math.ceil(frameCount / framesPerRow);
	return sharp({
		create: {
			width: width * framesPerRow,
			height: height * rows,
			channels: 4,
			background: { r: 0, g: 0, b: 0, alpha: 0 }
		}
	})
		.composite(composites)
		.png()
		.toBuffer();
}

async function writeClipFiles(clipId, clipOptions, sheet, frames, framesPerRow) {
	const dir = clipDir(clipId);
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
async function overwriteClipFiles(clipId, clipOptions, sheet, frames, framesPerRow) {
	const dir = clipDir(clipId);
	await fs.mkdir(dir, { recursive: true });
	await fs.writeFile(path.join(dir, 'sprite.png'), sheet);

	let existingMeta = {};
	try {
		existingMeta = JSON.parse(await fs.readFile(path.join(dir, 'meta.json'), 'utf8'));
	} catch {
		// No existing meta — start fresh
	}
	const newMeta = buildClipMeta(clipOptions, frames, framesPerRow);
	const mergedMeta = { ...existingMeta, ...newMeta };
	await fs.writeFile(path.join(dir, 'meta.json'), `${JSON.stringify(mergedMeta, null, '\t')}\n`);
}

function buildClipMeta(clipOptions, frames, framesPerRow) {
	const meta = {
		png: 'sprite.png',
		frames,
		framesPerRow,
		playback: clipOptions.playback || 'loop',
		retrigger: true,
		frameRatesForFrames: { 0: clipOptions.frameRate || 12 }
	};
	if (clipOptions.name) {
		meta.name = clipOptions.name;
	}
	if (clipOptions.role === 'bitmask') {
		meta.role = 'bitmask';
		meta.bitDepth = 1;
	}
	return meta;
}
