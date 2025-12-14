import fs from 'fs/promises';
import path from 'path';
import { getSubfolders, getFilesWithExtension } from './validate.js';

/**
 * Parse a JSON file safely.
 * @param {string} filePath - Path to JSON file
 * @returns {Promise<Object>} Parsed JSON or empty object on error
 */
async function parseJsonFile(filePath) {
	try {
		const content = await fs.readFile(filePath, 'utf8');
		return JSON.parse(content);
	} catch (err) {
		console.error(`  Error parsing ${path.basename(filePath)}: ${err.message}`);
		return {};
	}
}

/**
 * Generate animations.json from a directory of animations.
 * @param {string} sourceDir - Directory containing channel/note/velocity structure
 * @param {string} outputPath - Path to write animations.json
 * @returns {Promise<Object>} The generated animations object
 */
export async function generate(sourceDir, outputPath) {
	console.log(`Generating animations.json from ${sourceDir}`);
	const output = {};

	const channels = await getSubfolders(sourceDir);

	for (const channel of channels) {
		output[channel] = {};
		console.log(`Channel ${channel}`);

		const channelDir = path.join(sourceDir, channel);
		const notes = await getSubfolders(channelDir);

		for (const note of notes) {
			output[channel][note] = {};
			console.log(`  Note ${note}`);

			const noteDir = path.join(channelDir, note);
			const velocities = await getSubfolders(noteDir);

			for (const velocity of velocities) {
				const velocityDir = path.join(noteDir, velocity);
				const pngFiles = await getFilesWithExtension(velocityDir, '.png');
				const jsonFiles = await getFilesWithExtension(velocityDir, '.json');

				// Use the first PNG file in the directory (getFilesWithExtension already filters by extension)
				const pngFile = pngFiles[0];
				const jsonFile = jsonFiles.find(f => f === 'meta.json') || jsonFiles[0];

				const metadata = jsonFile ? await parseJsonFile(path.join(velocityDir, jsonFile)) : {};

				// Prefer metadata.png if present, otherwise use pngFile found in the dir
				const finalPng = metadata.png ?? pngFile;
				const entry = { ...metadata };
				if (finalPng) {
					entry.png = finalPng;
				}

				// Ensure bitDepth is included if specified (for bitmask mixing)
				if (metadata.bitDepth !== undefined) {
					entry.bitDepth = metadata.bitDepth;
				}

				// Ensure frameDurationBeats is included if specified (for BPM sync)
				if (metadata.frameDurationBeats !== undefined) {
					entry.frameDurationBeats = metadata.frameDurationBeats;
				}

				output[channel][note][velocity] = entry;
				console.log(`    Velocity ${velocity}: ${pngFile || '(no png)'}${metadata.bitDepth ? ` (${metadata.bitDepth}-bit)` : ''}${metadata.frameDurationBeats ? ' (BPM sync)' : ''}`);
			}
		}
	}

	// Ensure output directory exists
	await fs.mkdir(path.dirname(outputPath), { recursive: true });
	await fs.writeFile(outputPath, JSON.stringify(output, null, '\t'), 'utf8');
	console.log(`\nSaved to ${outputPath}`);

	return output;
}
