import fs from 'node:fs/promises';
import path from 'node:path';

const VERSION_ENTRY_REGEX = /^(\d{4}-\d{2}-\d{2})\s+(.+?)\s+(.+)$/;
const REFERENCE_REGEX = /^\[([A-Z]+[0-9]*)\]\s+(.+)$/;
const DEFINITION_REGEX = /^([A-Z0-9][A-Za-z0-9\s()/.–-]+?):\s+(.+)$/;
const PROFILE_ID_REGEX = /^Profile ID Byte\s+(\d+)\s+(0x[0-9A-Fa-f]+|0xXX)\s+\((.+)\)$/;
const RC_TABLE_REGEX = /^RC\s+(0x[0-9A-Fa-f]+)\s+(0x[0-9A-Fa-f]+)\s+(.+)$/;
const DRAWBAR_SETTING_REGEX = /^(Off\/In\/0|\d|Full\/Out\/8)\s+(0x[0-9A-Fa-f]+)\s*[-\u2013]\s*(0x[0-9A-Fa-f]+)\s+(0x[0-9A-Fa-f]+)$/;
const CC_RESPONSE_REGEX = /^(0x[0-9A-Fa-f]{8})\s+(.+)$/;
const BITMAP_REGEX = /^(D\d+(?:-\d+)?)\s+(.+)$/;
const SUMMARY_MESSAGE_REGEX = /^((?:Note On\/Off|RC\s+0x[0-9A-Fa-f]+\s+0x[0-9A-Fa-f]+|CC#\d+|Pitch Bend|Profile Specific Data))\s+(.+?)\s+(required|optional)$/;
const TOC_DOT_PATTERN = /\.{3,}/;
const VALUE_RANGE_REGEX = /^Value Range:\s+(0x[0-9A-Fa-f]+)\s*(?:[-\u2013]|to)\s*(0x[0-9A-Fa-f]+)\s*=\s*(.+)$/;
const VALUE_REGEX = /^Value:\s+(.+)$/;
const DEFAULT_VALUE_REGEX = /^Default Value:\s+(.+)$/;

const CONFORMANCE_RELATING_WORDS = ['shall', 'should', 'may'];
const CONFORMANCE_NOT_RELATING_WORDS = ['must', 'will', 'can', 'might'];

export async function transformDrawbarOrganProfile(markdownPath, outDir) {
	const content = await fs.readFile(markdownPath, 'utf-8');
	const lines = content.split('\n');

	const versionHistory = [];
	const normativeReferences = [];
	const definitions = [];
	const conformanceRelating = [];
	const conformanceNotRelating = [];
	const profileId = [];
	const profileLevels = [];
	const optionalFeaturesBitmap = [];
	const drawbarSettings = [];
	const drawbarRcs = [];
	const cc7VolumeResponse = [];
	const cc11ExpressionResponse = [];
	const channelModeMessages = [];
	const optionalCcMessages = [];
	const optionalRcs = [];
	const optionalRcDetails = [];
	const otherOptionalMessages = [];
	const midiMessagesSummary = [];

	let inVersionHistory = false;
	let inNormativeReferences = false;
	let inDefinitions = false;
	let inConformanceRelating = false;
	let inConformanceNotRelating = false;
	let inProfileId = false;
	let inProfileLevels = false;
	let inBitmap = false;
	let inDrawbarSettings = false;
	let inDrawbarRcs = false;
	let inCc7Volume = false;
	let inCc11Expression = false;
	let inOptionalRcs = false;
	let inSummary = false;

	let currentBitmapEntry = null;

	for (let i = 0; i < lines.length; i++) {
		const line = lines[i].trim();

		if (!line || line.startsWith('## Page') || line.startsWith('# Drawbar Organ')) {
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

		if (line.startsWith('Table 2') && line.includes('Words Relating') && !line.match(TOC_DOT_PATTERN)) {
			inConformanceRelating = true;
			inConformanceNotRelating = false;
			continue;
		}
		if (line.startsWith('Table 3') && line.includes('Words Not Relating') && !line.match(TOC_DOT_PATTERN)) {
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
					if (!nextLine || CONFORMANCE_NOT_RELATING_WORDS.includes(nextLine.split(/\s/)[0]) || nextLine.startsWith('## Page') || nextLine.startsWith('Table ') || nextLine.startsWith('1.3')) {
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

		if (line.startsWith('Table 4') && line.includes('Profile ID') && !line.match(TOC_DOT_PATTERN)) {
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
			if (line.startsWith('Drawbar Organ Profile Level:')) {
				inProfileId = false;
				inProfileLevels = true;
				continue;
			}
			if (line.startsWith('4.2') || line.startsWith('Table ')) {
				inProfileId = false;
			}
		}
		if (inProfileLevels) {
			const levelMatch = line.match(/^[•]\s+(0x[0-9A-Fa-f]+(?:\s*-\s*0x[0-9A-Fa-f]+)?)\s+(.+)$/);
			if (levelMatch) {
				profileLevels.push({ level: levelMatch[1], description: levelMatch[2] });
				continue;
			}
			if (line.startsWith('4.2') || line.startsWith('Table ')) {
				inProfileLevels = false;
			}
		}

		if (line.startsWith('Table 5') && line.includes('Bitmap') && !line.match(TOC_DOT_PATTERN)) {
			inBitmap = true;
			continue;
		}
		if (inBitmap) {
			if (line === 'Byte Bitmap' || line === 'Data' || line === 'Message' || line === 'Supported' || line === 'Description') {
				continue;
			}
			const bytePrefixMatch = line.match(/^Byte\s+\d+\s+(D\d+(?:-\d+)?)\s+(.+)$/);
			if (bytePrefixMatch) {
				if (currentBitmapEntry) {
					optionalFeaturesBitmap.push(currentBitmapEntry);
				}
				currentBitmapEntry = {
					bit: bytePrefixMatch[1],
					message: bytePrefixMatch[2],
					description: ''
				};
				continue;
			}
			const bitmapMatch = line.match(BITMAP_REGEX);
			if (bitmapMatch) {
				if (currentBitmapEntry) {
					optionalFeaturesBitmap.push(currentBitmapEntry);
				}
				currentBitmapEntry = {
					bit: bitmapMatch[1],
					message: bitmapMatch[2],
					description: ''
				};
				continue;
			}
			if (currentBitmapEntry) {
				if (line.startsWith('## Page') || line.startsWith('Table ') || line.startsWith('5 ')) {
					optionalFeaturesBitmap.push(currentBitmapEntry);
					currentBitmapEntry = null;
					inBitmap = false;
				} else {
					if (line.startsWith('RC ') || line.startsWith('CC#')) {
						currentBitmapEntry.message += ' ' + line;
					} else if (!currentBitmapEntry.description) {
						currentBitmapEntry.description = line;
					} else {
						currentBitmapEntry.description += ' ' + line;
					}
					continue;
				}
			}
			if (line.startsWith('## Page') || line.startsWith('5 ')) {
				inBitmap = false;
			}
		}

		if (line.startsWith('Table 6') && line.includes('Drawbar Settings') && !line.match(TOC_DOT_PATTERN)) {
			inDrawbarSettings = true;
			continue;
		}
		if (inDrawbarSettings) {
			if (line === 'Setting Range Discrete Value' || line.startsWith('Senders:') || line.startsWith('Receivers:')) {
				if (line.startsWith('Senders:') || line.startsWith('Receivers:')) {
					inDrawbarSettings = false;
				}
				continue;
			}
			const drawbarMatch = line.match(DRAWBAR_SETTING_REGEX);
			if (drawbarMatch) {
				drawbarSettings.push({
					setting: drawbarMatch[1],
					range_start: drawbarMatch[2],
					range_end: drawbarMatch[3],
					discrete_value: drawbarMatch[4]
				});
				continue;
			}
			if (line.startsWith('Table ') || line.startsWith('## Page')) {
				inDrawbarSettings = false;
			}
		}

		if (line.startsWith('Table 7') && line.includes('Drawbars') && !line.match(TOC_DOT_PATTERN)) {
			inDrawbarRcs = true;
			continue;
		}
		if (inDrawbarRcs) {
			if (line === 'MIDI Message Parameter' || line.startsWith('Note:')) {
				if (line.startsWith('Note:')) {
					inDrawbarRcs = false;
				}
				continue;
			}
			const rcMatch = line.match(RC_TABLE_REGEX);
			if (rcMatch) {
				drawbarRcs.push({
					controller_msb: rcMatch[1],
					controller_lsb: rcMatch[2],
					parameter: rcMatch[3]
				});
				continue;
			}
			if (line.startsWith('5.1.3') || line.startsWith('Table ') || line.startsWith('## Page')) {
				inDrawbarRcs = false;
			}
		}

		if (line.startsWith('Table 8') && line.includes('CC#7') && !line.match(TOC_DOT_PATTERN)) {
			inCc7Volume = true;
			continue;
		}
		if (inCc7Volume) {
			if (line === 'CC#7 Amplitude') {
				continue;
			}
			const ccMatch = line.match(CC_RESPONSE_REGEX);
			if (ccMatch) {
				cc7VolumeResponse.push({
					value: ccMatch[1],
					amplitude: ccMatch[2]
				});
				continue;
			}
			if (line.startsWith('The formula') || line.startsWith('5.1.3') || line.startsWith('Table ') || line.startsWith('## Page')) {
				inCc7Volume = false;
			}
		}

		if (line.startsWith('Table 9') && line.includes('CC#11') && !line.match(TOC_DOT_PATTERN)) {
			inCc11Expression = true;
			continue;
		}
		if (inCc11Expression) {
			if (line === 'CC#11 Amplitude') {
				continue;
			}
			const ccMatch = line.match(CC_RESPONSE_REGEX);
			if (ccMatch) {
				cc11ExpressionResponse.push({
					value: ccMatch[1],
					amplitude: ccMatch[2]
				});
				continue;
			}
			if (line.startsWith('The formula') || line.startsWith('Note:') || line.startsWith('5.1.4') || line.startsWith('Table ') || line.startsWith('## Page')) {
				inCc11Expression = false;
			}
		}

		if (line.match(/^5\.1\.4\.\d+\s+.+\s+\(CC#\d+\)$/)) {
			const modeMatch = line.match(/^(\d+\.\d+\.\d+\.\d+)\s+(.+?)\s+\(CC#(\d+)\)$/);
			if (modeMatch) {
				const descriptionLines = [];
				for (let j = i + 1; j < lines.length; j++) {
					const nextLine = lines[j].trim();
					if (!nextLine || nextLine.match(/^5\.1\.4\.\d+/) || nextLine.match(/^5\.1\.\d/) || nextLine.startsWith('## Page') || nextLine.startsWith('6 ')) {
						break;
					}
					descriptionLines.push(nextLine);
				}
				channelModeMessages.push({
					section: modeMatch[1],
					name: modeMatch[2],
					cc_number: parseInt(modeMatch[3], 10),
					description: descriptionLines.join(' ')
				});
				continue;
			}
		}

		if (line.match(/^6\.1\.1\.\d+\s+.+\s+\(CC#\d+\)$/)) {
			const ccMatch = line.match(/^(\d+\.\d+\.\d+\.\d+)\s+(.+?)\s+\(CC#(\d+)\)$/);
			if (ccMatch) {
				const optionalCcEntry = {
					section: ccMatch[1],
					name: ccMatch[2],
					cc_number: parseInt(ccMatch[3], 10),
					value_ranges: [],
					default_value: '',
					description: ''
				};
				const descriptionLines = [];
				for (let j = i + 1; j < lines.length; j++) {
					const nextLine = lines[j].trim();
					if (!nextLine || nextLine.match(/^6\.1\.\d/) || nextLine.startsWith('## Page') || nextLine.startsWith('Table ')) {
						break;
					}
					const valueMatch = nextLine.match(VALUE_REGEX);
					if (valueMatch) {
						optionalCcEntry.value_ranges = parseValueRanges(valueMatch[1]);
						continue;
					}
					const defaultMatch = nextLine.match(DEFAULT_VALUE_REGEX);
					if (defaultMatch) {
						optionalCcEntry.default_value = defaultMatch[1];
						continue;
					}
					descriptionLines.push(nextLine);
				}
				optionalCcEntry.description = descriptionLines.join(' ');
				optionalCcMessages.push(optionalCcEntry);
				continue;
			}
		}

		if (line.startsWith('Table 10') && line.includes('Optional Parameters') && !line.match(TOC_DOT_PATTERN)) {
			inOptionalRcs = true;
			continue;
		}
		if (inOptionalRcs) {
			if (line === 'MIDI Message Parameter') {
				continue;
			}
			const rcMatch = line.match(RC_TABLE_REGEX);
			if (rcMatch) {
				optionalRcs.push({
					controller_msb: rcMatch[1],
					controller_lsb: rcMatch[2],
					parameter: rcMatch[3]
				});
				continue;
			}
			if (line.match(/^6\.1\.2\.\d+/) || line.startsWith('Table ') || line.startsWith('## Page')) {
				inOptionalRcs = false;
			}
		}

		if (line.match(/^6\.1\.2\.\d+\s+RC\s+0x[0-9A-Fa-f]+\s+0x[0-9A-Fa-f]+/) && !line.match(TOC_DOT_PATTERN)) {
			const detailMatch = line.match(/^(\d+\.\d+\.\d+\.\d+)\s+RC\s+(0x[0-9A-Fa-f]+)\s+(0x[0-9A-Fa-f]+)\s+(.+)$/);
			if (detailMatch) {
				const rcDetailEntry = {
					section: detailMatch[1],
					controller_msb: detailMatch[2],
					controller_lsb: detailMatch[3],
					name: detailMatch[4],
					value_ranges: [],
					default_value: '',
					description: ''
				};
				const descriptionLines = [];
				for (let j = i + 1; j < lines.length; j++) {
					const nextLine = lines[j].trim();
					if (nextLine.match(/^6\.1\.\d/) || nextLine.startsWith('Table ')) {
						break;
					}
					if (!nextLine || nextLine.startsWith('## Page')) {
						continue;
					}
					const valueRangeMatch = nextLine.match(VALUE_RANGE_REGEX);
					if (valueRangeMatch) {
						rcDetailEntry.value_ranges.push({
							range_start: valueRangeMatch[1],
							range_end: valueRangeMatch[2],
							label: valueRangeMatch[3]
						});
						continue;
					}
					const valueMatch = nextLine.match(VALUE_REGEX);
					if (valueMatch) {
						rcDetailEntry.value_ranges = parseValueRanges(valueMatch[1]);
						continue;
					}
					const defaultMatch = nextLine.match(DEFAULT_VALUE_REGEX);
					if (defaultMatch) {
						rcDetailEntry.default_value = defaultMatch[1];
						continue;
					}
					descriptionLines.push(nextLine);
				}
				rcDetailEntry.description = descriptionLines.join(' ');
				optionalRcDetails.push(rcDetailEntry);
				continue;
			}
		}

		if (line.match(/^6\.1\.[3-5]\s+/) && !line.match(TOC_DOT_PATTERN)) {
			const sectionMatch = line.match(/^(\d+\.\d+\.\d+)\s+(.+)$/);
			if (sectionMatch) {
				const descriptionLines = [];
				for (let j = i + 1; j < lines.length; j++) {
					const nextLine = lines[j].trim();
					if (!nextLine || nextLine.match(/^6\.\d/) || nextLine.startsWith('## Page') || nextLine.startsWith('Appendix')) {
						break;
					}
					descriptionLines.push(nextLine);
				}
				otherOptionalMessages.push({
					section: sectionMatch[1],
					name: sectionMatch[2],
					description: descriptionLines.join(' ')
				});
				continue;
			}
		}

		if (line.startsWith('Table 11') && line.includes('MIDI Messages Summary') && !line.match(TOC_DOT_PATTERN)) {
			inSummary = true;
			continue;
		}
		if (inSummary) {
			if (line === 'MIDI Message Parameter Requirement') {
				continue;
			}
			const noParamMatch = line.match(/^(Note On\/Off)\s+(required|optional)$/);
			if (noParamMatch) {
				midiMessagesSummary.push({
					message: noParamMatch[1],
					parameter: '',
					requirement: noParamMatch[2]
				});
				continue;
			}
			const summaryMatch = line.match(SUMMARY_MESSAGE_REGEX);
			if (summaryMatch) {
				midiMessagesSummary.push({
					message: summaryMatch[1].replace(/\s+/g, ' ').trim(),
					parameter: summaryMatch[2],
					requirement: summaryMatch[3]
				});
				continue;
			}
			if (line.startsWith('## Page') || line.startsWith('Appendix')) {
				inSummary = false;
			}
		}
	}

	if (currentBitmapEntry) {
		optionalFeaturesBitmap.push(currentBitmapEntry);
	}

	const result = {
		metadata: {
			title: 'Drawbar Organ Profile',
			doc_id: 'M2-121-UM',
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
		profile_levels: profileLevels,
		optional_features_bitmap: optionalFeaturesBitmap,
		drawbar_settings: drawbarSettings,
		drawbar_rcs: drawbarRcs,
		cc7_volume_response: cc7VolumeResponse,
		cc11_expression_response: cc11ExpressionResponse,
		channel_mode_messages: channelModeMessages,
		optional_cc_messages: optionalCcMessages,
		optional_rcs: optionalRcs,
		optional_rc_details: optionalRcDetails,
		other_optional_messages: otherOptionalMessages,
		midi_messages_summary: midiMessagesSummary,
		summary: {
			version_history_count: versionHistory.length,
			normative_reference_count: normativeReferences.length,
			definition_count: definitions.length,
			conformance_relating_count: conformanceRelating.length,
			conformance_not_relating_count: conformanceNotRelating.length,
			profile_id_byte_count: profileId.length,
			profile_level_count: profileLevels.length,
			optional_features_bitmap_count: optionalFeaturesBitmap.length,
			drawbar_setting_count: drawbarSettings.length,
			drawbar_rc_count: drawbarRcs.length,
			cc7_volume_response_count: cc7VolumeResponse.length,
			cc11_expression_response_count: cc11ExpressionResponse.length,
			channel_mode_message_count: channelModeMessages.length,
			optional_cc_message_count: optionalCcMessages.length,
			optional_rc_count: optionalRcs.length,
			optional_rc_detail_count: optionalRcDetails.length,
			other_optional_message_count: otherOptionalMessages.length,
			midi_messages_summary_count: midiMessagesSummary.length
		}
	};

	if (outDir) {
		const outPath = path.join(outDir, 'drawbar-organ-profile.json');
		await fs.mkdir(outDir, { recursive: true });
		await fs.writeFile(outPath, JSON.stringify(result, null, 2), 'utf-8');
	}

	return result;
}

function parseValueRanges(text) {
	const ranges = [];
	const parts = text.split(/,\s*/);
	for (const part of parts) {
		const match = part.match(/^(0x[0-9A-Fa-f]+)\s*[-\u2013]\s*(0x[0-9A-Fa-f]+)\s*=\s*(.+)$/);
		if (match) {
			ranges.push({
				range_start: match[1],
				range_end: match[2],
				label: match[3].trim()
			});
		}
	}
	return ranges;
}
