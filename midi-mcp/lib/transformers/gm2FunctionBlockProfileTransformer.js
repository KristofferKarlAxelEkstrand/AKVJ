import fs from 'node:fs/promises';
import path from 'node:path';

const VERSION_ENTRY_REGEX = /^(\d{4}-\d{2}-\d{2})\s+(.+?)\s+(.+)$/;
const REFERENCE_REGEX = /^\[([A-Z]+[0-9]*)\]\s+(.+)$/;
const DEFINITION_REGEX = /^([A-Z0-9][A-Za-z0-9\s()/.–-]+?):\s+(.+)$/;
const PROFILE_ID_REGEX = /^Byte\s+(\d+)\s+(0x[0-9A-Fa-f]+)\s+\((.+)\)$/;
const TOC_DOT_PATTERN = /\.{3,}/;

const CONFORMANCE_RELATING_WORDS = ['shall', 'should', 'may'];
const CONFORMANCE_NOT_RELATING_WORDS = ['must', 'will', 'can', 'might'];

export async function transformGm2FunctionBlockProfile(markdownPath, outDir) {
	const content = await fs.readFile(markdownPath, 'utf-8');
	const lines = content.split('\n');

	const versionHistory = [];
	const normativeReferences = [];
	const definitions = [];
	const conformanceRelating = [];
	const conformanceNotRelating = [];
	const profileId = [];

	let inVersionHistory = false;
	let inNormativeReferences = false;
	let inDefinitions = false;
	let inConformanceRelating = false;
	let inConformanceNotRelating = false;
	let inProfileId = false;

	for (let i = 0; i < lines.length; i++) {
		const line = lines[i].trim();

		if (!line || line.startsWith('## Page') || line.startsWith('# General MIDI 2')) {
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

		if (line === '1.1.1 Normative References') {
			inNormativeReferences = true;
			continue;
		}
		if (inNormativeReferences) {
			if (line.startsWith('1.2 ') || line.startsWith('## Page')) {
				inNormativeReferences = false;
			} else {
				const refMatch = line.match(REFERENCE_REGEX);
				if (refMatch) {
					const descriptionLines = [refMatch[2]];
					for (let j = i + 1; j < lines.length; j++) {
						const nextLine = lines[j].trim();
						if (!nextLine || nextLine.match(/^\[[A-Z]+/) || nextLine.startsWith('## Page') || nextLine.startsWith('1.2 ')) {
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
					if (!nextLine || CONFORMANCE_NOT_RELATING_WORDS.includes(nextLine.split(/\s/)[0]) || nextLine.startsWith('## Page') || nextLine.startsWith('Table ') || nextLine.startsWith('2 Introduction')) {
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
			if (line.startsWith('## Page') || line.startsWith('2 Introduction')) {
				inConformanceNotRelating = false;
			}
		}

		if (line.startsWith('Table 4') && line.includes('GM2 Profile Id') && !line.match(TOC_DOT_PATTERN)) {
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
			if (line.startsWith('## Page') || line.startsWith('3.5')) {
				inProfileId = false;
			}
		}
	}

	const result = {
		metadata: {
			title: 'General MIDI 2 Function Block Profile',
			doc_id: 'M2-118-UM',
			protocol: 'midi2',
			version: '1.0.0',
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
		summary: {
			version_history_count: versionHistory.length,
			normative_reference_count: normativeReferences.length,
			definition_count: definitions.length,
			conformance_relating_count: conformanceRelating.length,
			conformance_not_relating_count: conformanceNotRelating.length,
			profile_id_byte_count: profileId.length
		}
	};

	if (outDir) {
		const outPath = path.join(outDir, 'gm2-function-block-profile.json');
		await fs.mkdir(outDir, { recursive: true });
		await fs.writeFile(outPath, JSON.stringify(result, null, 2), 'utf-8');
	}

	return result;
}
