import fs from 'node:fs/promises';
import path from 'node:path';

/**
 * Regex to match a sub-ID#2 command code line.
 * Examples: `00 - reserved`, `01 - Open file`, `05 to 7F - reserved`
 */
const COMMAND_CODE_REGEX = /^([0-9A-Fa-f]{2})(?:\s+to\s+([0-9A-Fa-f]{2}))?\s+-\s+(.+)$/;

/**
 * Regex to match a file type line with quoted ASCII and hex values.
 * Examples: `"DLS " 44 4C 53 20`, `"dls " 64 6C 73 20`
 */
const FILE_TYPE_LINE_REGEX = /^"(.+?)"\s+([0-9A-Fa-f ]+)$/;

/**
 * Regex to match a message format line starting with F0 and ending with F7.
 */
const MESSAGE_FORMAT_REGEX = /^F0\s+.+\s+F7$/;

/**
 * Regex to match a flag bit definition line.
 * Examples: `0 Source Drum flag. ...`, `2..6 Reserved, must be zero.`
 */
const FLAG_BIT_REGEX = /^(\d+)(?:\.\.(\d+))?\s+(.+)$/;

/**
 * Regex to match a fine tuning offset table row.
 * Examples: `00 00 -100.0 cents`, `00 40 0.0 cents`, `7F 7F +100.0 cents`
 */
const FINE_TUNING_REGEX = /^([0-9A-Fa-f]{2})\s+([0-9A-Fa-f]{2})\s+([+-]?[\d.]+)\s+cents$/;

/**
 * Set of message section header names in the document.
 */
const MESSAGE_HEADERS = new Set(['OPEN FILE', 'SELECT CONTENTS', 'OPEN FILE AND SELECT CONTENTS', 'CLOSE FILE']);

/**
 * Uppercases a hex string and normalises spacing.
 *
 * @param {string} hex - Hex byte string (e.g. "44 4c 53 20").
 * @returns {string} Normalised uppercase hex.
 */
function normaliseHex(hex) {
	return hex.trim().toUpperCase();
}

/**
 * Transforms the CA-018 File Reference System Exclusive Message markdown
 * document into a structured JSON object.
 *
 * Extractable structured elements:
 * 1. General message format
 * 2. Command codes (sub-ID#2): 6 entries
 * 3. File types: DLS, SF2, WAV — each with uppercase/lowercase ASCII + hex + description
 * 4. Message formats: OPEN FILE, SELECT CONTENTS (DLS/SF2), SELECT CONTENTS (WAV),
 *    OPEN FILE AND SELECT CONTENTS, CLOSE FILE
 * 5. Flag bits: bit 0 (Source Drum), bit 1 (Destination Drum), bits 2-6 (Reserved)
 * 6. Fine tuning offset table: 3 entries
 *
 * @param {string} markdownPath - Absolute path to the source markdown file.
 * @param {string} [outDir] - Optional output directory for the JSON file.
 * @returns {Promise<object>} The structured JSON result.
 */
export async function transformCa18(markdownPath, outDir) {
	const content = await fs.readFile(markdownPath, 'utf-8');
	const lines = content.split('\n').map(l => l.trim());

	const commandCodes = [];
	const fileTypes = [];
	const messages = [];
	const flagBits = [];
	const fineTuningTable = [];
	let generalFormat = '';

	// --- Pass 1: Extract general format ---
	for (const line of lines) {
		if (line === 'F0 7E <device ID> 0B <sub-ID#2> <ctx> <len> <data> F7') {
			generalFormat = line;
			break;
		}
	}

	// --- Pass 2: Extract command codes ---
	let inCommandCodes = false;
	for (const line of lines) {
		if (line === '<sub-ID#2> File Reference Message command code:') {
			inCommandCodes = true;
			continue;
		}
		if (inCommandCodes) {
			const match = line.match(COMMAND_CODE_REGEX);
			if (match) {
				const entry = {
					code: match[1].toUpperCase(),
					description: match[3].trim()
				};
				if (match[2]) {
					entry.code_range_end = match[2].toUpperCase();
				}
				commandCodes.push(entry);
			} else if (line.startsWith('<ctx>') || line === '<data> Command specific data. See below.') {
				inCommandCodes = false;
			}
		}
	}

	// --- Pass 3: Extract file types ---
	for (let i = 0; i < lines.length; i++) {
		const line = lines[i];
		const match = line.match(FILE_TYPE_LINE_REGEX);
		if (!match) {
			continue;
		}

		const quotedAscii = match[1];
		const hexValue = normaliseHex(match[2]);
		const isUppercase = quotedAscii === quotedAscii.toUpperCase();

		if (isUppercase) {
			const fileType = quotedAscii.trim().toUpperCase().replace(/\s/g, '');
			const entry = {
				type: fileType,
				ascii_uppercase: `"${quotedAscii}"`,
				hex_uppercase: hexValue
			};

			// Look for lowercase variant on the next non-empty line
			let nextIdx = i + 1;
			while (nextIdx < lines.length && !lines[nextIdx]) {
				nextIdx++;
			}
			const lowerMatch = lines[nextIdx]?.match(FILE_TYPE_LINE_REGEX);
			if (lowerMatch) {
				entry.ascii_lowercase = `"${lowerMatch[1]}"`;
				entry.hex_lowercase = normaliseHex(lowerMatch[2]);
			}

			// Look for description on subsequent lines (may span multiple lines)
			let descIdx = entry.ascii_lowercase ? nextIdx + 1 : i + 1;
			while (descIdx < lines.length && !lines[descIdx]) {
				descIdx++;
			}
			const descLines = [];
			while (descIdx < lines.length && lines[descIdx] && !lines[descIdx].match(FILE_TYPE_LINE_REGEX) && !lines[descIdx].startsWith('"') && lines[descIdx] !== 'Type Hex value and Description' && lines[descIdx] !== '---- -------------------------' && !lines[descIdx].startsWith('<url>') && !MESSAGE_HEADERS.has(lines[descIdx])) {
				descLines.push(lines[descIdx]);
				descIdx++;
			}
			if (descLines.length > 0) {
				entry.description = descLines.join(' ');
			}

			fileTypes.push(entry);
		}
	}

	// --- Pass 4: Extract message formats ---
	for (let i = 0; i < lines.length; i++) {
		const line = lines[i];
		if (!MESSAGE_HEADERS.has(line)) {
			continue;
		}

		const descriptionLines = [];
		let formatLine = '';
		for (let j = i + 1; j < lines.length; j++) {
			const subLine = lines[j];
			if (!subLine) {
				continue;
			}
			if (MESSAGE_HEADERS.has(subLine)) {
				break;
			}
			if (subLine.match(MESSAGE_FORMAT_REGEX)) {
				formatLine = subLine;
				break;
			}
			if (!subLine.startsWith('<') && !subLine.startsWith('Command specific') && !subLine.startsWith('Select data') && !subLine.startsWith('If') && !subLine.startsWith('A file') && !subLine.startsWith('This message') && !subLine.startsWith('This context') && !subLine.startsWith('This limits') && !subLine.startsWith('This value') && !subLine.startsWith('For') && !subLine.startsWith('Each') && !subLine.startsWith('When') && !subLine.startsWith('The') && !subLine.startsWith('Notes:') && !subLine.startsWith('F0') && !subLine.match(/^\d/) && !subLine.startsWith('Bit') && !subLine.startsWith('---') && !subLine.startsWith('LSB') && !subLine.startsWith('Source') && !subLine.startsWith('Destination') && !subLine.startsWith('Reserved') && !subLine.startsWith('Manufacturers') && !subLine.startsWith('Because') && !subLine.startsWith('Care') && !subLine.startsWith('Date') && !subLine.startsWith('Originated') && !subLine.startsWith('Reference') && !subLine.startsWith('Title') && !subLine.startsWith('CA#') && !subLine.startsWith('Related') && !subLine.startsWith('URL') && !subLine.startsWith('Maximum') && !subLine.startsWith('(People') && !subLine.startsWith('See') && !subLine.startsWith('IMPORTANT') && !subLine.startsWith('OS-provided') && !subLine.startsWith('Once') && !subLine.startsWith('Under') && !subLine.startsWith('Loaded') && !subLine.startsWith('Bank') && !subLine.startsWith('Extension')) {
				descriptionLines.push(subLine);
			}
		}

		messages.push({
			name: line,
			format: formatLine,
			description: descriptionLines.join(' ')
		});
	}

	// --- Pass 5: Extract flag bits ---
	let inFlagBits = false;
	for (let i = 0; i < lines.length; i++) {
		const line = lines[i];
		if (line === 'Bit Flag' || line === '--- ----') {
			inFlagBits = true;
			continue;
		}
		if (inFlagBits) {
			const match = line.match(FLAG_BIT_REGEX);
			if (match) {
				const entry = {
					bit: parseInt(match[1], 10),
					description: match[3].trim()
				};
				if (match[2]) {
					entry.bit_range_end = parseInt(match[2], 10);
				}
				flagBits.push(entry);
			} else if (line.startsWith('<vol>') || line.startsWith('<ext-data>') || line.startsWith('Select data')) {
				inFlagBits = false;
			}
		}
	}

	// --- Pass 6: Extract fine tuning table ---
	let inFineTuning = false;
	for (let i = 0; i < lines.length; i++) {
		const line = lines[i];
		if (line === 'LSB MSB Tuning offset' || line === '--- --- -------------') {
			inFineTuning = true;
			continue;
		}
		if (inFineTuning) {
			const match = line.match(FINE_TUNING_REGEX);
			if (match) {
				fineTuningTable.push({
					lsb: match[1].toUpperCase(),
					msb: match[2].toUpperCase(),
					tuning_offset: match[3] + ' cents'
				});
			} else if (line.startsWith('<vol>') || line.startsWith('These values')) {
				inFineTuning = false;
			}
		}
	}

	const result = {
		metadata: {
			title: 'File Reference System Exclusive Message',
			doc_id: 'CA-018',
			version: '1.0.0',
			source: path.basename(markdownPath)
		},
		general_format: generalFormat,
		command_codes: commandCodes,
		file_types: fileTypes,
		messages: messages,
		flag_bits: flagBits,
		fine_tuning_table: fineTuningTable
	};

	if (outDir) {
		await fs.mkdir(outDir, { recursive: true });
		await fs.writeFile(path.join(outDir, 'ca18-file-reference.json'), JSON.stringify(result, null, 2), 'utf-8');
	}

	return result;
}
