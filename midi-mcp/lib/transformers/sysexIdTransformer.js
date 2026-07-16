import fs from 'node:fs/promises';
import path from 'node:path';

/**
 * Regex to match a 1-byte SysEx ID line: `XXH | Company Name`
 * Captures the hex ID (with H suffix) and the company name.
 */
const ONE_BYTE_REGEX = /^([0-9A-Fa-f]{2}H)\s*\|\s*(.+)$/;

/**
 * Regex to match a 1-byte SysEx ID range line: `XXH to YYH | Company Name`
 * Captures both hex IDs and the company name.
 */
const ONE_BYTE_RANGE_REGEX = /^([0-9A-Fa-f]{2}H)\s+to\s+([0-9A-Fa-f]{2}H)\s*\|\s*(.+)$/;

/**
 * Regex to match a 3-byte SysEx ID line: `XXH YYH ZZH | Company Name`
 * Captures all three hex IDs and the company name.
 */
const THREE_BYTE_REGEX = /^([0-9A-Fa-f]{2}H)\s+([0-9A-Fa-f]{2}H)\s+([0-9A-Fa-f]{2}H)\s*\|\s*(.+)$/;

/**
 * Strips the trailing `H` suffix from a hex string and uppercases it.
 * e.g. "0aH" -> "0A", "00H" -> "00"
 *
 * @param {string} hexWithSuffix - Hex value with trailing H (e.g. "41H").
 * @returns {string} Uppercased hex without H suffix (e.g. "41").
 */
function stripHexSuffix(hexWithSuffix) {
	return hexWithSuffix.replace(/H$/i, '').toUpperCase();
}

/**
 * Parses a line from the SysEx ID table markdown document.
 *
 * @param {string} line - A single trimmed line from the markdown.
 * @returns {{type: 'one_byte'|'one_byte_range'|'three_byte', idHex: string, company: string, id?: string, idRange?: string[], idBytes?: string[]} | null}
 *   Parsed entry or null if the line doesn't match any known pattern.
 */
function parseLine(line) {
	const rangeMatch = line.match(ONE_BYTE_RANGE_REGEX);
	if (rangeMatch) {
		return {
			type: 'one_byte_range',
			idHex: `${rangeMatch[1]} to ${rangeMatch[2]}`,
			idRange: [stripHexSuffix(rangeMatch[1]), stripHexSuffix(rangeMatch[2])],
			company: rangeMatch[3].trim()
		};
	}

	const threeByteMatch = line.match(THREE_BYTE_REGEX);
	if (threeByteMatch) {
		return {
			type: 'three_byte',
			idHex: `${threeByteMatch[1]} ${threeByteMatch[2]} ${threeByteMatch[3]}`,
			idBytes: [stripHexSuffix(threeByteMatch[1]), stripHexSuffix(threeByteMatch[2]), stripHexSuffix(threeByteMatch[3])],
			company: threeByteMatch[4].trim()
		};
	}

	const oneByteMatch = line.match(ONE_BYTE_REGEX);
	if (oneByteMatch) {
		return {
			type: 'one_byte',
			idHex: oneByteMatch[1],
			id: stripHexSuffix(oneByteMatch[1]),
			company: oneByteMatch[2].trim()
		};
	}

	return null;
}

/**
 * Section header markers used to detect group transitions.
 */
const SECTION_MARKERS = [
	{ marker: 'Assigned Manufacturer MIDI SysEx ID Numbers', name: 'Assigned Manufacturer MIDI SysEx ID Numbers', idType: 'one_byte' },
	{ marker: '# European & Asian Group', name: 'European & Asian Group', idType: 'three_byte' },
	{ marker: '## Japanese (AMEI) Group', name: 'Japanese (AMEI) Group', idType: 'mixed' },
	{ marker: '## Japanese (AMEI) SysEx Id Holders', name: 'Japanese (AMEI) SysEx Id Holders', idType: 'three_byte' }
];

/**
 * Stop marker — parsing ends when this line is encountered.
 */
const STOP_MARKER = '### Join Us';

/**
 * Transforms the SysEx ID Table markdown document into a structured JSON object.
 *
 * The document contains 5 groups:
 * 1. Assigned Manufacturer MIDI SysEx ID Numbers (1-byte IDs)
 * 2. Standard Three-Byte IDs (3-byte IDs with no explicit header)
 * 3. European & Asian Group (3-byte IDs)
 * 4. Japanese (AMEI) Group (mixed 1-byte and 3-byte IDs)
 * 5. Japanese (AMEI) SysEx Id Holders (3-byte IDs)
 *
 * @param {string} markdownPath - Absolute path to the source markdown file.
 * @param {string} [outDir] - Optional output directory for the JSON file.
 * @returns {Promise<object>} The structured JSON result.
 */
export async function transformSysexIds(markdownPath, outDir) {
	const content = await fs.readFile(markdownPath, 'utf-8');
	const lines = content.split('\n').map(l => l.trim());

	const groups = [];
	let currentGroup = null;
	let foundOneByteSection = false;
	let foundThreeByteStart = false;

	for (const line of lines) {
		if (!line) {
			continue;
		}

		if (line === STOP_MARKER) {
			break;
		}

		// Check for section headers
		let sectionMatched = false;
		for (const section of SECTION_MARKERS) {
			if (line.includes(section.marker)) {
				if (currentGroup) {
					groups.push(currentGroup);
				}
				currentGroup = { name: section.name, id_type: section.idType, entries: [] };
				foundOneByteSection = true;
				sectionMatched = true;
				break;
			}
		}
		if (sectionMatched) {
			continue;
		}

		// Skip header rows like "SysEx ID Number | Company Name" or "ID Number | Company Name"
		if (line.match(/^(SysEx\s+)?ID\s+Number\s*\|/i)) {
			continue;
		}

		// Skip the markdown title and frontmatter
		if (line.startsWith('#') || line.startsWith('---') || line.startsWith('title:') || line.startsWith('protocol:') || line.startsWith('source:') || line.startsWith('sourceType:') || line.startsWith('sha256:') || line.startsWith('extractedAt:') || line.startsWith('summary:')) {
			continue;
		}

		// Skip footer content
		if (line.startsWith('About the') || line.startsWith('MIDI Association') || line.startsWith('Privacy Policy') || line.startsWith('Sign up') || line.startsWith('©')) {
			continue;
		}

		// Skip empty pipe-only lines (just `|`)
		if (line.match(/^\s*\|\s*$/)) {
			continue;
		}

		// If we haven't found the 1-byte section yet, skip
		if (!foundOneByteSection) {
			continue;
		}

		// Detect the start of the standard 3-byte section:
		// After the 1-byte section, when we encounter a 3-byte line without a section header
		const parsed = parseLine(line);
		if (!parsed) {
			continue;
		}

		// Auto-create the Standard Three-Byte IDs group when we see the first 3-byte entry
		// after the 1-byte section and before any explicit section header
		if (!foundThreeByteStart && parsed.type === 'three_byte' && currentGroup && currentGroup.id_type === 'one_byte') {
			groups.push(currentGroup);
			currentGroup = { name: 'Standard Three-Byte IDs', id_type: 'three_byte', entries: [] };
			foundThreeByteStart = true;
		}

		if (!currentGroup) {
			continue;
		}

		// Build the entry based on its type
		const entry = { id_hex: parsed.idHex, company: parsed.company };

		if (parsed.type === 'one_byte') {
			entry.id = parsed.id;
		} else if (parsed.type === 'one_byte_range') {
			entry.id_range = parsed.idRange;
		} else if (parsed.type === 'three_byte') {
			entry.id_bytes = parsed.idBytes;
		}

		currentGroup.entries.push(entry);
	}

	if (currentGroup) {
		groups.push(currentGroup);
	}

	const result = {
		metadata: {
			title: 'SysEx ID Table',
			version: '1.0.0',
			source: path.basename(markdownPath)
		},
		groups
	};

	if (outDir) {
		await fs.mkdir(outDir, { recursive: true });
		await fs.writeFile(path.join(outDir, 'sysex-ids.json'), JSON.stringify(result, null, 2), 'utf-8');
	}

	return result;
}
