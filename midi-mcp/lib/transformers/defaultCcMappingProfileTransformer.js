import fs from 'node:fs/promises';
import path from 'node:path';

/**
 * Regex to match Profile ID byte lines.
 * Format: `Profile ID Byte 1 \t0x7E (Standard Defined Profile)`
 * Also accepts 0xXX for wildcard bytes.
 */
const PROFILE_ID_REGEX = /^Profile ID Byte (\d)\s+(0x[0-9A-Fa-fX]{2})\s+\((.+)\)$/;

/**
 * Regex to match the start of a CC table row.
 * Format: `0 \t0x00 \tBank Select ...` or `71 \t47 \tSound Controller 2 ...`
 * The decimal is 0-127, hex is 2 chars with optional 0x prefix.
 */
const CC_ROW_START_REGEX = /^(\d{1,3})\s+(?:0x)?([0-9A-Fa-f]{2})\s+(.+)$/;

/**
 * Regex to match revision history entries.
 * Format: `Nov. 26, 2020 \t1.0 \tInitial Version`
 */
const REVISION_REGEX = /^(\w+\.\s*\d+,?\s*\d+)\s+(\d+\.\d+)\s+(.+)$/;

/**
 * Regex to match volume curve table rows.
 * Format: `127 \t0 dB \t127 x 127 = 16129`
 */
const VOLUME_CURVE_REGEX = /^(\d+)\s+([-\d.]+\s*dB)\s+(.+)$/;

/**
 * Regex to match expression curve table rows.
 * Format: `127 \t127 \t0 dB`
 * Must have two numbers followed by a dB value.
 */
const EXPRESSION_CURVE_REGEX = /^(\d+)\s+(\d+)\s+([-\d.]+\s*dB)$/;

/**
 * Checks if a line looks like a CC row start (decimal + hex).
 */
function isRowStart(line) {
	return CC_ROW_START_REGEX.test(line);
}

/**
 * Parses the value/used_as/reset_value from accumulated continuation lines.
 * The last tab-separated line in a row contains these fields.
 */
function parseValueFields(continuationLines) {
	for (let i = continuationLines.length - 1; i >= 0; i--) {
		const line = continuationLines[i];
		const parts = line
			.split('\t')
			.map(p => p.trim())
			.filter(p => p);

		if (parts.length >= 3) {
			const value = parts[0] || '';
			const usedAs = parts[1] || '';
			const resetValue = parts.slice(2).join(' ') || '';
			return { value, used_as: usedAs, reset_value: resetValue };
		}
		if (parts.length === 2) {
			// Ambiguous: could be value+used_as or value+reset_value
			// If second part is a reset value pattern, treat as value+reset_value
			const resetPatterns = ['Do Not Set', 'Device Specific', '0', '64', '127'];
			const secondIsReset = resetPatterns.some(p => parts[1] === p);
			if (secondIsReset) {
				return { value: parts[0], used_as: '---', reset_value: parts[1] };
			}
			// Otherwise treat as value+used_as
			return { value: parts[0], used_as: parts[1], reset_value: '' };
		}
	}

	const lastLine = continuationLines[continuationLines.length - 1] || '';
	return { value: '', used_as: '', reset_value: lastLine };
}

/**
 * Extracts the function text from continuation lines (everything before the
 * tab-separated value line).
 */
function extractFunctionContinuation(continuationLines) {
	for (let i = continuationLines.length - 1; i >= 0; i--) {
		const line = continuationLines[i];
		const parts = line
			.split('\t')
			.map(p => p.trim())
			.filter(p => p);

		if (parts.length >= 2) {
			return continuationLines.slice(0, i).join(' ').trim();
		}
	}
	return continuationLines.join(' ').trim();
}

/**
 * Transforms the Default Control Change Mapping Profile markdown document
 * into a structured JSON object.
 *
 * The document contains:
 * - Profile ID bytes (5 bytes identifying the MIDI-CI profile)
 * - Appendix A: 128 CC entries with decimal, hex, function, value, used_as, reset_value
 * - Appendix B: Recommended response sections with volume/pan/expression curve tables
 * - Revision history
 *
 * @param {string} markdownPath - Absolute path to the source markdown file.
 * @param {string} [outDir] - Optional output directory for the JSON file.
 * @returns {Promise<object>} The structured JSON result.
 */
export async function transformDefaultCcMappingProfile(markdownPath, outDir) {
	const content = await fs.readFile(markdownPath, 'utf-8');
	const lines = content.split('\n').map(l => l.trim());

	const profileIdBytes = [];
	const controlChanges = [];
	const volumeCurveEntries = [];
	const expressionCurveEntries = [];
	const revisionHistory = [];
	const notes = [];

	let inAppendixA = false;
	let inAppendixB = false;
	let inRevisionHistory = false;
	let currentEntry = null;
	let continuationLines = [];

	const finalizeEntry = () => {
		if (currentEntry) {
			if (continuationLines.length > 0 && !currentEntry.value) {
				// Entry was split across multiple lines — parse value fields from continuation
				const valueFields = parseValueFields(continuationLines);
				const functionContinuation = extractFunctionContinuation(continuationLines);
				if (functionContinuation) {
					currentEntry.function += ' ' + functionContinuation;
				}
				currentEntry.value = valueFields.value;
				currentEntry.used_as = valueFields.used_as;
				currentEntry.reset_value = valueFields.reset_value;
			} else if (continuationLines.length > 0 && currentEntry.value && !currentEntry.used_as) {
				// 4-tab entry: value was set on row start, continuation has value continuation + used_as/reset
				const lastTabLine = continuationLines.findLast(l => l.split('\t').filter(p => p).length >= 2);
				if (lastTabLine) {
					const parts = lastTabLine.split('\t').map(p => p.trim());
					currentEntry.used_as = parts[0] || '';
					currentEntry.reset_value = parts.slice(1).join(' ').trim() || '';
					// Value continuation is everything before the last tab line
					const valueLineIndex = continuationLines.indexOf(lastTabLine);
					const valueContinuation = continuationLines.slice(0, valueLineIndex).join(' ').trim();
					if (valueContinuation) {
						currentEntry.value += ' ' + valueContinuation;
					}
				}
			} else if (continuationLines.length > 0) {
				// Entry had all fields on row start line — append orphan continuation lines
				const orphanText = continuationLines.join(' ').trim();
				if (orphanText) {
					currentEntry.reset_value += ' ' + orphanText;
				}
			}
			controlChanges.push(currentEntry);
			currentEntry = null;
			continuationLines = [];
		}
	};

	for (const line of lines) {
		if (!line) {
			continue;
		}

		// Skip page headers and boilerplate
		if (line.startsWith('## Page') || line.startsWith('MIDI-CI Profile') || line.startsWith('Version 1.0') || line.startsWith('Published By') || line.startsWith('Association of') || line.startsWith('The MIDI Association') || line.startsWith('PREFACE') || line.startsWith('Profile Configuration') || line.startsWith('©') || line.startsWith('ALL RIGHTS') || line.startsWith('https://') || line.startsWith('http://') || line.startsWith('Table of Contents') || line.startsWith('MIDI Manufacturers') || line.startsWith('PO Box')) {
			continue;
		}

		// Detect section markers
		if (line.startsWith('Appendix A.')) {
			finalizeEntry();
			inAppendixA = true;
			inAppendixB = false;
			inRevisionHistory = false;
			continue;
		}
		if (line.startsWith('Appendix B.')) {
			finalizeEntry();
			inAppendixA = false;
			inAppendixB = true;
			inRevisionHistory = false;
			continue;
		}
		if (line === 'Revision History') {
			finalizeEntry();
			inAppendixA = false;
			inAppendixB = false;
			inRevisionHistory = true;
			continue;
		}

		// Parse Profile ID bytes
		const profileMatch = line.match(PROFILE_ID_REGEX);
		if (profileMatch) {
			profileIdBytes.push({
				byte_number: parseInt(profileMatch[1], 10),
				value: profileMatch[2].toUpperCase(),
				description: profileMatch[3].trim()
			});
			continue;
		}

		// Parse revision history
		if (inRevisionHistory) {
			const revMatch = line.match(REVISION_REGEX);
			if (revMatch) {
				revisionHistory.push({
					date: revMatch[1].trim(),
					version: revMatch[2],
					changes: revMatch[3].trim()
				});
				continue;
			}
		}

		// Parse Appendix A: CC table
		if (inAppendixA) {
			// Skip header lines
			if (line.startsWith('Control Change Message') || line.startsWith('Decimal') || line.startsWith('Hex') || line.startsWith('Function') || line.startsWith('Value') || line.startsWith('Used') || line.startsWith('As') || line.startsWith('Destinations') || line.startsWith('Set by') || line.startsWith('Reset All') || line.startsWith('Controllers')) {
				continue;
			}

			// Check for Note: lines (only when not in the middle of a CC entry)
			if (line.startsWith('Note:') && !currentEntry) {
				notes.push(line.substring(5).trim());
				continue;
			}

			// Check if this line is a new row start
			if (isRowStart(line)) {
				finalizeEntry();

				const match = line.match(CC_ROW_START_REGEX);
				const hexValue = match[2].toUpperCase();
				// Check if the row has all fields on one line (tab-separated)
				const tabParts = line.split('\t').map(p => p.trim());
				if (tabParts.length >= 6) {
					currentEntry = {
						decimal: parseInt(tabParts[0], 10),
						hex: '0X' + hexValue,
						function: tabParts[2],
						value: tabParts[3],
						used_as: tabParts[4],
						reset_value: tabParts[5]
					};
				} else if (tabParts.length >= 4) {
					// 4 tabs: decimal, hex, function, value (value continues on next lines)
					currentEntry = {
						decimal: parseInt(tabParts[0], 10),
						hex: '0X' + hexValue,
						function: tabParts[2],
						value: tabParts[3],
						used_as: '',
						reset_value: ''
					};
				} else {
					currentEntry = {
						decimal: parseInt(match[1], 10),
						hex: '0X' + hexValue,
						function: match[3].trim(),
						value: '',
						used_as: '',
						reset_value: ''
					};
				}
				continuationLines = [];
				continue;
			}

			// Accumulate continuation lines
			if (currentEntry) {
				continuationLines.push(line);
			}
		}

		// Parse Appendix B: Volume curve tables
		if (inAppendixB) {
			const volMatch = line.match(VOLUME_CURVE_REGEX);
			if (volMatch) {
				volumeCurveEntries.push({
					cc_value: parseInt(volMatch[1], 10),
					amplitude: volMatch[2].trim(),
					proportional_to: volMatch[3].trim()
				});
				continue;
			}

			const exprMatch = line.match(EXPRESSION_CURVE_REGEX);
			if (exprMatch) {
				expressionCurveEntries.push({
					cc7: parseInt(exprMatch[1], 10),
					cc11: parseInt(exprMatch[2], 10),
					amplitude: exprMatch[3].trim()
				});
				continue;
			}
		}
	}

	// Don't forget the last entry
	finalizeEntry();

	const result = {
		metadata: {
			title: 'Default Control Change Mapping Profile',
			doc_id: 'M2-113-UM',
			version: '1.0.0',
			source: path.basename(markdownPath)
		},
		profile_id: profileIdBytes,
		appendix_a_control_changes: controlChanges,
		appendix_b_volume_curve: volumeCurveEntries,
		appendix_b_expression_curve: expressionCurveEntries,
		revision_history: revisionHistory,
		notes,
		summary: {
			profile_id_byte_count: profileIdBytes.length,
			control_change_count: controlChanges.length,
			volume_curve_entry_count: volumeCurveEntries.length,
			expression_curve_entry_count: expressionCurveEntries.length,
			revision_history_count: revisionHistory.length,
			note_count: notes.length
		}
	};

	if (outDir) {
		await fs.mkdir(outDir, { recursive: true });
		await fs.writeFile(path.join(outDir, 'default-cc-mapping-profile.json'), JSON.stringify(result, null, 2), 'utf-8');
	}

	return result;
}
