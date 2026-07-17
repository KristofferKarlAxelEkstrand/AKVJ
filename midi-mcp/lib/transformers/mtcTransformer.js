import fs from 'node:fs/promises';
import path from 'node:path';

/**
 * Transforms the MIDI Time Code specification (RP-004-008)
 * into a structured JSON object.
 *
 * @param {string} markdownPath - Absolute path to the source markdown file.
 * @param {string} [outDir] - Optional output directory for the JSON file.
 * @returns {Promise<object>} The structured JSON result.
 */
export async function transformMtc(markdownPath, outDir) {
	const content = await fs.readFile(markdownPath, 'utf-8');
	const lines = content.split('\n');

	const result = {
		metadata: {
			title: 'MIDI Time Code',
			doc_id: 'RP-004-008',
			protocol: 'midi1',
			version: '4.2.1',
			date: '1996-01',
			source: 'RP-004-008_v4-2-1_MIDI_Time_Code_Specification_96-1-4.pdf'
		},
		quarter_frame_types: [],
		bit_field_assignments: [],
		smpte_types: [],
		full_message: {},
		user_bits_message: {},
		mtc_cueing_setup_types: [],
		special_subtypes: [],
		realtime_cueing_setup_types: [],
		signal_path_modes: [],
		quarter_frame_example: [],
		summary: {}
	};

	const PAGE_HEADER_RE = /^## Page \d+$/;
	const PAGE_NUM_RE = /^MIDI Time Code \(Doc.*\)\s+\d+$/;

	const ctx = { pendingEntry: null, pendingDescription: [] };
	let currentSection = null;

	for (const line of lines) {
		const trimmedLine = line.trim();

		if (!trimmedLine || trimmedLine.match(PAGE_HEADER_RE) || trimmedLine.match(PAGE_NUM_RE)) {
			continue;
		}

		if (trimmedLine.match(/^Quarter Frame Messages$/i)) {
			flushCueingEntry(result, ctx);
			currentSection = 'quarter_frame_messages';
			continue;
		}
		if (trimmedLine.match(/^Quarter Frame Message Implementation/i)) {
			flushCueingEntry(result, ctx);
			currentSection = 'quarter_frame_implementation';
			continue;
		}
		if (trimmedLine.match(/^Full Message$/i)) {
			flushCueingEntry(result, ctx);
			currentSection = 'full_message';
			continue;
		}
		if (trimmedLine.match(/^User Bits$/i)) {
			flushCueingEntry(result, ctx);
			currentSection = 'user_bits';
			continue;
		}
		if (trimmedLine.match(/^MIDI Cueing$/i)) {
			flushCueingEntry(result, ctx);
			currentSection = 'midi_cueing';
			continue;
		}
		if (trimmedLine.match(/^Description Of MTC Cueing Set-Up Types/i)) {
			flushCueingEntry(result, ctx);
			currentSection = 'cueing_descriptions';
			continue;
		}
		if (trimmedLine.match(/^Real Time MIDI Cueing Set-Up Messages/i)) {
			flushCueingEntry(result, ctx);
			currentSection = 'realtime_cueing';
			continue;
		}
		if (trimmedLine.match(/^MTC Signal Path Summary/i)) {
			flushCueingEntry(result, ctx);
			currentSection = 'signal_path';
			continue;
		}

		switch (currentSection) {
			case 'quarter_frame_messages':
				handleQuarterFrameMessages(result, trimmedLine);
				break;
			case 'quarter_frame_implementation':
				handleQuarterFrameExample(result, trimmedLine);
				break;
			case 'full_message':
				handleFullMessage(result, trimmedLine);
				break;
			case 'user_bits':
				handleUserBitsMessage(result, trimmedLine);
				break;
			case 'midi_cueing':
				handleMtcCueingSetupTypes(result, trimmedLine);
				break;
			case 'cueing_descriptions':
				handleCueingDescriptions(result, trimmedLine, ctx);
				break;
			case 'realtime_cueing':
				handleRealtimeCueingSetupTypes(result, trimmedLine);
				break;
			case 'signal_path':
				handleSignalPathModes(result, trimmedLine);
				break;
			default:
				break;
		}
	}

	flushCueingEntry(result, ctx);

	result.summary = {
		quarter_frame_type_count: result.quarter_frame_types.length,
		bit_field_assignment_count: result.bit_field_assignments.length,
		smpte_type_count: result.smpte_types.length,
		mtc_cueing_setup_type_count: result.mtc_cueing_setup_types.length,
		special_subtype_count: result.special_subtypes.length,
		realtime_cueing_setup_type_count: result.realtime_cueing_setup_types.length,
		signal_path_mode_count: result.signal_path_modes.length,
		quarter_frame_example_count: result.quarter_frame_example.length
	};

	if (outDir) {
		await fs.mkdir(outDir, { recursive: true });
		await fs.writeFile(path.join(outDir, 'mtc.json'), JSON.stringify(result, null, 2), 'utf-8');
	}

	return result;
}

function isCueingSetupType(hex, name) {
	if (hex.toUpperCase() === 'F7') {
		return false;
	}
	if (hex.toUpperCase() === 'FF') {
		return false;
	}
	if (name.match(/sub-ID|sub id/i)) {
		return false;
	}
	if (name.match(/^=\s*\d+\s*Frames/i)) {
		return false;
	}
	if (name.match(/^Fractional Frames/i)) {
		return false;
	}
	if (name.match(/^Hours\b|^Minutes\b|^Seconds\b|^Frames\b/i)) {
		return false;
	}
	if (name.match(/^Event Number/i)) {
		return false;
	}
	if (name.match(/^EOX/i)) {
		return false;
	}
	return true;
}

function handleQuarterFrameMessages(result, line) {
	const typeMatch = line.match(/^(\d)\s*=\s*(Frame count|Seconds count|Minutes count|Hours count).+$/);
	if (typeMatch) {
		result.quarter_frame_types.push({
			type: parseInt(typeMatch[1], 10),
			description: line.replace(/^\d\s*=\s*/, '').trim()
		});
		return;
	}

	const bitFieldMatch = line.match(/^([A-Z\s]+COUNT):\s+(.+)/);
	if (bitFieldMatch) {
		result.bit_field_assignments.push({
			field: bitFieldMatch[1].trim(),
			bit_pattern: bitFieldMatch[2].trim(),
			bit_descriptions: []
		});
		return;
	}

	const smpteMatch = line.match(/^(\d{1,2})\s*=\s*(\d+\s*Frames\/Second.*)$/);
	if (smpteMatch) {
		if (!result.smpte_types.find(e => e.description === smpteMatch[2].trim())) {
			result.smpte_types.push({ code: smpteMatch[1], description: smpteMatch[2].trim() });
		}
		return;
	}

	const bitDescMatch = line.match(/^([xys z]+)\s{2,}(.+)$/);
	if (bitDescMatch) {
		const lastField = result.bit_field_assignments[result.bit_field_assignments.length - 1];
		if (lastField && lastField.bit_descriptions) {
			lastField.bit_descriptions.push({ bits: bitDescMatch[1].trim(), description: bitDescMatch[2].trim() });
		}
		return;
	}

	const fieldDescMatch = line.match(/^([a-z]+)\s{2,}(.+)$/);
	if (fieldDescMatch) {
		const lastField = result.bit_field_assignments[result.bit_field_assignments.length - 1];
		if (lastField && lastField.bit_descriptions) {
			lastField.bit_descriptions.push({ bits: fieldDescMatch[1].trim(), description: fieldDescMatch[2].trim() });
		}
	}
}

function handleQuarterFrameExample(result, line) {
	const exampleMatch = line.match(/^(F1\s+[0-9A-Fa-f]{2})(?:\s+(.+))?$/);
	if (exampleMatch) {
		result.quarter_frame_example.push({
			message: exampleMatch[1],
			note: exampleMatch[2] || ''
		});
	}
}

function handleFullMessage(result, line) {
	if (!result.full_message.fields) {
		result.full_message = { format: 'F0 7F <device ID> 01 <sub-ID 2> hr mn sc fr F7', byte_count: 10, fields: [] };
	}

	// Filter out page number lines and standalone numbers
	if (line.match(/^\d+$/)) {
		return;
	}
	if (line.match(/^MIDI Time Code/i)) {
		return;
	}

	const parts = line
		.split('\t')
		.map(s => s.trim())
		.filter(Boolean);
	if (parts.length >= 2) {
		// Filter page number lines like "6 \tMIDI Time Code (Doc 4.2.1)"
		if (parts[0].match(/^\d+$/) && parts[1].match(/^MIDI Time Code/i)) {
			return;
		}
		result.full_message.fields.push({ byte: parts[0], description: parts.slice(1).join(' ') });
	}
}

function handleUserBitsMessage(result, line) {
	if (!result.user_bits_message.fields) {
		result.user_bits_message = { format: 'F0 7F <device ID> 01 <sub-ID 2> u1 u2 u3 u4 u5 u6 u7 u8 u9 F7', byte_count: 15, fields: [] };
	}

	if (line.match(/^MIDI Time Code/i)) {
		return;
	}

	const parts = line
		.split('\t')
		.map(s => s.trim())
		.filter(Boolean);
	if (parts.length >= 2) {
		result.user_bits_message.fields.push({ byte: parts[0], description: parts.slice(1).join(' ') });
	}
}

function handleMtcCueingSetupTypes(result, line) {
	const parts = line
		.split('\t')
		.map(s => s.trim())
		.filter(Boolean);
	if (parts.length >= 2 && parts[0].match(/^[0-9A-Fa-f]{2}$/)) {
		const hex = parts[0].toUpperCase();
		const name = parts.slice(1).join(' ');
		if (isCueingSetupType(hex, name)) {
			result.mtc_cueing_setup_types.push({ hex, name });
		}
		return;
	}

	// Non-tab lines: SMPTE types like "00 = 24 Frames/Second" — skip
	const match = line.match(/^([0-9A-Fa-f]{2})\s+(.+)$/);
	if (match && !line.match(/^F[0-7]/i)) {
		if (match[2].match(/^=\s*\d+\s*Frames/i)) {
			return;
		}
		const hex = match[1].toUpperCase();
		const name = match[2].trim();
		if (isCueingSetupType(hex, name)) {
			result.mtc_cueing_setup_types.push({ hex, name });
		}
	}
}

function handleCueingDescriptions(result, line, ctx) {
	// Special sub-types: "00 00 Time Code Offset refers to..."
	const specialMatch = line.match(/^([0-9A-Fa-f]{2}\s+[0-9A-Fa-f]{2})\s+(.+)$/);
	if (specialMatch) {
		flushCueingEntry(result, ctx);
		ctx.pendingEntry = { hex: specialMatch[1].replace(/\s+/g, ' ').toUpperCase(), name: specialMatch[2].trim(), description: '' };
		return;
	}

	// Type descriptions: "01/02 Punch In and Punch Out refer to..."
	const typeDescMatch = line.match(/^([0-9A-Fa-f]{2}\/[0-9A-Fa-f]{2})\s+(.+)$/);
	if (typeDescMatch) {
		flushCueingEntry(result, ctx);
		ctx.pendingEntry = { hex: typeDescMatch[1], name: typeDescMatch[2].trim(), description: '' };
		return;
	}

	// Single hex type: "0B Cue Point refers to..." — only accept 00-0E
	const singleMatch = line.match(/^([0-9A-Fa-f]{2})\s+(.+)$/);
	if (singleMatch && !line.match(/^F[0-7]/i) && !line.match(/^sl/i) && !line.match(/^<add/i)) {
		const hexCode = parseInt(singleMatch[1], 16);
		if (hexCode >= 0x00 && hexCode <= 0x0e) {
			flushCueingEntry(result, ctx);
			ctx.pendingEntry = { hex: singleMatch[1].toUpperCase(), name: singleMatch[2].trim(), description: '' };
			return;
		}
	}

	// Accumulate description text for current pending entry
	if (line && ctx.pendingEntry) {
		// Skip page number lines in descriptions
		if (line.match(/^MIDI Time Code/i)) {
			return;
		}
		ctx.pendingDescription.push(line);
	}
}

function handleRealtimeCueingSetupTypes(result, line) {
	const parts = line
		.split('\t')
		.map(s => s.trim())
		.filter(Boolean);
	if (parts.length >= 2 && parts[0].match(/^[0-9A-Fa-f]{2}$/)) {
		const hex = parts[0].toUpperCase();
		const name = parts.slice(1).join(' ');
		if (isCueingSetupType(hex, name)) {
			result.realtime_cueing_setup_types.push({ hex, name });
		}
		return;
	}

	const match = line.match(/^([0-9A-Fa-f]{2})\s+(.+)$/);
	if (match && !line.match(/^F[0-7]/i) && !line.match(/^sl/i) && !line.match(/^<add/i)) {
		const hex = match[1].toUpperCase();
		const name = match[2].trim();
		if (isCueingSetupType(hex, name)) {
			result.realtime_cueing_setup_types.push({ hex, name });
		}
	}
}

function handleSignalPathModes(result, line) {
	// "PLAY MODE: \tThe Master Time Code Source..."
	// "FAST FORWARD/ \tIn this mode, the tape is in a high-speed wind..."
	const modeMatch = line.match(/^([A-Z\s/]+MODE):/);
	if (modeMatch) {
		const modeName = modeMatch[1].trim();
		const parts = line
			.split('\t')
			.map(s => s.trim())
			.filter(Boolean);
		const description = parts.slice(1).join(' ');
		result.signal_path_modes.push({ mode: modeName, description });
		return;
	}

	// "FAST FORWARD/REWIND MODE:" might be split across lines
	// Check for continuation: "REWIND MODE: \t..."
	const rewindMatch = line.match(/^(REWIND MODE):/);
	if (rewindMatch) {
		const parts = line
			.split('\t')
			.map(s => s.trim())
			.filter(Boolean);
		const description = parts.slice(1).join(' ');
		// Check if last mode was "FAST FORWARD/" — if so, merge
		const lastMode = result.signal_path_modes[result.signal_path_modes.length - 1];
		if (lastMode && lastMode.mode.match(/FAST FORWARD/)) {
			lastMode.mode = 'FAST FORWARD/REWIND MODE';
			lastMode.description = description;
		} else {
			result.signal_path_modes.push({ mode: rewindMatch[1], description });
		}
	}
}

function flushCueingEntry(result, ctx) {
	if (ctx.pendingEntry && ctx.pendingEntry.hex) {
		ctx.pendingEntry.description = ctx.pendingDescription.join(' ').trim();
		result.special_subtypes.push(ctx.pendingEntry);
	}
	ctx.pendingEntry = null;
	ctx.pendingDescription = [];
}
