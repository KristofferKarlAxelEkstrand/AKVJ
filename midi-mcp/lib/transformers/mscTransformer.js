import fs from 'node:fs/promises';
import path from 'node:path';

/**
 * Transforms the MIDI Show Control 1.1.1 specification (RP-002-014)
 * into a structured JSON object.
 *
 * The document uses tab-separated columns for its data tables:
 * - Command formats (hex -> name)
 * - General/Sound/2PC commands (hex, name, data bytes, min sets)
 * - Detailed command descriptions (hex, name, data format, description)
 * - 2PC message sequences (order, message, sender, purpose)
 * - Status code ranges, CANCELLED/ABORT status codes
 * - Command_format dependent status codes
 * - Device IDs
 *
 * @param {string} markdownPath - Absolute path to the source markdown file.
 * @param {string} [outDir] - Optional output directory for the JSON file.
 * @returns {Promise<object>} The structured JSON result.
 */
export async function transformMsc(markdownPath, outDir) {
	const content = await fs.readFile(markdownPath, 'utf-8');
	const lines = content.split('\n');

	const result = {
		metadata: {
			title: 'MIDI Show Control 1.1.1 Including 2-Phase Commit Enhancements',
			doc_id: 'RP-002-014',
			protocol: 'midi1',
			version: '1.1.1',
			date: '1996-02',
			source: 'RP-002-014_v1-1-1_MIDI_Show_Control_Specification_96-1-4.pdf'
		},
		device_ids: [],
		command_formats: [],
		general_commands: [],
		sound_commands: [],
		two_phase_commands: [],
		command_descriptions: [],
		two_phase_normal_sequence: [],
		two_phase_exception_sequence: [],
		status_code_ranges: [],
		cancelled_status_codes: [],
		abort_status_codes: [],
		command_format_status_codes: [],
		summary: {}
	};

	let currentSection = null;
	let pendingCommand = null;
	let pendingDescription = [];

	const PAGE_HEADER_RE = /^## Page \d+$/;
	const SECTION_NUM_RE = /^\d+\.\d+(?:\.\d+)?\s+/;

	for (let i = 0; i < lines.length; i++) {
		const rawLine = lines[i];
		const line = rawLine.trim();

		if (!line || line.match(PAGE_HEADER_RE)) {
			continue;
		}

		// Detect section changes
		if (line.match(/^2\.2\.\s+Device Identification/i)) {
			flushPendingCommand(result, currentSection, pendingCommand, pendingDescription);
			pendingCommand = null;
			pendingDescription = [];
			currentSection = 'device_ids';
			continue;
		}
		if (line.match(/^4\.1\.\s+Command_Formats/i)) {
			flushPendingCommand(result, currentSection, pendingCommand, pendingDescription);
			pendingCommand = null;
			pendingDescription = [];
			currentSection = 'command_formats';
			continue;
		}
		if (line.match(/^4\.3\.\s+General Commands/i)) {
			flushPendingCommand(result, currentSection, pendingCommand, pendingDescription);
			pendingCommand = null;
			pendingDescription = [];
			currentSection = 'general_commands';
			continue;
		}
		if (line.match(/^4\.4\.\s+Sound Commands/i)) {
			flushPendingCommand(result, currentSection, pendingCommand, pendingDescription);
			pendingCommand = null;
			pendingDescription = [];
			currentSection = 'sound_commands';
			continue;
		}
		if (line.match(/^4\.5\.\s+Two-Phase Commit Commands/i)) {
			flushPendingCommand(result, currentSection, pendingCommand, pendingDescription);
			pendingCommand = null;
			pendingDescription = [];
			currentSection = 'two_phase_commands';
			continue;
		}
		if (line.match(/^5\.\s+Detailed Command/i)) {
			flushPendingCommand(result, currentSection, pendingCommand, pendingDescription);
			pendingCommand = null;
			pendingDescription = [];
			currentSection = 'command_descriptions';
			continue;
		}
		if (line.match(/^6\.4\.1\.\s+Normal Message/i)) {
			flushPendingCommand(result, currentSection, pendingCommand, pendingDescription);
			pendingCommand = null;
			pendingDescription = [];
			currentSection = 'two_phase_normal_sequence';
			continue;
		}
		if (line.match(/^6\.4\.3\.\s+Exceptional/i)) {
			flushPendingCommand(result, currentSection, pendingCommand, pendingDescription);
			pendingCommand = null;
			pendingDescription = [];
			currentSection = 'two_phase_exception_sequence';
			continue;
		}
		if (line.match(/status code ranges/i) && line.match(/^The following table/i)) {
			flushPendingCommand(result, currentSection, pendingCommand, pendingDescription);
			pendingCommand = null;
			pendingDescription = [];
			currentSection = 'status_code_ranges';
			continue;
		}
		if (line.match(/Status codes in CANCELLED/i)) {
			flushPendingCommand(result, currentSection, pendingCommand, pendingDescription);
			pendingCommand = null;
			pendingDescription = [];
			currentSection = 'cancelled_status_codes';
			continue;
		}
		if (line.match(/Status codes in ABORT/i)) {
			flushPendingCommand(result, currentSection, pendingCommand, pendingDescription);
			pendingCommand = null;
			pendingDescription = [];
			currentSection = 'abort_status_codes';
			continue;
		}
		if (line.match(/dependent on the command_format/i) && line.match(/^The following table/i)) {
			flushPendingCommand(result, currentSection, pendingCommand, pendingDescription);
			pendingCommand = null;
			pendingDescription = [];
			currentSection = 'command_format_status_codes';
			continue;
		}

		// Skip section number headers (e.g. "3.1. Cue Numbers")
		if (line.match(SECTION_NUM_RE)) {
			continue;
		}

		// In command_descriptions section, detect new command headers like "01 GO" or "0A RESET"
		if (currentSection === 'command_descriptions') {
			const cmdHeaderMatch = line.match(/^([0-9A-Fa-f]{2})\s+([A-Z].+)$/);
			if (cmdHeaderMatch && !pendingCommand) {
				pendingCommand = {
					hex: cmdHeaderMatch[1].toUpperCase(),
					name: cmdHeaderMatch[2].trim(),
					data_format: [],
					description: []
				};
				continue;
			}
			// If we already have a pending command and this looks like a new one, flush and start new
			if (cmdHeaderMatch && pendingCommand && cmdHeaderMatch[1].toUpperCase() !== pendingCommand.hex) {
				flushPendingCommand(result, currentSection, pendingCommand, pendingDescription);
				pendingCommand = {
					hex: cmdHeaderMatch[1].toUpperCase(),
					name: cmdHeaderMatch[2].trim(),
					data_format: [],
					description: []
				};
				pendingDescription = [];
				continue;
			}
		}

		// Process lines based on current section
		switch (currentSection) {
			case 'device_ids':
				handleDeviceIds(result, line);
				break;
			case 'command_formats':
				handleCommandFormats(result, line);
				break;
			case 'general_commands':
			case 'sound_commands':
			case 'two_phase_commands':
				handleCommands(result, line, currentSection);
				break;
			case 'command_descriptions':
				handleCommandDescriptions(line, pendingCommand, pendingDescription);
				break;
			case 'two_phase_normal_sequence':
				handleTwoPhaseSequence(result, line, 'two_phase_normal_sequence');
				break;
			case 'two_phase_exception_sequence':
				handleTwoPhaseExceptionSequence(result, line);
				break;
			case 'status_code_ranges':
				handleStatusCodeRanges(result, line);
				break;
			case 'cancelled_status_codes':
				handleStatusCodes(result, line, 'cancelled_status_codes');
				break;
			case 'abort_status_codes':
				handleStatusCodes(result, line, 'abort_status_codes');
				break;
			case 'command_format_status_codes':
				handleCommandFormatStatusCodes(result, line);
				break;
			default:
				break;
		}
	}

	// Flush final pending command
	flushPendingCommand(result, currentSection, pendingCommand, pendingDescription);

	result.summary = {
		device_id_count: result.device_ids.length,
		command_format_count: result.command_formats.length,
		general_command_count: result.general_commands.length,
		sound_command_count: result.sound_commands.length,
		two_phase_command_count: result.two_phase_commands.length,
		command_description_count: result.command_descriptions.length,
		two_phase_normal_sequence_count: result.two_phase_normal_sequence.length,
		two_phase_exception_sequence_count: result.two_phase_exception_sequence.length,
		status_code_range_count: result.status_code_ranges.length,
		cancelled_status_code_count: result.cancelled_status_codes.length,
		abort_status_code_count: result.abort_status_codes.length,
		command_format_status_code_count: result.command_format_status_codes.length
	};

	if (outDir) {
		await fs.mkdir(outDir, { recursive: true });
		await fs.writeFile(path.join(outDir, 'msc.json'), JSON.stringify(result, null, 2), 'utf-8');
	}

	return result;
}

function flushPendingCommand(result, section, cmd, _description) {
	if (section !== 'command_descriptions' || !cmd) {
		return;
	}
	result.command_descriptions.push({
		hex: cmd.hex,
		name: cmd.name,
		data_format: cmd.data_format.join('\n').trim(),
		description: cmd.description.join(' ').trim()
	});
}

function handleDeviceIds(result, line) {
	// "00-6F 	Individual IDs"
	const parts = line
		.split('\t')
		.map(s => s.trim())
		.filter(Boolean);
	if (parts.length >= 2 && parts[0].match(/^[0-9A-F]{2}(-[0-9A-F]{2})?$/i)) {
		result.device_ids.push({
			range: parts[0],
			description: parts.slice(1).join(' ')
		});
	}
}

function handleCommandFormats(result, line) {
	// "01 	Lighting (General Category)" or "7F All-types"
	// Skip page number lines like "10 MIDI Show Control 1.1.1"
	if (line.match(/^\d+\s+MIDI Show Control/i)) {
		return;
	}
	const parts = line
		.split('\t')
		.map(s => s.trim())
		.filter(Boolean);
	if (parts.length < 2) {
		// Try space-separated: "7F All-types"
		const spaceMatch = line.match(/^([0-9A-F]{2})\s+(.+)$/i);
		if (spaceMatch && !spaceMatch[2].match(/^MIDI Show Control/i)) {
			result.command_formats.push({
				hex: spaceMatch[1].toUpperCase(),
				name: spaceMatch[2].trim()
			});
		}
		return;
	}
	if (parts[0].match(/^[0-9A-F]{2}$/i) && !parts[1].match(/^MIDI Show Control/i)) {
		result.command_formats.push({
			hex: parts[0].toUpperCase(),
			name: parts.slice(1).join(' ')
		});
	}
}

function handleCommands(result, line, section) {
	// "01 	GO 	variable 	1 2 3"
	// Skip page number lines like "12 MIDI Show Control 1.1.1"
	if (line.match(/^\d+\s+MIDI Show Control/i)) {
		return;
	}
	const parts = line
		.split('\t')
		.map(s => s.trim())
		.filter(Boolean);
	if (parts.length >= 2 && parts[0].match(/^[0-9A-F]{2}$/i) && !parts[1].match(/^MIDI Show Control/i)) {
		const hex = parts[0].toUpperCase();
		const name = parts[1];
		const dataBytes = parts.length >= 3 ? parts[2] : '';
		const minSets = parts.length >= 4 ? parts.slice(3).join(' ') : '';
		const entry = { hex, name, data_bytes: dataBytes, recommended_minimum_sets: minSets };
		if (section === 'general_commands') {
			result.general_commands.push(entry);
		} else if (section === 'sound_commands') {
			result.sound_commands.push(entry);
		} else if (section === 'two_phase_commands') {
			result.two_phase_commands.push(entry);
		}
	}
}

function handleCommandDescriptions(line, pendingCommand, _pendingDescription) {
	if (!pendingCommand) {
		return;
	}

	// Check for command header repeat: "01 	GO"
	const cmdHeaderMatch = line.match(/^([0-9A-Fa-f]{2})\s+(.+)$/);
	if (cmdHeaderMatch && cmdHeaderMatch[1].toUpperCase() === pendingCommand.hex) {
		// This is the repeated header line, skip it
		return;
	}

	// Data format lines: "<Q_number> 	optional; required if Q_list is sent"
	// or "hr mn sc fr ff 	Standard Time Specification"
	// or "cc cc 	Generic Control Number, LSB first"
	// Only match if the first part looks like a data field (angle brackets, or 2/5 lowercase tokens)
	const dataFormatMatch = line.match(/^(<[^>]+>|[a-z]{2}(\s+[a-z]{2}){1,4})\s+(.+)$/);
	if (dataFormatMatch) {
		pendingCommand.data_format.push(line);
		return;
	}

	// "00 	delimiter" lines
	if (line.match(/^00\s+delimiter/i)) {
		pendingCommand.data_format.push(line);
		return;
	}

	// Standard Generic Control Numbers for Lighting (SET command specific)
	if (line.match(/^\d+-\d+\s+/) || line.match(/^\d+\s+/)) {
		pendingCommand.data_format.push(line);
		return;
	}

	// Everything else is description
	if (line && !line.match(/^## Page/)) {
		pendingCommand.description.push(line);
	}
}

function handleTwoPhaseSequence(result, line, section) {
	// "1st 	STANDBY 	controller 	to notify..."
	const parts = line
		.split('\t')
		.map(s => s.trim())
		.filter(Boolean);
	if (parts.length >= 3 && parts[0].match(/^\d/)) {
		result[section].push({
			order: parts[0],
			message: parts[1],
			sender: parts[2],
			purpose: parts.slice(3).join(' ')
		});
	}
}

function handleTwoPhaseExceptionSequence(result, line) {
	// "ABORT 	controlled device 	notify controller of exceptional condition"
	// Skip header row "Message 	Sender 	Purpose"
	if (line.match(/^Message\s+Sender/i)) {
		return;
	}
	const parts = line
		.split('\t')
		.map(s => s.trim())
		.filter(Boolean);
	if (parts.length >= 3 && parts[0].match(/^[A-Z]/)) {
		result.two_phase_exception_sequence.push({
			message: parts[0],
			sender: parts[1],
			purpose: parts.slice(2).join(' ')
		});
	}
}

function handleStatusCodeRanges(result, line) {
	// "00 04 -- 0F FC 	command_format & manufacturer dependent"
	const parts = line
		.split('\t')
		.map(s => s.trim())
		.filter(Boolean);
	if (parts.length >= 2 && parts[0].match(/^[0-9A-F]{2}/i)) {
		result.status_code_ranges.push({
			hex_range: parts[0],
			description: parts.slice(1).join(' ')
		});
	}
}

function handleStatusCodes(result, line, section) {
	// "80 04 	- - C 	completing"
	const parts = line
		.split('\t')
		.map(s => s.trim())
		.filter(Boolean);
	if (parts.length >= 3 && parts[0].match(/^[0-9A-F]{2}\s+[0-9A-F]{2}$/i)) {
		result[section].push({
			hex: parts[0],
			messages: parts[1],
			description: parts.slice(2).join(' ')
		});
	}
}

function handleCommandFormatStatusCodes(result, line) {
	// "For command_format values between 01 and 0F (lighting)"
	if (line.match(/^For command_format values between/i)) {
		result.command_format_status_codes.push({
			command_format_range: line.trim(),
			codes: []
		});
		return;
	}

	// "10 04 	S G 	position motor failure"
	const parts = line
		.split('\t')
		.map(s => s.trim())
		.filter(Boolean);
	if (parts.length >= 3 && parts[0].match(/^[0-9A-F]{2}\s+[0-9A-F]{2}$/i)) {
		const entry = {
			hex: parts[0],
			messages: parts[1],
			description: parts.slice(2).join(' ')
		};
		const lastGroup = result.command_format_status_codes[result.command_format_status_codes.length - 1];
		if (lastGroup) {
			lastGroup.codes.push(entry);
		}
	}
}
