import fs from 'node:fs/promises';
import path from 'node:path';

/**
 * Transforms the Common Rules for MIDI-CI Property Exchange (M2-103-UM)
 * into a structured JSON object.
 *
 * The document contains 97 tables. Key extractable sections:
 * - Table 4: PE Message Format (byte-level layout)
 * - Table 11: All MIDI-CI Messages used for Property Exchange
 * - Table 12: Encoding and Compression Types
 * - Tables 13, 14, 16, 19, 20, 39, 64, 79, 80: Property header definitions
 * - Table 15: Reply Status Codes
 * - Transaction example tables: Header Data | Property Data pairs
 *
 * @param {string} markdownPath - Absolute path to the source markdown file.
 * @param {string} [outDir] - Optional output directory for the JSON file.
 * @returns {Promise<object>} The structured JSON result.
 */
export async function transformPropertyExchange(markdownPath, outDir) {
	const content = await fs.readFile(markdownPath, 'utf-8');
	const lines = content.split('\n');

	const result = {
		metadata: {
			title: 'Common Rules for MIDI-CI Property Exchange',
			doc_id: 'M2-103-UM',
			protocol: 'midi2',
			version: '1.2',
			date: '2023-11',
			source: 'https://amei-music.github.io/midi2.0-docs/amei-pdf/M2-103-UM_v1-2_Common%20Rules_for_MIDI-CI_Property_Exchange.pdf'
		},
		pe_message_format: [],
		pe_messages: [],
		encoding_types: [],
		property_definitions: [],
		reply_status_codes: [],
		transaction_examples: [],
		summary: {}
	};

	let currentTable = null;
	let currentTableNum = 0;
	let pendingPropertyKey = null;
	let pendingValueType = null;
	let pendingDescription = [];

	const PAGE_HEADER_RE = /^## Page \d+$/;
	const TABLE_START_RE = /^Table (\d+)\s+(.+)/;
	const SECTION_HEADER_RE = /^\d+\.\d+(?:\.\d+)?\s+/;
	const NOTE_LINE_RE = /^(Note:|\*Note:)/;

	for (let i = 0; i < lines.length; i++) {
		const line = lines[i].trim();

		if (!line || line.match(PAGE_HEADER_RE)) {
			continue;
		}

		const tableMatch = line.match(TABLE_START_RE);
		if (tableMatch) {
			// Flush any pending property entry
			flushPendingProperty(result, currentTable, currentTableNum, pendingPropertyKey, pendingValueType, pendingDescription);
			pendingPropertyKey = null;
			pendingValueType = null;
			pendingDescription = [];

			currentTableNum = parseInt(tableMatch[1], 10);
			currentTable = mapTableNumber(currentTableNum);
			continue;
		}

		if (!currentTable) {
			continue;
		}

		if (line.match(SECTION_HEADER_RE) || line.match(NOTE_LINE_RE)) {
			flushPendingProperty(result, currentTable, currentTableNum, pendingPropertyKey, pendingValueType, pendingDescription);
			pendingPropertyKey = null;
			pendingValueType = null;
			pendingDescription = [];
			currentTable = null;
			continue;
		}

		const handled = handleLine(result, line, currentTable, currentTableNum, pendingPropertyKey, pendingValueType, pendingDescription);
		if (handled && handled.flushed) {
			pendingPropertyKey = null;
			pendingValueType = null;
			pendingDescription = [];
		} else if (handled && handled.newPending) {
			// Flush old pending entry first
			flushPendingProperty(result, currentTable, currentTableNum, pendingPropertyKey, pendingValueType, pendingDescription);
			pendingPropertyKey = handled.newPending.propertyKey;
			pendingValueType = handled.newPending.valueType;
			pendingDescription = handled.newPending.description ? [handled.newPending.description] : [];
		} else if (handled && handled.appendDescription) {
			pendingDescription.push(handled.appendDescription);
		}
	}

	// Flush final pending entry
	flushPendingProperty(result, currentTable, currentTableNum, pendingPropertyKey, pendingValueType, pendingDescription);

	result.summary = {
		pe_message_format_field_count: result.pe_message_format.length,
		pe_message_count: result.pe_messages.length,
		encoding_type_count: result.encoding_types.length,
		property_definition_count: result.property_definitions.length,
		reply_status_code_count: result.reply_status_codes.length,
		transaction_example_count: result.transaction_examples.length
	};

	if (outDir) {
		await fs.mkdir(outDir, { recursive: true });
		await fs.writeFile(path.join(outDir, 'property-exchange.json'), JSON.stringify(result, null, 2), 'utf-8');
	}

	return result;
}

function mapTableNumber(num) {
	if (num === 4) {
		return 'pe_message_format';
	}
	if (num === 11) {
		return 'pe_messages';
	}
	if (num === 12) {
		return 'encoding_types';
	}
	if (num === 15) {
		return 'reply_status_codes';
	}
	// Property definition tables
	const propertyTables = [13, 14, 16, 19, 20, 39, 64, 79, 80];
	if (propertyTables.includes(num)) {
		return 'property_definitions';
	}
	// Transaction example tables
	const exampleTables = [5, 6, 7, 8, 9, 10, 17, 18, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 40, 41, 42, 43, 44, 45, 46, 47, 48, 49, 50, 51, 52, 53, 54, 55, 56, 57, 58, 59, 60, 61, 62, 63, 65, 66, 67, 68, 69, 70, 71, 72, 73, 74, 75, 76, 77, 78, 81, 82, 83, 84, 85, 86, 87, 88, 89, 90, 91, 92, 93, 94, 95, 96, 97];
	if (exampleTables.includes(num)) {
		return 'transaction_examples';
	}
	return null;
}

function flushPendingProperty(result, tableName, tableNum, propertyKey, valueType, description) {
	if (tableName !== 'property_definitions' || !propertyKey) {
		return;
	}
	result.property_definitions.push({
		property_key: propertyKey,
		value_type: valueType || '',
		description: description.join(' ').trim(),
		table_number: tableNum
	});
}

function isHeaderLine(s) {
	return s.match(/^(Value|Parameter|Property Key|Property Value|Description|Sub ID|Message Type|Header Data|Property Data)/i);
}

function handleLine(result, line, tableName, tableNum, pendingPropertyKey, pendingValueType, pendingDescription) {
	switch (tableName) {
		case 'pe_message_format':
			return handlePeMessageFormat(result, line);
		case 'pe_messages':
			return handlePeMessages(result, line);
		case 'encoding_types':
			return handleEncodingTypes(result, line);
		case 'property_definitions':
			return handlePropertyDefinitions(line, pendingPropertyKey, pendingValueType, pendingDescription);
		case 'reply_status_codes':
			return handleReplyStatusCodes(result, line);
		case 'transaction_examples':
			return handleTransactionExamples(result, line, tableNum);
		default:
			return {};
	}
}

function handlePeMessageFormat(result, line) {
	if (isHeaderLine(line)) {
		return {};
	}
	if (line.match(/^F0\s+/)) {
		result.pe_message_format.push({ value: 'F0', parameter: line.replace(/^F0\s+/, '').trim() });
		return { flushed: true };
	}
	if (line.match(/^7E\s+/)) {
		result.pe_message_format.push({ value: '7E', parameter: line.replace(/^7E\s+/, '').trim() });
		return { flushed: true };
	}
	if (line.match(/^F7\s+/)) {
		result.pe_message_format.push({ value: 'F7', parameter: line.replace(/^F7\s+/, '').trim() });
		return { flushed: true };
	}
	if (line.match(/^0D\s+/)) {
		result.pe_message_format.push({ value: '0D', parameter: line.replace(/^0D\s+/, '').trim() });
		return { flushed: true };
	}
	const hexMatch = line.match(/^([0-9A-F]{2})\s+(.+)$/);
	if (hexMatch && !isHeaderLine(hexMatch[1])) {
		result.pe_message_format.push({ value: hexMatch[1], parameter: hexMatch[2].trim() });
		return { flushed: true };
	}
	const byteMatch = line.match(/^((?:\d+|n|nd|nh|ml)\s+bytes?|1byte)\s+(.+)$/i);
	if (byteMatch && !isHeaderLine(byteMatch[1])) {
		result.pe_message_format.push({ value: byteMatch[1].trim(), parameter: byteMatch[2].trim() });
		return { flushed: true };
	}
	const rangeMatch = line.match(/^([0-9A-F]{2}[:-][0-9A-F]{2}:)\s*(.+)$/i);
	if (rangeMatch) {
		result.pe_message_format.push({ value: rangeMatch[1], parameter: rangeMatch[2].trim() });
		return { flushed: true };
	}
	const multiByteMatch = line.match(/^([0-9A-F]{2}(?:\s[0-9A-F]{2})+)\s+(.+)$/);
	if (multiByteMatch && !isHeaderLine(multiByteMatch[1])) {
		result.pe_message_format.push({ value: multiByteMatch[1], parameter: multiByteMatch[2].trim() });
		return { flushed: true };
	}
	return {};
}

function handlePeMessages(result, line) {
	// "0x30 Inquiry: Property Exchange Capabilities The Inquiry..."
	const match = line.match(/^(0x[0-9A-F]{2})\s+(.+)$/);
	if (match && !isHeaderLine(match[1])) {
		const rest = match[2];
		// Known message types - match the longest possible type name
		const knownTypes = ['Inquiry: Property Exchange Capabilities', 'Reply to Property Exchange Capabilities', 'Inquiry: Get Property Data', 'Reply to Get Property Data', 'Inquiry: Set Property Data', 'Reply to Set Property Data', 'Subscription', 'Reply to Subscription', 'Notify Message', 'MIDI-CI ACK', 'MIDI-CI NAK'];
		let messageType = null;
		let description = rest;
		for (const knownType of knownTypes) {
			if (rest.startsWith(knownType)) {
				messageType = knownType;
				description = rest.substring(knownType.length).trim();
				break;
			}
		}
		if (!messageType) {
			// Fallback: first word
			const words = rest.split(/\s+/);
			messageType = words[0];
			description = words.slice(1).join(' ');
		}
		result.pe_messages.push({
			sub_id_2: match[1],
			message_type: messageType,
			description: description
		});
		return { flushed: true };
	}
	return {};
}

function handleEncodingTypes(result, line) {
	// "ASCII Uncompressed, unencoded (must be 7-bit data)"
	if (line.match(/^Property Value\s+Description/i)) {
		return {};
	}
	const match = line.match(/^(\w[\w+]*)\s+(.+)$/);
	if (match && !isHeaderLine(match[1]) && match[1] !== 'Property') {
		result.encoding_types.push({
			property_value: match[1],
			description: match[2].trim()
		});
		return { flushed: true };
	}
	return {};
}

function handlePropertyDefinitions(line, pendingPropertyKey, _pendingValueType, _pendingDescription) {
	// Skip header row
	if (line.match(/^Property Key\s+Property Value/i)) {
		return {};
	}

	// Try to detect a new property entry: starts with a known property name pattern
	// Property keys are typically lowercase words like "resource", "resId", "status", etc.
	const newPropMatch = line.match(/^([a-z][a-zA-Z]+)\s+(.+)$/);
	if (newPropMatch && !isHeaderLine(newPropMatch[1]) && !pendingPropertyKey) {
		// This is a new property entry
		return {
			newPending: {
				propertyKey: newPropMatch[1],
				valueType: newPropMatch[2].trim(),
				description: ''
			}
		};
	}

	// If we have a pending property and this line doesn't start with a new property key,
	// it's a continuation of the description
	if ((pendingPropertyKey && line && !line.match(/^[a-z][a-zA-Z]+\s+/)) || (pendingPropertyKey && line.match(/^[a-z][a-zA-Z]+\s+/) && isHeaderLine(line))) {
		return { appendDescription: line };
	}

	// Check if this could be a new property entry when we already have a pending one
	if (pendingPropertyKey && newPropMatch && !isHeaderLine(newPropMatch[1])) {
		// Heuristic: if the first word is a known property name pattern and the rest looks like a type
		const knownProps = ['resource', 'resId', 'mutualEncoding', 'flowControl', 'status', 'cacheTime', 'mediaType', 'subscribeId', 'command', 'partial', 'full', 'notify', 'title', 'role', 'canPaginate', 'columns', 'canSubscribe', 'resourceList', 'schema', 'links', 'description', 'name', 'version', 'model', 'manufacturer', 'serial', 'date', 'text', 'encoding', 'compression', 'url', 'action', 'method', 'data'];
		if (knownProps.includes(newPropMatch[1])) {
			return {
				newPending: {
					propertyKey: newPropMatch[1],
					valueType: newPropMatch[2].trim(),
					description: ''
				}
			};
		}
	}

	// Default: append as description
	if (pendingPropertyKey && line) {
		return { appendDescription: line };
	}

	return {};
}

function handleReplyStatusCodes(result, line) {
	if (isHeaderLine(line)) {
		return {};
	}
	// "200 Success/Ok" or "200-299 Success Messages..."
	const match = line.match(/^(\d{3}(?:-\d{3})?)\s+(.+)$/);
	if (match) {
		result.reply_status_codes.push({
			value: match[1],
			description: match[2].trim()
		});
		return { flushed: true };
	}
	return {};
}

function handleTransactionExamples(result, line, tableNum) {
	// "Header Data {"resource":"DeviceInfo"}" or "Property Data none"
	const headerMatch = line.match(/^Header Data\s+(.+)$/);
	if (headerMatch) {
		result.transaction_examples.push({
			table_number: tableNum,
			field: 'Header Data',
			content: headerMatch[1].trim()
		});
		return { flushed: true };
	}
	const propertyMatch = line.match(/^Property Data\s+(.+)$/);
	if (propertyMatch) {
		result.transaction_examples.push({
			table_number: tableNum,
			field: 'Property Data',
			content: propertyMatch[1].trim()
		});
		return { flushed: true };
	}
	// Multi-line JSON content continuation
	// If the last entry was a Property Data or Header Data, append to it
	const lastEntry = result.transaction_examples[result.transaction_examples.length - 1];
	if (lastEntry && lastEntry.table_number === tableNum && !isHeaderLine(line)) {
		lastEntry.content += '\n' + line;
		return { flushed: true };
	}
	return {};
}
