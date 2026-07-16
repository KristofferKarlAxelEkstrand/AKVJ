import fs from 'node:fs/promises';
import path from 'node:path';

/**
 * Regex to match a data row in the expanded messages table.
 * Format: `10000000= 80= 128 | Chan 1 Note off | Note Number (0-127) | Note Velocity (0-127)`
 * Captures: binary, hex, decimal, function, data_byte_1, data_byte_2
 */
const DATA_ROW_REGEX = /^([01]{8})=\s+([0-9A-Fa-f]{2})=\s+(\d+)\s+\|\s+(.+?)\s+\|\s+(.+?)\s+\|\s+(.+?)$/;

/**
 * Regex to match the header row (to skip it).
 */
const HEADER_ROW_REGEX = /^1st Byte Value Binary/;

/**
 * Regex to match the table title row (to skip it).
 */
const TITLE_ROW_REGEX = /^STATUS BYTE/;

/**
 * Categorizes a message by its status byte hex value.
 *
 * @param {string} hex - The hex status byte (e.g. "80", "F0").
 * @returns {string} The category: "channel_voice" or "system".
 */
function categorizeMessage(hex) {
	const upperHex = hex.toUpperCase();
	if (upperHex >= '80' && upperHex <= 'EF') {
		return 'channel_voice';
	}
	return 'system';
}

/**
 * Extracts the message type from the function description.
 *
 * @param {string} functionDescription - The function text (e.g. "Chan 1 Note off").
 * @returns {string} The message type (e.g. "Note Off", "Note On", "System Exclusive").
 */
function extractMessageType(functionDescription) {
	// Channel voice messages: "Chan N <Type>"
	const chanMatch = functionDescription.match(/^Chan\s+\d+\s+(.+)$/);
	if (chanMatch) {
		return chanMatch[1].trim();
	}
	// System messages: just the function name
	return functionDescription.trim();
}

/**
 * Extracts the channel number from the function description.
 *
 * @param {string} functionDescription - The function text.
 * @returns {number|null} Channel number (1-16) or null for system messages.
 */
function extractChannel(functionDescription) {
	const chanMatch = functionDescription.match(/^Chan\s+(\d+)\s+/);
	if (chanMatch) {
		return parseInt(chanMatch[1], 10);
	}
	return null;
}

/**
 * Transforms the Expanded MIDI 1.0 Messages List markdown document
 * into a structured JSON object.
 *
 * The document contains a pipe-delimited table with 144 rows covering:
 * - 128 channel voice messages (16 channels × 8 message types)
 * - 16 system messages (F0-FF)
 *
 * Each row has: binary, hex, decimal, function, 2nd byte, 3rd byte.
 *
 * @param {string} markdownPath - Absolute path to the source markdown file.
 * @param {string} [outDir] - Optional output directory for the JSON file.
 * @returns {Promise<object>} The structured JSON result.
 */
export async function transformExpandedMessages(markdownPath, outDir) {
	const content = await fs.readFile(markdownPath, 'utf-8');
	const lines = content.split('\n').map(l => l.trim());

	const messages = [];
	let sysexNote = '';

	for (const line of lines) {
		if (!line) {
			continue;
		}

		// Skip header/title rows
		if (line.match(TITLE_ROW_REGEX) || line.match(HEADER_ROW_REGEX)) {
			continue;
		}

		// Capture the SysEx note
		if (line.startsWith('** Note:')) {
			sysexNote = line.replace(/^\*\*\s*Note:\s*/, '').trim();
			continue;
		}

		// Parse data rows
		const match = line.match(DATA_ROW_REGEX);
		if (match) {
			const binary = match[1];
			const hex = match[2].toUpperCase();
			const decimal = parseInt(match[3], 10);
			const functionDescription = match[4].trim();
			const dataByte1 = match[5].trim();
			const dataByte2 = match[6].trim();

			const category = categorizeMessage(hex);
			const messageType = extractMessageType(functionDescription);
			const channel = extractChannel(functionDescription);

			const entry = {
				binary,
				hex,
				decimal,
				function: functionDescription,
				category,
				message_type: messageType,
				data_byte_1: dataByte1,
				data_byte_2: dataByte2
			};

			if (channel !== null) {
				entry.channel = channel;
			}

			messages.push(entry);
		}
	}

	const result = {
		metadata: {
			title: 'EXPANDED MIDI 1.0 MESSAGES LIST',
			version: '1.0.0',
			source: path.basename(markdownPath)
		},
		messages,
		sysex_note: sysexNote,
		summary: {
			total_messages: messages.length,
			channel_voice_count: messages.filter(m => m.category === 'channel_voice').length,
			system_count: messages.filter(m => m.category === 'system').length
		}
	};

	if (outDir) {
		await fs.mkdir(outDir, { recursive: true });
		await fs.writeFile(path.join(outDir, 'expanded-messages.json'), JSON.stringify(result, null, 2), 'utf-8');
	}

	return result;
}
