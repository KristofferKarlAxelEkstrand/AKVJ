import fs from 'node:fs/promises';
import path from 'node:path';

const VERSION_ENTRY_REGEX = /^(\d{4}-\d{2}-\d{2})\s+(.+?)\s+(.+)$/;

const REFERENCE_REGEX = /^\[([A-Z]+[0-9]*)\]\s+(.+)$/;

const DEFINITION_REGEX = /^([A-Z][A-Za-z0-9\s()/.–-]+?):\s+(.+)$/;

const PROFILE_ID_REGEX = /^Profile ID Byte\s+(\d+)\s+(0x[0-9A-Fa-f]+)\s+\((.+)\)$/;

const RC_ENTRY_REGEX = /^(0x[0-9A-Fa-f]+)\s+(0x[0-9A-Fa-f]+)\s+(.+)$/;

const DEFAULT_VALUE_REGEX = /^0x[0-9A-Fa-f]{8}$/;

const CONFORMANCE_RELATING_WORDS = ['shall', 'should', 'may'];
const CONFORMANCE_NOT_RELATING_WORDS = ['must', 'will', 'can', 'might'];

export async function transformRotarySpeakerProfile(markdownPath, outDir) {
	const content = await fs.readFile(markdownPath, 'utf-8');
	const lines = content.split('\n');

	const versionHistory = [];
	const normativeReferences = [];
	const definitions = [];
	const conformanceRelating = [];
	const conformanceNotRelating = [];
	const profileId = [];
	const requiredControllers = [];
	const optionalControllers = [];
	const modeMessages = [];

	let inVersionHistory = false;
	let inNormativeReferences = false;
	let inDefinitions = false;
	let inConformanceRelating = false;
	let inConformanceNotRelating = false;
	let inProfileId = false;
	let inRequiredControllers = false;
	let inOptionalControllers = false;
	let inModeMessages = false;
	let inNoteBlock = false;

	let currentRcEntry = null;

	for (let i = 0; i < lines.length; i++) {
		const line = lines[i].trim();

		if (!line || line.startsWith('## Page') || line.startsWith('# Rotary Speaker')) {
			continue;
		}

		if (line === 'Table 1 Version History') {
			inVersionHistory = true;
			continue;
		}
		if (inVersionHistory) {
			if (line === 'Publication Date Version Changes') {
				continue;
			}
			const versionMatch = line.match(VERSION_ENTRY_REGEX);
			if (versionMatch) {
				versionHistory.push({
					publication_date: versionMatch[1],
					version: versionMatch[2],
					changes: versionMatch[3]
				});
				continue;
			}
			if (line.startsWith('Contents') || line.startsWith('Version History')) {
				inVersionHistory = false;
			}
		}

		if (line === '1.1 Normative References') {
			inNormativeReferences = true;
			continue;
		}
		if (inNormativeReferences) {
			if (line.startsWith('1.2') || line.startsWith('## Page')) {
				inNormativeReferences = false;
			} else {
				const refMatch = line.match(REFERENCE_REGEX);
				if (refMatch) {
					const descriptionLines = [refMatch[2]];
					for (let j = i + 1; j < lines.length; j++) {
						const nextLine = lines[j].trim();
						if (!nextLine || nextLine.match(/^\[[A-Z]+/) || nextLine.startsWith('## Page') || nextLine.startsWith('1.2')) {
							break;
						}
						descriptionLines.push(nextLine);
					}
					normativeReferences.push({
						ref_id: refMatch[1],
						description: descriptionLines.join(' ')
					});
					continue;
				}
			}
		}

		if (line === '1.2.1 Definitions') {
			inDefinitions = true;
			continue;
		}
		if (inDefinitions) {
			if (line.startsWith('1.2.2') || line.startsWith('## Page')) {
				inDefinitions = false;
			} else {
				const defMatch = line.match(DEFINITION_REGEX);
				if (defMatch) {
					const descriptionLines = [defMatch[2]];
					for (let j = i + 1; j < lines.length; j++) {
						const nextLine = lines[j].trim();
						if (!nextLine || nextLine.match(DEFINITION_REGEX) || nextLine.startsWith('## Page') || nextLine.startsWith('1.2.2')) {
							break;
						}
						descriptionLines.push(nextLine);
					}
					definitions.push({
						term: defMatch[1].trim(),
						description: descriptionLines.join(' ')
					});
					continue;
				}
			}
		}

		if (line.startsWith('Table 2') && line.includes('Words Relating') && !line.match(/\.{3,}/)) {
			inConformanceRelating = true;
			inConformanceNotRelating = false;
			continue;
		}
		if (line.startsWith('Table 3') && line.includes('Words Not Relating') && !line.match(/\.{3,}/)) {
			inConformanceNotRelating = true;
			inConformanceRelating = false;
			continue;
		}
		if (line === 'Word Reserved For Relation to Specification Conformance') {
			continue;
		}

		if (inConformanceRelating) {
			const firstWord = line.split(/\s/)[0];
			if (CONFORMANCE_RELATING_WORDS.includes(firstWord)) {
				const rest = line.substring(firstWord.length).trim();
				const descLines = [rest];
				for (let j = i + 1; j < lines.length; j++) {
					const nextLine = lines[j].trim();
					if (!nextLine || CONFORMANCE_RELATING_WORDS.includes(nextLine.split(/\s/)[0]) || nextLine.startsWith('By contrast') || nextLine.startsWith('Table ') || nextLine.startsWith('## Page')) {
						break;
					}
					descLines.push(nextLine);
				}
				const fullText = descLines.join(' ');
				const reservedForMatch = fullText.match(/^Statements of (\w+)/);
				const reservedFor = reservedForMatch ? `Statements of ${reservedForMatch[1]}` : fullText.split(/\s/).slice(0, 3).join(' ');
				conformanceRelating.push({
					word: firstWord,
					reserved_for: reservedFor,
					relation: fullText.replace(reservedFor, '').trim()
				});
				continue;
			}
			if (line.startsWith('By contrast') || line.startsWith('Table ')) {
				inConformanceRelating = false;
			}
		}

		if (inConformanceNotRelating) {
			const firstWord = line.split(/\s/)[0];
			if (CONFORMANCE_NOT_RELATING_WORDS.includes(firstWord)) {
				const rest = line.substring(firstWord.length).trim();
				const describesIdx = rest.indexOf('Describes');
				let reservedFor;
				let relationText;
				if (describesIdx !== -1) {
					reservedFor = rest.substring(0, describesIdx).trim();
					relationText = rest.substring(describesIdx);
				} else {
					reservedFor = rest;
					relationText = '';
				}
				const descLines = [relationText];
				for (let j = i + 1; j < lines.length; j++) {
					const nextLine = lines[j].trim();
					if (!nextLine || CONFORMANCE_NOT_RELATING_WORDS.includes(nextLine.split(/\s/)[0]) || nextLine.startsWith('## Page') || nextLine.startsWith('Table ')) {
						break;
					}
					descLines.push(nextLine);
				}
				conformanceNotRelating.push({
					word: firstWord,
					reserved_for: reservedFor,
					relation: descLines.join(' ')
				});
				continue;
			}
			if (line.startsWith('## Page') || line.startsWith('1.3')) {
				inConformanceNotRelating = false;
			}
		}

		if (line.startsWith('Table 4') && line.includes('Profile ID') && !line.match(/\.{3,}/)) {
			inProfileId = true;
			continue;
		}
		if (inProfileId) {
			const profileMatch = line.match(PROFILE_ID_REGEX);
			if (profileMatch) {
				profileId.push({
					byte: parseInt(profileMatch[1], 10),
					value: profileMatch[2],
					description: profileMatch[3]
				});
				continue;
			}
			if (line.startsWith('3.2') || line.startsWith('Table ')) {
				inProfileId = false;
			}
		}

		if (line.startsWith('Table 5') && line.includes('Registered Controllers') && !line.match(/\.{3,}/)) {
			inRequiredControllers = true;
			inOptionalControllers = false;
			continue;
		}
		if (line.startsWith('Table 6') && line.includes('Optional Registered Controllers') && !line.match(/\.{3,}/)) {
			inOptionalControllers = true;
			inRequiredControllers = false;
			continue;
		}

		if (inRequiredControllers || inOptionalControllers) {
			const targetArray = inRequiredControllers ? requiredControllers : optionalControllers;

			if (line === 'Registered' || line === 'Controller' || line === 'Value Range Description Default Value') {
				continue;
			}

			if (line.startsWith('Note:')) {
				inNoteBlock = true;
				continue;
			}
			if (inNoteBlock) {
				if (line.startsWith('3.2.') || line.startsWith('Table ') || line.startsWith('## Page') || line.match(RC_ENTRY_REGEX)) {
					inNoteBlock = false;
				} else {
					continue;
				}
			}

			const rcMatch = line.match(RC_ENTRY_REGEX);
			if (rcMatch) {
				if (currentRcEntry) {
					finalizeRcEntry(currentRcEntry, targetArray);
				}
				currentRcEntry = {
					controller_msb: rcMatch[1],
					controller_lsb: rcMatch[2],
					raw_lines: [rcMatch[3]]
				};
				continue;
			}

			if (currentRcEntry) {
				if (line.startsWith('3.2.2') || line.startsWith('3.2.3') || line.startsWith('Table ') || line.startsWith('## Page')) {
					finalizeRcEntry(currentRcEntry, targetArray);
					currentRcEntry = null;
					if (line.startsWith('3.2.2') || line.startsWith('3.2.3')) {
						if (inRequiredControllers) {
							inRequiredControllers = false;
						}
						if (inOptionalControllers) {
							inOptionalControllers = false;
						}
					}
				} else {
					currentRcEntry.raw_lines.push(line);
				}
				continue;
			}

			if (line.startsWith('3.2.2') || line.startsWith('3.2.3')) {
				if (inRequiredControllers) {
					inRequiredControllers = false;
				}
				if (inOptionalControllers) {
					inOptionalControllers = false;
				}
			}
		}

		if (line.startsWith('3.2.3.1') && line.includes('Reset All Controllers')) {
			inModeMessages = true;
			continue;
		}
		if (inModeMessages) {
			if (line.startsWith('Default Value:')) {
				const defaultValue = line.replace('Default Value:', '').trim();
				modeMessages.push({
					cc_number: 121,
					name: 'Reset All Controllers',
					default_value: defaultValue,
					description: 'When a Device receives a Reset All Controllers message (cc#121) it shall reset all of the parameters that the Device supports to the default values as defined in Section 3.2.1 and 3.2.2.'
				});
				inModeMessages = false;
				continue;
			}
		}
	}

	if (currentRcEntry) {
		const targetArray = inOptionalControllers ? optionalControllers : requiredControllers;
		finalizeRcEntry(currentRcEntry, targetArray);
	}

	const result = {
		metadata: {
			title: 'Rotary Speaker Profile',
			doc_id: 'M2-122-UM',
			protocol: 'midi2',
			version: '1.0.2',
			date: '2024-01-24'
		},
		version_history: versionHistory,
		normative_references: normativeReferences,
		definitions: definitions,
		conformance_words: {
			relating_to_conformance: conformanceRelating,
			not_relating_to_conformance: conformanceNotRelating
		},
		profile_id: profileId,
		required_registered_controllers: requiredControllers,
		optional_registered_controllers: optionalControllers,
		mode_messages: modeMessages,
		summary: {
			version_history_count: versionHistory.length,
			normative_reference_count: normativeReferences.length,
			definition_count: definitions.length,
			conformance_relating_count: conformanceRelating.length,
			conformance_not_relating_count: conformanceNotRelating.length,
			profile_id_byte_count: profileId.length,
			required_rc_count: requiredControllers.length,
			optional_rc_count: optionalControllers.length,
			mode_message_count: modeMessages.length
		}
	};

	if (outDir) {
		const outPath = path.join(outDir, 'rotary-speaker-profile.json');
		await fs.mkdir(outDir, { recursive: true });
		await fs.writeFile(outPath, JSON.stringify(result, null, 2), 'utf-8');
	}

	return result;
}

function finalizeRcEntry(entry, targetArray) {
	const valueRanges = [];
	const descriptionParts = [];
	let defaultValue = '';

	const rawLines = entry.raw_lines;
	let lineIndex = 0;

	while (lineIndex < rawLines.length) {
		const rawLine = rawLines[lineIndex];

		const rangeWithLabelMatch = rawLine.match(/^(0x[0-9A-Fa-f]+)\s*[-\u2013]\s*(0x[0-9A-Fa-f]+)\s*=\s*(.+)$/);
		if (rangeWithLabelMatch) {
			let label = rangeWithLabelMatch[3].replace(/[,\s]+$/, '').trim();
			if (lineContainsDefaultValue(label)) {
				const parts = splitDescriptionAndDefault(label);
				label = parts.description;
			}
			valueRanges.push({ range_start: rangeWithLabelMatch[1], range_end: rangeWithLabelMatch[2], label });
			lineIndex++;
			continue;
		}

		const rangeStartMatch = rawLine.match(/^(0x[0-9A-Fa-f]+)\s*[-\u2013]\s*(0x[0-9A-Fa-f]+)\s*(.*)$/);
		if (rangeStartMatch) {
			let label = rangeStartMatch[3];
			if (!label.endsWith(')') && label.includes('(')) {
				lineIndex++;
				while (lineIndex < rawLines.length && !label.endsWith(')')) {
					label += ' ' + rawLines[lineIndex];
					lineIndex++;
				}
			} else {
				lineIndex++;
			}
			const afterParen = label.replace(/^\(.*?\)\s*/, '');
			if (afterParen) {
				const descDefaultMatch = afterParen.match(/^(.+?)\s+(0x[0-9A-Fa-f]{8})$/);
				if (descDefaultMatch) {
					descriptionParts.push(descDefaultMatch[1]);
					defaultValue = descDefaultMatch[2];
				} else if (afterParen.match(DEFAULT_VALUE_REGEX)) {
					defaultValue = afterParen;
				} else {
					descriptionParts.push(afterParen);
				}
			}
			const parenLabel = label.match(/^(\(.*?\))/);
			valueRanges.push({ range_start: rangeStartMatch[1], range_end: rangeStartMatch[2], label: parenLabel ? parenLabel[1] : label.trim() });
			continue;
		}

		if (rawLine.match(DEFAULT_VALUE_REGEX)) {
			defaultValue = rawLine;
			lineIndex++;
			continue;
		}

		const descWithDefault = rawLine.match(/^(.+?)\s+(0x[0-9A-Fa-f]{8})$/);
		if (descWithDefault) {
			descriptionParts.push(descWithDefault[1]);
			defaultValue = descWithDefault[2];
			lineIndex++;
			continue;
		}

		descriptionParts.push(rawLine);
		lineIndex++;
	}

	const description = descriptionParts.join(' ').replace(/\s+/g, ' ').trim();

	targetArray.push({
		controller_msb: entry.controller_msb,
		controller_lsb: entry.controller_lsb,
		value_ranges: valueRanges,
		description: description,
		default_value: defaultValue
	});
}

function lineContainsDefaultValue(text) {
	return /\b0x[0-9A-Fa-f]{8}\b/.test(text);
}

function splitDescriptionAndDefault(text) {
	const match = text.match(/^(.+?)\s+(0x[0-9A-Fa-f]{8})$/);
	if (match) {
		return { description: match[1], defaultValue: match[2] };
	}
	return { description: text, defaultValue: '' };
}
