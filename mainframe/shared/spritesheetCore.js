/**
 * Shared spritesheet compositing library.
 *
 * Used by both:
 * - `server/spritesheet.js` (API-driven clip creation/recompilation)
 * - `scripts/clips/spritesheet.js` (standalone CLI tool)
 *
 * All functions depend on the `sharp` instance being passed in or imported.
 */

import { resolveScaleMode } from './frameFit.js';
import { DEFAULT_FRAME_WIDTH, DEFAULT_FRAME_HEIGHT, DEFAULT_FRAME_RATE, MAX_FRAMES_PER_ROW, resolvePlacement } from './clipSchema.js';
import { resolveFrameBakeConfig } from './frameBake.js';

export { FRAME_BAKE_SCALE_MODES, resolveFrameBakeConfig } from './frameBake.js';

/** Transparent background color for sharp compositing. */
export const TRANSPARENT = { r: 0, g: 0, b: 0, alpha: 0 };

/**
 * Sharp resize kernel for upload / first-bake downscale (`resizeFrames` / `fitFrameBuffer`).
 * Soft resampling (not nearest). Sharp’s default is already `lanczos3`; we set it explicitly
 * so ingest never silently becomes hard-nearest. Mainframe preview stays nearest in the browser.
 */
export const INGEST_RESIZE_KERNEL = 'lanczos3';

/**
 * Merge ingest kernel into sharp resize options.
 * @param {import('sharp').ResizeOptions} [options={}]
 * @returns {import('sharp').ResizeOptions}
 */
export function withIngestResizeKernel(options = {}) {
	return { ...options, kernel: INGEST_RESIZE_KERNEL };
}

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
		let imageMeta;
		try {
			imageMeta = await sharpLib(buf).metadata();
		} catch {
			throw new Error('Could not read frame dimensions');
		}
		if (!imageMeta.width || !imageMeta.height) {
			throw new Error('Could not read frame dimensions');
		}
	}
}

/**
 * Fit each frame into target dimensions with alpha preserved.
 * Uses {@link INGEST_RESIZE_KERNEL} for soft downscale (not nearest).
 * `scaleModeOrConfigs` may be one shared scale mode string, or a per-frame bake config array.
 * @param {import('sharp').Sharp} sharpLib
 * @param {Buffer[]} frameBuffers
 * @param {number} targetWidth
 * @param {number} targetHeight
 * @param {string|FrameBakeConfig[]} [scaleModeOrConfigs='fit']
 * @returns {Promise<Buffer[]>}
 */
export async function resizeFrames(sharpLib, frameBuffers, targetWidth, targetHeight, scaleModeOrConfigs = 'fit') {
	return Promise.all(
		frameBuffers.map((buf, index) => {
			const config = Array.isArray(scaleModeOrConfigs) ? resolveFrameBakeConfig(scaleModeOrConfigs[index], targetWidth, targetHeight) : resolveFrameBakeConfig({ scaleMode: scaleModeOrConfigs }, targetWidth, targetHeight);
			return fitFrameBuffer(sharpLib, buf, targetWidth, targetHeight, config);
		})
	);
}

/**
 * Fit one source buffer into a frame cell.
 * Resize paths use {@link INGEST_RESIZE_KERNEL} (lanczos3). `none` / `pattern` crop without resampling.
 * @param {import('sharp').Sharp} sharpLib
 * @param {Buffer} buf
 * @param {number} targetWidth
 * @param {number} targetHeight
 * @param {string|FrameBakeConfig} [scaleModeOrConfig='fit']
 * @returns {Promise<Buffer>}
 */
export async function fitFrameBuffer(sharpLib, buf, targetWidth, targetHeight, scaleModeOrConfig = 'fit') {
	const config = typeof scaleModeOrConfig === 'string' ? resolveFrameBakeConfig({ scaleMode: scaleModeOrConfig }, targetWidth, targetHeight) : resolveFrameBakeConfig(scaleModeOrConfig, targetWidth, targetHeight);

	if (config.scaleMode === 'custom') {
		const sized = await sharpLib(buf).ensureAlpha().resize(config.width, config.height, withIngestResizeKernel({ fit: 'fill' })).ensureAlpha().png().toBuffer();
		return compositeContentOntoCell(sharpLib, sized, targetWidth, targetHeight, config.placement);
	}

	const mode = resolveScaleMode(config.scaleMode === 'custom' ? 'fit' : config.scaleMode);
	const base = sharpLib(buf).ensureAlpha();

	if (mode === 'stretch') {
		return base.resize(targetWidth, targetHeight, withIngestResizeKernel({ fit: 'fill' })).ensureAlpha().png().toBuffer();
	}
	if (mode === 'fit') {
		const fitted = await base.resize(targetWidth, targetHeight, withIngestResizeKernel({ fit: 'contain', background: TRANSPARENT })).ensureAlpha().png().toBuffer();
		return applyPlacementToCellSizedBuffer(sharpLib, fitted, targetWidth, targetHeight, config.placement);
	}
	if (mode === 'cover') {
		const covered = await base.resize(targetWidth, targetHeight, withIngestResizeKernel({ fit: 'cover', position: 'centre' })).ensureAlpha().png().toBuffer();
		return applyPlacementToCellSizedBuffer(sharpLib, covered, targetWidth, targetHeight, config.placement);
	}
	// none + pattern — cell stored at native size; pattern tiles at runtime
	return fitNone(sharpLib, buf, targetWidth, targetHeight, config.placement);
}

/**
 * Shift a cell-sized buffer by placement (center-origin). Stretch-like fills ignore this path.
 * @param {import('sharp').Sharp} sharpLib
 * @param {Buffer} cellBuffer
 * @param {number} targetWidth
 * @param {number} targetHeight
 * @param {{ x: number, y: number }} placement
 * @returns {Promise<Buffer>}
 */
async function applyPlacementToCellSizedBuffer(sharpLib, cellBuffer, targetWidth, targetHeight, placement) {
	if (placement.x === 0 && placement.y === 0) {
		return cellBuffer;
	}
	return compositeContentOntoCell(sharpLib, cellBuffer, targetWidth, targetHeight, placement, true);
}

/**
 * Place content onto a transparent cell with center-origin placement.
 * @param {import('sharp').Sharp} sharpLib
 * @param {Buffer} contentBuf
 * @param {number} targetWidth
 * @param {number} targetHeight
 * @param {{ x: number, y: number }} placement
 * @param {boolean} [contentIsFullCell=false] - when true, content is already cell-sized (shift whole layer)
 * @returns {Promise<Buffer>}
 */
export async function compositeContentOntoCell(sharpLib, contentBuf, targetWidth, targetHeight, placement, contentIsFullCell = false) {
	let contentMeta;
	try {
		contentMeta = await sharpLib(contentBuf).metadata();
	} catch {
		throw new Error('Could not read content dimensions');
	}
	const contentWidth = contentMeta.width;
	const contentHeight = contentMeta.height;
	if (!contentWidth || !contentHeight) {
		throw new Error('Could not read content dimensions');
	}

	const place = resolvePlacement(placement);
	let left = contentIsFullCell ? place.x : Math.floor((targetWidth - contentWidth) / 2) + place.x;
	let top = contentIsFullCell ? place.y : Math.floor((targetHeight - contentHeight) / 2) + place.y;

	let input = contentBuf;
	let extractLeft = 0;
	let extractTop = 0;
	let extractWidth = contentWidth;
	let extractHeight = contentHeight;

	if (left < 0) {
		extractLeft = -left;
		extractWidth -= extractLeft;
		left = 0;
	}
	if (top < 0) {
		extractTop = -top;
		extractHeight -= extractTop;
		top = 0;
	}
	if (left + extractWidth > targetWidth) {
		extractWidth = targetWidth - left;
	}
	if (top + extractHeight > targetHeight) {
		extractHeight = targetHeight - top;
	}

	if (extractWidth <= 0 || extractHeight <= 0) {
		return sharpLib({
			create: { width: targetWidth, height: targetHeight, channels: 4, background: TRANSPARENT }
		})
			.png()
			.toBuffer();
	}

	if (extractLeft !== 0 || extractTop !== 0 || extractWidth !== contentWidth || extractHeight !== contentHeight) {
		input = await sharpLib(contentBuf).extract({ left: extractLeft, top: extractTop, width: extractWidth, height: extractHeight }).png().toBuffer();
	}

	return sharpLib({
		create: {
			width: targetWidth,
			height: targetHeight,
			channels: 4,
			background: TRANSPARENT
		}
	})
		.composite([{ input, left, top }])
		.png()
		.toBuffer();
}

/**
 * No scale: center with transparent pad and/or centered crop, then apply placement.
 * @param {import('sharp').Sharp} sharpLib
 * @param {Buffer} buf
 * @param {number} targetWidth
 * @param {number} targetHeight
 * @param {{ x?: number, y?: number }} [placement]
 * @returns {Promise<Buffer>}
 */
export async function fitNone(sharpLib, buf, targetWidth, targetHeight, placement = { x: 0, y: 0 }) {
	const imageMeta = await sharpLib(buf).metadata();
	const sourceWidth = imageMeta.width;
	const sourceHeight = imageMeta.height;
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
	return compositeContentOntoCell(sharpLib, extracted, targetWidth, targetHeight, placement);
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
 * @param {number} frameCount - Total frames
 * @param {number} [maxFramesPerRow=16] - Maximum frames per row
 * @returns {Promise<Buffer>}
 */
export function renderSpriteSheet(sharpLib, composites, width, height, frameCount, maxFramesPerRow = DEFAULT_FRAMES_PER_ROW) {
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
 * Resolve the option preamble shared by clip create / update / recompile.
 * @param {Object} [options]
 * @param {number} [options.targetWidth]
 * @param {number} [options.targetHeight]
 * @param {string} [options.scaleMode]
 * @param {number} [options.frameRate]
 * @param {string} [options.playback]
 * @returns {{targetWidth: number, targetHeight: number, scaleMode: string, frameRate: number, playback: string}}
 */
export function resolveCompileOptions({ targetWidth, targetHeight, scaleMode, frameRate, playback } = {}) {
	return {
		...resolveTargetDimensions(targetWidth, targetHeight),
		scaleMode: resolveScaleMode(scaleMode),
		frameRate: resolveFrameRate(frameRate),
		playback: resolvePlayback(playback)
	};
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
