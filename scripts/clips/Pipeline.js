import fs from 'fs/promises';
import path from 'path';
import { validate } from './lib/validate.js';
import { optimize } from './lib/optimize.js';
import { generate } from './lib/generate.js';
import { copyToPublic, clean } from './lib/copy.js';

/**
 * Pipeline - Orchestrates the clip build process.
 *
 * Phases:
 * 1. Validate source clips
 * 2. Optimize PNGs (or copy if sharp is missing / --no-optimize)
 * 3. Generate clips.json in cache
 * 4. Copy cache to public folder
 */
export class Pipeline {
	/**
	 * @param {Object} config
	 * @param {string} config.sourceDir - Source clips directory
	 * @param {string} config.cacheDir - Cache directory
	 * @param {string} config.publicDir - Public output directory
	 */
	constructor({ sourceDir, cacheDir, publicDir }) {
		this.sourceDir = sourceDir;
		this.cacheDir = cacheDir;
		this.publicDir = publicDir;
	}

	/**
	 * Run the full pipeline with the provided options.
	 * @param {Object} [options={}]
	 * @param {boolean} [options.validateOnly] - Only validate, don't build
	 * @param {boolean} [options.noOptimize] - Skip PNG optimization
	 * @returns {Promise<void>}
	 * @throws {Error} When validation fails
	 */
	async run(options = {}) {
		console.log('Clip Pipeline');
		console.log('==================\n');

		const sourceDir = options.sourceDir ?? this.sourceDir;

		const { valid: validClips, errors } = await this.#validate(sourceDir);
		if (errors.length > 0) {
			this.#logValidationErrors(errors);
			throw new Error('Validation failed');
		}

		console.log(`  Found ${validClips.length} valid clips\n`);

		if (options.validateOnly) {
			console.log('Validation complete (--validate-only)');
			return;
		}

		await this.#optimize(validClips, options.noOptimize);
		await this.#generate(sourceDir);
		await this.#copy();
	}

	#validate(sourceDir) {
		console.log(`Step 1: Validating clips from ${sourceDir}...`);
		return validate(sourceDir);
	}

	#logValidationErrors(errors) {
		console.error('\nValidation errors:');
		for (const { path: animPath, errors: errs } of errors) {
			console.error(`  ${animPath}:`);
			for (const err of errs) {
				console.error(`    - ${err}`);
			}
		}
		console.error(`\n${errors.length} clip(s) have errors`);
	}

	async #optimize(validClips, noOptimize) {
		if (noOptimize) {
			console.log('Step 2: Skipping optimization (--no-optimize)\n');
			const { results } = await optimize(validClips, this.cacheDir);
			console.log(`  Copied ${results.filter(r => r.optimized).length} files to cache\n`);
			return;
		}

		console.log('Step 2: Optimizing PNGs...');
		const { results, sharp, bitDepthCounts } = await optimize(validClips, this.cacheDir);

		const optimized = results.filter(r => r.optimized).length;
		const skipped = results.filter(r => r.skipped).length;
		const failed = results.filter(r => r.error).length;

		if (sharp) {
			const totalSaved = results.filter(r => r.optimized && r.originalSize && r.optimizedSize).reduce((acc, r) => acc + (r.originalSize - r.optimizedSize), 0);

			console.log(`  Optimized: ${optimized}, Skipped: ${skipped}, Failed: ${failed}`);
			const bitmaskCount = bitDepthCounts?.[1] ?? 0;
			if (bitmaskCount > 0) {
				console.log(`  Bitmasks (1-bit): ${bitmaskCount}`);
			}
			if (totalSaved > 0) {
				console.log(`  Total size saved: ${(totalSaved / 1024).toFixed(1)} KB`);
			}
		} else {
			console.log(`  Copied: ${optimized}, Skipped: ${skipped} (sharp not installed)`);
		}

		if (failed > 0) {
			for (const r of results.filter(r => r.error)) {
				console.error(`  Error: ${r.clipPath}: ${r.error}`);
			}
		}
		console.log();
	}

	async #generate(sourceDir) {
		console.log('Step 3: Generating clips.json...');
		await generate(this.cacheDir, path.join(this.cacheDir, 'clips.json'));

		// Copy LICENSE file from source to cache if it exists
		const licensePath = path.join(sourceDir, 'LICENSE-ASSETS.md');
		try {
			await fs.access(licensePath);
			await fs.copyFile(licensePath, path.join(this.cacheDir, 'LICENSE-ASSETS.md'));
		} catch {
			// No LICENSE file in source, that's fine
		}
		console.log();
	}

	async #copy() {
		console.log('Step 4: Copying to public folder...');
		const copyStats = await copyToPublic(this.cacheDir, this.publicDir);
		console.log(`  Copied: ${copyStats.copied}, Skipped: ${copyStats.skipped}, Removed: ${copyStats.removed}\n`);
	}

	/**
	 * Remove cache and public output directories.
	 */
	async clean() {
		return clean(this.cacheDir, this.publicDir);
	}
}
