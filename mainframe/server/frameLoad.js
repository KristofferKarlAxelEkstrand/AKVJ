import fs from 'fs/promises';
import path from 'path';
import sharp from 'sharp';
import { clipDir, rawAssetsDir, isValidClipId, resolveSafeSpritePath, DEFAULT_PROJECT_ID } from './paths.js';
import { fpsToMs, DEFAULT_FALLBACK_FPS } from '../shared/frameTiming.js';

/**
 * Load editable frames for a clip: prefer raw assets, else extract sprite cells.
 * @param {string} clipId
 * @param {string} [projectId=default]
 * @returns {Promise<{ frames: Buffer[], durationsMs: number[], meta: object, source: 'raw'|'sprite' }>}
 */
export async function loadClipFrameBuffers(clipId, projectId = DEFAULT_PROJECT_ID) {
	if (!isValidClipId(clipId)) {
		throw new Error('Invalid clipId');
	}

	const meta = await readClipMeta(clipId, projectId);
	const durationsMs = durationsMsFromMeta(meta);

	const rawFrames = await readRawFrameBuffers(clipId, projectId);
	if (rawFrames.length > 0) {
		return {
			frames: rawFrames,
			durationsMs: padDurationsMs(durationsMs, rawFrames.length),
			meta,
			source: 'raw'
		};
	}

	const extracted = await extractFramesFromSprite(clipId, meta, projectId);
	return {
		frames: extracted,
		durationsMs: padDurationsMs(durationsMs, extracted.length),
		meta,
		source: 'sprite'
	};
}

/**
 * @param {string} clipId
 * @param {string} [projectId=default]
 * @returns {Promise<object>}
 */
async function readClipMeta(clipId, projectId = DEFAULT_PROJECT_ID) {
	const metaPath = path.join(clipDir(clipId, projectId), 'meta.json');
	try {
		return JSON.parse(await fs.readFile(metaPath, 'utf8'));
	} catch (error) {
		if (error.code === 'ENOENT') {
			throw new Error(`Clip "${clipId}" not found`, { cause: error });
		}
		throw error;
	}
}

/**
 * @param {string} clipId
 * @param {string} [projectId=default]
 * @returns {Promise<Buffer[]>}
 */
async function readRawFrameBuffers(clipId, projectId = DEFAULT_PROJECT_ID) {
	const rawDir = rawAssetsDir(clipId, projectId);
	let files;
	try {
		files = await fs.readdir(rawDir);
	} catch {
		return [];
	}
	const pngFiles = files.filter(file => file.endsWith('.png')).sort();
	return Promise.all(pngFiles.map(file => fs.readFile(path.join(rawDir, file))));
}

/**
 * Prefer `frameDurationsMs` (ms per frame) when present — same priority as akvj runtime.
 * Falls back to converting `frameRatesForFrames` (FPS) when ms is absent.
 * @param {object} meta
 * @returns {number[]}
 */
function durationsMsFromMeta(meta) {
	const fromMs = durationsFromFrameDurationsMs(meta?.frameDurationsMs);
	if (fromMs.length > 0) {
		return fromMs;
	}
	return durationsFromFrameRates(meta?.frameRatesForFrames);
}

/**
 * @param {unknown} frameDurationsMsInput
 * @returns {number[]}
 */
function durationsFromFrameDurationsMs(frameDurationsMsInput) {
	if (Array.isArray(frameDurationsMsInput) && frameDurationsMsInput.length > 0) {
		return frameDurationsMsInput.map(value => Number(value));
	}
	if (!frameDurationsMsInput || typeof frameDurationsMsInput !== 'object') {
		return [];
	}
	return denseNumericSeries(frameDurationsMsInput, value => Number(value));
}

/**
 * @param {unknown} rates
 * @returns {number[]}
 */
function durationsFromFrameRates(rates) {
	if (!rates || typeof rates !== 'object' || Array.isArray(rates)) {
		return [];
	}
	return denseNumericSeries(rates, value => fpsToMs(value));
}

/**
 * Build a dense 0..maxIndex array from a sparse frame-index map.
 * @param {object} map
 * @param {(value: unknown) => number} mapValue
 * @returns {number[]}
 */
function denseNumericSeries(map, mapValue) {
	const keys = Object.keys(map)
		.map(Number)
		.filter(key => Number.isInteger(key) && key >= 0)
		.sort((a, b) => a - b);
	if (keys.length === 0) {
		return [];
	}
	const maxIndex = keys.at(-1);
	const series = [];
	for (let i = 0; i <= maxIndex; i++) {
		series.push(mapValue(map[String(i)] ?? map[i]));
	}
	return series;
}

/**
 * @param {number[]} durationsMs
 * @param {number} frameCount
 * @returns {number[]}
 */
function padDurationsMs(durationsMs, frameCount) {
	const fallback = fpsToMs(DEFAULT_FALLBACK_FPS);
	const result = [];
	for (let i = 0; i < frameCount; i++) {
		result.push(durationsMs[i] > 0 ? durationsMs[i] : fallback);
	}
	return result;
}

/**
 * Extract individual cells from sprite.png using meta frames / framesPerRow.
 * @param {string} clipId
 * @param {object} meta
 * @param {string} [projectId=default]
 * @returns {Promise<Buffer[]>}
 */
async function extractFramesFromSprite(clipId, meta, projectId = DEFAULT_PROJECT_ID) {
	const pngName = typeof meta.png === 'string' ? path.basename(meta.png) : 'sprite.png';
	const spritePath = resolveSafeSpritePath(clipId, pngName, projectId);
	let spriteBuffer;
	try {
		spriteBuffer = await fs.readFile(spritePath);
	} catch (error) {
		if (error.code === 'ENOENT') {
			throw new Error(`No frames found for clip "${clipId}"`, { cause: error });
		}
		throw error;
	}

	const frameCount = Number(meta.frames ?? meta.numberOfFrames);
	const framesPerRow = Number(meta.framesPerRow);
	if (!Number.isInteger(frameCount) || frameCount <= 0 || !Number.isInteger(framesPerRow) || framesPerRow <= 0) {
		throw new Error(`Clip "${clipId}" meta is missing frames/framesPerRow`);
	}

	const imageMeta = await sharp(spriteBuffer).metadata();
	const sheetWidth = imageMeta.width;
	const sheetHeight = imageMeta.height;
	if (!sheetWidth || !sheetHeight) {
		throw new Error(`Could not read sprite dimensions for "${clipId}"`);
	}

	const cellWidth = Number.isInteger(meta.frameWidth) && meta.frameWidth > 0 ? meta.frameWidth : Math.floor(sheetWidth / framesPerRow);
	const rows = Math.ceil(frameCount / framesPerRow);
	const cellHeight = Number.isInteger(meta.frameHeight) && meta.frameHeight > 0 ? meta.frameHeight : Math.floor(sheetHeight / rows);

	const frames = [];
	for (let i = 0; i < frameCount; i++) {
		const col = i % framesPerRow;
		const row = Math.floor(i / framesPerRow);
		const left = col * cellWidth;
		const top = row * cellHeight;
		frames.push(await sharp(spriteBuffer).extract({ left, top, width: cellWidth, height: cellHeight }).ensureAlpha().png().toBuffer());
	}
	return frames;
}
