import fs from 'node:fs/promises';
import path from 'node:path';

const VERSION_ENTRY_REGEX = /^(\d{4}-\d{2}-\d{2})\s+(.+?)\s+(.+)$/;
const REFERENCE_REGEX = /^\[([A-Z]+[0-9]*)\]\s+(.+)$/;
const DEFINITION_REGEX = /^([A-Z0-9][A-Za-z0-9\s()/.–-]+?):\s+(.+)$/;
const PROFILE_ID_REGEX = /^Byte\s+(\d+)\s+(0x[0-9A-Fa-f]+)\s+\((.+)\)$/;
const TOC_DOT_PATTERN = /\.{3,}/;
const SYSEX_TABLE_HEADER_REGEX = /^Value\s+Parameter$/;

const CONFORMANCE_RELATING_WORDS = ['shall', 'should', 'may'];
const CONFORMANCE_NOT_RELATING_WORDS = ['must', 'will', 'can', 'might'];

export async function transformMpeProfile(markdownPath, outDir) {
	const content = await fs.readFile(markdownPath, 'utf-8');
	const lines = content.split('\n');

	const versionHistory = [];
	const normativeReferences = [];
	const definitions = [];
	const conformanceRelating = [];
	const conformanceNotRelating = [];
	const profileId = [];
	const channelResponseNotification = [];
	const profileDetailsInquiry = [];
	const replyToProfileDetails = [];
	const profileFeaturesSupported = [];
	const mpeExpressionControllers = [];
	const noteOnSetupExample = [];
	const negotiatingSteps = {};
	const midiMessagesTable = [];

	let inVersionHistory = false;
	let inNormativeReferences = false;
	let inDefinitions = false;
	let inConformanceRelating = false;
	let inConformanceNotRelating = false;
	let inProfileId = false;
	let inSysexTable = null;
	let inFeaturesSupported = false;
	let inExpressionControllers = false;
	let inNoteOnSetup = false;
	let inMidiMessagesTable = false;
	let currentFeatureByte = null;
	let currentExpressionEntry = null;
	let currentNegotiatingStep = null;

	for (let i = 0; i < lines.length; i++) {
		const line = lines[i].trim();

		if (!line || line.startsWith('## Page') || line.startsWith('# MIDI Polyphonic')) {
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
			if (line.startsWith('Contents') || line.match(TOC_DOT_PATTERN)) {
				inVersionHistory = false;
			}
		}

		if (line === '1.3.1 Normative References') {
			inNormativeReferences = true;
			continue;
		}
		if (inNormativeReferences) {
			if (line.startsWith('1.3.2') || line.startsWith('## Page')) {
				inNormativeReferences = false;
			} else {
				const refMatch = line.match(REFERENCE_REGEX);
				if (refMatch) {
					const descriptionLines = [refMatch[2]];
					for (let j = i + 1; j < lines.length; j++) {
						const nextLine = lines[j].trim();
						if (!nextLine || nextLine.match(/^\[[A-Z]+/) || nextLine.startsWith('## Page') || nextLine.startsWith('1.3.2')) {
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

		if (line === '1.4.1 Definitions') {
			inDefinitions = true;
			continue;
		}
		if (inDefinitions) {
			if (line.startsWith('1.4.2') || line.startsWith('## Page')) {
				inDefinitions = false;
			} else {
				const defMatch = line.match(DEFINITION_REGEX);
				if (defMatch) {
					const descriptionLines = [defMatch[2]];
					for (let j = i + 1; j < lines.length; j++) {
						const nextLine = lines[j].trim();
						if (!nextLine || nextLine.match(DEFINITION_REGEX) || nextLine.startsWith('## Page') || nextLine.startsWith('1.4.2')) {
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
					if (!nextLine || CONFORMANCE_NOT_RELATING_WORDS.includes(nextLine.split(/\s/)[0]) || nextLine.startsWith('## Page') || nextLine.startsWith('Table ') || nextLine.startsWith('1.4.3')) {
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
			if (line.startsWith('## Page') || line.startsWith('1.4.3')) {
				inConformanceNotRelating = false;
			}
		}

		if (line.startsWith('Table 4') && line.includes('MPE Profile Id') && !line.match(TOC_DOT_PATTERN)) {
			inProfileId = true;
			continue;
		}
		if (inProfileId) {
			if (line === '5 bytes Profile ID') {
				continue;
			}
			const profileMatch = line.match(PROFILE_ID_REGEX);
			if (profileMatch) {
				profileId.push({
					byte: parseInt(profileMatch[1], 10),
					value: profileMatch[2],
					description: profileMatch[3]
				});
				continue;
			}
			if (line.startsWith('## Page') || line.startsWith('3.3')) {
				inProfileId = false;
			}
		}

		if (line.startsWith('Table 5') && line.includes('Channel Response Type Notification') && !line.match(TOC_DOT_PATTERN)) {
			inSysexTable = 'channelResponseNotification';
			continue;
		}
		if (line.startsWith('Table 6') && line.includes('Profile Details Inquiry') && !line.match(TOC_DOT_PATTERN)) {
			inSysexTable = 'profileDetailsInquiry';
			continue;
		}
		if (line.startsWith('Table 7') && line.includes('Reply to Profile Details') && !line.match(TOC_DOT_PATTERN)) {
			inSysexTable = 'replyToProfileDetails';
			continue;
		}
		if (line.startsWith('Table 11') && line.includes('Negotiating') && line.includes('Step 1') && !line.match(TOC_DOT_PATTERN)) {
			inSysexTable = 'negotiatingStep1';
			currentNegotiatingStep = 'step1';
			continue;
		}
		if (line.startsWith('Table 12') && line.includes('Negotiating') && line.includes('Step 2') && !line.match(TOC_DOT_PATTERN)) {
			inSysexTable = 'negotiatingStep2';
			currentNegotiatingStep = 'step2';
			continue;
		}
		if (line.startsWith('Table 13') && line.includes('Negotiating') && line.includes('Step 3') && !line.match(TOC_DOT_PATTERN)) {
			inSysexTable = 'negotiatingStep3';
			currentNegotiatingStep = 'step3';
			continue;
		}
		if (line.startsWith('Table 14') && line.includes('Negotiating') && line.includes('Step 4') && !line.match(TOC_DOT_PATTERN)) {
			inSysexTable = 'negotiatingStep4';
			currentNegotiatingStep = 'step4';
			continue;
		}

		if (inSysexTable) {
			if (line.match(SYSEX_TABLE_HEADER_REGEX)) {
				continue;
			}
			const targetArray = getSysexTargetArray(inSysexTable, {
				channelResponseNotification,
				profileDetailsInquiry,
				replyToProfileDetails,
				negotiatingSteps
			});

			if (line === 'F7 End Universal System Exclusive' || line === '0xF7 End Universal System Exclusive') {
				pushSysexEntry(targetArray, line.split(/\s/)[0], 'End Universal System Exclusive', currentNegotiatingStep);
				inSysexTable = null;
				currentNegotiatingStep = null;
				continue;
			}

			if (line.startsWith('Table ') || line.startsWith('3.7') || line.startsWith('3.8') || line.startsWith('A.')) {
				inSysexTable = null;
				currentNegotiatingStep = null;
			}

			if (inSysexTable && line) {
				const sysexMatch = parseSysexLine(line);
				if (sysexMatch) {
					pushSysexEntry(targetArray, sysexMatch.value, sysexMatch.parameter, currentNegotiatingStep);
				} else {
					pushSysexEntry(targetArray, '', line, currentNegotiatingStep);
				}
				continue;
			}
		}

		if (line.startsWith('Table 8') && line.includes('Profile Features Supported') && !line.match(TOC_DOT_PATTERN)) {
			inFeaturesSupported = true;
			continue;
		}
		if (inFeaturesSupported) {
			if (line === 'Bytes Features Supported') {
				continue;
			}
			if (line.startsWith('*Bitmap') || line.startsWith('3.8') || line.startsWith('Figure ')) {
				if (currentFeatureByte) {
					profileFeaturesSupported.push(currentFeatureByte);
					currentFeatureByte = null;
				}
				inFeaturesSupported = false;
				continue;
			}
			const byteMatch = line.match(/^Byte\s+(\d+)\s*$/);
			if (byteMatch) {
				if (currentFeatureByte) {
					profileFeaturesSupported.push(currentFeatureByte);
				}
				currentFeatureByte = { byte: parseInt(byteMatch[1], 10), type: '', fields: [] };
				continue;
			}
			const typeMatch = line.match(/^\((\w+)\)$/);
			if (typeMatch && currentFeatureByte) {
				currentFeatureByte.type = typeMatch[1];
				continue;
			}
			if (currentFeatureByte) {
				const fieldMatch = line.match(/^(D\d+(?:-D?\d+)?:|0x\w+)\s*(.+)$/);
				if (fieldMatch) {
					currentFeatureByte.fields.push({ value: fieldMatch[1], description: fieldMatch[2] });
					continue;
				}
				if (currentFeatureByte.fields.length > 0) {
					const lastField = currentFeatureByte.fields[currentFeatureByte.fields.length - 1];
					lastField.description += ' ' + line;
					continue;
				}
			}
		}

		if (line.startsWith('Table 9') && line.includes('MPE Expression Controllers') && !line.match(TOC_DOT_PATTERN)) {
			inExpressionControllers = true;
			continue;
		}
		if (inExpressionControllers) {
			if (line === 'Property (in Priority' || line === 'Order)' || line === 'Controller Alternate Bipolar Controller') {
				continue;
			}
			if (line.startsWith('4.10') || line.startsWith('## Page')) {
				if (currentExpressionEntry) {
					mpeExpressionControllers.push(currentExpressionEntry);
					currentExpressionEntry = null;
				}
				inExpressionControllers = false;
			} else if (line === 'Pitch Bend Pitch Bend Pitch Bend') {
				if (currentExpressionEntry) {
					mpeExpressionControllers.push(currentExpressionEntry);
				}
				currentExpressionEntry = { property: 'Pitch Bend', controller: 'Pitch Bend', alternate_bipolar_controller: 'Pitch Bend' };
			} else if (line === 'Pressure Channel Pressure RPN MSB/RC Bank') {
				if (currentExpressionEntry) {
					mpeExpressionControllers.push(currentExpressionEntry);
				}
				currentExpressionEntry = { property: 'Pressure', controller: 'Channel Pressure', alternate_bipolar_controller: 'RPN MSB/RC Bank 0x20, RPN LSB/RC Index 0x20' };
			} else if (line === 'Third Dimension of' || line === 'Control') {
				if (line === 'Third Dimension of') {
					if (currentExpressionEntry) {
						mpeExpressionControllers.push(currentExpressionEntry);
					}
					currentExpressionEntry = { property: 'Third Dimension of Control', controller: 'Control Change #74', alternate_bipolar_controller: '' };
				}
			} else if (line === 'Control Change #74 RPN MSB/RC Bank' && currentExpressionEntry) {
				currentExpressionEntry.alternate_bipolar_controller = 'RPN MSB/RC Bank 0x20, RPN LSB/RC Index 0x21';
			}
		}

		if (line.startsWith('Table 10') && line.includes('Note On Setup') && !line.match(TOC_DOT_PATTERN)) {
			inNoteOnSetup = true;
			continue;
		}
		if (inNoteOnSetup) {
			if (line === 'Message' || line === 'Sequence Description Effect') {
				continue;
			}
			const seqMatch = line.match(/^(\d+)\s+(.+)$/);
			if (seqMatch) {
				const rest = seqMatch[2];
				const effectLines = [];
				for (let j = i + 1; j < lines.length; j++) {
					const nextLine = lines[j].trim();
					if (!nextLine || nextLine.match(/^\d+\s+/) || nextLine.startsWith('## Page') || nextLine.startsWith('Appendix')) {
						break;
					}
					effectLines.push(nextLine);
				}
				let description;
				let effectStart;
				if (rest === 'Third Dimension of') {
					description = 'Third Dimension of Control.';
					effectStart = '';
					effectLines.shift();
				} else {
					const descMatch = rest.match(/^(Pitch Bend|Channel Pressure|Note On)\s+(.*)$/);
					if (descMatch) {
						description = descMatch[1];
						effectStart = descMatch[2];
					} else {
						description = rest;
						effectStart = '';
					}
				}
				const effectParts = effectStart ? [effectStart, ...effectLines] : effectLines;
				noteOnSetupExample.push({
					sequence: parseInt(seqMatch[1], 10),
					description: description,
					effect: effectParts.join(' ')
				});
				continue;
			}
			if (line.startsWith('## Page') || line.startsWith('Appendix')) {
				inNoteOnSetup = false;
			}
		}

		if (line.startsWith('Table 15') && line.includes('MIDI Messages Used on MPE Channels') && !line.match(TOC_DOT_PATTERN)) {
			inMidiMessagesTable = true;
			continue;
		}
		if (inMidiMessagesTable) {
			if (line === 'MIDI Message or Feature' || line === 'Manager' || line === 'Channel' || line === 'Member' || line === 'Channels Details' || line === 'Tx Rx Tx Rx') {
				continue;
			}
			if (line.startsWith('Tx:') || line.startsWith('Note:') || line.startsWith('## Page') || line.startsWith('http')) {
				inMidiMessagesTable = false;
				continue;
			}
			if (line.trim()) {
				midiMessagesTable.push(line);
			}
		}
	}

	const result = {
		metadata: {
			title: 'MIDI Polyphonic Expression (MPE) Profile',
			doc_id: 'M2-120-UM',
			protocol: 'midi2',
			version: '2.0.3',
			date: '2024-02-16'
		},
		version_history: versionHistory,
		normative_references: normativeReferences,
		definitions: definitions,
		conformance_words: {
			relating_to_conformance: conformanceRelating,
			not_relating_to_conformance: conformanceNotRelating
		},
		profile_id: profileId,
		channel_response_notification: channelResponseNotification,
		profile_details_inquiry: profileDetailsInquiry,
		reply_to_profile_details: replyToProfileDetails,
		profile_features_supported: profileFeaturesSupported,
		mpe_expression_controllers: mpeExpressionControllers,
		note_on_setup_example: noteOnSetupExample,
		negotiating_steps: negotiatingSteps,
		midi_messages_table: midiMessagesTable,
		summary: {
			version_history_count: versionHistory.length,
			normative_reference_count: normativeReferences.length,
			definition_count: definitions.length,
			conformance_relating_count: conformanceRelating.length,
			conformance_not_relating_count: conformanceNotRelating.length,
			profile_id_byte_count: profileId.length,
			channel_response_notification_count: channelResponseNotification.length,
			profile_details_inquiry_count: profileDetailsInquiry.length,
			reply_to_profile_details_count: replyToProfileDetails.length,
			profile_features_supported_count: profileFeaturesSupported.length,
			mpe_expression_controller_count: mpeExpressionControllers.length,
			note_on_setup_example_count: noteOnSetupExample.length,
			negotiating_steps_count: Object.keys(negotiatingSteps).length,
			midi_messages_table_count: midiMessagesTable.length
		}
	};

	if (outDir) {
		const outPath = path.join(outDir, 'mpe-profile.json');
		await fs.mkdir(outDir, { recursive: true });
		await fs.writeFile(outPath, JSON.stringify(result, null, 2), 'utf-8');
	}

	return result;
}

function getSysexTargetArray(tableType, arrays) {
	if (tableType === 'channelResponseNotification') {
		return arrays.channelResponseNotification;
	}
	if (tableType === 'profileDetailsInquiry') {
		return arrays.profileDetailsInquiry;
	}
	if (tableType === 'replyToProfileDetails') {
		return arrays.replyToProfileDetails;
	}
	if (tableType && tableType.startsWith('negotiatingStep')) {
		const stepKey = tableType.replace('negotiating', '').replace('Step', 'step');
		if (!arrays.negotiatingSteps[stepKey]) {
			arrays.negotiatingSteps[stepKey] = [];
		}
		return arrays.negotiatingSteps[stepKey];
	}
	return [];
}

function parseSysexLine(line) {
	if (!line) {
		return null;
	}
	const match = line.match(/^(\S+)\s+(.+)$/);
	if (match) {
		return { value: match[1], parameter: match[2] };
	}
	return { value: line, parameter: '' };
}

function pushSysexEntry(targetArray, value, parameter, _currentStep) {
	if (Array.isArray(targetArray)) {
		targetArray.push({ value, parameter });
	}
}
