import fs from 'fs/promises';
import path from 'path';
import { validate } from './lib/validate.js';
import { validateKeyMap } from './lib/validateMapping.js';
import { optimize } from './lib/optimize.js';
import { generate } from './lib/generate.js';
import { copyToPublic, clean } from './lib/copy.js';
import { copyFileWithFallback } from './lib/fsUtils.js';

const PROJECT_ID_PATTERN = /^[a-zA-Z0-9][a-zA-Z0-9_-]*$/;

/**
 * Pipeline - Orchestrates the clip build process per project.
 *
 * Phases (per project):
 * 1. Validate source clips + key-map.json
 * 2. Optimize PNGs (or copy if sharp is missing / --no-optimize)
 * 3. Generate clips.json in cache
 * 4. Copy cache to public/projects/{id}/clips/
 * Then copy projects/index.json + active-project.json to public root.
 */
export class Pipeline {
	/**
	 * @param {Object} config
	 * @param {string} [config.sourceDir] - Legacy single clips dir (tests)
	 * @param {string} [config.cacheDir] - Legacy single cache dir (tests)
	 * @param {string} [config.publicDir] - Legacy single public clips dir (tests)
	 * @param {string} [config.projectsDir] - Source projects directory (repo root)
	 * @param {string} [config.publicRoot] - Public root directory (akvj/src/public)
	 * @param {string} [config.activeProjectPath] - Path to active-project.json
	 * @param {string} [config.cacheRoot] - Root for per-project caches (.cache/projects)
	 */
	constructor({ sourceDir, cacheDir, publicDir, projectsDir, publicRoot, activeProjectPath, cacheRoot }) {
		this.sourceDir = sourceDir;
		this.cacheDir = cacheDir;
		this.publicDir = publicDir;
		this.projectsDir = projectsDir;
		this.publicRoot = publicRoot;
		this.activeProjectPath = activeProjectPath;
		this.cacheRoot = cacheRoot;
	}

	/**
	 * Run the full pipeline with the provided options.
	 * @param {Object} [options={}]
	 * @param {boolean} [options.validateOnly] - Only validate, don't build
	 * @param {boolean} [options.noOptimize] - Skip PNG optimization
	 * @param {string} [options.sourceDir] - Override: single clips dir (fixture tests)
	 * @param {string} [options.project] - Build only this project id
	 * @returns {Promise<void>}
	 * @throws {Error} When validation fails
	 */
	async run(options = {}) {
		console.log('Clip Pipeline');
		console.log('==================\n');

		// Legacy / test mode: explicit sourceDir with key-map inside the clips folder
		if (options.sourceDir || (this.sourceDir && !this.projectsDir)) {
			await this.#runSingleSource(options.sourceDir ?? this.sourceDir, this.cacheDir, this.publicDir, options);
			return;
		}

		const projectIds = await this.#listProjectIds(options.project);
		if (projectIds.length === 0) {
			throw new Error('No projects found to build');
		}

		for (const projectId of projectIds) {
			console.log(`\n--- Project: ${projectId} ---\n`);
			const sourceDir = path.join(this.projectsDir, projectId, 'clips');
			const keyMapPath = path.join(this.projectsDir, projectId, 'key-map.json');
			const licensePath = path.join(this.projectsDir, projectId, 'LICENSE-ASSETS.md');
			const cacheDir = path.join(this.cacheRoot ?? path.join(path.dirname(this.projectsDir), '.cache/projects'), projectId);
			const publicDir = path.join(this.publicRoot, 'projects', projectId, 'clips');
			await this.#runSingleSource(sourceDir, cacheDir, publicDir, options, { keyMapPath, licensePath });
		}

		if (!options.validateOnly) {
			await this.#copyProjectIndexFiles();
		}
	}

	/**
	 * @param {string} [onlyProjectId]
	 * @returns {Promise<string[]>}
	 */
	async #listProjectIds(onlyProjectId) {
		if (onlyProjectId) {
			if (!PROJECT_ID_PATTERN.test(onlyProjectId) || /^\d+$/.test(onlyProjectId)) {
				throw new Error(`Invalid project id: ${onlyProjectId}`);
			}
			return [onlyProjectId];
		}
		if (!this.projectsDir) {
			return [];
		}
		let entries;
		try {
			entries = await fs.readdir(this.projectsDir, { withFileTypes: true });
		} catch (error) {
			if (error.code === 'ENOENT') {
				return [];
			}
			throw error;
		}
		return entries
			.filter(entry => entry.isDirectory() && PROJECT_ID_PATTERN.test(entry.name) && !/^\d+$/.test(entry.name))
			.map(entry => entry.name)
			.sort();
	}

	/**
	 * @param {string} sourceDir
	 * @param {string} cacheDir
	 * @param {string} publicDir
	 * @param {Object} options
	 * @param {{keyMapPath?: string, licensePath?: string}} [paths]
	 */
	async #runSingleSource(sourceDir, cacheDir, publicDir, options, paths = {}) {
		const keyMapPath = paths.keyMapPath ?? path.join(sourceDir, 'key-map.json');
		const licensePath = paths.licensePath ?? path.join(sourceDir, 'LICENSE-ASSETS.md');

		const { valid: validClips, errors: clipErrors } = await this.#validate(sourceDir);
		const { errors: mappingErrors } = await validateKeyMap(sourceDir, validClips, keyMapPath);
		const errors = [...clipErrors, ...mappingErrors];

		if (errors.length > 0) {
			this.#logValidationErrors(errors);
			throw new Error('Validation failed');
		}

		console.log(`  Found ${validClips.length} valid clips`);
		console.log('  key-map.json OK\n');

		if (options.validateOnly) {
			console.log('Validation complete (--validate-only)');
			return;
		}

		await this.#build(validClips, sourceDir, cacheDir, publicDir, options.noOptimize, { keyMapPath, licensePath });
	}

	async #build(validClips, sourceDir, cacheDir, publicDir, noOptimize, paths) {
		await this.#optimize(validClips, cacheDir, noOptimize);
		await this.#generate(cacheDir, paths);
		await this.#copy(cacheDir, publicDir);
	}

	#validate(sourceDir) {
		console.log(`Step 1: Validating clips from ${sourceDir}...`);
		return validate(sourceDir);
	}

	#logValidationErrors(errors) {
		console.error('\nValidation errors:');
		for (const { clipId, path: errorPath, errors: clipErrors } of errors) {
			console.error(`  ${clipId ?? errorPath}:`);
			for (const errorMessage of clipErrors) {
				console.error(`    - ${errorMessage}`);
			}
		}
		console.error(`\n${errors.length} issue(s) found`);
	}

	async #optimize(validClips, cacheDir, noOptimize) {
		if (noOptimize) {
			console.log('Step 2: Skipping optimization (--no-optimize)\n');
			const { results } = await optimize(validClips, cacheDir);
			console.log(`  Copied ${results.filter(result => result.optimized).length} files to cache\n`);
			return;
		}

		console.log('Step 2: Optimizing PNGs...');
		const { results, sharp, bitDepthCounts } = await optimize(validClips, cacheDir);
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

	async #generate(cacheDir, paths) {
		console.log('Step 3: Generating clips.json...');
		await generate(cacheDir, path.join(cacheDir, 'clips.json'));

		try {
			await fs.access(paths.licensePath);
			await copyFileWithFallback(paths.licensePath, path.join(cacheDir, 'LICENSE-ASSETS.md'));
		} catch {
			// No LICENSE file, that's fine
		}

		await copyFileWithFallback(paths.keyMapPath, path.join(cacheDir, 'key-map.json'));
		console.log('  Copied key-map.json');
		console.log();
	}

	async #copy(cacheDir, publicDir) {
		console.log('Step 4: Copying to public folder...');
		const copyStats = await copyToPublic(cacheDir, publicDir);
		console.log(`  Copied: ${copyStats.copied}, Skipped: ${copyStats.skipped}, Removed: ${copyStats.removed}\n`);
	}

	/**
	 * Copy projects index + active-project to the public root (key-maps already in per-project clips/).
	 */
	async #copyProjectIndexFiles() {
		if (!this.projectsDir || !this.publicRoot) {
			return;
		}

		console.log('Step 5: Copying project index files...');
		const projectsPublicDir = path.join(this.publicRoot, 'projects');
		let copiedCount = 0;

		const indexSrc = path.join(this.projectsDir, 'index.json');
		try {
			await fs.access(indexSrc);
			await fs.mkdir(projectsPublicDir, { recursive: true });
			await copyFileWithFallback(indexSrc, path.join(projectsPublicDir, 'index.json'));
			copiedCount++;
		} catch {
			// No index.json
		}

		if (this.activeProjectPath) {
			try {
				await fs.access(this.activeProjectPath);
				await copyFileWithFallback(this.activeProjectPath, path.join(this.publicRoot, 'active-project.json'));
				copiedCount++;
			} catch {
				// No active-project.json
			}
		}

		console.log(`  Copied ${copiedCount} project file(s)\n`);
	}

	/**
	 * Remove cache and public output directories.
	 */
	async clean() {
		if (this.cacheRoot) {
			await fs.rm(this.cacheRoot, { recursive: true, force: true });
		} else if (this.cacheDir) {
			await clean(this.cacheDir, this.publicDir ?? this.cacheDir);
		}
	}
}
