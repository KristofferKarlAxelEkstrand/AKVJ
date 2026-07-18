#!/usr/bin/env node

/**
 * Clip Pipeline Orchestrator
 *
 * Handles the full clip build pipeline per project:
 * 1. Validate source clips
 * 2. Optimize PNGs (if sharp is installed)
 * 3. Generate clips.json
 * 4. Copy to public/projects/{id}/clips/
 *
 * Usage:
 *   node scripts/clips                  # Full pipeline (all projects)
 *   node scripts/clips --project=default
 *   node scripts/clips --watch          # Watch mode
 *   node scripts/clips --validate-only  # Validation only
 *   node scripts/clips --no-optimize    # Skip optimization
 *   node scripts/clips --clean          # Remove cache and output
 */

import { existsSync } from 'fs';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { Pipeline } from './Pipeline.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const MAINFRAME_ROOT = path.resolve(__dirname, '../..'); // mainframe/
const REPO_ROOT = path.resolve(MAINFRAME_ROOT, '..');

const PROJECTS_DIR = path.join(REPO_ROOT, 'projects');
const CACHE_ROOT = path.join(REPO_ROOT, '.cache/projects');
const PUBLIC_ROOT = path.join(REPO_ROOT, 'akvj/src/public');
const ACTIVE_PROJECT_PATH = path.join(REPO_ROOT, 'active-project.json');

const pipeline = new Pipeline({
	projectsDir: PROJECTS_DIR,
	cacheRoot: CACHE_ROOT,
	publicRoot: PUBLIC_ROOT,
	activeProjectPath: ACTIVE_PROJECT_PATH
});

/**
 * Parse command line arguments.
 * @returns {Object} Parsed options
 */
function parseArgs() {
	const args = process.argv.slice(2);
	const projectArg = args.find(arg => arg.startsWith('--project='));
	return {
		watch: args.includes('--watch'),
		validateOnly: args.includes('--validate-only'),
		noOptimize: args.includes('--no-optimize'),
		clean: args.includes('--clean'),
		help: args.includes('--help') || args.includes('-h'),
		project: projectArg ? projectArg.slice('--project='.length) : undefined
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
  --project=<id>   Build only one project
  --watch          Watch for changes and rebuild automatically
  --validate-only  Only validate, don't build
  --no-optimize    Skip PNG optimization (just copy)
  --clean          Remove cache and generated output
  --help, -h       Show this help message

Directories:
  Source:  projects/{id}/clips/ + key-map.json
  Cache:   .cache/projects/{id}/
  Output:  akvj/src/public/projects/{id}/clips/
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
async function watchMode(options = {}) {
	let chokidar;
	try {
		chokidar = await import('chokidar');
	} catch {
		console.error('chokidar not installed. Run: npm install chokidar');
		process.exit(1);
	}

	await run(options);
	console.log('\nWatching for changes in projects/...\n');
	setupWatcher(chokidar, options);
}

function setupWatcher(chokidar, options) {
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
			await run(options);
		} catch (error) {
			console.error('Build error:', error.message);
		}
	}, 100);

	const usePolling = !!(process.env.REMOTE_CONTAINERS || process.env.CODESPACES || process.env.GITPOD_WORKSPACE_ID);
	const watchPaths = [PROJECTS_DIR, ACTIVE_PROJECT_PATH].filter(existsSync);
	chokidar.default
		.watch(watchPaths, {
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

async function cleanAll() {
	console.log('Cleaning cache and output...');
	await fs.rm(CACHE_ROOT, { recursive: true, force: true });
	await fs.rm(path.join(PUBLIC_ROOT, 'projects'), { recursive: true, force: true });
	await fs.rm(path.join(PUBLIC_ROOT, 'clips'), { recursive: true, force: true });
	console.log('Done');
}

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
			await cleanAll();
			process.exit(0);
		}

		if (options.watch) {
			try {
				await watchMode(options);
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
