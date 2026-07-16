import fs from 'fs/promises';
import path from 'path';
import { hashFile, writeHashFile, isCacheValid } from './hash.js';
import { copyFileWithFallback } from './fsUtils.js';

/**
 * Valid bit depth values for grayscale conversion.
 * @type {Set<number>}
 */
const VALID_BIT_DEPTHS = new Set([1, 2, 4, 8]);

/**
 * Optimization result for a single file.
 * @typedef {Object} OptimizeResult
 * @property {string} path - Source file path
 * @property {boolean} skipped - True if file was unchanged
 * @property {boolean} optimized - True if file was optimized
 * @property {number|null} [bitDepth] - Bit depth used for conversion, null if standard optimization
 * @property {number} [originalSize] - Original file size in bytes
 * @property {number} [optimizedSize] - Optimized file size in bytes
 * @property {string} [error] - Error message if optimization failed
 */

/**
 * Try to load sharp dynamically.
 * @returns {Promise<import('sharp')|null>}
 */
async function loadSharp() {
	try {
		const sharp = await import('sharp');
		return sharp.default;
	} catch {
		return null;
	}
}

/**
 * Determine the target bit depth for a clip.
 * Priority:
 * 1. Explicit bitDepth in meta.json
 * 2. meta.role === 'bitmask' defaults to 1-bit
 * 3. Regular clips: null (no bit depth conversion)
 *
 * @param {string} clipId - Clip folder id
 * @param {Object|null} meta - Parsed meta.json object
 * @returns {number|null} Target bit depth (1, 2, 4, 8) or null for standard optimization
 */
function getTargetBitDepth(clipId, meta) {
	if (meta?.bitDepth !== undefined) {
		const depth = meta.bitDepth;
		if (VALID_BIT_DEPTHS.has(depth)) {
			return depth;
		}
		console.warn(`Invalid bitDepth ${depth} in ${clipId}/meta.json, ignoring`);
	}

	if (meta?.role === 'bitmask') {
		return 1;
	}

	return null;
}

/**
 * Apply Sharp pipeline based on target bit depth.
 * @param {import('sharp').Sharp} pipeline - Sharp pipeline
 * @param {number|null} bitDepth - Target bit depth or null for standard optimization
 * @returns {import('sharp').Sharp} Modified pipeline
 */
const BIT_DEPTH_PNG_OPTIONS = {
	1: { palette: true, quality: 100, colors: 2, effort: 10 },
	2: { palette: true, quality: 100, colors: 4, effort: 10 },
	4: { palette: true, quality: 100, colors: 16, effort: 10 },
	8: { palette: true, quality: 100, colors: 256, effort: 10 }
};

const STANDARD_PNG_OPTIONS = { palette: true, quality: 80, effort: 10 };

function applyBitDepthPipeline(pipeline, bitDepth) {
	if (bitDepth === 1) {
		return pipeline.grayscale().threshold(128).png(BIT_DEPTH_PNG_OPTIONS[1]);
	}
	const options = BIT_DEPTH_PNG_OPTIONS[bitDepth];
	if (options) {
		return pipeline.grayscale().png(options);
	}
	return pipeline.png(STANDARD_PNG_OPTIONS);
}

/**
 * Optimize a single PNG file if it has changed.
 * @param {string} sourcePath - Path to source PNG
 * @param {string} cachePath - Path to output cached PNG
 * @param {import('sharp')|null} sharp - Sharp module or null to skip optimization
 * @param {number|null} [bitDepth=null] - Target bit depth (1, 2, 4, 8) or null for standard
 * @returns {Promise<OptimizeResult>}
 */
async function optimizeFile(sourcePath, cachePath, sharp, bitDepth = null) {
	if (await isCacheValid(sourcePath, cachePath)) {
		return { path: sourcePath, skipped: true, optimized: false, bitDepth };
	}

	await fs.mkdir(path.dirname(cachePath), { recursive: true });
	const originalSize = (await fs.stat(sourcePath)).size;
	let optimizedSize = originalSize;

	if (sharp) {
		optimizedSize = await runSharpOptimization(sourcePath, cachePath, sharp, bitDepth, originalSize);
	} else {
		await copyFileWithFallback(sourcePath, cachePath);
	}

	const finalHash = await hashFile(cachePath);
	await writeHashFile(cachePath + '.hash', finalHash);

	return { path: sourcePath, skipped: false, optimized: true, bitDepth, originalSize, optimizedSize };
}

async function runSharpOptimization(sourcePath, cachePath, sharp, bitDepth, originalSize) {
	const tempFilePath = cachePath + '.tmp';
	let cleanupNeeded = false;
	try {
		let pipeline = sharp(sourcePath);
		pipeline = applyBitDepthPipeline(pipeline, bitDepth);
		await pipeline.toFile(tempFilePath);
		cleanupNeeded = true;

		const tempStats = await fs.stat(tempFilePath);
		warnIfSizeIncreased(sourcePath, bitDepth, tempStats.size, originalSize);

		return await finalizeOptimizedFile(sourcePath, cachePath, tempFilePath, tempStats.size, bitDepth, originalSize);
	} catch (error) {
		await handleOptimizeError(sourcePath, cachePath, tempFilePath, cleanupNeeded, error);
		throw error;
	}
}

async function finalizeOptimizedFile(sourcePath, cachePath, tempFilePath, optimizedSize, bitDepth, originalSize) {
	if (bitDepth !== null || optimizedSize < originalSize) {
		await fs.rename(tempFilePath, cachePath);
		return optimizedSize;
	}
	await fs.unlink(tempFilePath);
	await copyFileWithFallback(sourcePath, cachePath);
	return originalSize;
}

function warnIfSizeIncreased(sourcePath, bitDepth, optimizedSize, originalSize) {
	if (bitDepth !== null && optimizedSize > originalSize * 1.5) {
		console.warn(`Warning: ${sourcePath} - ${bitDepth}-bit conversion increased size by ${((optimizedSize / originalSize - 1) * 100).toFixed(1)}%`);
	}
}

async function handleOptimizeError(sourcePath, cachePath, tempFilePath, cleanupNeeded, error) {
	try {
		if (cleanupNeeded) {
			await fs.unlink(tempFilePath);
		}
	} catch {
		// Ignore cleanup errors
	}
	try {
		await copyFileWithFallback(sourcePath, cachePath);
	} catch (copyError) {
		throw new Error(`optimize error: ${error instanceof Error ? error.message : String(error)}; copy failed: ${copyError instanceof Error ? copyError.message : String(copyError)}`, {
			cause: copyError
		});
	}
	throw new Error(`optimize error: ${error instanceof Error ? error.message : String(error)}`, {
		cause: error
	});
}

/**
 * Optimize all PNG files from validated clips.
 * Supports configurable bit depth conversion via meta.json bitDepth field.
 * Bitmask clips use meta.role === 'bitmask' (defaults to 1-bit if bitDepth omitted).
 *
 * @param {Array<{clipId: string, dir: string, pngPath: string|null, meta: Object}>} clips - Validated clips
 * @param {string} cacheDir - Cache output directory
 * @returns {Promise<{results: OptimizeResult[], sharp: boolean, bitDepthCounts: Object}>}
 */
export async function optimize(clips, cacheDir) {
	const sharp = await loadSharp();

	if (!sharp) {
		console.warn('sharp not installed - PNGs will be copied without optimization');
		console.warn('Run "npm install sharp" to enable PNG optimization');
	}

	const results = [];
	const bitDepthCounts = { 1: 0, 2: 0, 4: 0, 8: 0, standard: 0 };

	for (const clip of clips) {
		if (!clip.pngPath) {
			continue;
		}
		await processClipOptimization(clip, cacheDir, sharp, results, bitDepthCounts);
	}

	return { results, sharp: !!sharp, bitDepthCounts };
}

async function processClipOptimization(clip, cacheDir, sharp, results, bitDepthCounts) {
	const clipId = clip.clipId;
	const pngName = path.basename(clip.pngPath);
	const cachePath = path.join(cacheDir, clipId, pngName);
	const bitDepth = getTargetBitDepth(clipId, clip.meta);

	if (bitDepth !== null) {
		bitDepthCounts[bitDepth]++;
	} else {
		bitDepthCounts.standard++;
	}

	try {
		const result = await optimizeFile(clip.pngPath, cachePath, sharp, bitDepth);
		result.clipPath = clipId;
		results.push(result);
	} catch (error) {
		results.push({ path: clip.pngPath, clipPath: clipId, skipped: false, optimized: false, bitDepth, error: error.message });
	}

	await copyClipJsonFiles(clip.dir, cacheDir, clipId);
}

async function copyClipJsonFiles(clipDir, cacheDir, clipId) {
	const jsonFiles = await fs.readdir(clipDir);
	for (const file of jsonFiles) {
		if (path.extname(file) === '.json') {
			const srcJson = path.join(clipDir, file);
			const destJson = path.join(cacheDir, clipId, file);
			await fs.mkdir(path.dirname(destJson), { recursive: true });
			await copyFileWithFallback(srcJson, destJson);
		}
	}
}

// Export for testing
export { getTargetBitDepth, applyBitDepthPipeline, VALID_BIT_DEPTHS };
