import fs from 'node:fs/promises';
import path from 'node:path';

/**
 * Regex to match message format field lines.
 * Format: `0A sub-ID#1 = "Key-Based Instrument Control"` or `kk Key number` or `0n MIDI Channel Number`
 */
const FIELD_REGEX = /^([0-9A-Fa-f]{2}|[a-z]{2}|[0-9][a-z]|<.+?>|\[.+?\])\s+(.+)$/;

/**
 * Regex to match controller table rows.
 * Format: `7 07H Note Volume 00H-40H-7FH` or `10 0AH *Pan 00H-7FH absolute`
 * Also matches ranges: `33-63 21-3FH LSB for 01H-1FH`
 * Captures: CC# range, hex code, name (middle, may have * markers), value range (last H-containing token, may have 'absolute' suffix)
 */
const CONTROLLER_ROW_REGEX = /^(\d+(?:-\d+)?)\s+([0-9A-Fa-f]+(?:-[0-9A-Fa-f]+)?H)\s+(.+?)\s+([0-9A-Fa-f]+(?:H(?:-[0-9A-Fa-f]+H)*))(?:\s+(absolute))?$/;

/**
 * Transforms the CA-023 Key-Based Instrument Controllers markdown document
 * into a structured JSON object.
 *
 * The document contains:
 * - Message format with byte field definitions
 * - Table of 13 commonly-used controllers with CC#, hex, name, value range
 * - Footnotes about absolute/relative and redefined parameters
 *
 * @param {string} markdownPath - Absolute path to the source markdown file.
 * @param {string} [outDir] - Optional output directory for the JSON file.
 * @returns {Promise<object>} The structured JSON result.
 */
export async function transformCa23(markdownPath, outDir) {
	const content = await fs.readFile(markdownPath, 'utf-8');
	const lines = content.split('\n').map(l => l.trim());

	const messageFields = [];
	const controllers = [];
	const notes = [];

	let inMessageFormat = false;
	let inControllerTable = false;
	let inNotes = false;

	for (const line of lines) {
		if (!line) {
			continue;
		}

		// Skip page headers and boilerplate
		if (line.startsWith('## Page') || line.startsWith('Confirmation of') || line.startsWith('MMA Technical') || line.startsWith('AMEI MIDI')) {
			continue;
		}

		// Detect message format section
		if (line.startsWith('F0 7F <device ID> 0A 01')) {
			inMessageFormat = true;
			inControllerTable = false;
			inNotes = false;
			continue;
		}

		// Detect controller table header
		if (line === 'CC# nn Name vv') {
			inMessageFormat = false;
			inControllerTable = true;
			inNotes = false;
			continue;
		}

		// Detect notes section (footnotes starting with *)
		if (line.startsWith('*') && !line.match(CONTROLLER_ROW_REGEX)) {
			inMessageFormat = false;
			inControllerTable = false;
			inNotes = true;
			notes.push(line);
			continue;
		}

		// Detect notes starting with **
		if (line.startsWith('**') && !line.match(CONTROLLER_ROW_REGEX)) {
			inMessageFormat = false;
			inControllerTable = false;
			inNotes = true;
			notes.push(line);
			continue;
		}

		// Skip separator line in controller table
		if (inControllerTable && line.startsWith('---')) {
			continue;
		}

		// Stop controller table at non-matching lines
		if (inControllerTable && (line.startsWith('Any controller') || line.startsWith('Multiple') || line.startsWith('Key-Based'))) {
			inControllerTable = false;
			// Fall through to check if it's a note
		}

		// Parse message format fields
		if (inMessageFormat) {
			if (line === ':' || line === 'F7 EOX') {
				if (line === 'F7 EOX') {
					messageFields.push({ code: 'F7', description: 'EOX' });
				}
				inMessageFormat = false;
				continue;
			}
			const match = line.match(FIELD_REGEX);
			if (match) {
				messageFields.push({
					code: match[1],
					description: match[2].trim()
				});
			}
			continue;
		}

		// Parse controller table rows
		if (inControllerTable) {
			const match = line.match(CONTROLLER_ROW_REGEX);
			if (match) {
				const ccRange = match[1];
				const hexCode = match[2];
				const name = match[3].trim();
				const valueRange = match[4];

				// Detect markers in name
				const isRedefined = name.includes('**');
				const isAbsolute = (name.includes('*') && !isRedefined) || match[5] === 'absolute';
				const cleanName = name
					.replace(/^\*+\s*/, '')
					.replace(/\s*\*+$/, '')
					.trim();

				controllers.push({
					cc_number: ccRange,
					hex_code: hexCode.toUpperCase(),
					name: cleanName,
					value_range: valueRange.toUpperCase(),
					absolute: isAbsolute,
					redefined: isRedefined
				});
			}
			continue;
		}

		// Parse remaining notes
		if (inNotes) {
			if (line.startsWith('Any controller') || line.startsWith('Multiple') || line.startsWith('Key-Based')) {
				notes.push(line);
				continue;
			}
			if (line.startsWith('Values below') || line.startsWith('Units and') || line.startsWith('recommended practice') || line.startsWith('See General')) {
				notes.push(line);
				continue;
			}
		}
	}

	const result = {
		metadata: {
			title: 'Key-Based Instrument Controllers',
			doc_id: 'CA-023',
			version: '1.0.0',
			source: path.basename(markdownPath)
		},
		message_format: {
			template: 'F0 7F <device ID> 0A 01 0n kk [nn vv] .. F7',
			fields: messageFields
		},
		controllers,
		notes,
		summary: {
			message_field_count: messageFields.length,
			controller_count: controllers.length,
			note_count: notes.length
		}
	};

	if (outDir) {
		await fs.mkdir(outDir, { recursive: true });
		await fs.writeFile(path.join(outDir, 'ca23-key-based-instrument-controllers.json'), JSON.stringify(result, null, 2), 'utf-8');
	}

	return result;
}
