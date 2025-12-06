#!/usr/bin/env node

/**
 * Animation Pipeline Orchestrator
 *
 * Handles the full animation build pipeline:
 * 1. Validate source animations
 * 2. Optimize PNGs (if sharp is installed)
 * 3. Generate animations.json
 * 4. Copy to public folder
 *
 * Usage:
 *   node scripts/animations                  # Full pipeline
 *   node scripts/animations --watch          # Watch mode
 *   node scripts/animations --validate-only  # Validation only
 *   node scripts/animations --no-optimize    # Skip optimization
 *   node scripts/animations --clean          # Remove cache and output
 */

import path from 'path';
import fs from 'fs/promises';
import { fileURLToPath } from 'url';
import { validate } from './lib/validate.js';
import { optimize } from './lib/optimize.js';
import { generate } from './lib/generate.js';
import { copyToPublic, clean } from './lib/copy.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '../..');

// Directory paths
const SOURCE_DIR = path.join(ROOT, 'animations');
const CACHE_DIR = path.join(ROOT, '.cache/animations');
const PUBLIC_DIR = path.join(ROOT, 'src/public/animations');

/**
 * Parse command line arguments.
 * @returns {Object} Parsed options
 */
function parseArgs() {
	const args = process.argv.slice(2);
	return {
		watch: args.includes('--watch'),
		validateOnly: args.includes('--validate-only'),
		noOptimize: args.includes('--no-optimize'),
		clean: args.includes('--clean'),
		help: args.includes('--help') || args.includes('-h')
	};
}

/**
 * Print help message.
 */
function printHelp() {
	console.log(`
Animation Pipeline

Usage:
  node scripts/animations [options]

Options:
  --watch          Watch for changes and rebuild automatically
  --validate-only  Only validate, don't build
  --no-optimize    Skip PNG optimization (just copy)
  --clean          Remove cache and generated output
  --help, -h       Show this help message

Directories:
  Source:  animations/
  Cache:   .cache/animations/
  Output:  src/public/animations/
`);
}

/**
 * Run the full pipeline.
 * @param {Object} options - Pipeline options
 */
export async function run(options = {}) {
	const startTime = performance.now();

	console.log('Animation Pipeline');
	console.log('==================\n');

	// Step 1: Validate
	const sourceDir = options.sourceDir ?? SOURCE_DIR;
	console.log(`Step 1: Validating animations from ${sourceDir}...`);
	const { valid, errors } = await validate(sourceDir);

	if (errors.length > 0) {
		console.error('\nValidation errors:');
		for (const { path: animPath, errors: errs } of errors) {
			console.error(`  ${animPath}:`);
			for (const err of errs) {
				console.error(`    - ${err}`);
			}
		}
		console.error(`\n${errors.length} animation(s) have errors`);
		if (options.exitOnError === false) {
			throw new Error('Validation failed');
		}
		process.exit(1);
	}

	console.log(`  Found ${valid.length} valid animations\n`);

	if (options.validateOnly) {
		console.log('Validation complete (--validate-only)');
		return;
	}

	// Step 2: Optimize
	if (!options.noOptimize) {
		console.log('Step 2: Optimizing PNGs...');
		const { results, sharp } = await optimize(valid, CACHE_DIR);

		const optimized = results.filter(r => r.optimized).length;
		const skipped = results.filter(r => r.skipped).length;
		const failed = results.filter(r => r.error).length;

		if (sharp) {
			const totalSaved = results.filter(r => r.optimized && r.originalSize && r.optimizedSize).reduce((acc, r) => acc + (r.originalSize - r.optimizedSize), 0);

			console.log(`  Optimized: ${optimized}, Skipped: ${skipped}, Failed: ${failed}`);
			if (totalSaved > 0) {
				console.log(`  Total size saved: ${(totalSaved / 1024).toFixed(1)} KB`);
			}
		} else {
			console.log(`  Copied: ${optimized}, Skipped: ${skipped} (sharp not installed)`);
		}

		if (failed > 0) {
			for (const r of results.filter(r => r.error)) {
				console.error(`  Error: ${r.animationPath}: ${r.error}`);
			}
		}
		console.log();
	} else {
		console.log('Step 2: Skipping optimization (--no-optimize)\n');
		// Still need to copy files to cache
		const { results } = await optimize(valid, CACHE_DIR);
		console.log(`  Copied ${results.filter(r => r.optimized).length} files to cache\n`);
	}

	// Step 3: Generate animations.json
	console.log('Step 3: Generating animations.json...');
	await generate(CACHE_DIR, path.join(CACHE_DIR, 'animations.json'));

	// Copy LICENSE file from source to cache if it exists
	const licensePath = path.join(sourceDir, 'LICENSE-ASSETS.md');
	try {
		await fs.access(licensePath);
		await fs.copyFile(licensePath, path.join(CACHE_DIR, 'LICENSE-ASSETS.md'));
	} catch {
		// No LICENSE file in source, that's fine
	}
	console.log();

	// Step 4: Copy to public
	console.log('Step 4: Copying to public folder...');
	const copyStats = await copyToPublic(CACHE_DIR, PUBLIC_DIR);
	console.log(`  Copied: ${copyStats.copied}, Skipped: ${copyStats.skipped}, Removed: ${copyStats.removed}\n`);

	const elapsed = ((performance.now() - startTime) / 1000).toFixed(2);
	console.log(`Done in ${elapsed}s`);
}

/**
 * Watch mode with debouncing.
 */
async function watchMode() {
	let chokidar;
	try {
		chokidar = await import('chokidar');
	} catch {
		console.error('chokidar not installed. Run: npm install chokidar');
		process.exit(1);
	}

	console.log('Watching for changes in animations/...\n');

	// Initial build
	await run();

	// Debounce function
	let timeout;
	const debounce = (fn, ms) => {
		return () => {
			clearTimeout(timeout);
			timeout = setTimeout(fn, ms);
		};
	};

	const rebuild = debounce(async () => {
		console.log('\n--- Rebuilding ---\n');
		try {
			await run();
		} catch (err) {
			console.error('Build error:', err.message);
		}
	}, 100);

	chokidar.default.watch(SOURCE_DIR, { ignoreInitial: true }).on('all', rebuild);
}
export { watchMode };

// Execute the pipeline only when run as a CLI, not when imported as a module
const isCli = import.meta.url === `file://${process.argv[1]}` || (process.argv[1] && process.argv[1].endsWith('index.js'));

if (isCli) {
	(async () => {
		const options = parseArgs();

		if (options.help) {
			printHelp();
			process.exit(0);
		}

		if (options.clean) {
			console.log('Cleaning cache and output...');
			await clean(CACHE_DIR, PUBLIC_DIR);
			console.log('Done');
			process.exit(0);
		}

		if (options.watch) {
			try {
				// Await initial setup; error here should exit
				await watchMode();
			} catch (err) {
				console.error('Watch mode failed:', err);
				process.exit(1);
			}
		} else {
			try {
				await run(options);
			} catch (err) {
				console.error('Pipeline error:', err.message);
				process.exit(1);
			}
		}
	})();
}
