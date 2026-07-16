import fs from 'node:fs/promises';
import path from 'node:path';

/**
 * Regex to match message section headers in brackets.
 * Format: `[BULK TUNING DUMP REQUEST]` or `[SINGLE NOTE TUNING CHANGE (REAL-TIME)]`
 */
const SECTION_HEADER_REGEX = /^\[(.+)\]$/;

/**
 * Regex to match message template lines.
 * Format: `F0 7E <device ID> 08 00 tt F7` or `F0 7F <device ID> 08 02 tt ll [kk xx yy zz] F7`
 */
const TEMPLATE_REGEX = /^F0\s/;

/**
 * Regex to match field definition lines.
 * Format: `08 \tsub-ID#1 (MIDI Tuning)` or `<device ID> \tID of target device`
 * Also handles: `bb bank: 0-127` and `[kk] \tMIDI key number`
 */
const FIELD_REGEX = /^([0-9A-Fa-f]{2}|bb|tt|ll|kk|ff|gg|hh|chksum|checksum|<[^>]+>|\[[^\]]+\])\s+(.+)$/;

/**
 * Regex to match standalone field codes on their own line (description on following lines).
 * Format: `bb` or `ss` on a line by itself
 */
const STANDALONE_CODE_REGEX = /^(bb|tt|ll|kk|ff|gg|hh)$/;

/**
 * Regex to match frequency data example lines.
 * Format: `00 00 00 = 8.1758 Hz (C – normal tuning of MIDI key no. 0)`
 */
const FREQ_EXAMPLE_REGEX = /^([0-9A-Fa-f]{2}\s+[0-9A-Fa-f]{2}\s+[0-9A-Fa-f]{2})\s*=\s*(.+)$/;

/**
 * Regex to match frequency byte structure lines.
 * Format: `xxxxxxx \t= semitone` or `abcdefghijklmn = fraction of semitone...`
 */
const BYTE_STRUCTURE_REGEX = /^([01xabcdefghijklemn]+)\s*=?\s*(.+)$/;

/**
 * Regex to match RPN message lines.
 * Format: `Bn 64 03 65 00 06 tt (data entry)`
 */
const RPN_MESSAGE_REGEX = /^(Bn\s+\S+\s+\S+\s+\S+\s+\S+\s+\S+\s+\S+)\s+\((.+)\)$/;

/**
 * Transforms the MIDI Tuning Updated Specification markdown document
 * into a structured JSON object.
 *
 * The document contains:
 * - Frequency data format with 3-byte structure and 18 example entries
 * - 12+ message formats each with template and field definitions
 * - RPN tuning program/bank select messages
 * - Checksum calculation description
 * - Notes
 *
 * @param {string} markdownPath - Absolute path to the source markdown file.
 * @param {string} [outDir] - Optional output directory for the JSON file.
 * @returns {Promise<object>} The structured JSON result.
 */
export async function transformMidiTuning(markdownPath, outDir) {
	const content = await fs.readFile(markdownPath, 'utf-8');
	const lines = content.split('\n').map(l => l.trim());

	const messages = [];
	const frequencyExamples = [];
	const frequencyByteStructure = [];
	const rpnMessages = [];
	const notes = [];
	let checksumCalculation = null;

	let currentMessage = null;
	let inFrequencyExamples = false;
	let inByteStructure = false;
	let inChecksum = false;
	let inNotes = false;
	let lastField = null;

	for (const line of lines) {
		if (!line) {
			continue;
		}

		// Skip page headers and boilerplate
		if (line.startsWith('## Page') || line.startsWith('MMA Technical') || line.startsWith('AMEI MIDI') || line.startsWith('Supporting the Arts') || line.startsWith('Confirmation of') || line.startsWith('CA-020/CA-021') || line.startsWith('Recommended Practice')) {
			continue;
		}

		// Detect section headers in brackets — only uppercase names (filter out field refs like [xx], [ss])
		const sectionMatch = line.match(SECTION_HEADER_REGEX);
		if (sectionMatch && sectionMatch[1].match(/[A-Z]{2,}/) && sectionMatch[1].length > 4) {
			// Finalize any current message
			if (currentMessage) {
				messages.push(currentMessage);
			}
			const sectionName = sectionMatch[1].trim();
			currentMessage = {
				name: sectionName,
				template: null,
				fields: []
			};
			inFrequencyExamples = false;
			inByteStructure = false;
			inChecksum = false;
			inNotes = false;
			lastField = null;
			continue;
		}

		// Detect frequency examples section
		if (line === 'Examples of frequency data:') {
			inFrequencyExamples = true;
			inByteStructure = false;
			continue;
		}

		// Detect byte structure section
		if (line === '0xxxxxxx 0abcdefg 0hijklmn') {
			inByteStructure = true;
			inFrequencyExamples = false;
			continue;
		}

		// Detect checksum calculation
		if (line.startsWith('Checksum Calculation')) {
			inChecksum = true;
			inFrequencyExamples = false;
			inByteStructure = false;
			if (currentMessage) {
				messages.push(currentMessage);
				currentMessage = null;
			}
			continue;
		}

		// Detect notes section
		if (line === 'Notes:') {
			inNotes = true;
			inChecksum = false;
			continue;
		}

		// Parse frequency examples
		if (inFrequencyExamples) {
			const match = line.match(FREQ_EXAMPLE_REGEX);
			if (match) {
				frequencyExamples.push({
					hex: match[1].toUpperCase(),
					description: match[2].trim()
				});
				continue;
			}
			// Stop if not a frequency example
			if (!line.match(/^[0-9A-Fa-f]{2}\s/)) {
				inFrequencyExamples = false;
			}
		}

		// Parse byte structure
		if (inByteStructure) {
			const match = line.match(BYTE_STRUCTURE_REGEX);
			if (match && (line.includes('=') || line.startsWith('xxxxxxx') || line.startsWith('abcdefghijklmn'))) {
				frequencyByteStructure.push({
					bits: match[1],
					description: match[2].trim()
				});
				continue;
			}
			// Stop at non-matching lines
			if (!line.startsWith('0') && !line.startsWith('x') && !line.startsWith('a')) {
				inByteStructure = false;
			}
		}

		// Parse checksum calculation
		if (inChecksum) {
			if (!checksumCalculation) {
				checksumCalculation = line;
			} else {
				checksumCalculation += ' ' + line;
			}
			continue;
		}

		// Parse notes
		if (inNotes) {
			notes.push(line);
			continue;
		}

		// Parse RPN messages
		const rpnMatch = line.match(RPN_MESSAGE_REGEX);
		if (rpnMatch) {
			rpnMessages.push({
				message: rpnMatch[1],
				type: rpnMatch[2].trim()
			});
			continue;
		}

		// Parse message template and fields
		if (currentMessage) {
			// Template line starts with F0
			if (line.match(TEMPLATE_REGEX) && !currentMessage.template) {
				currentMessage.template = line;
				continue;
			}

			// Standalone field code on its own line (description follows on next lines)
			const standaloneMatch = line.match(STANDALONE_CODE_REGEX);
			if (standaloneMatch) {
				const existing = currentMessage.fields.find(f => f.code === standaloneMatch[1]);
				if (!existing) {
					const field = { code: standaloneMatch[1], description: '' };
					currentMessage.fields.push(field);
					lastField = field;
				} else {
					lastField = existing;
				}
				continue;
			}

			// Field definition lines (skip RPN variable assignments like 'tt = ...')
			const fieldMatch = line.match(FIELD_REGEX);
			if (fieldMatch && !fieldMatch[2].trim().startsWith('=')) {
				const field = {
					code: fieldMatch[1],
					description: fieldMatch[2].trim()
				};
				// Check for duplicate field names (continuation lines)
				const existing = currentMessage.fields.find(f => f.code === fieldMatch[1]);
				if (existing) {
					existing.description += ' ' + fieldMatch[2].trim();
					lastField = existing;
				} else {
					currentMessage.fields.push(field);
					lastField = field;
				}
				continue;
			}

			// Continuation lines for field descriptions (standalone codes and sub-descriptions)
			if (lastField && !line.startsWith('F0') && !line.startsWith('The ') && !line.startsWith('This ') && !line.startsWith('If ') && !line.startsWith('On ') && !line.startsWith('For ') && !line.startsWith('An ') && !line.startsWith('In ') && !line.startsWith('Changing') && !line.startsWith('Scale/') && !line.startsWith('MIDI Tuning') && !line.startsWith('The minimum') && !line.startsWith('Comments') && !line.startsWith('Single Note') && !line.startsWith('One of') && !line.startsWith('Although') && !line.startsWith('The specification') && !line.startsWith('The standard') && !line.startsWith('Frequency') && !line.startsWith('Registered') && !line.startsWith('As with') && !line.startsWith('Likewise') && !line.startsWith('However') && !line.startsWith('Therefore') && !line.startsWith('Manufacturers') && !line.startsWith('Using') && !line.startsWith('The intent') && !line.startsWith('A message') && !line.startsWith('Each message') && !line.startsWith('Ed:')) {
				// Append to last field if it's a continuation line
				if (line.startsWith('(') || line.startsWith('00H') || line.startsWith('40H') || line.startsWith('7FH') || line.startsWith('bits ') || line.startsWith('bit ') || line.startsWith('bank:') || line.startsWith('number of') || line.startsWith('xx yy zz') || line.startsWith('24 byte') || line.startsWith('12 byte') || lastField.description === '') {
					lastField.description += (lastField.description ? ' ' : '') + line;
				}
			}
		}
	}

	// Don't forget the last message
	if (currentMessage) {
		messages.push(currentMessage);
	}

	const result = {
		metadata: {
			title: 'MIDI Tuning Messages Bank/Dump Extensions Scale/Octave Extensions',
			doc_id: 'CA-020/CA-021',
			version: '1.0.0',
			source: path.basename(markdownPath)
		},
		frequency_data_format: {
			description: '3-byte (21-bit) frequency data word. First byte specifies nearest equal-tempered semitone below the frequency. Next two bytes (14 bits) specify fraction of 100 cents above the semitone. Effective resolution = 100 cents / 2^14 = .0061 cents.',
			byte_structure: frequencyByteStructure,
			examples: frequencyExamples
		},
		messages,
		rpn_messages: rpnMessages,
		checksum_calculation: checksumCalculation,
		notes,
		summary: {
			message_count: messages.length,
			frequency_example_count: frequencyExamples.length,
			byte_structure_count: frequencyByteStructure.length,
			rpn_message_count: rpnMessages.length,
			note_count: notes.length
		}
	};

	if (outDir) {
		await fs.mkdir(outDir, { recursive: true });
		await fs.writeFile(path.join(outDir, 'midi-tuning-updated.json'), JSON.stringify(result, null, 2), 'utf-8');
	}

	return result;
}
