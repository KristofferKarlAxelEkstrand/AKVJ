import fs from 'fs/promises';
import path from 'path';
import { validate } from './lib/validate.js';
import { validateMidiLayout } from './lib/validateMapping.js';
import { optimize } from './lib/optimize.js';
import { generate } from './lib/generate.js';
import { copyToPublic, clean } from './lib/copy.js';
import { copyFileWithFallback } from './lib/fsUtils.js';

/**
 * Pipeline - Orchestrates the clip build process.
 *
 * Phases:
 * 1. Validate source clips + midi-layout.json
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
		const { valid: validClips, errors: clipErrors } = await this.#validate(sourceDir);
		const { errors: mappingErrors } = await validateMidiLayout(sourceDir, validClips);
		const errors = [...clipErrors, ...mappingErrors];

		if (errors.length > 0) {
			this.#logValidationErrors(errors);
			throw new Error('Validation failed');
		}

		console.log(`  Found ${validClips.length} valid clips`);
		console.log('  midi-layout.json OK\n');

		if (options.validateOnly) {
			console.log('Validation complete (--validate-only)');
			return;
		}

		await this.#build(validClips, sourceDir, options.noOptimize);
	}

	async #build(validClips, sourceDir, noOptimize) {
		await this.#optimize(validClips, noOptimize);
		await this.#generate(sourceDir);
		await this.#copy();
	}

	#validate(sourceDir) {
		console.log(`Step 1: Validating clips from ${sourceDir}...`);
		return validate(sourceDir);
	}

	#logValidationErrors(errors) {
		console.error('\nValidation errors:');
		// Clip validation errors use `clipId`, mapping validation errors use `path` (file location)
		for (const { clipId, path, errors: clipErrors } of errors) {
			console.error(`  ${clipId ?? path}:`);
			for (const errorMessage of clipErrors) {
				console.error(`    - ${errorMessage}`);
			}
		}
		console.error(`\n${errors.length} issue(s) found`);
	}

	async #optimize(validClips, noOptimize) {
		if (noOptimize) {
			console.log('Step 2: Skipping optimization (--no-optimize)\n');
			const { results } = await optimize(validClips, this.cacheDir);
			console.log(`  Copied ${results.filter(result => result.optimized).length} files to cache\n`);
			return;
		}

		console.log('Step 2: Optimizing PNGs...');
		const { results, sharp, bitDepthCounts } = await optimize(validClips, this.cacheDir);
		this.#logOptimizeResults(results, sharp, bitDepthCounts);
	}

	#logOptimizeResults(results, sharp, bitDepthCounts) {
		const optimized = results.filter(result => result.optimized).length;
		const skipped = results.filter(result => result.skipped).length;
		const failed = results.filter(result => result.error).length;

		if (sharp) {
			this.#logSharpResults(results, optimized, skipped, failed, bitDepthCounts);
		} else {
			console.log(`  Copied: ${optimized}, Skipped: ${skipped} (sharp not installed)`);
		}

		this.#logFailedFiles(results, failed);
		console.log();
	}

	#logSharpResults(results, optimized, skipped, failed, bitDepthCounts) {
		const totalSaved = results.filter(result => result.optimized && result.originalSize && result.optimizedSize).reduce((total, result) => total + (result.originalSize - result.optimizedSize), 0);
		console.log(`  Optimized: ${optimized}, Skipped: ${skipped}, Failed: ${failed}`);
		const bitmaskCount = bitDepthCounts?.[1] ?? 0;
		if (bitmaskCount > 0) {
			console.log(`  Bitmasks (1-bit): ${bitmaskCount}`);
		}
		if (totalSaved > 0) {
			console.log(`  Total size saved: ${(totalSaved / 1024).toFixed(1)} KB`);
		}
	}

	#logFailedFiles(results, failed) {
		if (failed === 0) {
			return;
		}
		for (const result of results.filter(result => result.error)) {
			console.error(`  Error: ${result.clipPath}: ${result.error}`);
		}
	}

	async #generate(sourceDir) {
		console.log('Step 3: Generating clips.json...');
		await generate(this.cacheDir, path.join(this.cacheDir, 'clips.json'));

		const licensePath = path.join(sourceDir, 'LICENSE-ASSETS.md');
		try {
			await fs.access(licensePath);
			await copyFileWithFallback(licensePath, path.join(this.cacheDir, 'LICENSE-ASSETS.md'));
		} catch {
			// No LICENSE file in source, that's fine
		}

		const layoutPath = path.join(sourceDir, 'midi-layout.json');
		await copyFileWithFallback(layoutPath, path.join(this.cacheDir, 'midi-layout.json'));
		console.log('  Copied midi-layout.json');
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
