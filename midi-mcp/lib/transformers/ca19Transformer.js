import fs from 'node:fs/promises';
import path from 'node:path';

/**
 * Regex to match a sub-command header line.
 * Examples: `EXTENDED DUMP HEADER - (Sub Command 05)`,
 *           `EXTENDED LOOP POINT Transmission (Sub Command 06)`,
 *           `SAMPLE NAME TRANSMISSION (Sub Command 03)`
 */
const SUB_COMMAND_REGEX = /^(.+?)\s+(?:-\s+)?\(?\s*Sub Command\s+([0-9A-Fa-f]{2})\s*\)?$/;

/**
 * Regex to match a byte field definition line.
 * Examples: `ee Sample Format (# of significant Bits from 8 - 28)`,
 *           `ff ff ff ff Sample rate integer portion in Hertz (LSB first)`,
 *           `bb bb Loop Number (LSB First: 7F 7F delete all loops)`
 */
const BYTE_FIELD_REGEX = /^([a-z]{1,2}(?:\s+[a-z]{1,2})*)\s+(.+)$/;

/**
 * Regex to match a loop type value definition.
 * Examples: `Value 00 = Forward playback with unidirectional loop. Sample plays...`,
 *           `Value 7F = Forward one-shot playback, no looping.`
 */
const LOOP_TYPE_REGEX = /^\.?Value\s+([0-9A-Fa-f]{2})\s+=\s+(.+)$/;

/**
 * Regex to match a SysEx example line.
 * Examples: `F0 7E 01 05 04 00 01 F7 - Requests name of sample #1`,
 *           `F0 7E 01 05 03 00 01 00 0B 54 65 73 74 20 53 61 6D 70 6C 65 F7`
 */
const SYSEX_EXAMPLE_REGEX = /^(F0\s+[0-9A-Fa-f ]+\s+F7)\s*(?:-\s*(.+))?$/;

/**
 * Set of known byte field variable names to distinguish from description text.
 */
const BYTE_FIELD_PREFIXES = new Set(['ee', 'ff', 'gg', 'hh', 'ii', 'jj', 'kk', 'll', 'bb', 'cc', 'dd', 'tt', 'nn']);

/**
 * Set of sub-command section header names for detecting message boundaries.
 */
const SECTION_HEADERS = new Set(['EXTENDED DUMP HEADER', 'EXTENDED LOOP POINT Transmission', 'EXTENDED LOOP POINT Request', 'SAMPLE NAME TRANSMISSION', 'SAMPLE NAME REQUEST', 'Comments', 'Examples']);

/**
 * Uppercases a hex string.
 *
 * @param {string} hex - Hex string.
 * @returns {string} Uppercase hex.
 */
function upperHex(hex) {
	return hex.toUpperCase();
}

/**
 * Transforms the CA-019 Sample Dump Size, Rate and Name Extensions markdown
 * document into a structured JSON object.
 *
 * Extractable structured elements:
 * 1. Sub-commands with byte field definitions (05, 06, 07, 03, 04)
 * 2. Loop type values (10 entries: 00-03, 40-43, 7E-7F)
 * 3. SysEx example messages (3 entries)
 *
 * @param {string} markdownPath - Absolute path to the source markdown file.
 * @param {string} [outDir] - Optional output directory for the JSON file.
 * @returns {Promise<object>} The structured JSON result.
 */
export async function transformCa19(markdownPath, outDir) {
	const content = await fs.readFile(markdownPath, 'utf-8');
	const lines = content.split('\n').map(l => l.trim());

	const subCommands = [];
	const loopTypes = [];
	const examples = [];

	let currentSubCommand = null;
	let inByteFields = false;
	let inExamples = false;
	let lastContextLine = '';

	for (let i = 0; i < lines.length; i++) {
		const line = lines[i];

		if (!line) {
			continue;
		}

		// Detect sub-command headers
		const subCmdMatch = line.match(SUB_COMMAND_REGEX);
		if (subCmdMatch) {
			// Flush previous sub-command
			if (currentSubCommand) {
				subCommands.push(currentSubCommand);
			}
			currentSubCommand = {
				name: subCmdMatch[1].trim(),
				sub_command: upperHex(subCmdMatch[2]),
				byte_fields: []
			};
			inByteFields = true;
			inExamples = false;
			continue;
		}

		// Detect "Notes:" section which ends byte field collection
		if (line === 'Notes:') {
			inByteFields = false;
			continue;
		}

		// Detect loop type values
		const loopMatch = line.match(LOOP_TYPE_REGEX);
		if (loopMatch) {
			loopTypes.push({
				value: upperHex(loopMatch[1]),
				description: loopMatch[2].trim()
			});
			continue;
		}

		// Detect examples section
		if (line === 'Examples:') {
			inExamples = true;
			if (currentSubCommand) {
				subCommands.push(currentSubCommand);
				currentSubCommand = null;
			}
			continue;
		}

		// Track context lines in examples section for descriptions
		if (inExamples) {
			const sysexMatch = line.match(SYSEX_EXAMPLE_REGEX);
			if (sysexMatch) {
				const description = sysexMatch[2] || lastContextLine || '';
				examples.push({
					message: sysexMatch[1],
					description: description
				});
				lastContextLine = '';
				continue;
			}
			// Non-SysEx lines in examples section are context for the next example
			if (!line.startsWith('F0') && line !== 'Examples:') {
				lastContextLine = line;
			}
			continue;
		}

		// Parse byte field definitions within sub-commands
		if (currentSubCommand && inByteFields) {
			// Check if this line starts with a known byte field prefix
			const firstToken = line.split(/\s+/)[0].toLowerCase();
			if (BYTE_FIELD_PREFIXES.has(firstToken)) {
				// Split the variable name from the description
				// The variable part is all repeated single/double letter tokens
				const byteMatch = line.match(BYTE_FIELD_REGEX);
				if (byteMatch) {
					const variablePart = byteMatch[1].trim();
					const description = byteMatch[2].trim();

					// Only add if the variable part looks like byte field names
					// (all tokens are 1-2 lowercase letters)
					const tokens = variablePart.split(/\s+/);
					const allByteTokens = tokens.every(t => /^[a-z]{1,2}$/.test(t));
					if (allByteTokens) {
						currentSubCommand.byte_fields.push({
							variable: variablePart,
							description: description
						});
						continue;
					}
				}
			}

			// Check for section boundaries that end the current sub-command
			if (SECTION_HEADERS.has(line) || line.startsWith('A Sample Name')) {
				subCommands.push(currentSubCommand);
				currentSubCommand = null;
				inByteFields = false;
				continue;
			}
		}
	}

	// Flush last sub-command
	if (currentSubCommand) {
		subCommands.push(currentSubCommand);
	}

	const result = {
		metadata: {
			title: 'Sample Dump Size, Rate and Name Extensions',
			doc_id: 'CA-019',
			version: '1.0.0',
			source: path.basename(markdownPath)
		},
		sub_commands: subCommands,
		loop_types: loopTypes,
		examples: examples
	};

	if (outDir) {
		await fs.mkdir(outDir, { recursive: true });
		await fs.writeFile(path.join(outDir, 'ca19-sample-dump.json'), JSON.stringify(result, null, 2), 'utf-8');
	}

	return result;
}
