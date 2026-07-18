/**
 * Shared spritesheet compositing library.
 *
 * Used by both:
 * - `server/spritesheet.js` (API-driven clip creation/recompilation)
 * - `scripts/clips/spritesheet.js` (standalone CLI tool)
 *
 * All functions depend on the `sharp` instance being passed in or imported.
 */

import { resolveScaleMode } from '../../../shared/frameFit.js';
import { DEFAULT_FRAME_WIDTH, DEFAULT_FRAME_HEIGHT, DEFAULT_FRAME_RATE, MAX_FRAMES_PER_ROW } from '../../../shared/clipSchema.js';

/** Transparent background color for sharp compositing. */
export const TRANSPARENT = { r: 0, g: 0, b: 0, alpha: 0 };

/** Default target dimensions for clip frames (AKVJ canvas resolution). */
export const DEFAULT_TARGET_WIDTH = DEFAULT_FRAME_WIDTH;
export const DEFAULT_TARGET_HEIGHT = DEFAULT_FRAME_HEIGHT;

/** Default frames per row in a spritesheet. */
export const DEFAULT_FRAMES_PER_ROW = MAX_FRAMES_PER_ROW;

/** Default frame rate (FPS). */
export { DEFAULT_FRAME_RATE };

/**
 * Decode PNG/JPG/GIF stills to PNG buffers with alpha (GIF uses first page only).
 * @param {import('sharp').Sharp} sharpLib
 * @param {Buffer[]} frameBuffers
 * @returns {Promise<Buffer[]>}
 */
export async function normalizeFrameBuffers(sharpLib, frameBuffers) {
	return Promise.all(frameBuffers.map(buf => sharpLib(buf, { page: 0 }).ensureAlpha().png().toBuffer()));
}

/**
 * Assert that all frame buffers are readable images with valid dimensions.
 * @param {import('sharp').Sharp} sharpLib
 * @param {Buffer[]} frameBuffers
 */
export async function assertReadableFrames(sharpLib, frameBuffers) {
	for (const buf of frameBuffers) {
		const meta = await sharpLib(buf).metadata();
		if (!meta.width || !meta.height) {
			throw new Error('Could not read frame dimensions');
		}
	}
}

/**
 * Fit each frame into target dimensions with alpha preserved.
 * @param {import('sharp').Sharp} sharpLib
 * @param {Buffer[]} frameBuffers
 * @param {number} targetWidth
 * @param {number} targetHeight
 * @param {string} scaleMode
 * @returns {Promise<Buffer[]>}
 */
export async function resizeFrames(sharpLib, frameBuffers, targetWidth, targetHeight, scaleMode) {
	return Promise.all(frameBuffers.map(buf => fitFrameBuffer(sharpLib, buf, targetWidth, targetHeight, scaleMode)));
}

/**
 * @param {import('sharp').Sharp} sharpLib
 * @param {Buffer} buf
 * @param {number} targetWidth
 * @param {number} targetHeight
 * @param {string} scaleMode
 * @returns {Promise<Buffer>}
 */
export async function fitFrameBuffer(sharpLib, buf, targetWidth, targetHeight, scaleMode) {
	const mode = resolveScaleMode(scaleMode);
	const base = sharpLib(buf).ensureAlpha();

	if (mode === 'stretch') {
		return base.resize(targetWidth, targetHeight, { fit: 'fill' }).ensureAlpha().png().toBuffer();
	}
	if (mode === 'fit') {
		return base
			.resize(targetWidth, targetHeight, { fit: 'contain', background: TRANSPARENT })
			.ensureAlpha()
			.png()
			.toBuffer();
	}
	if (mode === 'cover') {
		return base.resize(targetWidth, targetHeight, { fit: 'cover', position: 'centre' }).ensureAlpha().png().toBuffer();
	}
	return fitNone(sharpLib, buf, targetWidth, targetHeight);
}

/**
 * No scale: center with transparent pad and/or centered crop.
 * @param {import('sharp').Sharp} sharpLib
 * @param {Buffer} buf
 * @param {number} targetWidth
 * @param {number} targetHeight
 * @returns {Promise<Buffer>}
 */
export async function fitNone(sharpLib, buf, targetWidth, targetHeight) {
	const meta = await sharpLib(buf).metadata();
	const sourceWidth = meta.width;
	const sourceHeight = meta.height;
	if (!sourceWidth || !sourceHeight) {
		throw new Error('Could not read frame dimensions');
	}

	let pipeline = sharpLib(buf).ensureAlpha();
	if (sourceWidth > targetWidth || sourceHeight > targetHeight) {
		const width = Math.min(sourceWidth, targetWidth);
		const height = Math.min(sourceHeight, targetHeight);
		const left = Math.max(0, Math.floor((sourceWidth - targetWidth) / 2));
		const top = Math.max(0, Math.floor((sourceHeight - targetHeight) / 2));
		pipeline = pipeline.extract({ left, top, width, height });
	}

	const extracted = await pipeline.png().toBuffer();
	const extractedMeta = await sharpLib(extracted).metadata();
	const left = Math.floor((targetWidth - extractedMeta.width) / 2);
	const top = Math.floor((targetHeight - extractedMeta.height) / 2);

	return sharpLib({
		create: {
			width: targetWidth,
			height: targetHeight,
			channels: 4,
			background: TRANSPARENT
		}
	})
		.composite([{ input: extracted, left, top }])
		.png()
		.toBuffer();
}

/**
 * Build composite layer descriptors for a spritesheet from frame buffers.
 * @param {Buffer[]} frameBuffers
 * @param {number} width - Frame width in pixels
 * @param {number} height - Frame height in pixels
 * @param {number} [maxFramesPerRow=16] - Maximum frames per row
 * @returns {Array<{input: Buffer, left: number, top: number}>}
 */
export function buildComposites(frameBuffers, width, height, maxFramesPerRow = DEFAULT_FRAMES_PER_ROW) {
	const framesPerRow = Math.min(frameBuffers.length, maxFramesPerRow);
	const composites = [];
	for (let i = 0; i < frameBuffers.length; i++) {
		const col = i % framesPerRow;
		const row = Math.floor(i / framesPerRow);
		composites.push({ input: frameBuffers[i], left: col * width, top: row * height });
	}
	return composites;
}

/**
 * Render a spritesheet PNG buffer from composite descriptors.
 * @param {import('sharp').Sharp} sharpLib
 * @param {Array<{input: Buffer, left: number, top: number}>} composites
 * @param {number} width - Frame width in pixels
 * @param {number} height - Frame height in pixels
 * @param {number} frameCount - Total number of frames
 * @param {number} [maxFramesPerRow=16] - Maximum frames per row
 * @returns {Promise<Buffer>}
 */
export async function renderSpriteSheet(sharpLib, composites, width, height, frameCount, maxFramesPerRow = DEFAULT_FRAMES_PER_ROW) {
	const framesPerRow = Math.min(frameCount, maxFramesPerRow);
	const rows = Math.ceil(frameCount / framesPerRow);
	return sharpLib({
		create: {
			width: width * framesPerRow,
			height: height * rows,
			channels: 4,
			background: TRANSPARENT
		}
	})
		.composite(composites)
		.png()
		.toBuffer();
}

/**
 * Resolve target dimensions with defaults.
 * @param {number} [targetWidth]
 * @param {number} [targetHeight]
 * @returns {{targetWidth: number, targetHeight: number}}
 */
export function resolveTargetDimensions(targetWidth, targetHeight) {
	return {
		targetWidth: Number.isInteger(targetWidth) && targetWidth > 0 ? targetWidth : DEFAULT_TARGET_WIDTH,
		targetHeight: Number.isInteger(targetHeight) && targetHeight > 0 ? targetHeight : DEFAULT_TARGET_HEIGHT
	};
}

/**
 * Resolve frame rate with default.
 * @param {number} [frameRate]
 * @returns {number}
 */
export function resolveFrameRate(frameRate) {
	return Number.isFinite(frameRate) && frameRate > 0 ? frameRate : DEFAULT_FRAME_RATE;
}

/**
 * Resolve playback mode with default.
 * @param {string} [playback]
 * @returns {string}
 */
export function resolvePlayback(playback) {
	return typeof playback === 'string' && playback ? playback : 'loop';
}

/**
 * Resolve frames per row with default and cap.
 * @param {number} [frameCount] - Total frames (used to cap)
 * @param {number} [maxFramesPerRow=16]
 * @returns {number}
 */
export function resolveFramesPerRow(frameCount, maxFramesPerRow = DEFAULT_FRAMES_PER_ROW) {
	if (!frameCount || frameCount < 1) {
		return 1;
	}
	return Math.min(frameCount, maxFramesPerRow);
}
