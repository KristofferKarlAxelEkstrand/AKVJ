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
 * Parses a size cell (e.g. "32 bits", "64 bits", "128 bits") into a numeric bit count.
 *
 * @param {string} raw - The raw cell value.
 * @returns {number} Numeric bit count (e.g. 32, 64, 128).
 */
function parseSizeBits(raw) {
	const match = raw.match(/(\d+)\s*bits?/i);
	if (match) {
		return parseInt(match[1], 10);
	}
	return 0;
}

/**
 * Transforms the MIDI 2.0 / UMP Quick Reference markdown document
 * into a structured JSON object.
 *
 * The document contains:
 * 1. A UMP message type table (MT, Size, Contents) — 8 entries
 * 2. A MIDI 2.0 Channel Voice messages table (Opcode, Message, Resolution) — 15 entries
 * 3. Structured sections: value scaling, timing, MIDI-CI, Web MIDI status
 *
 * @param {string} markdownPath - Absolute path to the source markdown file.
 * @param {string} [outDir] - Optional output directory for the JSON file.
 * @returns {Promise<object>} The structured JSON result.
 */
export async function transformMidi2Ump(markdownPath, outDir) {
	const content = await fs.readFile(markdownPath, 'utf-8');
	const lines = content.split('\n');

	const result = {
		metadata: {
			title: 'MIDI 2.0 / UMP Quick Reference',
			version: '1.0.0',
			source: path.basename(markdownPath)
		},
		ump_message_types: [],
		midi2_channel_voice_messages: [],
		notes: {}
	};

	let currentTable = null;
	let currentHeaders = null;
	let inTable = false;
	let currentSection = null;
	let currentNoteLines = [];

	function flushNotes() {
		if (currentSection && currentNoteLines.length > 0) {
			result.notes[currentSection] = currentNoteLines.join(' ');
		}
		currentNoteLines = [];
	}

	for (const line of lines) {
		const trimmed = line.trim();

		// Detect section headers
		if (trimmed === '## Universal MIDI Packet (UMP)') {
			flushNotes();
			currentSection = null;
			currentTable = 'ump_message_types';
			currentHeaders = null;
			inTable = false;
			continue;
		}

		if (trimmed === '## MIDI 2.0 Channel Voice messages (MT 0x4)') {
			flushNotes();
			currentSection = null;
			currentTable = 'midi2_channel_voice';
			currentHeaders = null;
			inTable = false;
			continue;
		}

		if (trimmed === '## Value scaling between MIDI 1.0 and 2.0 (M2-115-U)') {
			flushNotes();
			currentTable = null;
			inTable = false;
			currentSection = 'value_scaling';
			currentNoteLines = [];
			continue;
		}

		if (trimmed === '## Timing') {
			flushNotes();
			currentTable = null;
			inTable = false;
			currentSection = 'timing';
			currentNoteLines = [];
			continue;
		}

		if (trimmed === '## MIDI-CI (M2-101-UM)') {
			flushNotes();
			currentTable = null;
			inTable = false;
			currentSection = 'midi_ci';
			currentNoteLines = [];
			continue;
		}

		if (trimmed === '## Web MIDI status') {
			flushNotes();
			currentTable = null;
			inTable = false;
			currentSection = 'web_midi_status';
			currentNoteLines = [];
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

			if (!inTable || !currentTable) {
				continue;
			}

			if (currentTable === 'ump_message_types') {
				result.ump_message_types.push({
					mt: cells[0],
					size_bits: parseSizeBits(cells[1]),
					contents: cells[2] || ''
				});
			} else if (currentTable === 'midi2_channel_voice') {
				result.midi2_channel_voice_messages.push({
					opcode: cells[0],
					message: cells[1] || '',
					resolution: cells[2] || ''
				});
			}
			continue;
		}

		// Collect note lines for structured sections
		if (currentSection && trimmed && !trimmed.startsWith('|')) {
			// Skip the intro paragraph before the table in UMP section
			if (currentTable && !inTable) {
				// This is intro text before a table — skip
				continue;
			}
			if (!currentTable) {
				// This is a note section
				currentNoteLines.push(trimmed);
			}
			continue;
		}

		// Non-table, non-header line ends table context
		if (inTable && trimmed && !trimmed.startsWith('|')) {
			inTable = false;
			currentHeaders = null;
		}
	}

	flushNotes();

	if (outDir) {
		await fs.mkdir(outDir, { recursive: true });
		await fs.writeFile(path.join(outDir, 'midi2-ump.json'), JSON.stringify(result, null, 2), 'utf-8');
	}

	return result;
}
