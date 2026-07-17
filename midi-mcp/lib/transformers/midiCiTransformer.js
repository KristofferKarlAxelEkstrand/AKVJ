import fs from 'node:fs/promises';
import path from 'node:path';

/**
 * Transforms the MIDI Capability Inquiry (MIDI-CI) Specification (M2-101-UM)
 * into a structured JSON object.
 *
 * The document contains 46 tables. Most are message format tables with
 * "Value | Parameter" columns. Key extractable sections:
 * - Table 4: Categories of MIDI-CI Messages
 * - Table 5: Standard Format for MIDI-CI Messages
 * - Table 7: Category Supported Bitmap Bit Allocation
 * - Tables 6, 8-13, 15, 17-28, 30, 32-39, 40-43, 45-46: Message format tables
 * - Table 14: ACK Status Codes
 * - Table 16: NAK Status Codes
 * - Table 31: Property Exchange Versions
 * - Table 44: Message Data Control Values
 *
 * @param {string} markdownPath - Absolute path to the source markdown file.
 * @param {string} [outDir] - Optional output directory for the JSON file.
 * @returns {Promise<object>} The structured JSON result.
 */
export async function transformMidiCi(markdownPath, outDir) {
	const content = await fs.readFile(markdownPath, 'utf-8');
	const lines = content.split('\n');

	const result = {
		metadata: {
			title: 'MIDI Capability Inquiry (MIDI-CI) Specification',
			doc_id: 'M2-101-UM',
			protocol: 'midi2',
			version: '1.2',
			date: '2023-11',
			source: 'https://amei-music.github.io/midi2.0-docs/amei-pdf/M2-101-UM_v1-2_MIDI-CI_Specification.pdf'
		},
		categories: [],
		standard_format: [],
		bitmap_allocation: [],
		message_formats: [],
		ack_status_codes: [],
		nak_status_codes: [],
		property_exchange_versions: [],
		message_data_control_values: [],
		endpoint_info_status_values: [],
		profile_id_formats: [],
		summary: {}
	};

	let currentTable = null;
	let currentTableNum = 0;

	const PAGE_HEADER_RE = /^## Page \d+$/;
	const TABLE_START_RE = /^Table (\d+)\s+(.+)/;
	const SECTION_HEADER_RE = /^\d+\.\d+(?:\.\d+)?\s+/;
	const NOTE_LINE_RE = /^(Note:|\*Note:|The following fields)/;

	for (let i = 0; i < lines.length; i++) {
		const line = lines[i].trim();

		if (!line || line.match(PAGE_HEADER_RE)) {
			continue;
		}

		const tableMatch = line.match(TABLE_START_RE);
		if (tableMatch) {
			currentTableNum = parseInt(tableMatch[1], 10);
			currentTable = mapTableNumber(currentTableNum);
			continue;
		}

		if (!currentTable) {
			continue;
		}

		if (line.match(SECTION_HEADER_RE) || line.match(NOTE_LINE_RE)) {
			currentTable = null;
			continue;
		}

		const parsed = parseTableRow(line, currentTable, currentTableNum);
		if (parsed) {
			pushResult(result, currentTable, parsed, currentTableNum);
		}
	}

	result.summary = {
		category_count: result.categories.length,
		standard_format_field_count: result.standard_format.length,
		bitmap_allocation_count: result.bitmap_allocation.length,
		message_format_count: result.message_formats.length,
		ack_status_code_count: result.ack_status_codes.length,
		nak_status_code_count: result.nak_status_codes.length,
		property_exchange_version_count: result.property_exchange_versions.length,
		endpoint_info_status_value_count: result.endpoint_info_status_values.length,
		profile_id_format_count: result.profile_id_formats.length,
		message_data_control_value_count: result.message_data_control_values.length
	};

	if (outDir) {
		await fs.mkdir(outDir, { recursive: true });
		await fs.writeFile(path.join(outDir, 'midi-ci.json'), JSON.stringify(result, null, 2), 'utf-8');
	}

	return result;
}

function mapTableNumber(num) {
	if (num === 4) {
		return 'categories';
	}
	if (num === 5) {
		return 'standard_format';
	}
	if (num === 7) {
		return 'bitmap_allocation';
	}
	if (num === 10) {
		return 'endpoint_info_status_values';
	}
	if (num === 14) {
		return 'ack_status_codes';
	}
	if (num === 16) {
		return 'nak_status_codes';
	}
	if (num === 31) {
		return 'property_exchange_versions';
	}
	if (num === 44) {
		return 'message_data_control_values';
	}
	if (num === 19) {
		return 'profile_id_formats';
	}
	// Message format tables
	const messageFormatTables = [6, 8, 9, 11, 12, 13, 15, 17, 18, 20, 21, 22, 23, 24, 25, 26, 27, 28, 30, 32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 45, 46];
	if (messageFormatTables.includes(num)) {
		return 'message_formats';
	}
	return null;
}

function pushResult(result, tableName, row, tableNum) {
	if (tableName === 'message_formats') {
		result.message_formats.push({ ...row, table_number: tableNum });
	} else if (result[tableName]) {
		result[tableName].push(row);
	}
}

function parseTableRow(line, tableName, _tableNum) {
	switch (tableName) {
		case 'categories':
			return parseCategories(line);
		case 'standard_format':
			return parseStandardFormat(line);
		case 'bitmap_allocation':
			return parseBitmapAllocation(line);
		case 'message_formats':
			return parseMessageFormat(line);
		case 'endpoint_info_status_values':
			return parseEndpointInfoStatusValues(line);
		case 'profile_id_formats':
			return parseProfileIdFormats(line);
		case 'ack_status_codes':
			return parseStatusCodes(line);
		case 'nak_status_codes':
			return parseStatusCodes(line);
		case 'property_exchange_versions':
			return parsePropertyExchangeVersions(line);
		case 'message_data_control_values':
			return parseMessageDataControlValues(line);
		default:
			return null;
	}
}

function isHeaderLine(s) {
	return s.match(/^(Value|Parameter|Category|Sub-ID|Description|Bit|Status Code|Status Data|Reason|Common Rules|Major|Minor|Total Expected|Number|Property Exchange|Message Data)/i);
}

function parseCategories(line) {
	// "0 	0x00-0x0F 	Reserved – No Messages Defined Yet"
	const match = line.match(/^(\d+)\s+(0x[0-9A-F]{2}-0x[0-9A-F]{2})\s+(.+)$/);
	if (match && !isHeaderLine(match[1])) {
		return {
			category: parseInt(match[1], 10),
			sub_id_2_range: match[2],
			description: match[3].trim()
		};
	}
	return null;
}

function parseStandardFormat(line) {
	// "F0 	System Exclusive Start" or "1 byte 	Device ID..."
	const match = line.match(/^([A-Fa-f0-9]{2}|n bytes|\d+ bytes?|1 byte|00.0F:|10.7D:|7E:|7F:|0x[0-9A-F]{2}.0x[0-9A-F]{2}:)\s+(.+)$/);
	if (match && !isHeaderLine(match[1])) {
		return {
			value: match[1].trim(),
			parameter: match[2].trim()
		};
	}
	return null;
}

function parseBitmapAllocation(line) {
	// "D0 	0 	0x00-0x0F 	Reserved – No Messages Defined Yet"
	const match = line.match(/^(D\d)\s+(\d+)\s+(0x[0-9A-F]{2}-0x[0-9A-F]{2})\s+(.+)$/);
	if (match && !isHeaderLine(match[1])) {
		return {
			bit: match[1],
			category: parseInt(match[2], 10),
			sub_id_2_range: match[3],
			description: match[4].trim()
		};
	}
	return null;
}

function parseMessageFormat(line) {
	// "F0 	System Exclusive Start" or "1 byte 	Device ID..."
	// Skip header row "Value 	Parameter"
	if (line.match(/^Value\s+Parameter$/i)) {
		return null;
	}
	if (line.match(/^F0\s+/)) {
		return { value: 'F0', parameter: line.replace(/^F0\s+/, '').trim() };
	}
	if (line.match(/^7E\s+/)) {
		return { value: '7E', parameter: line.replace(/^7E\s+/, '').trim() };
	}
	if (line.match(/^F7\s+/)) {
		return { value: 'F7', parameter: line.replace(/^F7\s+/, '').trim() };
	}
	if (line.match(/^0D\s+/)) {
		return { value: '0D', parameter: line.replace(/^0D\s+/, '').trim() };
	}
	// Match hex values like "70", "7F", "30", "42", etc.
	const hexMatch = line.match(/^([0-9A-F]{2})\s+(.+)$/);
	if (hexMatch && !isHeaderLine(hexMatch[1]) && hexMatch[1].length === 2) {
		return { value: hexMatch[1], parameter: hexMatch[2].trim() };
	}
	// Match byte descriptions like "1 byte", "4 bytes", "n bytes", "ml bytes", "5 bytes"
	const byteMatch = line.match(/^((?:\d+|n|ml)\s+bytes?|1byte)\s+(.+)$/i);
	if (byteMatch && !isHeaderLine(byteMatch[1])) {
		return { value: byteMatch[1].trim(), parameter: byteMatch[2].trim() };
	}
	// Match sub-ranges like "00–0F:", "10–7D:", "7E:", "7F:"
	const rangeMatch = line.match(/^([0-9A-F]{2}[–-][0-9A-F]{2}:[\s\S]*)$/i);
	if (rangeMatch) {
		const colonIdx = rangeMatch[1].indexOf(':');
		const value = rangeMatch[1].substring(0, colonIdx + 1).trim();
		const parameter = rangeMatch[1].substring(colonIdx + 1).trim();
		return { value, parameter };
	}
	// Match "7F 7F 7F 7F" type multi-byte values
	const multiByteMatch = line.match(/^([0-9A-F]{2}(?:\s[0-9A-F]{2})+)\s+(.+)$/);
	if (multiByteMatch && !isHeaderLine(multiByteMatch[1])) {
		return { value: multiByteMatch[1], parameter: multiByteMatch[2].trim() };
	}
	return null;
}

function parseStatusCodes(line) {
	// "0x00 	0x00 	ACK" or "0x00 - 0x0F Success Messages..."
	const match = line.match(/^(0x[0-9A-F]{2}(?:\s*[-–]\s*0x[0-9A-F]{2})?)\s+(0x[0-9A-F]{2}(?:\s*[-–]\s*0x[0-9A-F]{2})?)\s+(.+)$/);
	if (match && !isHeaderLine(match[1])) {
		return {
			status_code: match[1],
			status_data: match[2],
			reason: match[3].trim()
		};
	}
	// Range headers like "0x00 - 0x0F Success Messages – Do Not Retry"
	const rangeMatch = line.match(/^(0x[0-9A-F]{2}\s*[-–]\s*0x[0-9A-F]{2})\s+(.+)$/);
	if (rangeMatch && !isHeaderLine(rangeMatch[1]) && !rangeMatch[2].match(/^0x/)) {
		return {
			status_code: rangeMatch[1],
			status_data: '–',
			reason: rangeMatch[2].trim()
		};
	}
	return null;
}

function parsePropertyExchangeVersions(line) {
	// "1.0/1.1* 	0x00 	0x00"
	const match = line.match(/^(.+?)\s+(0x[0-9A-F]{2})\s+(0x[0-9A-F]{2})$/);
	if (match && !isHeaderLine(match[1])) {
		return {
			common_rules_version: match[1].trim(),
			major_version: match[2],
			minor_version: match[3]
		};
	}
	return null;
}

function parseEndpointInfoStatusValues(line) {
	// "0x00 \tProduct instance ID \tProduct Instance ID of the UMP"
	const parts = line
		.split('\t')
		.map(s => s.trim())
		.filter(Boolean);
	if (parts.length >= 2 && parts[0].match(/^0x[0-9A-F]{2}/)) {
		return {
			status_value: parts[0],
			target_property: parts[1],
			details: parts[2] || ''
		};
	}
	return null;
}

function parseProfileIdFormats(line) {
	// "Profile ID Byte 1 \t0x7E Standard Defined Profile \tManufacturer SysEx ID 1 Profile"
	const parts = line
		.split('\t')
		.map(s => s.trim())
		.filter(Boolean);
	if (parts.length >= 3 && parts[0].match(/^Profile ID Byte \d+$/)) {
		return {
			byte_name: parts[0],
			standard_defined: parts[1],
			manufacturer_specific: parts[2]
		};
	}
	return null;
}

function parseMessageDataControlValues(line) {
	// "0x00 	Do not report any data..."
	const match = line.match(/^(0x[0-9A-F]{2}(?:\s*[-–]\s*0x[0-9A-F]{2})?)\s+(.+)$/);
	if (match && !isHeaderLine(match[1])) {
		return {
			value: match[1],
			description: match[2].trim()
		};
	}
	return null;
}
