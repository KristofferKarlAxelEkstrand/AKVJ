import fs from 'node:fs/promises';
import path from 'node:path';

/**
 * Regex to match extension data field definition lines.
 * Format: `<ext-ID#1> Extension Specifier #1` or `<len> Two 7-bit bytes: ...`
 */
const EXTENSION_FIELD_REGEX = /^(<[^>]+>)\s+(.+)$/;

/**
 * Regex to match map entire file field definition lines.
 * Format: `<ext-ID#1> 00 - Spcifies this extension` or `<dst-bank> Two 7-bit bytes: ...`
 */
const MAP_FIELD_REGEX = /^(<[^>]+>)\s+(.+)$/;

/**
 * Regex to match bit flag table rows.
 * Format: `0 Source Drum flag. This flag indicates the` or `1-6 Undefined, should be 0`
 */
const BIT_FLAG_REGEX = /^(\d+(?:-\d+)?)\s+(.+)$/;

/**
 * Transforms the CA-028 Extension 00-01 to File Reference SysEx markdown document
 * into a structured JSON object.
 *
 * The document contains:
 * - Extension data format with 4 field definitions
 * - Map Entire File with Bank Offset message format with 5 field definitions
 * - Bit flags table (bit 0: Source Drum flag, bits 1-6: Undefined)
 *
 * @param {string} markdownPath - Absolute path to the source markdown file.
 * @param {string} [outDir] - Optional output directory for the JSON file.
 * @returns {Promise<object>} The structured JSON result.
 */
export async function transformCa28(markdownPath, outDir) {
	const content = await fs.readFile(markdownPath, 'utf-8');
	const lines = content.split('\n').map(l => l.trim());

	const extensionDataFields = [];
	const mapEntireFileFields = [];
	const bitFlags = [];

	let currentSection = null; // 'extension_data' | 'map_entire_file' | 'bit_flags' | null
	let lastField = null;

	for (const line of lines) {
		if (!line) {
			continue;
		}

		// Skip page headers and boilerplate
		if (line.startsWith('## Page') || line.startsWith('MMA Technical') || line.startsWith('AMEI MIDI') || line.startsWith('Supporting the Arts') || line.startsWith('Confirmation of') || line.startsWith('Date of issue') || line.startsWith('Reference TSB') || line.startsWith('Title:') || line.startsWith('CA#:') || line.startsWith('Related item') || line.startsWith('Submitted By') || line.startsWith('TSB Rep')) {
			continue;
		}

		// Detect EXTENSION DATA section
		if (line === 'EXTENSION DATA') {
			currentSection = 'extension_data';
			lastField = null;
			continue;
		}

		// Detect MAP ENTIRE FILE section
		if (line.startsWith('EXTENSION: MAP ENTIRE FILE')) {
			currentSection = 'map_entire_file';
			lastField = null;
			continue;
		}

		// Detect bit flags table header
		if (line === 'Bit Flag') {
			currentSection = 'bit_flags';
			continue;
		}

		// Skip separator lines
		if (line.startsWith('---') && currentSection === 'bit_flags') {
			continue;
		}

		// Parse extension data fields
		if (currentSection === 'extension_data') {
			// Stop at the MAP ENTIRE FILE section
			if (line.startsWith('EXTENSION: MAP ENTIRE FILE')) {
				currentSection = 'map_entire_file';
				lastField = null;
				continue;
			}
			// Skip format template lines (contain multiple <fields>)
			if (line.match(/^<[^>]+>\s*<[^>]+>/)) {
				continue;
			}
			const match = line.match(EXTENSION_FIELD_REGEX);
			if (match) {
				const existing = extensionDataFields.find(f => f.name === match[1]);
				if (existing) {
					existing.description += ' ' + match[1] + ' ' + match[2].trim();
					lastField = existing;
				} else {
					const field = {
						name: match[1],
						description: match[2].trim()
					};
					extensionDataFields.push(field);
					lastField = field;
				}
			} else if (lastField && !line.startsWith('<') && !line.startsWith('This') && !line.startsWith('The format') && !line.startsWith('The ext-ID') && !line.startsWith('EXTENSION')) {
				lastField.description += ' ' + line;
			}
			continue;
		}

		// Parse map entire file fields
		if (currentSection === 'map_entire_file') {
			// Skip format template lines
			if (line.match(/^<[^>]+>\s*<[^>]+>/)) {
				continue;
			}
			// Stop at bit flags table
			if (line === 'Bit Flag') {
				currentSection = 'bit_flags';
				continue;
			}
			const match = line.match(MAP_FIELD_REGEX);
			if (match) {
				const existing = mapEntireFileFields.find(f => f.name === match[1]);
				if (existing) {
					existing.description += ' ' + match[1] + ' ' + match[2].trim();
					lastField = existing;
				} else {
					const field = {
						name: match[1],
						description: match[2].trim()
					};
					mapEntireFileFields.push(field);
					lastField = field;
				}
			} else if (lastField && !line.startsWith('<') && !line.startsWith('Note') && !line.startsWith('The format') && !line.startsWith('Bit Flag') && !line.startsWith('---')) {
				lastField.description += ' ' + line;
			}
			continue;
		}

		// Parse bit flags
		if (currentSection === 'bit_flags') {
			const match = line.match(BIT_FLAG_REGEX);
			if (match) {
				bitFlags.push({
					bits: match[1],
					description: match[2].trim()
				});
			} else if (bitFlags.length > 0 && !line.startsWith('---') && !line.startsWith('Date of') && !line.startsWith('Reference') && !line.startsWith('Title:') && !line.startsWith('CA#:') && !line.startsWith('Related')) {
				bitFlags[bitFlags.length - 1].description += ' ' + line;
			}
			continue;
		}
	}

	const result = {
		metadata: {
			title: 'Extension 00-01 to File Reference SysEx Message',
			doc_id: 'CA-028',
			version: '1.0.0',
			source: path.basename(markdownPath)
		},
		extension_data: {
			format: '<ext-ID#1> <ext-ID#2> <len> <extension-data>',
			fields: extensionDataFields
		},
		map_entire_file: {
			format: '<ext-ID#1> <ext-ID#2> <len> <dst-bank> <flags>',
			fields: mapEntireFileFields
		},
		bit_flags: bitFlags,
		summary: {
			extension_data_field_count: extensionDataFields.length,
			map_entire_file_field_count: mapEntireFileFields.length,
			bit_flag_count: bitFlags.length
		}
	};

	if (outDir) {
		await fs.mkdir(outDir, { recursive: true });
		await fs.writeFile(path.join(outDir, 'ca28-extension-file-reference.json'), JSON.stringify(result, null, 2), 'utf-8');
	}

	return result;
}
