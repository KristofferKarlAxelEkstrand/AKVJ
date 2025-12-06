import fs from 'fs/promises';
import path from 'path';
import { hashFile, writeHashFile, isCacheValid } from './hash.js';

/**
 * Optimization result for a single file.
 * @typedef {Object} OptimizeResult
 * @property {string} path - Animation path
 * @property {boolean} skipped - True if file was unchanged
 * @property {boolean} optimized - True if file was optimized
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
 * Optimize a single PNG file if it has changed.
 * @param {string} sourcePath - Path to source PNG
 * @param {string} cachePath - Path to output cached PNG
 * @param {import('sharp')|null} sharp - Sharp module or null to skip optimization
 * @returns {Promise<OptimizeResult>}
 */
async function optimizeFile(sourcePath, cachePath, sharp) {
	// Check if cache is valid
	if (await isCacheValid(sourcePath, cachePath)) {
		return { path: sourcePath, skipped: true, optimized: false };
	}

	// Ensure cache directory exists
	await fs.mkdir(path.dirname(cachePath), { recursive: true });

	const originalStats = await fs.stat(sourcePath);
	const originalSize = originalStats.size;
	let optimizedSize = originalSize;

	if (sharp) {
		// Try palette optimization first
		const tempPath = cachePath + '.tmp';
		let tempExists = false;
		try {
			await sharp(sourcePath).png({ palette: true, quality: 80, effort: 10 }).toFile(tempPath);
			tempExists = true;

			const tempStats = await fs.stat(tempPath);

			// Only keep optimized version if it's smaller
			if (tempStats.size < originalSize) {
				await fs.rename(tempPath, cachePath);
				optimizedSize = tempStats.size;
			} else {
				// Original is smaller, just copy it
				await fs.unlink(tempPath);
				await fs.copyFile(sourcePath, cachePath);
			}
		} catch (err) {
			// If optimization fails, attempt to clean up temp file and copy original
			try {
				if (tempExists) {
					await fs.unlink(tempPath);
				}
			} catch {
				// Ignore cleanup errors
			}
			await fs.copyFile(sourcePath, cachePath);
			// Re-throw to be handled by caller
			throw new Error(`optimize error: ${err instanceof Error ? err.message : String(err)}`);
		}
	} else {
		// No sharp available, just copy
		await fs.copyFile(sourcePath, cachePath);
	}

	// Write hash sidecar; recompute source hash immediately after the copy
	const sourceHash = await hashFile(sourcePath);
	await writeHashFile(cachePath + '.hash', sourceHash);

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

	for (const animation of animations) {
		if (!animation.pngPath) {
			// Animation uses 'src' field referencing another animation
			continue;
		}

		const relativePath = animation.path;
		const pngName = path.basename(animation.pngPath);
		const cachePath = path.join(cacheDir, relativePath, pngName);

		try {
			const result = await optimizeFile(animation.pngPath, cachePath, sharp);
			result.animationPath = relativePath;
			results.push(result);
		} catch (error) {
			results.push({
				path: animation.pngPath,
				animationPath: relativePath,
				skipped: false,
				optimized: false,
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

	return { results, sharp: !!sharp };
}
