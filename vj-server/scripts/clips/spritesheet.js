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

/**
 * Parse command line arguments.
 */
function parseArgs() {
	const args = process.argv.slice(2);
	const options = {
		inputDir: null,
		outputDir: null,
		framesPerRow: 8,
		frameRate: 12
	};

	for (let i = 0; i < args.length; i++) {
		const arg = args[i];
		if (arg === '--frames-per-row' && args[i + 1]) {
			options.framesPerRow = parseInt(args[++i], 10);
		} else if (arg === '--frame-rate' && args[i + 1]) {
			options.frameRate = parseInt(args[++i], 10);
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

async function createSpriteSheet(inputDir, outputDir, options = {}) {
	const { framesPerRow = 8, frameRate = 12 } = options;
	const sharp = await importSharp();

	const files = await loadFrameFiles(inputDir);
	const { frameWidth, frameHeight } = await getFrameDimensions(sharp, inputDir, files[0]);
	const composites = await buildComposites(sharp, inputDir, files, framesPerRow, frameWidth, frameHeight);
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

async function loadFrameFiles(inputDir) {
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
		console.error('Error: No image files found in', inputDir);
		process.exit(1);
	}
	console.log(`Found ${files.length} frames`);
	return files;
}

async function getFrameDimensions(sharp, inputDir, firstFile) {
	const firstImage = await sharp(path.join(inputDir, firstFile)).metadata();
	console.log(`Frame size: ${firstImage.width}x${firstImage.height}`);
	return { frameWidth: firstImage.width, frameHeight: firstImage.height };
}

async function buildComposites(sharp, inputDir, files, framesPerRow, frameWidth, frameHeight) {
	const cols = Math.min(files.length, framesPerRow);
	const rows = Math.ceil(files.length / framesPerRow);
	console.log(`Sprite sheet: ${cols}x${rows} grid (${cols * frameWidth}x${rows * frameHeight}px)`);
	return Promise.all(
		files.map(async (file, i) => ({
			input: await sharp(path.join(inputDir, file)).toBuffer(),
			left: (i % framesPerRow) * frameWidth,
			top: Math.floor(i / framesPerRow) * frameHeight
		}))
	);
}

async function writeSpriteSheet(sharp, outputDir, composites, framesPerRow, frameWidth, frameHeight, fileCount) {
	const cols = Math.min(fileCount, framesPerRow);
	const rows = Math.ceil(fileCount / framesPerRow);
	await fs.mkdir(outputDir, { recursive: true });
	await sharp({
		create: {
			width: cols * frameWidth,
			height: rows * frameHeight,
			channels: 4,
			background: { r: 0, g: 0, b: 0, alpha: 0 }
		}
	})
		.composite(composites)
		.png()
		.toFile(path.join(outputDir, 'sprite.png'));
}

async function writeMetaFile(outputDir, numberOfFrames, framesPerRow, frameRate) {
	const meta = {
		png: 'sprite.png',
		numberOfFrames,
		framesPerRow,
		loop: true,
		retrigger: true,
		frameRatesForFrames: { 0: frameRate }
	};
	await fs.writeFile(path.join(outputDir, 'meta.json'), JSON.stringify(meta, null, '\t'));
	console.log(`\nCreated:`);
	console.log(`  ${path.join(outputDir, 'sprite.png')}`);
	console.log(`  ${path.join(outputDir, 'meta.json')}`);
}

const options = parseArgs();

if (!options.inputDir || !options.outputDir) {
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

createSpriteSheet(options.inputDir, options.outputDir, options).catch(error => {
	console.error('Error creating sprite sheet:', error.message);
	process.exit(1);
});
