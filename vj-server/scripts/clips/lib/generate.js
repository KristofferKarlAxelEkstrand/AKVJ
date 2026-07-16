import fs from 'fs/promises';
import path from 'path';
import { getSubfolders, getFilesWithExtension } from './validate/index.js';

const CLIP_ID_PATTERN = /^[a-zA-Z0-9][a-zA-Z0-9_-]*$/;

/**
 * Parse a JSON file safely.
 * @param {string} filePath - Path to JSON file
 * @returns {Promise<Object>} Parsed JSON or empty object on error
 */
async function parseJsonFile(filePath) {
	try {
		const content = await fs.readFile(filePath, 'utf8');
		return JSON.parse(content);
	} catch (error) {
		console.error(`  Error parsing ${path.basename(filePath)}: ${error.message}`);
		return {};
	}
}

/**
 * Generate a flat clips.json catalog keyed by clipId.
 * @param {string} sourceDir - Flat clip-id bucket (usually cache)
 * @param {string} outputPath - Path to write clips.json
 * @returns {Promise<Object>} The generated clips object
 */
export async function generate(sourceDir, outputPath) {
	console.log(`Generating clips.json from ${sourceDir}`);
	const output = {};

	const clipIds = await getSubfolders(sourceDir);

	for (const clipId of clipIds) {
		if (!CLIP_ID_PATTERN.test(clipId) || /^\d+$/.test(clipId)) {
			continue;
		}
		const entry = await buildClipCatalogEntry(sourceDir, clipId);
		output[clipId] = entry;
		console.log(`  ${clipId}: ${entry.png || '(no png)'}${entry.bitDepth ? ` (${entry.bitDepth}-bit)` : ''}${entry.role ? ` [${entry.role}]` : ''}`);
	}

	await fs.mkdir(path.dirname(outputPath), { recursive: true });
	await fs.writeFile(outputPath, JSON.stringify(output, null, '\t'), 'utf8');
	console.log(`\nSaved to ${outputPath}`);

	return output;
}

async function buildClipCatalogEntry(sourceDir, clipId) {
	const clipFolder = path.join(sourceDir, clipId);
	const pngFiles = await getFilesWithExtension(clipFolder, '.png');
	const jsonFiles = await getFilesWithExtension(clipFolder, '.json');

	const pngFile = pngFiles[0];
	const jsonFile = jsonFiles.find(filename => filename === 'meta.json') || jsonFiles[0];
	const metadata = jsonFile ? await parseJsonFile(path.join(clipFolder, jsonFile)) : {};
	const finalPng = metadata.png ?? pngFile;
	const entry = { ...metadata };
	if (finalPng) {
		entry.png = finalPng;
	}
	return entry;
}
