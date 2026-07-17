import fs from 'node:fs/promises';
import path from 'node:path';

/**
 * Transforms the Network MIDI 2.0 (UDP) Transport Specification (M2-124-UM)
 * into a structured JSON object.
 *
 * @param {string} markdownPath - Absolute path to the source markdown file.
 * @param {string} [outDir] - Optional output directory for the JSON file.
 * @returns {Promise<object>} The structured JSON result.
 */
export async function transformNetworkMidi(markdownPath, outDir) {
	const content = await fs.readFile(markdownPath, 'utf-8');
	const lines = content.split('\n');

	const result = {
		metadata: {},
		version_history: [],
		definitions: [],
		conformance_words: [],
		normative_references: [],
		dns_records: { ptr: [], srv: [], txt: [] },
		command_packet_header: { fields: [] },
		signature: {},
		commands: [],
		session_states: [],
		commands_per_session_state: [],
		command_tables: {},
		nak_reasons: [],
		bye_reasons: [],
		error_reasons: [],
		authentication_states: [],
		summary: {}
	};

	const PAGE_HEADER_RE = /^## Page \d+$/;

	parseFrontmatter(content, result);

	let currentSection = null;
	let currentTable = null;

	for (let i = 0; i < lines.length; i++) {
		const line = lines[i];
		const trimmedLine = line.trim();

		if (!trimmedLine || trimmedLine.match(PAGE_HEADER_RE)) {
			continue;
		}

		// Skip TOC entries
		if (trimmedLine.match(/\.{5,}/)) {
			continue;
		}

		// Section detection
		if (trimmedLine.match(/^Table 1 Version History/i)) {
			currentSection = 'version_history';
			continue;
		}
		if (trimmedLine.match(/^1\.4\.1\s+Definitions/i)) {
			currentSection = 'definitions';
			continue;
		}
		if (trimmedLine.match(/^Table 2 Words Relating/i)) {
			currentSection = 'conformance_required';
			continue;
		}
		if (trimmedLine.match(/^Table 3 Words Not Relating/i)) {
			currentSection = 'conformance_descriptive';
			continue;
		}
		if (trimmedLine.match(/^1\.3\.1\s+Normative References/i)) {
			currentSection = 'normative_references';
			continue;
		}
		if (trimmedLine.match(/^Table 4 PTR Fields/i)) {
			currentSection = 'ptr_fields';
			continue;
		}
		if (trimmedLine.match(/^Table 5 SRV Fields/i)) {
			currentSection = 'srv_fields';
			continue;
		}
		if (trimmedLine.match(/^Table 6 TXT Keys/i)) {
			currentSection = 'txt_fields';
			continue;
		}
		if (trimmedLine.match(/^5\.2\s+Signature/i)) {
			currentSection = 'signature';
			continue;
		}
		if (trimmedLine.match(/^Table 7 Command Packet Header/i)) {
			currentSection = 'command_packet_header';
			continue;
		}
		if (trimmedLine.match(/^Table 8 List of all Commands/i)) {
			currentSection = 'command_list';
			continue;
		}
		if (trimmedLine.match(/^6\.1\s+Session States/i)) {
			currentSection = 'session_states';
			continue;
		}
		if (trimmedLine.match(/^Table 9 List of valid Commands/i)) {
			currentSection = 'commands_per_state';
			continue;
		}
		if (trimmedLine.match(/^[67]\.\d+\s+/) && currentSection?.match(/^(commands_per_state|auth_states|command_table|nak_reasons|bye_reasons|error_reasons)/)) {
			currentSection = null;
			// Don't continue — let this line be processed normally
		}
		if (trimmedLine.match(/^Table 25 List of NAK Reasons/i)) {
			currentSection = 'nak_reasons';
			continue;
		}
		if (trimmedLine.match(/^Table 27 List of Bye Reasons/i)) {
			currentSection = 'bye_reasons';
			continue;
		}
		if (trimmedLine.match(/^Table 32 List of Error Reasons/i)) {
			currentSection = 'error_reasons';
			continue;
		}
		if (trimmedLine.match(/^Table 1[57] Values for.*Authentication/i)) {
			currentSection = 'auth_states';
			continue;
		}

		// Detect command field tables (Tables 10-14, 16, 18-24, 26, 28-31)
		const cmdTableMatch = trimmedLine.match(/^Table (\d+) (.+?)(?:\s+Command)?$/);
		if (cmdTableMatch && !currentSection?.match(/^(version_history|definitions|conformance|normative|ptr|srv|txt|signature|command_packet|command_list|session_states|commands_per|nak_reasons|bye_reasons|error_reasons|auth_states)/)) {
			const tableNum = parseInt(cmdTableMatch[1], 10);
			if (tableNum >= 10 && tableNum <= 31) {
				currentSection = 'command_table';
				currentTable = {
					table_number: tableNum,
					name: cmdTableMatch[2].trim(),
					fields: []
				};
				continue;
			}
		}

		// Detect top-level section boundaries to terminate table parsing
		if (trimmedLine.match(/^[89]\s+[A-Z]/) || trimmedLine.match(/^Appendix/i)) {
			currentSection = null;
			continue;
		}

		// Dispatch
		switch (currentSection) {
			case 'version_history':
				handleVersionHistory(result, trimmedLine);
				break;
			case 'definitions':
				handleDefinitions(result, trimmedLine);
				break;
			case 'conformance_required':
				handleConformanceWords(result, trimmedLine, 'required');
				break;
			case 'conformance_descriptive':
				handleConformanceWords(result, trimmedLine, 'descriptive');
				break;
			case 'normative_references':
				handleNormativeReferences(result, trimmedLine);
				break;
			case 'ptr_fields':
				handleDnsFields(result.dns_records.ptr, trimmedLine);
				break;
			case 'srv_fields':
				handleDnsFields(result.dns_records.srv, trimmedLine);
				break;
			case 'txt_fields':
				handleDnsFields(result.dns_records.txt, trimmedLine);
				break;
			case 'signature':
				handleSignature(result, trimmedLine);
				break;
			case 'command_packet_header':
				handleCommandPacketHeader(result, trimmedLine);
				break;
			case 'command_list':
				handleCommandList(result, trimmedLine);
				break;
			case 'session_states':
				handleSessionStates(result, trimmedLine);
				break;
			case 'commands_per_state':
				handleCommandsPerState(result, trimmedLine);
				break;
			case 'nak_reasons':
				handleReasonList(result.nak_reasons, trimmedLine, 'nak');
				break;
			case 'bye_reasons':
				handleReasonList(result.bye_reasons, trimmedLine, 'bye');
				break;
			case 'error_reasons':
				handleReasonList(result.error_reasons, trimmedLine, 'error');
				break;
			case 'auth_states':
				handleAuthStates(result, trimmedLine);
				break;
			case 'command_table':
				handleCommandTable(result, trimmedLine, currentTable);
				break;
			default:
				break;
		}
	}

	// Finalize command tables
	for (const [key, table] of Object.entries(result.command_tables)) {
		if (table.fields.length === 0) {
			delete result.command_tables[key];
		}
	}

	result.summary = {
		version_history_count: result.version_history.length,
		definition_count: result.definitions.length,
		conformance_word_count: result.conformance_words.length,
		normative_reference_count: result.normative_references.length,
		dns_record_count: result.dns_records.ptr.length + result.dns_records.srv.length + result.dns_records.txt.length,
		command_count: result.commands.length,
		session_state_count: result.session_states.length,
		command_table_count: Object.keys(result.command_tables).length,
		nak_reason_count: result.nak_reasons.length,
		bye_reason_count: result.bye_reasons.length,
		error_reason_count: result.error_reasons.length
	};

	if (outDir) {
		await fs.mkdir(outDir, { recursive: true });
		await fs.writeFile(path.join(outDir, 'network-midi.json'), JSON.stringify(result, null, 2), 'utf-8');
	}

	return result;
}

function parseFrontmatter(content, result) {
	const fmMatch = content.match(/^---\n([\s\S]*?)\n---/);
	if (!fmMatch) {
		return;
	}

	const fm = fmMatch[1];
	for (const line of fm.split('\n')) {
		const match = line.match(/^(\w+):\s*(.+)$/);
		if (match) {
			const key = match[1];
			const value = match[2].trim();
			if (key === 'title') {
				result.metadata.title = value;
			} else if (key === 'docId') {
				result.metadata.doc_id = value;
			} else if (key === 'version') {
				result.metadata.version = value;
			} else if (key === 'protocol') {
				result.metadata.protocol = value;
			} else if (key === 'source') {
				result.metadata.source = value;
			} else if (key === 'pages') {
				result.metadata.pages = parseInt(value, 10);
			} else if (key === 'summary') {
				result.metadata.summary = value;
			}
		}
	}
}

function handleVersionHistory(result, line) {
	// "2024-11-20 1.0 Initial release"
	// "2025-12-01 1.0.1 Clarifications and Errata Fixes"
	const parts = line.split(/\s+/);
	if (parts.length >= 3 && parts[0].match(/^\d{4}-\d{2}-\d{2}$/)) {
		result.version_history.push({
			date: parts[0],
			version: parts[1],
			changes: parts.slice(2).join(' ')
		});
	}
}

function handleDefinitions(result, line) {
	// "AMEI: Association of Musical Electronics Industry..."
	// "CryptoNonce: A cryptographic nonce..."
	const defMatch = line.match(/^([A-Z][A-Za-z\s/().-]+?):\s+(.+)$/);
	if (defMatch && defMatch[1].length < 60) {
		if (!defMatch[1].match(/^\d/) && !defMatch[1].match(/^Table|^Figure|^Appendix|^Note/i)) {
			result.definitions.push({
				term: defMatch[1].trim(),
				definition: defMatch[2].trim()
			});
		}
	}
}

function handleConformanceWords(result, line, category) {
	// "shall Statements of requirement"
	// "must Statements of unavoidability Describes an action..."
	const match = line.match(/^(shall|should|may|must|will|can|might)\s+(Statements of \w+)(?:\s+(.+))?$/);
	if (match) {
		result.conformance_words.push({
			word: match[1],
			reserved_for: match[2].trim(),
			relation: match[3]?.trim() || '',
			category
		});
	}
}

function handleNormativeReferences(result, line) {
	// "[RFC768] User Datagram Protocol (UDP)..."
	// "[MA01] Complete MIDI 1.0 Detailed Specification..."
	const match = line.match(/^(\[(?:RFC|MA|USBIF|EIA)\d+\])\s+(.+)$/);
	if (match) {
		result.normative_references.push({
			reference: match[1],
			description: match[2].trim()
		});
	}
}

function handleDnsFields(targetArray, line) {
	// "Service Type _midi2._udp.local The registered service type in the local domain."
	// "UMPEndpointName The UMP Endpoint Name of the Host in (UTF-8, up to 98 bytes)."
	// Single-space separated, not tab
	if (line.match(/^Field|^Value|^Example|^Scheme/i)) {
		return;
	}
	// Try to match known field names
	const knownFields = ['Service Type', 'Service Instance Name', 'Port', 'Hostname', 'UMPEndpointName', 'ProductInstanceId'];
	for (const field of knownFields) {
		if (line.startsWith(field)) {
			const rest = line.substring(field.length).trim();
			const parts = rest.split(/\s+/);
			if (field === 'Service Type') {
				targetArray.push({ field, value: parts[0], description: parts.slice(1).join(' ') });
			} else if (field === 'Service Instance Name') {
				targetArray.push({ field, value: parts[0], description: parts.slice(1).join(' ') });
			} else if (field === 'Port') {
				targetArray.push({ field, value: parts[0], description: parts.slice(1).join(' ') });
			} else if (field === 'Hostname') {
				targetArray.push({ field, value: parts[0], description: parts.slice(1).join(' ') });
			} else {
				targetArray.push({ field, value: '', description: rest });
			}
			return;
		}
	}
}

function handleSignature(result, line) {
	if (!result.signature.value) {
		result.signature = { value: '0x4D494449', ascii: 'MIDI', size_bytes: 4, description: '' };
	}
	if (line.match(/^5\.3|^5\.4|^Figure/i)) {
		return;
	}
	if (line.match(/^All UDP packets shall start/i)) {
		result.signature.description = line;
	}
}

function handleCommandPacketHeader(result, line) {
	// "Command Code 1" (field + size)
	// "Command Payload Length 1 Length in number of 32-bit words..."
	// "Command Specific Data 2"
	if (line.match(/^Field\s+Size/i)) {
		return;
	}
	// Match known field names with size
	const fieldMatch = line.match(/^(Command Code|Command Payload Length|Command Specific Data)\s+(\d+)\s*(.*)$/);
	if (fieldMatch) {
		result.command_packet_header.fields.push({
			field: fieldMatch[1],
			size_bytes: parseInt(fieldMatch[2], 10),
			description: fieldMatch[3].trim()
		});
	}
}

function handleCommandList(result, line) {
	// "0xFF UMP Data Sequence Number UMP Data both 7.1"
	// "0x01 Invitation Capabilities UMP Endpoint Name + Product Instance Id C → H 6.4"
	// These are multi-line, try to capture hex code + name
	const hexMatch = line.match(/^(0x[0-9A-Fa-f]{2})\s+(.+)$/);
	if (hexMatch) {
		const code = hexMatch[1];
		const rest = hexMatch[2].trim();
		// Try to extract name (first word/phrase before tab or multiple spaces)
		const nameMatch = rest.match(/^([A-Z][A-Za-z\s:]+?)(?:\s{2,}|\t|$)/);
		const name = nameMatch ? nameMatch[1].trim() : rest.split(/\s{2,}|\t/)[0] || rest;

		// Try to extract direction and section
		const directionMatch = rest.match(/(C\s*→\s*H|H\s*→\s*C|both)/i);
		const sectionMatch = rest.match(/(\d+\.\d+(?:\.\d+)?)\s*$/);

		result.commands.push({
			code,
			name,
			direction: directionMatch ? directionMatch[1].replace(/\s/g, '') : '',
			section: sectionMatch ? sectionMatch[1] : ''
		});
	}
}

function handleSessionStates(result, line) {
	// "• Idle - Device may be aware of each other..."
	// "• Pending Invitation - Client has sent Invitation..."
	const stateMatch = line.match(/^[•·]\s+(.+?)\s*[-–]\s*(.+)$/);
	if (stateMatch) {
		result.session_states.push({
			state: stateMatch[1].trim(),
			description: stateMatch[2].trim()
		});
	}
}

function handleCommandsPerState(result, line) {
	// "Every State NAK" — state on same line as first command
	// "Ping" — continuation command (no state prefix)
	// "Idle Invitation" — state + first command
	if (line.match(/^Session State|^Note/i)) {
		return;
	}
	const knownStates = ['Every State', 'Idle', 'Pending Invitation', 'Authentication Required', 'Established Session', 'Pending Session Reset', 'Pending Bye'];
	for (const state of knownStates) {
		if (line.startsWith(state)) {
			const rest = line.substring(state.length).trim();
			const commands = rest ? [rest] : [];
			result.commands_per_session_state.push({
				state,
				valid_commands: commands
			});
			return;
		}
	}
	// Continuation: add to last entry's commands (only known command names)
	const lastEntry = result.commands_per_session_state[result.commands_per_session_state.length - 1];
	const knownCommands = ['NAK', 'Ping', 'Ping Reply', 'Bye', 'Invitation', 'Invitation Reply: Accepted', 'Invitation Reply: Pending', 'Invitation Reply: Authentication Required', 'Invitation Reply: User Authentication required', 'Invitation with Authentication', 'Invitation with User Authentication', 'UMP Data', 'Retransmit Request', 'Retransmit Error', 'Session Reset Reply', 'Bye Reply'];
	if (lastEntry && knownCommands.includes(line)) {
		lastEntry.valid_commands.push(line);
	}
}

function handleReasonList(targetArray, line, _type) {
	// NAK: "0x00 Other The Text Message field..."
	// Bye: "0x01 User terminated session"
	// Bye: "— Sent by Either Client or Host —" (category header)
	// Error: "0x00 Unknown"
	const hexMatch = line.match(/^(0x[0-9A-Fa-f]{2})\s+(.+)$/);
	if (hexMatch) {
		const rest = hexMatch[2];
		// Try to split at multi-space gap or tab first
		const multiParts = rest
			.split(/\s{2,}|\t/)
			.map(s => s.trim())
			.filter(Boolean);
		if (multiParts.length >= 2) {
			targetArray.push({
				code: hexMatch[1],
				reason: multiParts[0],
				description: multiParts.slice(1).join(' ')
			});
		} else {
			// Single-space format: try known reason names
			const knownReasons = ['Other', 'Command Not Supported', 'Command Not Expected', 'Command Malformed', 'Bad Ping Reply', 'Unknown or Undefined', 'User terminated session', 'Power Down', 'Too Many Missing UMP Packets - cannot recover.', 'Timeout', 'Session Not Established', 'No Pending Session', 'Protocol Error', 'Invitation Failed: too many opened sessions', 'Invitation With Authentication Rejected: missing prior invitation attempt without authentication.', 'Invitation Rejected: user did not accept session', 'Invitation Rejected: authentication failed', 'Invitation Rejected: username not found', 'No Matching Authentication Method', 'Invitation Canceled', 'Unknown'];
			knownReasons.sort((a, b) => b.length - a.length);
			let matched = false;
			for (const reason of knownReasons) {
				if (rest.startsWith(reason)) {
					const description = rest.substring(reason.length).trim();
					targetArray.push({ code: hexMatch[1], reason, description });
					matched = true;
					break;
				}
			}
			if (!matched) {
				targetArray.push({ code: hexMatch[1], reason: rest.trim(), description: '' });
			}
		}
		return;
	}

	// Category headers for Bye: "— Sent by Either Client or Host —"
	if (line.match(/^—.*—$/)) {
		targetArray.push({
			code: '',
			reason: line,
			description: 'category header'
		});
	}
}

function handleAuthStates(result, line) {
	// "0x00 First authentication request"
	// "0x01 Previously provided Authentication"
	// Filter out hex byte sequences from examples (e.g. "0x67 0x6E ...")
	const hexMatch = line.match(/^(0x[0-9A-Fa-f]{2})\s+([A-Z][a-zA-Z].+)$/);
	if (hexMatch && !line.match(/0x[0-9A-Fa-f]{2}\s+0x[0-9A-Fa-f]{2}/)) {
		result.authentication_states.push({
			code: hexMatch[1],
			description: hexMatch[2].trim()
		});
	}
}

function handleCommandTable(result, line, currentTable) {
	// "Field Size (bytes) Values Description" — header, skip
	if (line.match(/^Field\s+Size/i)) {
		return;
	}

	// Known field name patterns in command tables
	// Lines like: "Command Code 1 0x01"
	// "Command Payload Length (pl) 1 2...36 Payload length..."
	// "Command Specific Data 1 (csd1) 1 1…25 Length..."
	// "Command Specific Data 2 1 bitmap Capabilities"
	// "UMP Endpoint Name (csd1*4) String The UMP Endpoint Name..."
	// "Product Instance Id (pl-csd1)*4 String The Product Instance Id..."
	// "CryptoNonce 16 ASCII A cryptographic nonce..."
	// "Sequence Number 2 16-bit unsigned..."
	// "Reserved 2 0"
	// "Text Message pl*4 String An optional message..."
	// "Number of UMP Commands 2 0 Number of UMP Data Commands..."

	const knownFields = ['Command Code', 'Command Payload Length', 'Command Specific Data 1', 'Command Specific Data 2', 'Command Specific Data', 'UMP Endpoint Name', 'UMP Data', 'Product Instance Id', 'CryptoNonce', 'Sequence Number', 'Reserved', 'Text Message', 'Number of UMP Commands', 'Ping Id', 'NAK Code', 'NAK Reason', 'Bye Code', 'Bye Reason', 'Error Reason', 'Capabilities', 'Username', 'Authentication State', 'Authentication Digest', 'Session Reset Code'];

	// Sort by length descending so longer names match first
	knownFields.sort((a, b) => b.length - a.length);

	for (const fieldName of knownFields) {
		if (line.startsWith(fieldName)) {
			const rest = line.substring(fieldName.length).trim();
			// Try to extract size, values, description
			// Pattern: size values description (all optional)
			const restParts = rest.split(/\s+/);
			const field = {
				field: fieldName,
				size_bytes: '',
				values: '',
				description: ''
			};

			// First token might be a size (number or formula like (csd1*4) or pl*4)
			if (restParts.length > 0) {
				const firstPart = restParts[0];
				if (firstPart.match(/^\d+$/) || firstPart.match(/^\(.*\)$/) || firstPart.match(/^[a-z]+\*\d+$/i)) {
					field.size_bytes = firstPart;
					restParts.shift();
				}
			}

			// Next token might be values (0x01, String, bitmap, ASCII, Enum, 0, etc.)
			if (restParts.length > 0) {
				const secondPart = restParts[0];
				if (secondPart.match(/^0x[0-9A-Fa-f]+$/) || secondPart.match(/^(String|bitmap|ASCII|Enum|0|16-bit|state)$/i)) {
					field.values = secondPart;
					restParts.shift();
				}
			}

			field.description = restParts.join(' ');
			currentTable.fields.push(field);

			// Store table in result
			const tableKey = `table_${currentTable.table_number}`;
			if (!result.command_tables[tableKey]) {
				result.command_tables[tableKey] = currentTable;
			}
			return;
		}
	}

	// Also store table if we haven't yet (for tables with no recognized fields)
	const tableKey = `table_${currentTable.table_number}`;
	if (!result.command_tables[tableKey]) {
		result.command_tables[tableKey] = currentTable;
	}
}
