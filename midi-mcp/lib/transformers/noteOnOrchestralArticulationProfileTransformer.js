import fs from 'node:fs/promises';
import path from 'node:path';

const CLASSIFICATION_ENTRY_REGEX = /^(N\/A|\d+(?:-\d+)?)\s+(0x[0-9A-Fa-f]+(?:-0x[0-9A-Fa-f]+)?)\s+(.+)$/;

const SUBCLASS_ENTRY_REGEX = /^(0x[0-9A-Fa-f])\s+(.+)$/;

const SUBCLASS_HEX_ONLY_REGEX = /^(0x[0-9A-Fa-f])$/;

const MUTE_RANGE_REGEX = /^(0x[0-9A-Fa-f]+)\s+\u2013\s+(0x[0-9A-Fa-f]+)\s+(.+)$/;

const DIRECTION_ENTRY_REGEX = /^(0x[0-9A-Fa-f])\s+(.+)$/;

const STRING_ASSIGNMENT_REGEX = /^(0x[0-9A-Fa-f])\s+(.+)$/;

const NOTE_OFF_ATTRIBUTE_REGEX = /^(0x[0-9A-Fa-f]{2})\s+(.+)$/;

const NOTE_OFF_SUBCLASS_REGEX = /^(0x[0-9A-Fa-f])(?:-0x[0-9A-Fa-f])?\s+(.+)$/;

const PROFILE_ID_REGEX = /^Byte\s+(\d+)\s+(0x[0-9A-Fa-f]+)\s+(.+)$/;

const INSTRUMENT_TYPE_REGEX = /^([A-Z][a-zA-Z]{1,3})\s+(.+)$/;

const REFERENCE_REGEX = /^\[([A-Z]+[0-9]*)\]\s+(.+)$/;

const DEFINITION_REGEX = /^([A-Z][A-Za-z0-9\s-]+?):\s+(.+)$/;

const VERSION_ENTRY_REGEX = /^(\d{4}-\d{2}-\d{2})\s+(.+?)\s+(.+)$/;

const PLAYING_POSITION_REGEX = /^(0x[0-9A-Fa-f]+)\s+(.+)$/;

const OPTIONAL_FEATURE_REGEX = /^(D\d+)\s+(.+?)\s+(Supports\s.+)$/;

const APPENDIX_ENTRY_REGEX = /^(0x[0-9A-Fa-f])\s+(.+)$/;

const INSTRUMENT_TYPES = ['Str', 'Ww', 'Brs', 'NoP', 'TuP', 'Gui', 'Hrp', 'Kbd', 'Chr'];

function parseAppendixLine(line) {
	const match = line.match(APPENDIX_ENTRY_REGEX);
	if (!match) {
		return null;
	}
	const subclassHex = match[1];
	const rest = match[2];
	const bullets = rest.match(/\u2022/g) || [];
	const articulationPart = rest.replace(/\u2022/g, '').trim();
	return {
		subclass: subclassHex,
		articulation: articulationPart,
		applicability: bullets
	};
}

export async function transformNoteOnOrchestralArticulationProfile(markdownPath, outDir) {
	const content = await fs.readFile(markdownPath, 'utf-8');
	const lines = content.split('\n');

	const versionHistory = [];
	const conformanceRelating = [];
	const conformanceNotRelating = [];
	const definitions = [];
	const normativeReferences = [];
	const profileId = [];
	const classifications = [];
	const subclassTables = {};
	const noteOffAttributeTypes = [];
	const noteOffSubclasses = [];
	const noteOffStringAssignments = [];
	const muteTypeRanges = [];
	const playingPositionEntries = [];
	const optionalFeatures = [];
	const instrumentTypes = [];
	const appendixTables = {};

	let inVersionHistory = false;
	let inConformanceRelating = false;
	let inConformanceNotRelating = false;
	let inDefinitions = false;
	let inNormativeReferences = false;
	let inProfileId = false;
	let inClassifications = false;
	let inSubclassTable = null;
	let inDirection = false;
	let inStringAssignment = false;
	let inNoteOffAttribute = false;
	let inNoteOffSubclass = false;
	let inNoteOffString = false;
	let inMuteType = false;
	let inPlayingPosition = false;
	let inOptionalFeatures = false;
	let inInstrumentTypes = false;
	let inAppendixTable = null;
	let currentSubclassEntry = null;
	let currentAppendixEntry = null;

	const finalizeSubclassEntry = () => {
		if (currentSubclassEntry && inSubclassTable) {
			if (!subclassTables[inSubclassTable]) {
				subclassTables[inSubclassTable] = [];
			}
			subclassTables[inSubclassTable].push(currentSubclassEntry);
			currentSubclassEntry = null;
		}
	};

	const finalizeAppendixEntry = () => {
		if (currentAppendixEntry && inAppendixTable) {
			if (!appendixTables[inAppendixTable]) {
				appendixTables[inAppendixTable] = [];
			}
			appendixTables[inAppendixTable].push(currentAppendixEntry);
			currentAppendixEntry = null;
		}
	};

	for (let i = 0; i < lines.length; i++) {
		const line = lines[i].trim();
		if (!line) {
			continue;
		}

		if (line.startsWith('---') || line.startsWith('title:') || line.startsWith('docId:') || line.startsWith('version:') || line.startsWith('protocol:') || line.startsWith('source:') || line.startsWith('sourceType:') || line.startsWith('pages:') || line.startsWith('sha256:') || line.startsWith('extractedAt:') || line.startsWith('summary:') || line.startsWith('# Note') || line.startsWith('## Page') || line.startsWith('MIDI-CI Profile') || line.startsWith('MIDI Association Document') || line.startsWith('Document Version') || line.startsWith('Draft Date') || line.startsWith('Published') || line.startsWith('Developed and') || line.startsWith('The MIDI Association') || line.startsWith('PREFACE') || line.startsWith('©') || line.startsWith('ALL RIGHTS') || line.startsWith('NO PART') || line.startsWith('FORM OR BY') || line.startsWith('RETRIEVAL SYSTEMS') || line.startsWith('WITHOUT PERMISSION') || line.startsWith('http://') || line.startsWith('Figures') || line.startsWith('Figure ') || line.startsWith('Tables') || line.startsWith('Contents') || line.startsWith('Version History ..') || line.startsWith('Contents ..')) {
			continue;
		}

		if (line.match(/^\d/) && line.includes('....')) {
			continue;
		}
		if (line.match(/^\d/) && line.includes('Error!')) {
			continue;
		}

		if (line === 'Table 1 Version History') {
			inVersionHistory = true;
			continue;
		}
		if (inVersionHistory) {
			if (line.startsWith('Publication Date')) {
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
			if (!line.match(/^\d{4}/)) {
				inVersionHistory = false;
			}
		}

		if (line.startsWith('Table 2') && line.includes('Words Relating')) {
			inConformanceRelating = true;
			inConformanceNotRelating = false;
			continue;
		}
		if (line.startsWith('Table 3') && line.includes('Words Not Relating')) {
			inConformanceNotRelating = true;
			inConformanceRelating = false;
			continue;
		}
		if (line.startsWith('Word') && line.includes('Reserved For')) {
			continue;
		}

		if (inConformanceRelating) {
			if (['shall', 'should', 'may'].includes(line.split(/\s/)[0])) {
				const parts = line.split(/\s+/);
				const word = parts[0];
				const reservedFor = parts.slice(1).join(' ');
				const descriptionLines = [];
				for (let j = i + 1; j < lines.length; j++) {
					const nextLine = lines[j].trim();
					if (!nextLine || ['shall', 'should', 'may'].includes(nextLine.split(/\s/)[0]) || nextLine.startsWith('By contrast') || nextLine.startsWith('Table ')) {
						break;
					}
					descriptionLines.push(nextLine);
				}
				conformanceRelating.push({
					word,
					reserved_for: reservedFor,
					description: descriptionLines.join(' ')
				});
				continue;
			}
			if (line.startsWith('By contrast') || line.startsWith('Table ')) {
				inConformanceRelating = false;
			}
		}

		if (inConformanceNotRelating) {
			if (['must', 'will', 'can', 'might'].includes(line.split(/\s/)[0])) {
				const parts = line.split(/\s+/);
				const word = parts[0];
				const rest = parts.slice(1).join(' ');
				const describesIdx = rest.indexOf('Describes');
				let reservedFor;
				let descriptionText;
				if (describesIdx !== -1) {
					reservedFor = rest.substring(0, describesIdx).trim();
					descriptionText = rest.substring(describesIdx);
				} else {
					reservedFor = rest;
					descriptionText = '';
				}
				const descriptionLines = [descriptionText];
				for (let j = i + 1; j < lines.length; j++) {
					const nextLine = lines[j].trim();
					if (!nextLine || ['must', 'will', 'can', 'might'].includes(nextLine.split(/\s/)[0]) || nextLine.startsWith('## Page') || nextLine.startsWith('Table ')) {
						break;
					}
					descriptionLines.push(nextLine);
				}
				conformanceNotRelating.push({
					word,
					reserved_for: reservedFor,
					description: descriptionLines.join(' ')
				});
				continue;
			}
			if (line.startsWith('## Page') || line.match(/^2\s+Introduction/)) {
				inConformanceNotRelating = false;
			}
		}

		if (line.match(/^1\.2\.1\s+Definitions/) || line === '1.2.1 Definitions') {
			inDefinitions = true;
			continue;
		}
		if (inDefinitions) {
			if (line.match(/^1\.2\.2/) || line.match(/^2\s+Introduction/)) {
				inDefinitions = false;
			} else {
				const defMatch = line.match(DEFINITION_REGEX);
				if (defMatch && !line.startsWith('\u2022') && !line.startsWith('MIDI 1.0') && !line.startsWith('MIDI 2.0')) {
					const descriptionLines = [defMatch[2]];
					for (let j = i + 1; j < lines.length; j++) {
						const nextLine = lines[j].trim();
						if (!nextLine || nextLine.match(/^[A-Z][A-Za-z0-9\s-]+?:\s/) || nextLine.startsWith('## Page') || nextLine.match(/^1\.2\.2/)) {
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

		if (line.match(/^1\.1\.1\s+Normative/) || line === '1.1.1 Normative References') {
			inNormativeReferences = true;
			continue;
		}
		if (inNormativeReferences) {
			if (line.match(/^1\.1\.2/) || line.match(/^1\.2/)) {
				inNormativeReferences = false;
			} else {
				const refMatch = line.match(REFERENCE_REGEX);
				if (refMatch) {
					const descriptionLines = [refMatch[2]];
					for (let j = i + 1; j < lines.length; j++) {
						const nextLine = lines[j].trim();
						if (!nextLine || nextLine.match(/^\[[A-Z]+/) || nextLine.startsWith('## Page') || nextLine.match(/^1\.1\.2/)) {
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

		if (line.startsWith('Table 4') && line.includes('Profile ID')) {
			inProfileId = true;
			continue;
		}
		if (inProfileId) {
			if (line.startsWith('5 bytes')) {
				continue;
			}
			const profileMatch = line.match(PROFILE_ID_REGEX);
			if (profileMatch) {
				profileId.push({
					byte: parseInt(profileMatch[1], 10),
					value: profileMatch[2],
					description: profileMatch[3].replace(/[()]/g, '').trim()
				});
				continue;
			}
			if (line.match(/^3\.2\.1/) || line.startsWith('Version')) {
				inProfileId = false;
			}
		}

		if (line.startsWith('Table 5') && line.includes('Note On Direction')) {
			inDirection = true;
			continue;
		}
		if (inDirection) {
			if (line === 'Direction Description') {
				continue;
			}
			const dirMatch = line.match(DIRECTION_ENTRY_REGEX);
			if (dirMatch) {
				classifications.push({ table: 'direction', value: dirMatch[1], description: dirMatch[2] });
				continue;
			}
			if (line.startsWith('Reset Round Robin') || line.startsWith('Table ') || line.startsWith('## Page')) {
				inDirection = false;
			}
		}

		if (line.startsWith('Table 6') && line.includes('Note On String Assignment')) {
			inStringAssignment = true;
			continue;
		}
		if (inStringAssignment) {
			if (line === 'String' || line === 'Assignment' || line === 'Description') {
				continue;
			}
			const strMatch = line.match(STRING_ASSIGNMENT_REGEX);
			if (strMatch) {
				classifications.push({ table: 'string_assignment', value: strMatch[1], description: strMatch[2] });
				continue;
			}
			if (line.startsWith('Note:') || line.startsWith('Table ') || line.startsWith('## Page') || line.startsWith('4.2')) {
				inStringAssignment = false;
			}
		}

		if (line.startsWith('Table 7') && line.includes('Classifications')) {
			inClassifications = true;
			continue;
		}
		if (inClassifications) {
			if (['Classification', 'Number', 'Attribute', 'Type', 'Classification of Articulation'].includes(line)) {
				continue;
			}
			const classMatch = line.match(CLASSIFICATION_ENTRY_REGEX);
			if (classMatch) {
				classifications.push({
					table: 'classifications',
					classification_number: classMatch[1],
					attribute_type: classMatch[2],
					description: classMatch[3]
				});
				continue;
			}
			if (line.startsWith('Each Classification') || line.startsWith('5.2') || line.startsWith('## Page')) {
				inClassifications = false;
			}
		}

		const subclassTableMatch = line.match(/^Table\s+(\d+)\s+Subclasses\/Articulations in (0x[0-9A-Fa-f]+)/) || line.match(/^Table\s+(\d+)\s+(0x[0-9A-Fa-f]+)\s/);
		if (subclassTableMatch && subclassTableMatch[2] && subclassTableMatch[2].match(/^0x[0-9A-Fa-f]+$/)) {
			finalizeSubclassEntry();
			inSubclassTable = subclassTableMatch[2];
			continue;
		}
		if (line.startsWith('Table 10') && line.includes('0x12')) {
			finalizeSubclassEntry();
			inSubclassTable = '0x12';
			continue;
		}
		if (line.startsWith('Table 11') && line.includes('0x13')) {
			finalizeSubclassEntry();
			inSubclassTable = '0x13';
			continue;
		}
		if (line.startsWith('Table 12') && line.includes('0x14')) {
			finalizeSubclassEntry();
			inSubclassTable = '0x14';
			continue;
		}
		if (line.startsWith('Table 13') && line.includes('0x15')) {
			finalizeSubclassEntry();
			inSubclassTable = '0x15';
			continue;
		}
		if (line.startsWith('Table 14') && line.includes('0x16')) {
			finalizeSubclassEntry();
			inSubclassTable = '0x16';
			continue;
		}
		if (line.startsWith('Table 15') && line.includes('0x17')) {
			finalizeSubclassEntry();
			inSubclassTable = '0x17';
			continue;
		}

		if (inSubclassTable) {
			if (line === 'Sub' || line === 'Class' || line === 'Articulation Notes, Alternatives') {
				continue;
			}
			if (line.startsWith('*Note:') || line.startsWith('**Example') || line.startsWith('***Example')) {
				finalizeSubclassEntry();
				inSubclassTable = null;
				continue;
			}
			if (line.startsWith('Table ') || line.match(/^5\.2\.\d+/) || line.match(/^6\s+/) || line.match(/^7\s+/) || line.match(/^8\s+/) || line.match(/^9\s+/) || line.match(/^10\s+/) || line.startsWith('Appendix')) {
				finalizeSubclassEntry();
				inSubclassTable = null;
			} else {
				const subMatch = line.match(SUBCLASS_ENTRY_REGEX);
				if (subMatch) {
					finalizeSubclassEntry();
					currentSubclassEntry = {
						subclass: subMatch[1],
						articulation: subMatch[2],
						notes: ''
					};
					continue;
				}
				const hexOnlyMatch = line.match(SUBCLASS_HEX_ONLY_REGEX);
				if (hexOnlyMatch) {
					finalizeSubclassEntry();
					currentSubclassEntry = {
						subclass: hexOnlyMatch[1],
						articulation: '',
						notes: ''
					};
					continue;
				}
				if (currentSubclassEntry) {
					if (line === 'reserved' || line.startsWith('reserved')) {
						currentSubclassEntry.notes = line;
						finalizeSubclassEntry();
						continue;
					}
					currentSubclassEntry.articulation += ' ' + line;
					currentSubclassEntry.articulation = currentSubclassEntry.articulation.trim();
					continue;
				}
			}
		}

		if (line.startsWith('Table 16') && line.includes('Note Off Attribute')) {
			inNoteOffAttribute = true;
			continue;
		}
		if (inNoteOffAttribute) {
			if (['Attribute', 'Type', 'Classification of Articulation'].includes(line)) {
				continue;
			}
			const attrMatch = line.match(NOTE_OFF_ATTRIBUTE_REGEX);
			if (attrMatch) {
				const descLines = [attrMatch[2]];
				for (let j = i + 1; j < lines.length; j++) {
					const nextLine = lines[j].trim();
					if (!nextLine || nextLine.match(/^0x[0-9A-Fa-f]{2}\s/) || nextLine.startsWith('Note Off Subclass') || nextLine.startsWith('Table ') || nextLine.startsWith('## Page')) {
						break;
					}
					descLines.push(nextLine);
				}
				noteOffAttributeTypes.push({
					attribute_type: attrMatch[1],
					description: descLines.join(' ')
				});
				continue;
			}
			if (line.startsWith('Note Off Subclass') || line.startsWith('Table ') || line.startsWith('## Page')) {
				inNoteOffAttribute = false;
			}
		}

		if (line.startsWith('Table 17') && line.includes('Note Off Subclasses')) {
			inNoteOffSubclass = true;
			continue;
		}
		if (inNoteOffSubclass) {
			if (line === 'Subclass Description') {
				continue;
			}
			const subMatch = line.match(NOTE_OFF_SUBCLASS_REGEX);
			if (subMatch) {
				noteOffSubclasses.push({
					subclass: subMatch[1],
					description: subMatch[2]
				});
				continue;
			}
			if (line.startsWith('A Receiver') || line.startsWith('Table ') || line.startsWith('## Page')) {
				inNoteOffSubclass = false;
			}
		}

		if (line.startsWith('Table 18') && line.includes('Note Off String')) {
			inNoteOffString = true;
			continue;
		}
		if (inNoteOffString) {
			if (['String', 'Assignment', 'Description'].includes(line)) {
				continue;
			}
			const strMatch = line.match(STRING_ASSIGNMENT_REGEX);
			if (strMatch) {
				noteOffStringAssignments.push({
					value: strMatch[1],
					description: strMatch[2]
				});
				continue;
			}
			if (line.startsWith('7.2') || line.startsWith('Table ') || line.startsWith('## Page')) {
				inNoteOffString = false;
			}
		}

		if (line.startsWith('Table 19') && line.includes('Mute Type')) {
			inMuteType = true;
			continue;
		}
		if (inMuteType) {
			if (line === 'Subrange Values Mute Type') {
				continue;
			}
			const muteMatch = line.match(MUTE_RANGE_REGEX);
			if (muteMatch) {
				muteTypeRanges.push({
					range_start: muteMatch[1],
					range_end: muteMatch[2],
					mute_type: muteMatch[3]
				});
				continue;
			}
			if (line.startsWith('If a Receiver') || line.startsWith('Table ') || line.startsWith('## Page') || line.startsWith('8.1.2')) {
				inMuteType = false;
			}
		}

		if (line.startsWith('Table 20') && line.includes('Playing Position')) {
			inPlayingPosition = true;
			continue;
		}
		if (inPlayingPosition) {
			if (line === 'Value Applied to Bowed/Plucked Applied to Drums & Cymbals') {
				continue;
			}
			const posMatch = line.match(PLAYING_POSITION_REGEX);
			if (posMatch) {
				const rest = posMatch[2];
				let bowedPlucked;
				let drumsCymbals;
				if (rest.includes('At the Bridge')) {
					bowedPlucked = 'At the Bridge';
					drumsCymbals = rest.replace('At the Bridge', '').trim();
				} else if (rest.includes('At the Nut')) {
					bowedPlucked = 'At the Nut';
					drumsCymbals = rest.replace('At the Nut', '').trim();
				} else if (rest.includes('(Default)')) {
					bowedPlucked = '(Default) Normal Playing Position';
					drumsCymbals = rest.replace('(Default) Normal Playing Position', '').trim();
				} else {
					bowedPlucked = rest;
				}
				playingPositionEntries.push({
					value: posMatch[1],
					bowed_plucked: bowedPlucked,
					drums_cymbals: drumsCymbals
				});
				continue;
			}
			if (line.startsWith('Each instrument') || line.startsWith('Figure ') || line.startsWith('Table ') || line.startsWith('## Page')) {
				inPlayingPosition = false;
			}
		}

		if (line.startsWith('Table 21') && line.includes('Optional Features')) {
			inOptionalFeatures = true;
			continue;
		}
		if (inOptionalFeatures) {
			if (['Size', 'Bitmap', 'Data', 'Feature or', 'Message', 'Supported', 'Description'].includes(line)) {
				continue;
			}
			if (line === '2 bytes') {
				continue;
			}
			const featLine = line.replace(/^2 bytes\s+/, '');
			const featMatch = featLine.match(OPTIONAL_FEATURE_REGEX);
			if (featMatch) {
				optionalFeatures.push({
					bit: featMatch[1],
					controller: featMatch[2],
					description: featMatch[3]
				});
				continue;
			}
			const multiLineFeatMatch = featLine.match(/^(D\d+)\s+(.+)$/);
			if (multiLineFeatMatch) {
				optionalFeatures.push({
					bit: multiLineFeatMatch[1],
					controller: multiLineFeatMatch[2],
					description: ''
				});
				continue;
			}
			if (line.startsWith('D5-D13') || line.startsWith('D5 - D13')) {
				optionalFeatures.push({
					bit: 'D5-D13',
					controller: 'Reserved',
					description: ''
				});
				continue;
			}
			const lastFeature = optionalFeatures[optionalFeatures.length - 1];
			if (lastFeature && lastFeature.controller !== 'Reserved' && !line.startsWith('Figure ') && !line.startsWith('Table ')) {
				if (!lastFeature.description) {
					lastFeature.controller += ' ' + line;
					lastFeature.controller = lastFeature.controller.trim();
					const supportsIdx = lastFeature.controller.indexOf('Supports ');
					if (supportsIdx !== -1) {
						lastFeature.description = lastFeature.controller.substring(supportsIdx);
						lastFeature.controller = lastFeature.controller.substring(0, supportsIdx).trim();
					}
				} else {
					lastFeature.description += ' ' + line;
					lastFeature.description = lastFeature.description.trim();
				}
				continue;
			}
			if (line.startsWith('Figure ') || line.startsWith('Table ') || line.startsWith('## Page')) {
				inOptionalFeatures = false;
			}
		}

		if (line.startsWith('Table 26') && line.includes('Musical Instrument')) {
			inInstrumentTypes = true;
			continue;
		}
		if (inInstrumentTypes) {
			if (line.startsWith('Table 27')) {
				inInstrumentTypes = false;
				continue;
			}
			const instMatch = line.match(INSTRUMENT_TYPE_REGEX);
			if (instMatch && INSTRUMENT_TYPES.includes(instMatch[1])) {
				instrumentTypes.push({
					abbreviation: instMatch[1],
					name: instMatch[2]
				});
				continue;
			}
		}

		const appendixMatch = line.match(/^Table\s+(\d+)\s+Applying\s+(0x[0-9A-Fa-f]+)/);
		if (appendixMatch) {
			finalizeAppendixEntry();
			inAppendixTable = appendixMatch[2];
			continue;
		}
		if (inAppendixTable) {
			if (line === 'Sub' || line === 'Class' || line.includes('Articulation Str Ww Brs')) {
				continue;
			}
			if (line.startsWith('*Note:') || line.match(/^A\.\d+/) || line.startsWith('Table ') || line.match(/^10\s+/)) {
				finalizeAppendixEntry();
				if (line.match(/^A\.\d+/) || line.startsWith('Table ') || line.match(/^10\s+/)) {
					inAppendixTable = null;
				}
				continue;
			}
			const parsed = parseAppendixLine(line);
			if (parsed && parsed.subclass.match(/^0x[0-9A-Fa-f]$/)) {
				finalizeAppendixEntry();
				currentAppendixEntry = {
					subclass: parsed.subclass,
					articulation: parsed.articulation,
					applicability: parsed.applicability
				};
				continue;
			}
			if (currentAppendixEntry) {
				if (line === 'reserved') {
					currentAppendixEntry.articulation = 'reserved';
					finalizeAppendixEntry();
					continue;
				}
				const continuationBullets = line.match(/\u2022/g) || [];
				if (continuationBullets.length > 0) {
					currentAppendixEntry.applicability.push(...continuationBullets);
				}
				currentAppendixEntry.articulation += ' ' + line.replace(/\u2022/g, '').trim();
				currentAppendixEntry.articulation = currentAppendixEntry.articulation.trim();
				continue;
			}
		}
	}

	finalizeSubclassEntry();
	finalizeAppendixEntry();

	const directionEntries = classifications.filter(c => c.table === 'direction');
	const stringAssignmentEntries = classifications.filter(c => c.table === 'string_assignment');
	const classificationEntries = classifications.filter(c => c.table === 'classifications');

	const result = {
		metadata: {
			title: 'Note-On Orchestral Articulation Profile',
			doc_id: 'M2-123-UM',
			protocol: 'midi2',
			source: path.basename(markdownPath),
			version: '1.0',
			date: '2024-04-05'
		},
		version_history: versionHistory,
		conformance_words: {
			relating_to_conformance: conformanceRelating,
			not_relating_to_conformance: conformanceNotRelating
		},
		definitions,
		normative_references: normativeReferences,
		profile_id: profileId,
		note_on: {
			direction: directionEntries.map(d => ({ value: d.value, description: d.description })),
			string_assignment: stringAssignmentEntries.map(s => ({ value: s.value, description: s.description })),
			classifications: classificationEntries
		},
		subclass_tables: subclassTables,
		note_off: {
			attribute_types: noteOffAttributeTypes,
			subclasses: noteOffSubclasses,
			string_assignment: noteOffStringAssignments
		},
		controllers: {
			mute_type_ranges: muteTypeRanges,
			playing_position: playingPositionEntries,
			optional_features: optionalFeatures
		},
		instrument_types: instrumentTypes,
		appendix_tables: appendixTables,
		summary: {
			version_history_count: versionHistory.length,
			conformance_relating_count: conformanceRelating.length,
			conformance_not_relating_count: conformanceNotRelating.length,
			definition_count: definitions.length,
			normative_reference_count: normativeReferences.length,
			profile_id_byte_count: profileId.length,
			classification_count: classificationEntries.length,
			direction_count: directionEntries.length,
			string_assignment_count: stringAssignmentEntries.length,
			subclass_table_count: Object.keys(subclassTables).length,
			subclass_total_count: Object.values(subclassTables).reduce((sum, arr) => sum + arr.length, 0),
			note_off_attribute_type_count: noteOffAttributeTypes.length,
			note_off_subclass_count: noteOffSubclasses.length,
			note_off_string_assignment_count: noteOffStringAssignments.length,
			mute_type_range_count: muteTypeRanges.length,
			playing_position_count: playingPositionEntries.length,
			optional_feature_count: optionalFeatures.length,
			instrument_type_count: instrumentTypes.length,
			appendix_table_count: Object.keys(appendixTables).length,
			appendix_total_count: Object.values(appendixTables).reduce((sum, arr) => sum + arr.length, 0)
		}
	};

	if (outDir) {
		await fs.mkdir(outDir, { recursive: true });
		await fs.writeFile(path.join(outDir, 'note-on-orchestral-articulation-profile.json'), JSON.stringify(result, null, 2), 'utf-8');
	}

	return result;
}
