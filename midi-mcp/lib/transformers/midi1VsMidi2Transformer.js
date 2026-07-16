import fs from 'node:fs/promises';
import path from 'node:path';

/**
 * Regex to match a markdown table separator row (e.g. `| --- | --- |`).
 */
const SEPARATOR_ROW_REGEX = /^\|[\s-]+\|/;

/**
 * Regex to match a markdown table row starting with `|`.
 */
const TABLE_ROW_REGEX = /^\|.*\|$/;

/**
 * Regex to match a numbered list item (e.g. `1. **Velocity 0**: ...`).
 * Captures the number, the bold topic (optional), and the description.
 */
const NUMBERED_LIST_REGEX = /^(\d+)\.\s+\*\*(.+?)\*\*:\s+(.+)$/;

/**
 * Parses a markdown table row into an array of cell values.
 *
 * @param {string} row - A markdown table row.
 * @returns {string[]} Array of trimmed cell values.
 */
function parseTableRow(row) {
	return row
		.split('|')
		.map(cell => cell.trim())
		.filter(cell => cell !== '');
}

/**
 * Transforms the MIDI 1.0 vs MIDI 2.0 Comparison markdown document
 * into a structured JSON object.
 *
 * The document contains:
 * 1. A comparison table (16 rows × 3 cols: Capability, MIDI 1.0, MIDI 2.0)
 * 2. A "Translation gotchas" section with 4 numbered items
 * 3. A "Practical guidance for this repo (AKVJ)" section with a paragraph
 *
 * @param {string} markdownPath - Absolute path to the source markdown file.
 * @param {string} [outDir] - Optional output directory for the JSON file.
 * @returns {Promise<object>} The structured JSON result.
 */
export async function transformMidi1VsMidi2(markdownPath, outDir) {
	const content = await fs.readFile(markdownPath, 'utf-8');
	const lines = content.split('\n');

	const comparisons = [];
	const translationGotchas = [];
	let practicalGuidance = '';

	let currentHeaders = null;
	let inTable = false;
	let currentSection = null;

	for (const line of lines) {
		const trimmed = line.trim();

		// Detect section headers
		if (trimmed === '## Translation gotchas (MIDI 1.0 ↔ 2.0)') {
			currentSection = 'translation_gotchas';
			inTable = false;
			currentHeaders = null;
			continue;
		}

		if (trimmed === '## Practical guidance for this repo (AKVJ)') {
			currentSection = 'practical_guidance';
			inTable = false;
			currentHeaders = null;
			continue;
		}

		// Process table rows
		if (trimmed.match(TABLE_ROW_REGEX)) {
			if (trimmed.match(SEPARATOR_ROW_REGEX)) {
				continue;
			}

			const cells = parseTableRow(trimmed);

			if (!currentHeaders) {
				currentHeaders = cells.map(h => h.toLowerCase());
				inTable = true;
				continue;
			}

			if (!inTable) {
				continue;
			}

			comparisons.push({
				capability: cells[0] || '',
				midi_1_0: cells[1] || '',
				midi_2_0: cells[2] || ''
			});
			continue;
		}

		// Non-table line ends table context
		if (inTable && trimmed && !trimmed.startsWith('|')) {
			inTable = false;
			currentHeaders = null;
		}

		// Process numbered list items for translation gotchas
		if (currentSection === 'translation_gotchas') {
			const match = trimmed.match(NUMBERED_LIST_REGEX);
			if (match) {
				translationGotchas.push({
					number: parseInt(match[1], 10),
					topic: match[2] || '',
					description: match[3] || ''
				});
			}
			continue;
		}

		// Process practical guidance paragraph
		if (currentSection === 'practical_guidance' && trimmed) {
			practicalGuidance = trimmed;
			continue;
		}
	}

	const result = {
		metadata: {
			title: 'MIDI 1.0 vs MIDI 2.0 Comparison',
			version: '1.0.0',
			source: path.basename(markdownPath)
		},
		comparisons,
		translation_gotchas: translationGotchas,
		practical_guidance: practicalGuidance
	};

	if (outDir) {
		await fs.mkdir(outDir, { recursive: true });
		await fs.writeFile(path.join(outDir, 'midi1-vs-midi2.json'), JSON.stringify(result, null, 2), 'utf-8');
	}

	return result;
}
