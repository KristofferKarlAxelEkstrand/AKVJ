import fs from 'node:fs/promises';
import path from 'node:path';

/**
 * Regex to match function description entries.
 * Format: `MIDI channels \tThe range of MIDI channels...`
 */
const FUNCTION_DESC_REGEX = /^(.+?)\t(.+)$/;

/**
 * Regex to match chart template section headers.
 * Format: `1. Basic Information`
 */
const CHART_SECTION_REGEX = /^(\d+)\.\s+(.+)$/;

/**
 * Regex to match control number table entries.
 * Format: `0 \tBank Select (MSB)`
 */
const CONTROL_NUMBER_REGEX = /^(\d+)\s*\t(.+)$/;

/**
 * Regex to match control number table header.
 */
const CONTROL_TABLE_HEADER_REGEX = /^Control #\s+Function\s+Transmitted/i;

/**
 * Transforms the MIDI Implementation Chart V2 (RP-028) markdown document
 * into a structured JSON object.
 *
 * @param {string} markdownPath - Absolute path to the source markdown file.
 * @param {string} [outDir] - Optional output directory for the JSON file.
 * @returns {Promise<object>} The structured JSON result.
 */
export async function transformMidiImplementationChartV2(markdownPath, outDir) {
	const content = await fs.readFile(markdownPath, 'utf-8');
	const lines = content.split('\n');

	const functionDescriptions = [];
	const chartTemplate = { sections: [] };
	const controlNumberTables = [];

	let currentChartSection = null;
	let currentControlTable = null;
	let currentFunctionDesc = null;

	let inFunctionDescriptions = false;
	let inChartTemplate = false;
	let inControlNumbers = false;

	const finalizeFunctionDesc = () => {
		if (currentFunctionDesc) {
			functionDescriptions.push(currentFunctionDesc);
			currentFunctionDesc = null;
		}
	};

	const finalizeChartSection = () => {
		if (currentChartSection) {
			chartTemplate.sections.push(currentChartSection);
			currentChartSection = null;
		}
	};

	const finalizeControlTable = () => {
		if (currentControlTable) {
			controlNumberTables.push(currentControlTable);
			currentControlTable = null;
		}
	};

	for (let i = 0; i < lines.length; i++) {
		const rawLine = lines[i];
		const line = rawLine.trim();
		if (!line) {
			continue;
		}

		// Skip frontmatter, page headers, and boilerplate
		if (line.startsWith('---') || line.startsWith('title:') || line.startsWith('protocol:') || line.startsWith('source:') || line.startsWith('sourceType:') || line.startsWith('pages:') || line.startsWith('sha256:') || line.startsWith('extractedAt:') || line.startsWith('summary:') || line.startsWith('# 1.') || line.startsWith('## Page') || line.startsWith('IMPORTANT:') || line.startsWith('MMA/AMEI RP-028') || line.startsWith('www.midi.org') || line.startsWith('MIDI Implementation Chart V 2.0') || line.startsWith('Manufacturer:') || line.startsWith('Transmit/Export')) {
			continue;
		}

		// Detect function descriptions section
		if (line.startsWith('3.2.1. Basic Information') || line.startsWith('3.2.2. MIDI Timing') || line.startsWith('3.2.3. Extensions')) {
			inFunctionDescriptions = true;
			inChartTemplate = false;
			inControlNumbers = false;
			finalizeFunctionDesc();
			continue;
		}

		// Detect chart template start
		if (line.startsWith('MIDI Implementation Chart v. 2.0 (Page 1')) {
			inFunctionDescriptions = false;
			inChartTemplate = true;
			inControlNumbers = false;
			finalizeFunctionDesc();
			continue;
		}

		// Detect control number tables
		if (line.startsWith('MIDI Implementation Chart v 2.0 Control Number Information')) {
			inFunctionDescriptions = false;
			inChartTemplate = false;
			inControlNumbers = true;
			finalizeChartSection();
			finalizeControlTable();
			currentControlTable = { page: line, entries: [] };
			continue;
		}

		// Detect control table header
		if (CONTROL_TABLE_HEADER_REGEX.test(line)) {
			continue;
		}

		// Detect end of structured sections
		if (line.startsWith('4. Pages 2 & 3') || line.startsWith('4.1. General') || line.startsWith('4.2. Functions')) {
			inFunctionDescriptions = false;
			inChartTemplate = false;
			inControlNumbers = false;
			finalizeFunctionDesc();
			finalizeChartSection();
			finalizeControlTable();
			continue;
		}

		// Parse function descriptions
		if (inFunctionDescriptions) {
			const descMatch = line.match(FUNCTION_DESC_REGEX);
			if (descMatch && !line.startsWith('3.2.')) {
				finalizeFunctionDesc();
				currentFunctionDesc = {
					function_name: descMatch[1].trim(),
					description: descMatch[2].trim()
				};
				continue;
			}

			// Continuation lines
			if (currentFunctionDesc && !line.startsWith('3.2.') && !line.startsWith('##')) {
				currentFunctionDesc.description += ' ' + line;
				continue;
			}
		}

		// Parse chart template
		if (inChartTemplate) {
			// Detect chart section headers
			const sectionMatch = line.match(CHART_SECTION_REGEX);
			if (sectionMatch && !line.startsWith('3.2.')) {
				finalizeChartSection();
				currentChartSection = {
					section_number: parseInt(sectionMatch[1], 10),
					section_title: sectionMatch[2].trim(),
					items: []
				};
				continue;
			}

			// Accumulate items
			if (currentChartSection) {
				currentChartSection.items.push(line);
				continue;
			}

			// Items before a section header (shouldn't happen but handle gracefully)
			if (!currentChartSection && !line.startsWith('MIDI Implementation')) {
				continue;
			}
		}

		// Parse control number tables
		if (inControlNumbers) {
			const controlMatch = line.match(CONTROL_NUMBER_REGEX);
			if (controlMatch && currentControlTable) {
				currentControlTable.entries.push({
					control_number: parseInt(controlMatch[1], 10),
					function: controlMatch[2].trim()
				});
				continue;
			}
		}
	}

	finalizeFunctionDesc();
	finalizeChartSection();
	finalizeControlTable();

	const result = {
		metadata: {
			title: 'MIDI Implementation Chart V2',
			doc_id: 'RP-028',
			protocol: 'midi1',
			source: path.basename(markdownPath)
		},
		function_descriptions: functionDescriptions,
		chart_template: chartTemplate,
		control_number_tables: controlNumberTables,
		summary: {
			function_description_count: functionDescriptions.length,
			chart_section_count: chartTemplate.sections.length,
			chart_item_count: chartTemplate.sections.reduce((sum, s) => sum + s.items.length, 0),
			control_number_table_count: controlNumberTables.length,
			control_number_entry_count: controlNumberTables.reduce((sum, t) => sum + t.entries.length, 0)
		}
	};

	if (outDir) {
		await fs.mkdir(outDir, { recursive: true });
		await fs.writeFile(path.join(outDir, 'midi-implementation-chart-v2.json'), JSON.stringify(result, null, 2), 'utf-8');
	}

	return result;
}
