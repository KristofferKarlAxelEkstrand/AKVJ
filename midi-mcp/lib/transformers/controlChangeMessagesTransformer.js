import fs from 'node:fs/promises';
import path from 'node:path';

/**
 * Regex to match Control Change table rows.
 * Format: `0 | 00000000 | 00 | Bank Select | 0-127 | MSB`
 * Also handles channel mode messages: `120 | 01111000 | 78 | [Channel Mode Message] All Sound Off | 0 | —`
 */
const CC_ROW_REGEX = /^(\d+)\s*\|\s*([01]{8})\s*\|\s*([0-9A-Fa-f]{2})\s*\|\s*(.+?)\s*\|\s*(.+?)\s*\|\s*(.+)$/;

/**
 * Regex to match the RPN table header line.
 * The entire RPN table is on a single line starting with 'Parameter Number |'
 */
const RPN_HEADER_REGEX = /^Parameter Number\s*\|/;

/**
 * Regex to split RPN entries from the single-line table.
 * Matches entry starts: 'XXH |' or 'XXH (nn) |' or '… |'
 */
const RPN_ENTRY_SPLIT_REGEX = /\s+(?=(?:[0-9A-Fa-f]{2}H(?:\s*\(\d+\))?|…)\s*\|)/g;

/**
 * Regex to match an individual RPN entry after splitting.
 * Format: '00H | 00H | Pitch Bend Sensitivity | MSB = +/- semitones LSB =+/–cents'
 * Or: '3DH (61) | Three Dimensional Sound Controllers'
 * Or: '… | … | All RESERVED for future MMA Definition | …'
 */
const RPN_ENTRY_PARSE_REGEX = /^([0-9A-Fa-f]{2}H(?:\s*\(\d+\))?|…)\s*\|\s*(.+)$/;

/**
 * Transforms the MIDI 1.0 Control Change Messages markdown document
 * into a structured JSON object.
 *
 * The document contains:
 * - Table 3: 128 Control Change entries (decimal, binary, hex, function, value, used_as)
 * - Table 3a: Registered Parameter Numbers (RPNs)
 *
 * @param {string} markdownPath - Absolute path to the source markdown file.
 * @param {string} [outDir] - Optional output directory for the JSON file.
 * @returns {Promise<object>} The structured JSON result.
 */
export async function transformControlChangeMessages(markdownPath, outDir) {
	const content = await fs.readFile(markdownPath, 'utf-8');
	const lines = content.split('\n').map(l => l.trim());

	const controlChanges = [];
	const rpnEntries = [];

	for (const line of lines) {
		if (!line) {
			continue;
		}

		// Skip page headers and boilerplate
		if (line.startsWith('#') || line.startsWith('Download') || line.startsWith('Sign up') || line.startsWith('About') || line.startsWith('MIDI Association') || line.startsWith('Privacy') || line.startsWith('©') || line.startsWith('As a Sysex') || line.startsWith('WARNING') || line.startsWith('The following') || line.startsWith('Registered Parameter') || line.startsWith('Table 3') || line.startsWith('Note:')) {
			continue;
		}

		// Parse Control Change table rows
		const ccMatch = line.match(CC_ROW_REGEX);
		if (ccMatch) {
			controlChanges.push({
				decimal: parseInt(ccMatch[1], 10),
				binary: ccMatch[2],
				hex: ccMatch[3].toUpperCase(),
				function: ccMatch[4].trim(),
				value: ccMatch[5].trim(),
				used_as: ccMatch[6].trim()
			});
			continue;
		}

		// Parse RPN table — the entire table is on a single line
		if (line.match(RPN_HEADER_REGEX)) {
			// Strip the header prefix to get just the entries
			const headerEndIndex = line.indexOf('Value ') + 'Value '.length;
			const rpnData = line.substring(headerEndIndex);

			// Split by entry start patterns
			const entries = rpnData.split(RPN_ENTRY_SPLIT_REGEX);

			for (const entry of entries) {
				const trimmed = entry.trim();
				if (!trimmed) {
					continue;
				}
				const match = trimmed.match(RPN_ENTRY_PARSE_REGEX);
				if (match) {
					rpnEntries.push({
						parameter_number: match[1].trim().toUpperCase(),
						description: match[2].trim()
					});
				}
			}
			continue;
		}
	}

	const result = {
		metadata: {
			title: 'MIDI 1.0 Control Change Messages (Data Bytes)',
			doc_id: 'CC-MESSAGES',
			version: '1.0.0',
			source: path.basename(markdownPath)
		},
		table_3_control_changes: controlChanges,
		table_3a_rpn_entries: rpnEntries,
		summary: {
			control_change_count: controlChanges.length,
			rpn_entry_count: rpnEntries.length
		}
	};

	if (outDir) {
		await fs.mkdir(outDir, { recursive: true });
		await fs.writeFile(path.join(outDir, 'control-change-messages.json'), JSON.stringify(result, null, 2), 'utf-8');
	}

	return result;
}
