#!/usr/bin/env node

/**
 * Sprite Sheet Generator
 *
 * Combines individual frame images into a single sprite sheet.
 *
 * Usage:
 *   node scripts/clips/spritesheet.js <input-folder> <output-folder> [options]
 *
 * Options:
 *   --frames-per-row <n>  Number of frames per row (default: 8)
 *   --frame-rate <n>      Default frame rate (default: 12)
 *
 * Example:
 *   node scripts/clips/spritesheet.js ./my-frames ./clips/neon-skull
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { writeJsonAtomic } from '../../server/writeJsonAtomic.js';
import { renderSpriteSheet, DEFAULT_FRAME_RATE, DEFAULT_FRAMES_PER_ROW } from '../../shared/spritesheetCore.js';

/**
 * Parse command line arguments.
 * @param {string[]} [argv=process.argv.slice(2)]
 */
export function parseArgs(argv = process.argv.slice(2)) {
	const options = {
		inputDir: null,
		outputDir: null,
		framesPerRow: DEFAULT_FRAMES_PER_ROW,
		frameRate: DEFAULT_FRAME_RATE
	};

	for (let i = 0; i < argv.length; i++) {
		const arg = argv[i];
		if (arg === '--frames-per-row' && argv[i + 1]) {
			options.framesPerRow = parseInt(argv[++i], 10);
		} else if (arg === '--frame-rate' && argv[i + 1]) {
			options.frameRate = parseInt(argv[++i], 10);
		} else if (!arg.startsWith('--')) {
			if (!options.inputDir) {
				options.inputDir = arg;
			} else if (!options.outputDir) {
				options.outputDir = arg;
			}
		}
	}

	return options;
}

export async function createSpriteSheet(inputDir, outputDir, options = {}) {
	const { framesPerRow = DEFAULT_FRAMES_PER_ROW, frameRate = DEFAULT_FRAME_RATE } = options;
	const sharp = await importSharp();

	const files = await loadFrameFiles(inputDir);
	const { frameWidth, frameHeight } = await getFrameDimensions(sharp, inputDir, files[0]);
	const composites = await buildCompositesFromFiles(sharp, inputDir, files, framesPerRow, frameWidth, frameHeight);
	await writeSpriteSheet(sharp, outputDir, composites, framesPerRow, frameWidth, frameHeight, files.length);
	await writeMetaFile(outputDir, files.length, framesPerRow, frameRate);
}

async function importSharp() {
	try {
		const sharpModule = await import('sharp');
		return sharpModule.default;
	} catch {
		throw new Error('sharp is required for sprite sheet generation. Run: npm install sharp');
	}
}

export async function loadFrameFiles(inputDir) {
	const allFiles = await fs.readdir(inputDir);
	const files = allFiles
		.filter(f => /\.(png|jpg|jpeg)$/i.test(f))
		.sort((a, b) => {
			const numA = parseInt(a.match(/\d+/)?.[0], 10);
			const numB = parseInt(b.match(/\d+/)?.[0], 10);
			if (isNaN(numA) || isNaN(numB)) {
				return a.localeCompare(b);
			}
			return numA - numB;
		});
	if (files.length === 0) {
		throw new Error(`No image files found in ${inputDir}`);
	}
	console.log(`Found ${files.length} frames`);
	return files;
}

async function getFrameDimensions(sharp, inputDir, firstFile) {
	const firstImage = await sharp(path.join(inputDir, firstFile)).metadata();
	console.log(`Frame size: ${firstImage.width}x${firstImage.height}`);
	return { frameWidth: firstImage.width, frameHeight: firstImage.height };
}

async function buildCompositesFromFiles(sharp, inputDir, files, framesPerRow, frameWidth, frameHeight) {
	const cols = Math.min(files.length, framesPerRow);
	const rows = Math.ceil(files.length / framesPerRow);
	console.log(`Sprite sheet: ${cols}x${rows} grid (${cols * frameWidth}x${rows * frameHeight}px)`);
	const composites = await Promise.all(
		files.map(async (file, i) => ({
			input: await sharp(path.join(inputDir, file)).toBuffer(),
			left: (i % framesPerRow) * frameWidth,
			top: Math.floor(i / framesPerRow) * frameHeight
		}))
	);
	return composites;
}

async function writeSpriteSheet(sharp, outputDir, composites, framesPerRow, frameWidth, frameHeight, fileCount) {
	const sheet = await renderSpriteSheet(sharp, composites, frameWidth, frameHeight, fileCount, framesPerRow);
	await fs.mkdir(outputDir, { recursive: true });
	await fs.writeFile(path.join(outputDir, 'sprite.png'), sheet);
}

export async function writeMetaFile(outputDir, frameCount, framesPerRow, frameRate) {
	const meta = {
		png: 'sprite.png',
		frames: frameCount,
		framesPerRow,
		playback: 'loop',
		retrigger: true,
		frameRatesForFrames: { 0: frameRate }
	};
	await writeJsonAtomic(path.join(outputDir, 'meta.json'), meta);
	console.log(`\nCreated:`);
	console.log(`  ${path.join(outputDir, 'sprite.png')}`);
	console.log(`  ${path.join(outputDir, 'meta.json')}`);
}

function printUsageAndExit() {
	console.log('Sprite Sheet Generator');
	console.log('');
	console.log('Usage: node scripts/clips/spritesheet.js <input-folder> <output-folder> [options]');
	console.log('');
	console.log('Options:');
	console.log('  --frames-per-row <n>  Number of frames per row (default: 8)');
	console.log('  --frame-rate <n>      Default frame rate in fps (default: 12)');
	console.log('');
	console.log('Example:');
	console.log('  node scripts/clips/spritesheet.js ./my-frames ./clips/neon-skull');
	console.log('');
	console.log('Input folder should contain numbered image files like:');
	console.log('  frame001.png, frame002.png, ...');
	console.log('  or: 1.png, 2.png, ...');
	process.exit(1);
}

const scriptPath = process.argv[1] ?? '';
const isCli = scriptPath && path.resolve(scriptPath) === fileURLToPath(import.meta.url);

if (isCli) {
	const options = parseArgs();
	if (!options.inputDir || !options.outputDir) {
		printUsageAndExit();
	}
	createSpriteSheet(options.inputDir, options.outputDir, options).catch(error => {
		console.error('Error creating sprite sheet:', error.message);
		process.exit(1);
	});
}
