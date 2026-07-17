import fs from 'node:fs/promises';
import path from 'node:path';

/**
 * Transforms the UMP Format and MIDI 2.0 Protocol Specification (M2-104-UM)
 * into a structured JSON object.
 *
 * The document contains 35 tables with space-separated formatting, page breaks,
 * and multi-line entries. This transformer extracts the most structured tables:
 * - Table 4: Message Type (MT) Allocation
 * - Table 8: Defined Attribute Types for Note On/Off
 * - Table 9: Flex Data Message Format Field Values
 * - Table 10: Flex Data Message Address Field Values
 * - Table 11: Status Bank Classifications
 * - Table 12: Sharps and Flats Examples
 * - Table 13: Tonic Sharps and Flats Values
 * - Table 14: Chord Type Field Values
 * - Table 15: Bass Note Sharps and Flats Values
 * - Table 16: Text Messages by Status
 * - Table 17: Messages that use System Message General Format
 * - Table 18: Status Field Values for SysEx 7-Bit
 * - Table 19: Status Field Values for SysEx 8-Bit
 * - Table 20: 16-Bit Values for 7-Bit Special IDs
 * - Table 21: MIDI 2.0 MfrID Conversions
 * - Table 22: Registered Per-Note Controllers
 * - Table 23: Center Value Examples
 * - Tables 26-33: UMP Format tables (byte-by-byte layouts)
 * - Table 35: MIDI 2.0 Addressing
 *
 * @param {string} markdownPath - Absolute path to the source markdown file.
 * @param {string} [outDir] - Optional output directory for the JSON file.
 * @returns {Promise<object>} The structured JSON result.
 */
export async function transformUmpMidi2Protocol(markdownPath, outDir) {
	const content = await fs.readFile(markdownPath, 'utf-8');
	const lines = content.split('\n');

	const result = {
		metadata: {
			title: 'Universal MIDI Packet (UMP) Format and MIDI 2.0 Protocol Specification',
			doc_id: 'M2-104-UM',
			protocol: 'midi2',
			version: '1.1.2',
			date: '2023-11',
			source: 'https://amei-music.github.io/midi2.0-docs/amei-pdf/M2-104-UM_v1-1-2_UMP_and_MIDI_2-0_Protocol_Specification.pdf'
		},
		message_type_allocation: [],
		attribute_types: [],
		flex_data_format_fields: [],
		flex_data_address_fields: [],
		status_bank_classifications: [],
		sharps_flats_examples: [],
		tonic_sharps_flats: [],
		chord_types: [],
		bass_note_sharps_flats: [],
		text_messages: [],
		system_message_formats: [],
		sysex7_status_values: [],
		sysex8_status_values: [],
		special_id_conversions: [],
		manufacturer_id_conversions: [],
		registered_per_note_controllers: [],
		center_value_examples: [],
		ump_formats: [],
		midi2_addressing: [],
		summary: {}
	};

	let currentTable = null;

	const PAGE_HEADER_RE = /^## Page \d+$/;
	const TABLE_START_RE = /^Table (\d+)\s+(.+)/;
	const SKIP_LINES_RE = /^(Table\s+\d+\s|Figure\s+\d+|Appendix\s+[A-Z]|F\.\d|##\s|Page\s|\* Note:)/;

	for (let i = 0; i < lines.length; i++) {
		const line = lines[i].trim();

		if (!line || line.match(PAGE_HEADER_RE)) {
			continue;
		}

		const tableMatch = line.match(TABLE_START_RE);
		if (tableMatch) {
			const tableNum = parseInt(tableMatch[1], 10);
			currentTable = mapTableNumber(tableNum);
			continue;
		}

		if (!currentTable) {
			continue;
		}

		if (line.match(SKIP_LINES_RE)) {
			if (!line.startsWith('Table ')) {
				currentTable = null;
			}
			continue;
		}

		const parsed = parseTableRow(line, currentTable);
		if (parsed) {
			pushResult(result, currentTable, parsed);
		}
	}

	result.summary = {
		message_type_allocation_count: result.message_type_allocation.length,
		attribute_type_count: result.attribute_types.length,
		flex_data_format_field_count: result.flex_data_format_fields.length,
		flex_data_address_field_count: result.flex_data_address_fields.length,
		status_bank_classification_count: result.status_bank_classifications.length,
		sharps_flats_example_count: result.sharps_flats_examples.length,
		tonic_sharps_flats_count: result.tonic_sharps_flats.length,
		chord_type_count: result.chord_types.length,
		bass_note_sharps_flats_count: result.bass_note_sharps_flats.length,
		text_message_count: result.text_messages.length,
		system_message_format_count: result.system_message_formats.length,
		sysex7_status_value_count: result.sysex7_status_values.length,
		sysex8_status_value_count: result.sysex8_status_values.length,
		special_id_conversion_count: result.special_id_conversions.length,
		manufacturer_id_conversion_count: result.manufacturer_id_conversions.length,
		registered_per_note_controller_count: result.registered_per_note_controllers.length,
		center_value_example_count: result.center_value_examples.length,
		ump_format_count: result.ump_formats.length,
		midi2_addressing_count: result.midi2_addressing.length
	};

	if (outDir) {
		await fs.mkdir(outDir, { recursive: true });
		await fs.writeFile(path.join(outDir, 'ump-midi2-protocol.json'), JSON.stringify(result, null, 2), 'utf-8');
	}

	return result;
}

function mapTableNumber(num) {
	const map = {
		4: 'message_type_allocation',
		8: 'attribute_types',
		9: 'flex_data_format_fields',
		10: 'flex_data_address_fields',
		11: 'status_bank_classifications',
		12: 'sharps_flats_examples',
		13: 'tonic_sharps_flats',
		14: 'chord_types',
		15: 'bass_note_sharps_flats',
		16: 'text_messages',
		17: 'system_message_formats',
		18: 'sysex7_status_values',
		19: 'sysex8_status_values',
		20: 'special_id_conversions',
		21: 'manufacturer_id_conversions',
		22: 'registered_per_note_controllers',
		23: 'center_value_examples',
		26: 'ump_formats',
		27: 'ump_formats',
		28: 'ump_formats',
		29: 'ump_formats',
		30: 'ump_formats',
		31: 'ump_formats',
		32: 'ump_formats',
		33: 'ump_formats',
		35: 'midi2_addressing'
	};
	return map[num] || null;
}

function pushResult(result, tableName, row) {
	if (result[tableName]) {
		result[tableName].push(row);
	}
}

function parseTableRow(line, tableName) {
	switch (tableName) {
		case 'message_type_allocation':
			return parseMessageTypeAllocation(line);
		case 'attribute_types':
			return parseAttributeTypes(line);
		case 'flex_data_format_fields':
			return parseFlexDataFormatFields(line);
		case 'flex_data_address_fields':
			return parseFlexDataAddressFields(line);
		case 'status_bank_classifications':
			return parseStatusBankClassifications(line);
		case 'sharps_flats_examples':
			return parseSharpsFlats(line);
		case 'tonic_sharps_flats':
			return parseTonicSharpsFlats(line);
		case 'chord_types':
			return parseChordTypes(line);
		case 'bass_note_sharps_flats':
			return parseBassNoteSharpsFlats(line);
		case 'text_messages':
			return parseTextMessages(line);
		case 'system_message_formats':
			return parseSystemMessageFormats(line);
		case 'sysex7_status_values':
			return parseSysexStatusValues(line);
		case 'sysex8_status_values':
			return parseSysexStatusValues(line);
		case 'special_id_conversions':
			return parseSpecialIdConversions(line);
		case 'manufacturer_id_conversions':
			return parseManufacturerIdConversions(line);
		case 'registered_per_note_controllers':
			return parseRegisteredPerNoteControllers(line);
		case 'center_value_examples':
			return parseCenterValueExamples(line);
		case 'ump_formats':
			return parseUmpFormats(line);
		case 'midi2_addressing':
			return parseMidi2Addressing(line);
		default:
			return null;
	}
}

function isHeaderValue(s) {
	return s.match(/^(MT|UMP Size|Description|Attribute Type|Definition|Notes|Format Field Value|Address Field Value|Message Addressing|Status Bank|Classification|Value|Chord Type|Sharps|Flats|Tonic|Bass Note|Status|Message|MIDI 1\.0|Status Field|Special ID|7-Bit|16-Bit|Manufacturer|MFID|MfrID|MfrID_hi|MfrID_lo|Number|Registered|Default|Reference|Size|Center|Hex|Binary|Byte|Bytes|Group|Channel|UTILITY|SYSTEM|DATA|MIDI|Flex|UMP|Message Type)/i);
}

function parseMessageTypeAllocation(line) {
	const match = line.match(/^(0x[0-9A-F])\s+(\d+\s*bits)(?:\s+(.*))?$/);
	if (match) {
		return { mt: match[1], ump_size: match[2].replace(/\s+/g, ' '), description: (match[3] || '').trim() };
	}
	return null;
}

function parseAttributeTypes(line) {
	const match = line.match(/^(0x[0-9A-F]{2})\s+(.+)$/);
	if (match && !isHeaderValue(match[1])) {
		const definition = match[2].trim();
		return { attribute_type: match[1], definition };
	}
	return null;
}

function parseFlexDataFormatFields(line) {
	const match = line.match(/^([0-3])\s+(.+)$/);
	if (match && !isHeaderValue(match[1])) {
		return { value: parseInt(match[1], 10), ump_type: match[2].trim() };
	}
	return null;
}

function parseFlexDataAddressFields(line) {
	const match = line.match(/^([0-3])\s+(.+)$/);
	if (match && !isHeaderValue(match[1])) {
		return { value: parseInt(match[1], 10), addressing: match[2].trim() };
	}
	return null;
}

function parseStatusBankClassifications(line) {
	const match = line.match(/^(0x[0-9A-F]{2}(?:-FF)?)\s+(.+)$/i);
	if (match && !isHeaderValue(match[1])) {
		return { status_bank: match[1], classification: match[2].trim() };
	}
	return null;
}

function parseSharpsFlats(line) {
	// Table 12: "One Sharp D D Natural" — text columns
	const match = line.match(/^([\w\s/]+?)\s+([A-G])\s+([A-G]\s+\w+)$/);
	if (match && !isHeaderValue(match[1])) {
		return {
			sharps_flats_field: match[1].trim(),
			tonic_note: match[2],
			intended_tonic_note: match[3].trim()
		};
	}
	return null;
}

function parseTonicSharpsFlats(line) {
	// Table 13: "0x2 2 Double Sharp" — hex, decimal, description
	const match = line.match(/^(0x[0-9A-F])\s+(-?\d+)\s+(.+)$/);
	if (match && !isHeaderValue(match[1])) {
		return {
			twos_complement: match[1],
			decimal_value: parseInt(match[2], 10),
			applied_to_tonic: match[3].trim()
		};
	}
	return null;
}

function parseChordTypes(line) {
	const match = line.match(/^(0x[0-9A-F]{2}(?:\s*-\s*0xFF)?)\s+(.+)$/);
	if (match && !isHeaderValue(match[1])) {
		return { value: match[1], chord_type: match[2].trim() };
	}
	return null;
}

function parseBassNoteSharpsFlats(line) {
	// Table 15: "0x2 2 Double Sharp" — hex, decimal, description
	const match = line.match(/^(0x[0-9A-F])\s+(-?\d+)\s+(.+)$/);
	if (match && !isHeaderValue(match[1])) {
		return {
			twos_complement: match[1],
			decimal_value: parseInt(match[2], 10),
			applied_to_bass_note: match[3].trim()
		};
	}
	return null;
}

function parseTextMessages(line) {
	const match = line.match(/^(0x[0-9A-F]{2})\s+(0x[0-9A-F]{2})\s+(.+)$/);
	if (match && !isHeaderValue(match[1])) {
		return {
			status_bank: match[1],
			status: match[2],
			message: match[3].trim()
		};
	}
	return null;
}

function parseSystemMessageFormats(line) {
	const match = line.match(/^(.+?)\s+(0xF[0-9A-F])\s+(\S+)\s+(\S+)$/);
	if (match && !isHeaderValue(match[2])) {
		return {
			message: match[1].trim(),
			status: match[2],
			byte_2: match[3],
			byte_3: match[4]
		};
	}
	return null;
}

function parseSysexStatusValues(line) {
	const match = line.match(/^(0x[0-3])\s+(.+)$/);
	if (match && !isHeaderValue(match[1])) {
		return { status: match[1], ump_type: match[2].trim() };
	}
	return null;
}

function parseSpecialIdConversions(line) {
	const match = line.match(/^(.+?)\s+(0x[0-9A-F]{2})\s+(0x[0-9A-F]{4})$/);
	if (match && !isHeaderValue(match[2])) {
		return {
			special_id: match[1].trim(),
			seven_bit_value: match[2],
			sixteen_bit_value: match[3]
		};
	}
	return null;
}

function parseManufacturerIdConversions(line) {
	const parts = line.split(/\s+/);
	const mfridIdx = parts.findIndex(p => p.match(/^0x[0-9A-Fa-f]{4}$/));
	if (mfridIdx >= 5 && parts.length >= mfridIdx + 2) {
		return {
			manufacturer: parts.slice(0, mfridIdx - 4).join(' '),
			mfid_1: parts[mfridIdx - 4],
			mfid_2: parts[mfridIdx - 3],
			mfid_3: parts[mfridIdx - 2],
			mfid_32: parts[mfridIdx - 1],
			mfrid: parts[mfridIdx],
			mfrid_hi: parts[mfridIdx + 1],
			mfrid_lo: parts[mfridIdx + 2] || ''
		};
	}
	return null;
}

function parseRegisteredPerNoteControllers(line) {
	// Match entries with dash/reference on same line: "3 Pitch 7.25 – Section 7.4.15.2"
	const matchWithRef = line.match(/^(\d+)(?:[–-](\d+))?\s+(.+?)\s+([–-])\s*(.*)$/);
	if (matchWithRef && !isHeaderValue(matchWithRef[1])) {
		const numEnd = matchWithRef[2] ? `–${matchWithRef[2]}` : '';
		let reference = '–';
		const rest = matchWithRef[5].trim();
		if (rest.includes('Section')) {
			const refMatch = rest.match(/Section\s+[\d.]+/);
			if (refMatch) {
				reference = refMatch[0];
			}
		} else if (rest.includes('MMA RP')) {
			const refMatch = rest.match(/MMA\s+RP-?\d+/);
			if (refMatch) {
				reference = refMatch[0];
			}
		} else if (rest && rest !== '–' && rest !== '-') {
			reference = rest;
		}
		return {
			number: `${matchWithRef[1]}${numEnd}`,
			controller_name: matchWithRef[3].trim(),
			default_value: rest || '–',
			reference
		};
	}
	// Match entries without dash (multi-line): "76 Sound Controller 7 Vibrato Rate"
	const matchNoDash = line.match(/^(\d+)(?:[–-](\d+))?\s+(.+)$/);
	if (matchNoDash && !isHeaderValue(matchNoDash[1]) && !matchNoDash[3].match(/^[–-]/)) {
		const numEnd = matchNoDash[2] ? `–${matchNoDash[2]}` : '';
		let controllerName = matchNoDash[3].trim();
		let reference = '–';
		// Extract MMA RP reference from controller name
		const rpMatch = controllerName.match(/^(.+?)\s+(MMA\s+RP-?\d+)$/);
		if (rpMatch) {
			controllerName = rpMatch[1].trim();
			reference = rpMatch[2];
		}
		// Filter out continuation lines like "96 and"
		if (controllerName.match(/^(and|above|Level|Intensity|Depth)$/i)) {
			return null;
		}
		return {
			number: `${matchNoDash[1]}${numEnd}`,
			controller_name: controllerName,
			default_value: '–',
			reference
		};
	}
	return null;
}

function parseCenterValueExamples(line) {
	const match = line.match(/^(\d+\s*bits?)\s+(0x[0-9A-F]+)\s+(.+)$/i);
	if (match && !isHeaderValue(match[1])) {
		return {
			value_size: match[1].trim(),
			center_hex: match[2],
			center_binary: match[3].trim()
		};
	}
	return null;
}

function parseUmpFormats(line) {
	const match = line.match(/^(.+?)\s+(0x[0-9A-F])\s+(gggg|0xg|res\.|reserved)\s+(.+)$/);
	if (match) {
		return {
			message: match[1].trim(),
			mt: match[2],
			group: match[3],
			fields: match[4].trim()
		};
	}
	return null;
}

function parseMidi2Addressing(line) {
	if (line.match(/^(UMP Stream|Utility|MIDI-CI|System|Flex|Data|MIDI\s+\d|Channel|Group)/i)) {
		return { entry: line.trim() };
	}
	return null;
}
