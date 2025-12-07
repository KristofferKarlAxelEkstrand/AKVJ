import fs from 'fs/promises';
import path from 'path';
import { hashFile, writeHashFile, isCacheValid } from './hash.js';

/**
 * Channel number for bitmask/mixer animations.
 * Animations in this channel are converted to 1-bit (black & white).
 */
const BITMASK_CHANNEL = 4;

/**
 * Optimization result for a single file.
 * @typedef {Object} OptimizeResult
 * @property {string} path - Animation path
 * @property {boolean} skipped - True if file was unchanged
 * @property {boolean} optimized - True if file was optimized
 * @property {boolean} [isBitmask] - True if processed as 1-bit bitmask
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
 * Check if an animation path is a bitmask (channel 4).
 * @param {string} animationPath - Path like "4/0/0"
 * @returns {boolean}
 */
function isBitmaskAnimation(animationPath) {
	const channel = parseInt(animationPath.split('/')[0], 10);
	return channel === BITMASK_CHANNEL;
}

/**
 * Optimize a single PNG file if it has changed.
 * @param {string} sourcePath - Path to source PNG
 * @param {string} cachePath - Path to output cached PNG
 * @param {import('sharp')|null} sharp - Sharp module or null to skip optimization
 * @param {boolean} [isBitmask=false] - If true, convert to 1-bit black & white
 * @returns {Promise<OptimizeResult>}
 */
async function optimizeFile(sourcePath, cachePath, sharp, isBitmask = false) {
	// Check if cache is valid
	if (await isCacheValid(sourcePath, cachePath)) {
		return { path: sourcePath, skipped: true, optimized: false, isBitmask };
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

			if (isBitmask) {
				// Convert to 1-bit: grayscale, threshold at 128, then 1-bit palette
				pipeline = pipeline.grayscale().threshold(128).png({
					palette: true,
					quality: 100,
					colors: 2, // Black and white only
					effort: 10
				});
			} else {
				// Standard palette optimization
				pipeline = pipeline.png({ palette: true, quality: 80, effort: 10 });
			}

			await pipeline.toFile(tempPath);
			tempExists = true;
			cleanupNeeded = true;

			const tempStats = await fs.stat(tempPath);

			// For bitmasks, always use the converted version (correctness over size)
			// For regular images, only keep optimized version if it's smaller
			if (isBitmask || tempStats.size < originalSize) {
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
		originalSize,
		optimizedSize
	};
}

/**
 * Optimize all PNG files from validated animations.
 * Bitmask animations (channel 4) are converted to 1-bit black & white.
 * @param {Array<{path: string, dir: string, pngPath: string|null, meta: Object}>} animations - Validated animations
 * @param {string} cacheDir - Cache output directory
 * @returns {Promise<{results: OptimizeResult[], sharp: boolean}>}
 */
export async function optimize(animations, cacheDir) {
	const sharp = await loadSharp();

	if (!sharp) {
		console.warn('sharp not installed - PNGs will be copied without optimization');
		console.warn('Run "npm install sharp" to enable PNG optimization');
	}

	const results = [];
	let bitmaskCount = 0;

	for (const animation of animations) {
		if (!animation.pngPath) {
			// Animation uses 'src' field referencing another animation
			continue;
		}

		const relativePath = animation.path;
		const pngName = path.basename(animation.pngPath);
		const cachePath = path.join(cacheDir, relativePath, pngName);
		const isBitmask = isBitmaskAnimation(relativePath);

		if (isBitmask) {
			bitmaskCount++;
		}

		try {
			const result = await optimizeFile(animation.pngPath, cachePath, sharp, isBitmask);
			result.animationPath = relativePath;
			results.push(result);
		} catch (error) {
			results.push({
				path: animation.pngPath,
				animationPath: relativePath,
				skipped: false,
				optimized: false,
				isBitmask,
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

	return { results, sharp: !!sharp, bitmaskCount };
}
