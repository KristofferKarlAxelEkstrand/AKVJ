import fs from 'node:fs/promises';
import path from 'node:path';

/**
 * Transforms the MIDI Machine Control specification (RP-013)
 * into a structured JSON object.
 *
 * The document is 11042 lines, heavily OCR-fragmented with tab-separated
 * tables broken across multiple lines. The transformer focuses on:
 * - Message types and abbreviations (well-formed tab-separated)
 * - Commands index list (well-formed single-line tab entries)
 * - Information fields index list (well-formed single-line tab entries)
 * - Detailed command descriptions (hex + name marker with preceding description)
 * - Detailed information field descriptions (same pattern in Section 6)
 *
 * @param {string} markdownPath - Absolute path to the source markdown file.
 * @param {string} [outDir] - Optional output directory for the JSON file.
 * @returns {Promise<object>} The structured JSON result.
 */
export async function transformMmc(markdownPath, outDir) {
	const content = await fs.readFile(markdownPath, 'utf-8');
	const lines = content.split('\n');

	const result = {
		metadata: {
			title: 'MIDI Machine Control',
			doc_id: 'RP-013',
			protocol: 'midi1',
			version: '1.0',
			date: '1996-01',
			source: 'RP-013_v1-0_MIDI_Machine_Control_Specification_96-1-4.pdf'
		},
		message_types: [],
		abbreviations: [],
		commands: [],
		information_fields: [],
		command_descriptions: [],
		field_descriptions: [],
		summary: {}
	};

	const PAGE_HEADER_RE = /^## Page (\d+)$/;

	// Section tracking
	let currentSection = null;
	let currentPage = 0;

	// For detailed descriptions: accumulate text before hex marker
	let pendingDescription = [];
	let inCommandDescriptions = false;
	let inFieldDescriptions = false;

	for (let i = 0; i < lines.length; i++) {
		const line = lines[i];
		const trimmedLine = line.trim();

		if (!trimmedLine) {
			continue;
		}

		// Track page number
		const pageMatch = trimmedLine.match(PAGE_HEADER_RE);
		if (pageMatch) {
			currentPage = parseInt(pageMatch[1], 10);
			continue;
		}

		// Detect section boundaries — require tab AND past TOC (page > 10)
		if (currentPage > 10 && line.match(/^4\s\tINDEX LIST/i)) {
			currentSection = 'index_list';
			continue;
		}
		if (currentPage > 10 && line.match(/^5\s\tDETAILED COMMAND/i)) {
			currentSection = 'command_descriptions';
			inCommandDescriptions = true;
			inFieldDescriptions = false;
			pendingDescription = [];
			continue;
		}
		if (currentPage > 10 && line.match(/^6\s\tDETAILED RESPONSE/i)) {
			currentSection = 'field_descriptions';
			inCommandDescriptions = false;
			inFieldDescriptions = true;
			pendingDescription = [];
			continue;
		}

		// Message types section (within index list)
		if (currentSection === 'index_list' && trimmedLine.match(/^MESSAGE TYPES/i)) {
			currentSection = 'message_types';
			continue;
		}
		// Abbreviations section
		if (currentSection === 'message_types' && trimmedLine.match(/^ABBREVIATIONS USED/i)) {
			currentSection = 'abbreviations';
			continue;
		}
		// Commands index
		if (currentSection === 'index_list' || currentSection === 'abbreviations') {
			if (trimmedLine.match(/^COMMANDS$/i)) {
				currentSection = 'commands_index';
				continue;
			}
		}
		// Responses/Information Fields index
		if (currentSection === 'commands_index' && trimmedLine.match(/^RESPONSES AND INFORMATION FIELDS/i)) {
			currentSection = 'fields_index';
			continue;
		}

		// Process based on current section
		switch (currentSection) {
			case 'message_types':
				handleMessageTypes(result, trimmedLine);
				break;
			case 'abbreviations':
				handleAbbreviations(result, trimmedLine);
				break;
			case 'commands_index':
				handleCommandsIndex(result, line);
				break;
			case 'fields_index':
				handleFieldsIndex(result, line);
				break;
			case 'command_descriptions':
				handleDetailedDescriptions(result, trimmedLine, pendingDescription, 'command_descriptions');
				break;
			case 'field_descriptions':
				handleDetailedDescriptions(result, trimmedLine, pendingDescription, 'field_descriptions');
				break;
			default:
				// If in detailed descriptions but section wasn't detected yet, still try
				if (inCommandDescriptions || inFieldDescriptions) {
					const section = inCommandDescriptions ? 'command_descriptions' : 'field_descriptions';
					handleDetailedDescriptions(result, trimmedLine, pendingDescription, section);
				}
				break;
		}
	}

	// No final flush needed — new logic flushes immediately on hex marker

	result.summary = {
		message_type_count: result.message_types.length,
		abbreviation_count: result.abbreviations.length,
		command_count: result.commands.length,
		information_field_count: result.information_fields.length,
		command_description_count: result.command_descriptions.length,
		field_description_count: result.field_descriptions.length
	};

	if (outDir) {
		await fs.mkdir(outDir, { recursive: true });
		await fs.writeFile(path.join(outDir, 'mmc.json'), JSON.stringify(result, null, 2), 'utf-8');
	}

	return result;
}

function handleMessageTypes(result, line) {
	// "Comm 	Support for communications e.g. WAIT, RESUME, GROUP."
	const parts = line
		.split('\t')
		.map(s => s.trim())
		.filter(Boolean);
	if (parts.length >= 2 && parts[0].match(/^[A-Za-z/]+$/) && parts[0].length <= 5) {
		result.message_types.push({
			abbreviation: parts[0],
			description: parts.slice(1).join(' ')
		});
	}
}

function handleAbbreviations(result, line) {
	// "ATR 	Audio Tape Recorder"
	const parts = line
		.split('\t')
		.map(s => s.trim())
		.filter(Boolean);
	if (parts.length >= 2 && parts[0].match(/^[A-Za-z{/]+$/) && parts[0].length <= 8) {
		result.abbreviations.push({
			abbreviation: parts[0],
			description: parts.slice(1).join(' ')
		});
	}
}

function handleCommandsIndex(result, line) {
	// "01 	STOP (MCS) 	Ctrl 	- 	1 234"
	const parts = line
		.split('\t')
		.map(s => s.trim())
		.filter(Boolean);
	if (parts.length >= 3 && parts[0].match(/^[0-9A-Fa-f]{2}$/)) {
		result.commands.push({
			hex: parts[0].toUpperCase(),
			name: parts[1],
			type: parts[2] || '',
			data_bytes: parts.length >= 4 ? parts[3] : '',
			guideline_min_sets: parts.length >= 5 ? parts.slice(4).join(' ') : ''
		});
	}
}

function handleFieldsIndex(result, line) {
	// "01 	SELECTED TIME CODE { st } 	Time 	5 	RW 	1234"
	const parts = line
		.split('\t')
		.map(s => s.trim())
		.filter(Boolean);
	if (parts.length >= 5 && parts[0].match(/^[0-9A-Fa-f]{2}$/)) {
		result.information_fields.push({
			hex: parts[0].toUpperCase(),
			name: parts[1],
			type: parts[2] || '',
			data_bytes: parts[3] || '',
			read_write: parts.length >= 5 ? parts[4] : '',
			guideline_min_sets: parts.length >= 6 ? parts.slice(5).join(' ') : ''
		});
	}
}

function handleDetailedDescriptions(result, line, pendingDescription, section) {
	// In this document, description text appears BEFORE the hex marker line.
	// Pattern: description text...\n hex \tname
	// So we accumulate text, and when a hex marker is found, the accumulated
	// text becomes the description for that command/field.

	// Look for hex marker with tab: "01 \tSTOP" (hex + space + tab + name)
	const hexMatch = line.match(/^([0-9A-Fa-f]{2})\s\t(.+)$/);

	if (hexMatch && hexMatch[2].match(/^[A-Z]/)) {
		// The accumulated text in pendingDescription is the description for THIS command
		const descriptionText = pendingDescription.join(' ').trim();
		const entry = {
			hex: hexMatch[1].toUpperCase(),
			name: hexMatch[2].trim(),
			description: descriptionText
		};

		if (section === 'command_descriptions') {
			result.command_descriptions.push(entry);
		} else {
			result.field_descriptions.push(entry);
		}

		// Clear accumulator for next entry
		pendingDescription.length = 0;
		return;
	}

	// Accumulate text (will become description for the next hex marker found)
	if (line) {
		pendingDescription.push(line);
	}
}
