#!/usr/bin/env node

/**
 * Sprite Sheet Generator
 *
 * Combines individual frame images into a single sprite sheet.
 *
 * Usage:
 *   node scripts/animations/spritesheet.js <input-folder> <output-folder> [options]
 *
 * Options:
 *   --frames-per-row <n>  Number of frames per row (default: 8)
 *   --frame-rate <n>      Default frame rate (default: 12)
 *
 * Example:
 *   node scripts/animations/spritesheet.js ./my-frames ./animations/0/3/0
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

	// Try to import sharp
	let sharp;
	try {
		const sharpModule = await import('sharp');
		sharp = sharpModule.default;
	} catch {
		console.error('Error: sharp is required for sprite sheet generation.');
		console.error('Run: npm install sharp');
		process.exit(1);
	}

	// Find all frame images, sorted numerically
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

	// Get frame dimensions from first image
	const firstImage = await sharp(path.join(inputDir, files[0])).metadata();
	const frameWidth = firstImage.width;
	const frameHeight = firstImage.height;

	console.log(`Frame size: ${frameWidth}x${frameHeight}`);

	// Calculate sprite sheet dimensions
	const cols = Math.min(files.length, framesPerRow);
	const rows = Math.ceil(files.length / framesPerRow);

	console.log(`Sprite sheet: ${cols}x${rows} grid (${cols * frameWidth}x${rows * frameHeight}px)`);

	// Load all frames
	const composites = await Promise.all(
		files.map(async (file, i) => ({
			input: await sharp(path.join(inputDir, file)).toBuffer(),
			left: (i % framesPerRow) * frameWidth,
			top: Math.floor(i / framesPerRow) * frameHeight
		}))
	);

	// Create sprite sheet
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

	// Generate meta.json
	const meta = {
		png: 'sprite.png',
		numberOfFrames: files.length,
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
	console.log('Usage: node scripts/animations/spritesheet.js <input-folder> <output-folder> [options]');
	console.log('');
	console.log('Options:');
	console.log('  --frames-per-row <n>  Number of frames per row (default: 8)');
	console.log('  --frame-rate <n>      Default frame rate in fps (default: 12)');
	console.log('');
	console.log('Example:');
	console.log('  node scripts/animations/spritesheet.js ./my-frames ./animations/0/3/0');
	console.log('');
	console.log('Input folder should contain numbered image files like:');
	console.log('  frame001.png, frame002.png, ...');
	console.log('  or: 1.png, 2.png, ...');
	process.exit(1);
}

createSpriteSheet(options.inputDir, options.outputDir, options);
