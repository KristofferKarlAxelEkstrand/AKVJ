#!/usr/bin/env node

/**
 * Clip Pipeline Orchestrator
 *
 * Handles the full clip build pipeline:
 * 1. Validate source clips
 * 2. Optimize PNGs (if sharp is installed)
 * 3. Generate clips.json
 * 4. Copy to public folder
 *
 * Usage:
 *   node scripts/clips                  # Full pipeline
 *   node scripts/clips --watch          # Watch mode
 *   node scripts/clips --validate-only  # Validation only
 *   node scripts/clips --no-optimize    # Skip optimization
 *   node scripts/clips --clean          # Remove cache and output
 */

import path from 'path';
import { fileURLToPath } from 'url';
import { Pipeline } from './Pipeline.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PACKAGE_ROOT = path.resolve(__dirname, '../..'); // vj-server/
const REPO_ROOT = path.resolve(PACKAGE_ROOT, '..');

// Directory paths — source clips stay at repo root; public output is per-package
const SOURCE_DIR = path.join(REPO_ROOT, 'clips');
const CACHE_DIR = path.join(REPO_ROOT, '.cache/clips');
const PUBLIC_DIR = path.join(PACKAGE_ROOT, 'src/public/clips');

const pipeline = new Pipeline({ sourceDir: SOURCE_DIR, cacheDir: CACHE_DIR, publicDir: PUBLIC_DIR });

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
Clip Pipeline

Usage:
  node scripts/clips [options]

Options:
  --watch          Watch for changes and rebuild automatically
  --validate-only  Only validate, don't build
  --no-optimize    Skip PNG optimization (just copy)
  --clean          Remove cache and generated output
  --help, -h       Show this help message

Directories:
  Source:  ../clips/ (repo root)
  Cache:   ../.cache/clips/ (repo root)
  Output:  src/public/clips/ (vj-server package)
`);
}

/**
 * Run the full pipeline.
 * @param {Object} options - Pipeline options
 */
export async function run(options = {}) {
	const startTime = performance.now();

	await pipeline.run(options);

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

	await run();
	console.log('\nWatching for changes in clips/...\n');
	setupWatcher(chokidar);
}

function setupWatcher(chokidar) {
	let timeout;
	const debounce = (callback, delayMs) => {
		return () => {
			clearTimeout(timeout);
			timeout = setTimeout(callback, delayMs);
		};
	};

	const rebuild = debounce(async () => {
		console.log('\n--- Rebuilding ---\n');
		try {
			await run();
		} catch (error) {
			console.error('Build error:', error.message);
		}
	}, 100);

	const usePolling = !!(process.env.REMOTE_CONTAINERS || process.env.CODESPACES || process.env.GITPOD_WORKSPACE_ID);
	chokidar.default
		.watch(SOURCE_DIR, {
			ignoreInitial: true,
			usePolling,
			interval: usePolling ? 300 : undefined
		})
		.on('all', (event, filePath) => {
			console.log(`[clips] ${event}: ${filePath}`);
			rebuild();
		});
}
export { watchMode };

// Execute the pipeline only when run as a CLI, not when imported as a module
// Handles both `node scripts/clips/index.js` and `node scripts/clips` (folder)
const scriptPath = process.argv[1] ?? '';
const fileUrlPath = fileURLToPath(import.meta.url);
const isCli = scriptPath && (fileUrlPath === scriptPath || path.join(scriptPath, 'index.js') === fileUrlPath);

if (isCli) {
	(async () => {
		const options = parseArgs();

		if (options.help) {
			printHelp();
			process.exit(0);
		}

		if (options.clean) {
			console.log('Cleaning cache and output...');
			await pipeline.clean();
			console.log('Done');
			process.exit(0);
		}

		if (options.watch) {
			try {
				// Await initial setup; error here should exit
				await watchMode();
			} catch (error) {
				console.error('Watch mode failed:', error);
				process.exit(1);
			}
		} else {
			try {
				await run(options);
			} catch (error) {
				console.error('Pipeline error:', error.message);
				process.exit(1);
			}
		}
	})();
}
