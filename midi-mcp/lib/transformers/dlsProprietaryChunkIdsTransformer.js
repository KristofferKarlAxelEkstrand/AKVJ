import fs from 'node:fs/promises';
import path from 'node:path';

/**
 * Regex to match DLS Proprietary Chunk ID entries.
 * Format: `MMA_ | MIDI Manufacturers Association`
 */
const CHUNK_ID_REGEX = /^([A-Z]{3}_)\s*\|\s*(.+)$/;

/**
 * Transforms the DLS Proprietary Chunk IDs markdown document
 * into a structured JSON object.
 *
 * @param {string} markdownPath - Absolute path to the source markdown file.
 * @param {string} [outDir] - Optional output directory for the JSON file.
 * @returns {Promise<object>} The structured JSON result.
 */
export async function transformDlsProprietaryChunkIds(markdownPath, outDir) {
	const content = await fs.readFile(markdownPath, 'utf-8');
	const lines = content.split('\n');

	const chunkIds = [];
	let description = '';
	let asOfDate = null;

	let collectingDescription = false;

	for (const rawLine of lines) {
		const line = rawLine.trim();
		if (!line) {
			continue;
		}

		// Skip frontmatter, headers, and boilerplate
		if (line.startsWith('---') || line.startsWith('title:') || line.startsWith('protocol:') || line.startsWith('source:') || line.startsWith('sourceType:') || line.startsWith('sha256:') || line.startsWith('extractedAt:') || line.startsWith('summary:') || line.startsWith('# DLS') || line.startsWith('Download') || line.startsWith('### Join') || line.startsWith('Sign up') || line.startsWith('About the MIDI') || line.startsWith('MIDI Association') || line.startsWith('Media Enquiries') || line.startsWith('Privacy Policy') || line.startsWith('©')) {
			continue;
		}

		// Detect the "Current as of" date line
		const dateMatch = line.match(/Current as of\s+(.+)$/i);
		if (dateMatch) {
			asOfDate = dateMatch[1].trim();
			collectingDescription = false;
			continue;
		}

		// Parse chunk ID entries
		const chunkMatch = line.match(CHUNK_ID_REGEX);
		if (chunkMatch) {
			chunkIds.push({
				chunk_id: chunkMatch[1].trim(),
				manufacturer: chunkMatch[2].trim()
			});
			collectingDescription = false;
			continue;
		}

		// Collect description text (paragraphs before the table)
		if (line.startsWith('The MMA maintains') || line.startsWith('The MMA assignment') || line.startsWith('Upon acceptance') || line.startsWith('The Downloadable') || line.startsWith('As a Sysex')) {
			collectingDescription = true;
		}

		if (collectingDescription) {
			if (chunkIds.length === 0 && !line.startsWith('DLS PROPRIETARY')) {
				description += (description ? ' ' : '') + line;
			}
		}
	}

	const result = {
		metadata: {
			title: 'DLS Proprietary Chunk IDs',
			protocol: 'midi1',
			source: path.basename(markdownPath),
			as_of_date: asOfDate
		},
		description: description.trim(),
		chunk_ids: chunkIds,
		summary: {
			chunk_id_count: chunkIds.length
		}
	};

	if (outDir) {
		await fs.mkdir(outDir, { recursive: true });
		await fs.writeFile(path.join(outDir, 'dls-proprietary-chunk-ids.json'), JSON.stringify(result, null, 2), 'utf-8');
	}

	return result;
}
