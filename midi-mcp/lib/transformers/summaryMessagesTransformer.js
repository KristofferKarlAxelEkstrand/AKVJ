import fs from 'node:fs/promises';
import path from 'node:path';

/**
 * Regex to match a data row with 3 pipe-separated columns.
 * Format: `1000nnnn | 0kkkkkkk 0vvvvvvv | Note Off event...`
 * Also matches rows with empty status (sub-entries): ` | All Sound Off...`
 * Also matches rows with empty data bytes: `11110100 |  | Undefined. (Reserved)`
 */
const DATA_ROW_REGEX = /^([^|]*)\|([^|]*)\|(.+)$/;

/**
 * Section header lines that indicate category boundaries.
 */
const SECTION_HEADERS = new Set(['Channel Voice Messages [nnnn = 0-15 (MIDI Channel Number 1-16)]', 'Channel Mode Messages (See also Control Change, above)', 'System Common Messages', 'System Real-Time Messages']);

/**
 * Maps section header text to category key.
 */
const SECTION_CATEGORY_MAP = {
	'Channel Voice Messages [nnnn = 0-15 (MIDI Channel Number 1-16)]': 'channel_voice',
	'Channel Mode Messages (See also Control Change, above)': 'channel_mode',
	'System Common Messages': 'system_common',
	'System Real-Time Messages': 'system_real_time'
};

/**
 * Extracts the message type name from a description string.
 * Uses the first sentence (up to period or end of string).
 *
 * @param {string} description - The full description text.
 * @returns {string} The short message type name.
 */
function extractMessageType(description) {
	const firstSentence = description.split('.')[0];
	return firstSentence.trim();
}

/**
 * Transforms the Summary of MIDI 1.0 Messages markdown document
 * into a structured JSON object.
 *
 * The document contains a pipe-delimited table with 3 columns:
 * - Status (binary pattern with nnnn placeholders)
 * - Data Byte(s) (binary pattern, may be empty)
 * - Description (full text description)
 *
 * Categories:
 * - Channel Voice (7 entries: Note Off, Note On, Poly Aftertouch, CC, Program Change, Channel Pressure, Pitch Bend)
 * - Channel Mode (1 main entry + 4 sub-entries for mode commands)
 * - System Common (8 entries: SysEx through EOX)
 * - System Real-Time (8 entries: Timing Clock through Reset)
 *
 * @param {string} markdownPath - Absolute path to the source markdown file.
 * @param {string} [outDir] - Optional output directory for the JSON file.
 * @returns {Promise<object>} The structured JSON result.
 */
export async function transformSummaryMessages(markdownPath, outDir) {
	const content = await fs.readFile(markdownPath, 'utf-8');
	const lines = content.split('\n').map(l => l.trim());

	const messages = [];
	let currentCategory = null;
	let lastMainEntry = null;

	let inTable = false;

	for (const line of lines) {
		if (!line) {
			continue;
		}

		// Skip "Download" lines (appear both before and after table)
		if (line === 'Download') {
			continue;
		}

		// Detect section headers
		if (SECTION_HEADERS.has(line)) {
			currentCategory = SECTION_CATEGORY_MAP[line];
			inTable = true;
			continue;
		}

		// Handle continuation lines (no pipes) in channel_mode section
		if (inTable && currentCategory === 'channel_mode' && !line.includes('|') && lastMainEntry) {
			lastMainEntry.sub_entries.push({
				data_bytes: '',
				description: line
			});
			continue;
		}

		// Handle sub-entries with only one pipe in channel_mode section
		// (e.g. " | All Sound Off. When All Sound Off is received...")
		if (inTable && currentCategory === 'channel_mode' && line.includes('|') && lastMainEntry) {
			const pipeCount = (line.match(/\|/g) || []).length;
			if (pipeCount === 1) {
				const parts = line.split('|');
				lastMainEntry.sub_entries.push({
					data_bytes: parts[0].trim(),
					description: parts[1].trim()
				});
				continue;
			}
		}

		// Skip non-table lines
		if (!line.includes('|')) {
			continue;
		}

		// Skip header rows
		if (line.startsWith('Status D7') || line.startsWith('Table 1')) {
			continue;
		}

		// Parse data rows
		const match = line.match(DATA_ROW_REGEX);
		if (!match) {
			continue;
		}

		const statusByte = match[1].trim();
		const dataBytes = match[2].trim();
		const description = match[3].trim();

		// Skip footer lines that don't have valid binary status byte patterns
		// Valid patterns: contains only 0, 1, n characters (e.g. "1000nnnn", "11110000")
		// or is empty (sub-entry with empty status byte)
		if (statusByte && !/^[01n]+$/.test(statusByte)) {
			continue;
		}

		// Sub-entry: empty status byte means this is a continuation
		// of the previous main entry (e.g. Channel Mode sub-commands)
		if (!statusByte && lastMainEntry) {
			lastMainEntry.sub_entries.push({
				data_bytes: dataBytes,
				description: description
			});
			continue;
		}

		// Main entry
		const entry = {
			status_byte: statusByte,
			data_bytes: dataBytes,
			description: description,
			message_type: extractMessageType(description),
			category: currentCategory,
			sub_entries: []
		};

		messages.push(entry);
		lastMainEntry = entry;
	}

	// Remove empty sub_entries arrays from entries that have none
	for (const entry of messages) {
		if (entry.sub_entries.length === 0) {
			delete entry.sub_entries;
		}
	}

	const result = {
		metadata: {
			title: 'Summary of MIDI 1.0 Messages',
			version: '1.0.0',
			source: path.basename(markdownPath)
		},
		messages,
		summary: {
			total_entries: messages.length,
			channel_voice_count: messages.filter(m => m.category === 'channel_voice').length,
			channel_mode_count: messages.filter(m => m.category === 'channel_mode').length,
			system_common_count: messages.filter(m => m.category === 'system_common').length,
			system_real_time_count: messages.filter(m => m.category === 'system_real_time').length
		}
	};

	if (outDir) {
		await fs.mkdir(outDir, { recursive: true });
		await fs.writeFile(path.join(outDir, 'summary-messages.json'), JSON.stringify(result, null, 2), 'utf-8');
	}

	return result;
}
