import fs from 'fs/promises';
import path from 'path';
import { hashFile, writeHashFile, isCacheValid } from './hash.js';

/**
 * Channel number for bitmask/mixer animations.
 * Animations in this channel default to 1-bit (black & white) if no bitDepth specified.
 */
const BITMASK_CHANNEL = 4;

/**
 * Valid bit depth values for grayscale conversion.
 * @type {Set<number>}
 */
const VALID_BIT_DEPTHS = new Set([1, 2, 4, 8]);

/**
 * Optimization result for a single file.
 * @typedef {Object} OptimizeResult
 * @property {string} path - Animation path
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
 * Determine the target bit depth for an animation.
 * Priority:
 * 1. Explicit bitDepth in meta.json takes priority
 * 2. Channel 4 (bitmask) defaults to 1-bit
 * 3. Regular animations: null (no bit depth conversion)
 *
 * @param {string} animationPath - Path like "4/0/0"
 * @param {Object|null} meta - Parsed meta.json object
 * @returns {number|null} Target bit depth (1, 2, 4, 8) or null for standard optimization
 */
function getTargetBitDepth(animationPath, meta) {
	// Explicit bitDepth in meta.json takes priority
	if (meta?.bitDepth !== undefined) {
		const depth = meta.bitDepth;
		if (VALID_BIT_DEPTHS.has(depth)) {
			return depth;
		}
		console.warn(`Invalid bitDepth ${depth} in ${animationPath}/meta.json, ignoring`);
	}

	// Channel 4 defaults to 1-bit for bitmasks
	const pathParts = animationPath.split('/');
	const channel = pathParts.length > 0 ? parseInt(pathParts[0], 10) : NaN;
	if (!isNaN(channel) && channel === BITMASK_CHANNEL) {
		return 1;
	}

	// Regular animations: no bit depth conversion
	return null;
}

/**
 * Apply Sharp pipeline based on target bit depth.
 * @param {import('sharp').Sharp} pipeline - Sharp pipeline
 * @param {number|null} bitDepth - Target bit depth or null for standard optimization
 * @returns {import('sharp').Sharp} Modified pipeline
 */
function applyBitDepthPipeline(pipeline, bitDepth) {
	switch (bitDepth) {
		case 1:
			// 1-bit: threshold to pure B&W (2 colors)
			return pipeline.grayscale().threshold(128).png({
				palette: true,
				quality: 100,
				colors: 2,
				effort: 10
			});

		case 2:
			// 2-bit: 4 grayscale levels (uses indexed palette)
			return pipeline.grayscale().png({
				palette: true,
				quality: 100,
				colors: 4,
				effort: 10
			});

		case 4:
			// 4-bit: 16 grayscale levels
			return pipeline.grayscale().png({
				palette: true,
				quality: 100,
				colors: 16,
				effort: 10
			});

		case 8:
			// 8-bit: true grayscale (256 levels)
			return pipeline.grayscale().png({
				palette: true,
				quality: 100,
				colors: 256,
				effort: 10
			});

		default:
			// Standard color optimization
			return pipeline.png({ palette: true, quality: 80, effort: 10 });
	}
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
	// Check if cache is valid
	if (await isCacheValid(sourcePath, cachePath)) {
		return { path: sourcePath, skipped: true, optimized: false, bitDepth };
	}

	// Ensure cache directory exists
	await fs.mkdir(path.dirname(cachePath), { recursive: true });

	const originalStats = await fs.stat(sourcePath);
	const originalSize = originalStats.size;
	let optimizedSize = originalSize;

	if (sharp) {
		// Try palette optimization first and ensure temp cleanup
		const tempPath = cachePath + '.tmp';
		let tempExists = false;
		let cleanupNeeded = false;
		try {
			let pipeline = sharp(sourcePath);
			pipeline = applyBitDepthPipeline(pipeline, bitDepth);

			await pipeline.toFile(tempPath);
			tempExists = true;
			cleanupNeeded = true;

			const tempStats = await fs.stat(tempPath);

			// When converting to bit depth we prioritize correctness; warn if size increased dramatically
			if (bitDepth !== null && tempStats.size > originalSize * 1.5) {
				console.warn(`Warning: ${sourcePath} - bit depth conversion increased size by ${((tempStats.size / originalSize - 1) * 100).toFixed(1)}%`);
			}

			// For bit depth conversions, always use the converted version (correctness over size)
			// For regular images, only keep optimized version if it's smaller
			if (bitDepth !== null || tempStats.size < originalSize) {
				await fs.rename(tempPath, cachePath);
				optimizedSize = tempStats.size;
				cleanupNeeded = false;
			} else {
				// Original is smaller, just copy it
				await fs.unlink(tempPath);
				cleanupNeeded = false;
				await fs.copyFile(sourcePath, cachePath);
			}
		} catch (err) {
			// If optimization fails, ensure temp cleanup and copy original
			try {
				if (tempExists && cleanupNeeded) {
					await fs.unlink(tempPath);
				}
			} catch {
				// Ignore cleanup errors
			}
			try {
				await fs.copyFile(sourcePath, cachePath);
			} catch (copyErr) {
				// If copying fails, rethrow optimization error with additional context
				throw new Error(`optimize error: ${err instanceof Error ? err.message : String(err)}; copy failed: ${copyErr instanceof Error ? copyErr.message : String(copyErr)}`);
			}
			// Re-throw original error so caller records failure
			throw new Error(`optimize error: ${err instanceof Error ? err.message : String(err)}`);
		}
	} else {
		// No sharp available, just copy
		await fs.copyFile(sourcePath, cachePath);
	}

	// Write hash sidecar based on the cached file we just wrote (avoids a race where source may change)
	const finalHash = await hashFile(cachePath);
	await writeHashFile(cachePath + '.hash', finalHash);

	return {
		path: sourcePath,
		skipped: false,
		optimized: true,
		bitDepth,
		originalSize,
		optimizedSize
	};
}

/**
 * Optimize all PNG files from validated animations.
 * Supports configurable bit depth conversion via meta.json bitDepth field.
 * Channel 4 (bitmask) defaults to 1-bit if no bitDepth specified.
 *
 * @param {Array<{path: string, dir: string, pngPath: string|null, meta: Object}>} animations - Validated animations
 * @param {string} cacheDir - Cache output directory
 * @returns {Promise<{results: OptimizeResult[], sharp: boolean, bitDepthCounts: Object}>}
 */
export async function optimize(animations, cacheDir) {
	const sharp = await loadSharp();

	if (!sharp) {
		console.warn('sharp not installed - PNGs will be copied without optimization');
		console.warn('Run "npm install sharp" to enable PNG optimization');
	}

	const results = [];
	const bitDepthCounts = { 1: 0, 2: 0, 4: 0, 8: 0, standard: 0 };

	for (const animation of animations) {
		if (!animation.pngPath) {
			// Animation uses 'src' field referencing another animation
			continue;
		}

		const relativePath = animation.path;
		const pngName = path.basename(animation.pngPath);
		const cachePath = path.join(cacheDir, relativePath, pngName);
		const bitDepth = getTargetBitDepth(relativePath, animation.meta);

		// Track counts
		if (bitDepth !== null) {
			bitDepthCounts[bitDepth]++;
		} else {
			bitDepthCounts.standard++;
		}

		try {
			const result = await optimizeFile(animation.pngPath, cachePath, sharp, bitDepth);
			result.animationPath = relativePath;
			results.push(result);
		} catch (error) {
			results.push({
				path: animation.pngPath,
				animationPath: relativePath,
				skipped: false,
				optimized: false,
				bitDepth,
				error: error.message
			});
		}

		// Also copy meta.json to cache
		const jsonFiles = await fs.readdir(animation.dir);
		for (const file of jsonFiles) {
			if (path.extname(file) === '.json') {
				const srcJson = path.join(animation.dir, file);
				const destJson = path.join(cacheDir, relativePath, file);
				await fs.mkdir(path.dirname(destJson), { recursive: true });
				await fs.copyFile(srcJson, destJson);
			}
		}
	}

	return { results, sharp: !!sharp, bitDepthCounts };
}

// Export for testing
export { getTargetBitDepth, applyBitDepthPipeline, VALID_BIT_DEPTHS, BITMASK_CHANNEL };
