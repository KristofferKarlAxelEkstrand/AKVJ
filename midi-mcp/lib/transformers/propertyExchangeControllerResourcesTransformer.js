import fs from 'node:fs/promises';
import path from 'node:path';

/**
 * Regex to match definition entries.
 * Format: `Active Controller Message: Any of the Controller Messages...`
 */
const DEFINITION_REGEX = /^([A-Z][A-Za-z0-9\s-]+?):\s+(.+)$/;

/**
 * Regex to match normative reference entries.
 * Format: `[COMM01] \tCommonMark Spec, Version 0.28, ...`
 */
const REFERENCE_REGEX = /^\[([A-Z]+[0-9]*)\]\s*\t(.+)$/;

/**
 * Regex to match version history entries.
 * Format: `June 15, 2023 \t1.0 \tInitial Version`
 */
const VERSION_ENTRY_REGEX = /^(.+?)\s*\t(.+?)\s*\t(.+)$/;

/**
 * Regex to match conformance word entries (relating).
 * Format: `shall \tStatements of requirement`
 */
const CONFORMANCE_RELATING_REGEX = /^(\w+)\s*\t(.+)$/;

/**
 * Regex to match conformance word entries (not relating).
 * Format: `must \tStatements of unavoidability \tDescribes an action...`
 */
const CONFORMANCE_NOT_RELATING_REGEX = /^(\w+)\s*\t(.+?)\s*\t(.+)$/;

/**
 * Regex to match Controller Message Data Object property entries.
 * Format: `title \tstring, required \tHuman-readable name...`
 */
const PROPERTY_ENTRY_REGEX = /^(\w+)\s*\t(.+?)\s*\t(.+)$/;

/**
 * Regex to match property entries with only key and type (description on next lines).
 * Format: `description \tstring, commonmark`
 */
const PROPERTY_KEY_TYPE_REGEX = /^(\w+)\s*\t(.+)$/;

/**
 * Regex to match resource section headers.
 * Format: `2 	Resource: AllCtrlList`
 */
const RESOURCE_HEADER_REGEX = /^\d+\s+Resource:\s+(.+)$/;

/**
 * Transforms the MIDI-CI Property Exchange Controller Resources (M2-117-UM)
 * markdown document into a structured JSON object.
 *
 * @param {string} markdownPath - Absolute path to the source markdown file.
 * @param {string} [outDir] - Optional output directory for the JSON file.
 * @returns {Promise<object>} The structured JSON result.
 */
export async function transformPropertyExchangeControllerResources(markdownPath, outDir) {
	const content = await fs.readFile(markdownPath, 'utf-8');
	const lines = content.split('\n');

	const versionHistory = [];
	const conformanceWordsRelating = [];
	const conformanceWordsNotRelating = [];
	const definitions = [];
	const normativeReferences = [];
	const allCtrlListProperties = [];
	const chCtrlListProperties = [];
	const ctrlMapListProperties = [];
	const jsonExamples = [];
	const resourceListIntegrations = [];

	let currentSection = null;
	let inVersionHistory = false;
	let inConformanceRelating = false;
	let inConformanceNotRelating = false;
	let inDefinitions = false;
	let inNormativeReferences = false;
	let inPropertyTable = null;
	let currentPropertyEntry = null;
	let inJsonExample = false;
	let currentJsonExample = null;
	let inResourceListIntegration = false;

	const finalizePropertyEntry = () => {
		if (currentPropertyEntry && inPropertyTable) {
			if (inPropertyTable === 'allCtrlList') {
				allCtrlListProperties.push(currentPropertyEntry);
			} else if (inPropertyTable === 'chCtrlList') {
				chCtrlListProperties.push(currentPropertyEntry);
			} else if (inPropertyTable === 'ctrlMapList') {
				ctrlMapListProperties.push(currentPropertyEntry);
			}
			currentPropertyEntry = null;
		}
	};

	for (let i = 0; i < lines.length; i++) {
		const rawLine = lines[i];
		const line = rawLine.trim();
		if (!line) {
			continue;
		}

		// Skip frontmatter, page headers, boilerplate
		if (line.startsWith('---') || line.startsWith('title:') || line.startsWith('docId:') || line.startsWith('version:') || line.startsWith('protocol:') || line.startsWith('source:') || line.startsWith('sourceType:') || line.startsWith('pages:') || line.startsWith('sha256:') || line.startsWith('extractedAt:') || line.startsWith('summary:') || line.startsWith('# Property') || line.startsWith('## Page') || line.startsWith('MIDI-CI Property') || line.startsWith('MIDI Association Document') || line.startsWith('Document Version') || line.startsWith('Draft Date') || line.startsWith('Published') || line.startsWith('Developed and') || line.startsWith('The MIDI Association') || line.startsWith('and') || line.startsWith('PREFACE') || line.startsWith('©') || line.startsWith('ALL RIGHTS') || line.startsWith('NO PART') || line.startsWith('FORM OR BY') || line.startsWith('RETRIEVAL SYSTEMS') || line.startsWith('WITHOUT PERMISSION') || line.startsWith('http://') || line.startsWith('Figures') || line.startsWith('Figure ') || line.startsWith('Tables') || line.startsWith('Table 1 ') || line.startsWith('Contents') || line.startsWith('Version History ..') || line.startsWith('Contents ..') || line.startsWith('Figures ..') || line.startsWith('Tables ..')) {
			continue;
		}

		// Skip TOC entries (lines with dots and page numbers)
		if (line.match(/^\d/) && line.includes('....')) {
			continue;
		}

		// Skip bullet points in TOC-like sections
		if (line.startsWith('•') && currentSection !== 'definitions' && currentSection !== 'json_example') {
			continue;
		}

		// Detect Version History table
		if (line.startsWith('Publication Date') && line.includes('Version') && line.includes('Changes')) {
			inVersionHistory = true;
			continue;
		}

		if (inVersionHistory) {
			const versionMatch = line.match(VERSION_ENTRY_REGEX);
			if (versionMatch) {
				versionHistory.push({
					publication_date: versionMatch[1].trim(),
					version: versionMatch[2].trim(),
					changes: versionMatch[3].trim()
				});
				continue;
			}
			if (!line.startsWith('Publication Date')) {
				inVersionHistory = false;
			}
		}

		// Detect Conformance Words (relating) - Table 2
		if (line.startsWith('Table 2') && line.includes('Words Relating')) {
			inConformanceRelating = true;
			inConformanceNotRelating = false;
			continue;
		}

		// Detect Conformance Words (not relating) - Table 3
		if (line.startsWith('Table 3') && line.includes('Words Not Relating')) {
			inConformanceNotRelating = true;
			inConformanceRelating = false;
			continue;
		}

		// Skip the duplicate header lines
		if (line.startsWith('Word') && line.includes('Reserved For') && line.includes('Relation to')) {
			continue;
		}

		if (inConformanceRelating) {
			const confMatch = line.match(CONFORMANCE_RELATING_REGEX);
			if (confMatch && ['shall', 'should', 'may'].includes(confMatch[1])) {
				// Collect continuation lines for the conformance description
				const descriptionLines = [confMatch[2]];
				// Look ahead for continuation lines (non-tab lines)
				for (let j = i + 1; j < lines.length; j++) {
					const nextLine = lines[j].trim();
					if (!nextLine || nextLine.match(/^\w+\s*\t/) || nextLine.startsWith('Word') || nextLine.startsWith('Table') || nextLine.startsWith('By contrast')) {
						break;
					}
					descriptionLines.push(nextLine);
				}
				conformanceWordsRelating.push({
					word: confMatch[1],
					reserved_for: confMatch[2].trim(),
					description: descriptionLines.slice(1).join(' ')
				});
				continue;
			}
			if (line.startsWith('By contrast') || line.startsWith('Table ')) {
				inConformanceRelating = false;
			}
		}

		if (inConformanceNotRelating) {
			const confMatch = line.match(CONFORMANCE_NOT_RELATING_REGEX);
			if (confMatch && ['must', 'will', 'can', 'might'].includes(confMatch[1])) {
				// Collect continuation lines
				const descriptionLines = [confMatch[3]];
				for (let j = i + 1; j < lines.length; j++) {
					const nextLine = lines[j].trim();
					if (!nextLine || nextLine.match(/^\w+\s*\t/) || nextLine.startsWith('Word') || nextLine.startsWith('Table') || nextLine.startsWith('## Page')) {
						break;
					}
					descriptionLines.push(nextLine);
				}
				conformanceWordsNotRelating.push({
					word: confMatch[1],
					reserved_for: confMatch[2].trim(),
					description: descriptionLines.join(' ')
				});
				continue;
			}
			if (line.startsWith('## Page') || line.startsWith('1.5')) {
				inConformanceNotRelating = false;
			}
		}

		// Detect Definitions section
		if (line.match(/^1\.4\.1\s+Definitions/) || line === '1.4.1 Definitions') {
			inDefinitions = true;
			currentSection = 'definitions';
			continue;
		}

		if (inDefinitions) {
			// End definitions at next section
			if (line.match(/^1\.4\.2/) || line.match(/^1\.5/) || line.match(/^2\s/)) {
				inDefinitions = false;
				currentSection = null;
			} else {
				const defMatch = line.match(DEFINITION_REGEX);
				if (defMatch && !line.startsWith('•') && !line.startsWith('MIDI 1.0') && !line.startsWith('MIDI 2.0')) {
					// Collect continuation lines
					const descriptionLines = [defMatch[2]];
					for (let j = i + 1; j < lines.length; j++) {
						const nextLine = lines[j].trim();
						if (!nextLine || nextLine.match(/^[A-Z][A-Za-z0-9\s-]+?:\s/) || nextLine.startsWith('## Page') || nextLine.match(/^1\.4\.2/)) {
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

		// Detect Normative References
		if (line.match(/^1\.3\.1\s+Normative/) || line === '1.3.1 Normative References') {
			inNormativeReferences = true;
			currentSection = 'normative_refs';
			continue;
		}

		if (inNormativeReferences) {
			if (line.match(/^1\.3\.2/) || line.match(/^1\.4/)) {
				inNormativeReferences = false;
				currentSection = null;
			} else {
				const refMatch = line.match(REFERENCE_REGEX);
				if (refMatch) {
					// Collect continuation lines
					const descriptionLines = [refMatch[2]];
					for (let j = i + 1; j < lines.length; j++) {
						const nextLine = lines[j].trim();
						if (!nextLine || nextLine.match(/^\[[A-Z]+/) || nextLine.startsWith('## Page') || nextLine.match(/^1\.3\.2/)) {
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

		// Detect Controller Message Data Object property tables
		// AllCtrlList: Table 5, ChCtrlList: Table 11, CtrlMapList: Table 19
		if (line.includes('Controller Message Data Object') && line.startsWith('Table ')) {
			if (line.startsWith('Table 11')) {
				inPropertyTable = 'chCtrlList';
			} else {
				inPropertyTable = 'allCtrlList';
			}
			currentPropertyEntry = null;
			continue;
		}
		if (line.includes('Controller Map Data Object') && line.startsWith('Table ')) {
			inPropertyTable = 'ctrlMapList';
			currentPropertyEntry = null;
			continue;
		}

		// Parse property table entries
		if (inPropertyTable && line.startsWith('Property Key') && line.includes('Property Value Type')) {
			continue;
		}

		if (inPropertyTable) {
			// Check for end of property table
			if (line.startsWith('Table ') || line.match(/^\d+\.\d+/) || line.match(/^\*\s/)) {
				finalizePropertyEntry();
				if (line.includes('Controller Message Data Object') || line.includes('Controller Map Data Object')) {
					// Next property table
					if (line.includes('Table 11')) {
						inPropertyTable = 'chCtrlList';
					} else if (line.includes('Controller Map Data Object')) {
						inPropertyTable = 'ctrlMapList';
					}
					continue;
				}
				inPropertyTable = null;
				// Don't continue - let the line be processed by other sections
			}

			if (inPropertyTable) {
				// Try to match property entry with all 3 columns
				const propMatch = line.match(PROPERTY_ENTRY_REGEX);
				if (propMatch && !line.startsWith('Table ') && !line.startsWith('Property Key')) {
					finalizePropertyEntry();
					currentPropertyEntry = {
						property_key: propMatch[1].trim(),
						property_value_type: propMatch[2].trim(),
						description: propMatch[3].trim()
					};
					continue;
				}

				// Try to match property with only key and type (description on next lines)
				const propKeyTypeMatch = line.match(PROPERTY_KEY_TYPE_REGEX);
				if (propKeyTypeMatch && !line.startsWith('Table ') && !line.startsWith('Property Key') && !line.startsWith('•')) {
					// Check if this looks like a property key (lowercase word)
					if (propKeyTypeMatch[1].match(/^[a-z]/) || propKeyTypeMatch[1] === 'Title' || propKeyTypeMatch[1] === 'Priority' || propKeyTypeMatch[1] === 'Default' || propKeyTypeMatch[1] === 'Transmit') {
						finalizePropertyEntry();
						// Collect description from continuation lines
						const descriptionLines = [];
						for (let j = i + 1; j < lines.length; j++) {
							const nextLine = lines[j].trim();
							if (!nextLine || nextLine.match(/^[A-Z][a-z]+\s*\t/) || nextLine.match(/^[a-z]+\s*\t/) || nextLine.startsWith('Table ') || nextLine.startsWith('Property Key') || nextLine.startsWith('## Page') || nextLine.startsWith('•') || nextLine.match(/^\*\s/)) {
								break;
							}
							descriptionLines.push(nextLine);
						}
						currentPropertyEntry = {
							property_key: propKeyTypeMatch[1].trim(),
							property_value_type: propKeyTypeMatch[2].trim(),
							description: descriptionLines.join(' ')
						};
						continue;
					}
				}

				// Continuation lines for current entry's description
				if (currentPropertyEntry && !line.startsWith('Table ') && !line.startsWith('Property Key') && !line.startsWith('•') && !line.match(/^[a-z]+\s*\t/) && !line.match(/^[A-Z][a-z]+\s*\t/)) {
					currentPropertyEntry.description += ' ' + line;
					continue;
				}
			}
		}

		// Detect ResourceList Integration entries (before JSON handler to avoid conflicts)
		if (line.match(/^\d+\.\d+\s+ResourceList Integration/)) {
			// Finalize any pending JSON example
			if (currentJsonExample) {
				jsonExamples.push(currentJsonExample);
				currentJsonExample = null;
				inJsonExample = false;
			}
			inResourceListIntegration = true;
			currentSection = 'resourceList';
			continue;
		}

		if (inResourceListIntegration) {
			// Skip Table caption lines
			if (line.startsWith('Table ') && line.includes('ResourceList')) {
				continue;
			}
			if (line.startsWith('Property Data') && line.includes('[')) {
				const jsonData = line.replace(/^Property Data\s*/, '').trim();
				if (jsonData && jsonData !== 'None' && jsonData !== 'none') {
					resourceListIntegrations.push({
						context: currentSection,
						property_data: [jsonData]
					});
				}
				continue;
			}
			if (line.startsWith('{') || line.startsWith('}') || line.startsWith('[') || line.startsWith(']') || line.startsWith('"')) {
				const lastEntry = resourceListIntegrations[resourceListIntegrations.length - 1];
				if (lastEntry) {
					lastEntry.property_data.push(line);
				}
				continue;
			}
			if (line.match(/^\d+\.\d+/) || line.match(/^\d+\s+Resource/) || line.match(/^\d+\s+Integration/)) {
				inResourceListIntegration = false;
				currentSection = null;
			}
		}

		// Detect JSON examples (Header Data / Property Data tables)
		if ((line.startsWith('Header Data') || line.startsWith('Property Data')) && (line.includes('{') || line.includes('['))) {
			if (!inJsonExample) {
				inJsonExample = true;
				currentJsonExample = {
					header_data: null,
					property_data: [],
					context: currentSection || ''
				};
			}
			if (line.startsWith('Header Data')) {
				currentJsonExample.header_data = line.replace(/^Header Data\s*/, '').trim();
			} else if (line.startsWith('Property Data')) {
				const jsonData = line.replace(/^Property Data\s*/, '').trim();
				if (jsonData && jsonData !== 'None' && jsonData !== 'none') {
					currentJsonExample.property_data.push(jsonData);
				}
			}
			continue;
		}

		if (inJsonExample && currentJsonExample) {
			// Collect JSON continuation lines
			if (line.startsWith('{') || line.startsWith('}') || line.startsWith('[') || line.startsWith(']') || line.startsWith('"') || line.match(/^[[{}\]"]/)) {
				currentJsonExample.property_data.push(line);
				continue;
			}
			// End of JSON example
			if (line.startsWith('Table ') || line.match(/^\d+\.\d+/) || line.match(/^\d+\s+Resource/)) {
				jsonExamples.push(currentJsonExample);
				currentJsonExample = null;
				inJsonExample = false;
			}
		}

		// Track current section for context
		const resourceMatch = line.match(RESOURCE_HEADER_REGEX);
		if (resourceMatch) {
			currentSection = resourceMatch[1].trim();
			continue;
		}

		if (line.match(/^\d+\.\d+\s+/)) {
			currentSection = line.replace(/^\d+\.\d+\s+/, '').trim();
		}
	}

	// Finalize any pending entries
	finalizePropertyEntry();
	if (currentJsonExample) {
		jsonExamples.push(currentJsonExample);
	}

	const result = {
		metadata: {
			title: 'Property Exchange Controller Resources',
			doc_id: 'M2-117-UM',
			protocol: 'midi2',
			source: path.basename(markdownPath),
			version: '1.0',
			date: 'June 15, 2023'
		},
		version_history: versionHistory,
		conformance_words: {
			relating_to_conformance: conformanceWordsRelating,
			not_relating_to_conformance: conformanceWordsNotRelating
		},
		definitions,
		normative_references: normativeReferences,
		resources: {
			allCtrlList: {
				controller_message_properties: allCtrlListProperties
			},
			chCtrlList: {
				controller_message_properties: chCtrlListProperties
			},
			ctrlMapList: {
				controller_map_properties: ctrlMapListProperties
			}
		},
		json_examples: jsonExamples,
		resource_list_integrations: resourceListIntegrations,
		summary: {
			version_history_count: versionHistory.length,
			conformance_relating_count: conformanceWordsRelating.length,
			conformance_not_relating_count: conformanceWordsNotRelating.length,
			definition_count: definitions.length,
			normative_reference_count: normativeReferences.length,
			all_ctrl_list_property_count: allCtrlListProperties.length,
			ch_ctrl_list_property_count: chCtrlListProperties.length,
			ctrl_map_list_property_count: ctrlMapListProperties.length,
			json_example_count: jsonExamples.length,
			resource_list_integration_count: resourceListIntegrations.length
		}
	};

	if (outDir) {
		await fs.mkdir(outDir, { recursive: true });
		await fs.writeFile(path.join(outDir, 'property-exchange-controller-resources.json'), JSON.stringify(result, null, 2), 'utf-8');
	}

	return result;
}
