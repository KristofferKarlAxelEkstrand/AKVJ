import fs from 'node:fs/promises';
import path from 'node:path';

/**
 * Regex to match a markdown table separator row (e.g. `| ---- | ---- |`).
 */
const SEPARATOR_ROW_REGEX = /^\|[\s-]+\|/;

/**
 * Regex to match a markdown table header row starting with `|`.
 */
const TABLE_ROW_REGEX = /^\|.*\|$/;

/**
 * Parses a markdown table row into an array of cell values.
 *
 * @param {string} row - A markdown table row (e.g. `| 0x8n | Note Off | 3 | ... |`).
 * @returns {string[]} Array of trimmed cell values.
 */
function parseTableRow(row) {
	return row
		.split('|')
		.map(cell => cell.trim())
		.filter(cell => cell !== '');
}

/**
 * Parses a `total_bytes` cell value into a number or string.
 *
 * @param {string} raw - The raw cell value (e.g. "3", "variable", "—").
 * @returns {number|string|null} Numeric byte count, "variable", or null for "—".
 */
function parseTotalBytes(raw) {
	const trimmed = raw.trim();
	if (trimmed === '—' || trimmed === '-' || trimmed === '') {
		return null;
	}
	if (trimmed.toLowerCase() === 'variable') {
		return 'variable';
	}
	const parsed = parseInt(trimmed, 10);
	if (!Number.isNaN(parsed)) {
		return parsed;
	}
	return trimmed;
}

/**
 * Transforms the MIDI 1.0 Status Byte Quick Reference markdown document
 * into a structured JSON object.
 *
 * The document contains 3 markdown tables:
 * 1. Channel Voice Messages (5 columns: Status, Message, Total bytes, Data byte 1, Data byte 2)
 * 2. System Common Messages (4 columns: Status, Message, Total bytes, Data)
 * 3. System Real-Time Messages (3 columns: Status, Message, Notes)
 *
 * Plus a "## Parsing rules" section with bullet points.
 *
 * @param {string} markdownPath - Absolute path to the source markdown file.
 * @param {string} [outDir] - Optional output directory for the JSON file.
 * @returns {Promise<object>} The structured JSON result.
 */
export async function transformStatusBytes(markdownPath, outDir) {
	const content = await fs.readFile(markdownPath, 'utf-8');
	const lines = content.split('\n');

	const categories = [];
	const parsingRules = [];

	let currentCategory = null;
	let currentHeaders = null;
	let inTable = false;
	let inParsingRules = false;

	for (let i = 0; i < lines.length; i++) {
		const line = lines[i].trim();

		// Detect section headers
		if (line === '## Channel Voice Messages') {
			currentCategory = { name: 'channel_voice', description: 'Channel Voice Messages', messages: [] };
			categories.push(currentCategory);
			currentHeaders = null;
			inTable = false;
			continue;
		}

		if (line === '## System Common Messages') {
			currentCategory = { name: 'system_common', description: 'System Common Messages', messages: [] };
			categories.push(currentCategory);
			currentHeaders = null;
			inTable = false;
			continue;
		}

		if (line.startsWith('## System Real-Time Messages')) {
			currentCategory = { name: 'system_real_time', description: 'System Real-Time Messages', messages: [] };
			categories.push(currentCategory);
			currentHeaders = null;
			inTable = false;
			continue;
		}

		if (line === '## Parsing rules') {
			inParsingRules = true;
			inTable = false;
			continue;
		}

		if (inParsingRules) {
			// Collect bullet points as parsing rules
			if (line.startsWith('- ')) {
				parsingRules.push(line.slice(2).trim());
			}
			continue;
		}

		// Process table rows
		if (line.match(TABLE_ROW_REGEX)) {
			// Skip separator rows
			if (line.match(SEPARATOR_ROW_REGEX)) {
				continue;
			}

			const cells = parseTableRow(line);

			// If no headers yet, this is the header row
			if (!currentHeaders) {
				currentHeaders = cells.map(h => h.toLowerCase());
				inTable = true;
				continue;
			}

			if (!inTable || !currentCategory) {
				continue;
			}

			// Build message entry based on category type
			const message = { status: cells[0], message: cells[1] };

			if (currentCategory.name === 'channel_voice') {
				message.total_bytes = parseTotalBytes(cells[2]);
				message.data_byte_1 = cells[3] || '';
				message.data_byte_2 = cells[4] || '';
			} else if (currentCategory.name === 'system_common') {
				message.total_bytes = parseTotalBytes(cells[2]);
				message.data = cells[3] || '';
			} else if (currentCategory.name === 'system_real_time') {
				message.notes = cells[2] || '';
			}

			currentCategory.messages.push(message);
			continue;
		}

		// Non-table, non-header line ends table context
		if (inTable && line && !line.startsWith('|')) {
			inTable = false;
			currentHeaders = null;
		}
	}

	const result = {
		metadata: {
			title: 'MIDI 1.0 Status Byte Quick Reference',
			version: '1.0.0',
			source: path.basename(markdownPath)
		},
		categories,
		parsing_rules: parsingRules
	};

	if (outDir) {
		await fs.mkdir(outDir, { recursive: true });
		await fs.writeFile(path.join(outDir, 'status-bytes.json'), JSON.stringify(result, null, 2), 'utf-8');
	}

	return result;
}
