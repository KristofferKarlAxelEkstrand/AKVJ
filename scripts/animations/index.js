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
import { fileURLToPath } from 'url';
import { Pipeline } from './Pipeline.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '../..');

// Directory paths
const SOURCE_DIR = path.join(ROOT, 'animations');
const CACHE_DIR = path.join(ROOT, '.cache/animations');
const PUBLIC_DIR = path.join(ROOT, 'src/public/animations');

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

	// Initial build (animations:watch is the only entry point in dev)
	await run();

	console.log('\nWatching for changes in animations/...\n');

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

	// Use polling in dev containers where inotify may not work reliably
	const usePolling = !!(process.env.REMOTE_CONTAINERS || process.env.CODESPACES || process.env.GITPOD_WORKSPACE_ID);
	chokidar.default
		.watch(SOURCE_DIR, {
			ignoreInitial: true,
			usePolling,
			interval: usePolling ? 300 : undefined
		})
		.on('all', (event, filePath) => {
			console.log(`[anim] ${event}: ${filePath}`);
			rebuild();
		});
}
export { watchMode };

// Execute the pipeline only when run as a CLI, not when imported as a module
// Handles both `node scripts/animations/index.js` and `node scripts/animations` (folder)
const scriptPath = process.argv[1] ?? '';
const isCli = import.meta.url === `file://${scriptPath}` || import.meta.url === `file://${scriptPath}/index.js` || scriptPath.endsWith('index.js');

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
