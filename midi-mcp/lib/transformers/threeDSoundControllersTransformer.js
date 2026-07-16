import fs from 'node:fs/promises';
import path from 'node:path';

/**
 * Regex to match controller section headers.
 * Format: `AZIMUTH ANGLE PARAMETER CONTROLLER`
 */
const CONTROLLER_HEADER_REGEX = /^(.+?)\s+PARAMETER CONTROLLER$/;

/**
 * Regex to match RPN LSB data value line.
 * Format: `Registered Parameter Number LSB Data Value 0 is used to control Azimuth Angle.`
 */
const RPN_LSB_REGEX = /^Registered Parameter Number LSB Data Value (\d+) is used to control (.+)\.$/;

/**
 * Regex to match message format line.
 * Format: `B<n> 64 00 06 <Data MSB> 26 <Data LSB>`
 */
const MESSAGE_FORMAT_REGEX = /^B<n>\s+64\s+([0-9A-Fa-f]{2})\s+06\s+<Data MSB>\s+26\s+<Data LSB>$/;

/**
 * Regex to match parameter table entries.
 * Format: `Min \t<00/00> \t-180.00 degrees`
 * Or with extra tab: `Step \t<00/01> \t~ \t0.02 degrees`
 */
const PARAM_ENTRY_REGEX = /^(Min|Max|Step|Default|Except)\s*\t\s*<([0-9A-Fa-f]{2}\/[0-9A-Fa-f]{2})>\s*\t\s*(.+)$/;

/**
 * Regex to match data byte description lines.
 * Format: `<Data MSB> \tAzimuth Value MSB Contribution`
 */
const DATA_BYTE_DESC_REGEX = /^<(Data MSB|Data LSB)>\s*\t\s*(.+)$/;

/**
 * Regex to match the general parameter format line.
 */
const GENERAL_FORMAT_REGEX = /^B<n>\s+64\s+<Param>\s+06\s+<Data MSB>\s+26\s+<Data LSB>$/;

/**
 * Regex to match technical note section headers.
 * Format: `1/ Controlling the stereo field in 3D:`
 */
const TECH_NOTE_HEADER_REGEX = /^(\d+)\/\s+(.+)$/;

/**
 * Transforms the Three Dimensional Sound Controllers (RP-049) markdown document
 * into a structured JSON object.
 *
 * @param {string} markdownPath - Absolute path to the source markdown file.
 * @param {string} [outDir] - Optional output directory for the JSON file.
 * @returns {Promise<object>} The structured JSON result.
 */
export async function transformThreeDSoundControllers(markdownPath, outDir) {
	const content = await fs.readFile(markdownPath, 'utf-8');
	const lines = content.split('\n');

	let abstract = '';
	let background = '';
	let sourceCommittee = null;
	let generalParameterFormat = null;
	const generalFormatDescriptions = [];

	const controllers = [];
	const technicalNotes = [];

	let currentController = null;
	let currentSection = null;
	let currentTechNote = null;
	let currentTechNoteTitle = null;
	let currentTechNoteDetails = [];

	const finalizeController = () => {
		if (currentController) {
			controllers.push(currentController);
			currentController = null;
		}
	};

	const finalizeTechNote = () => {
		if (currentTechNote) {
			technicalNotes.push({
				note_number: currentTechNote,
				title: currentTechNoteTitle,
				details: currentTechNoteDetails
			});
			currentTechNote = null;
			currentTechNoteTitle = null;
			currentTechNoteDetails = [];
		}
	};

	for (const rawLine of lines) {
		const line = rawLine.trim();
		if (!line) {
			continue;
		}

		// Skip frontmatter, page headers, and boilerplate
		if (line.startsWith('---') || line.startsWith('title:') || line.startsWith('protocol:') || line.startsWith('source:') || line.startsWith('sourceType:') || line.startsWith('pages:') || line.startsWith('sha256:') || line.startsWith('extractedAt:') || line.startsWith('summary:') || line.startsWith('# Three') || line.startsWith('## Page') || line.startsWith('MMA Technical Standards') || line.startsWith('AMEI MIDI Committee') || line.startsWith('Letter of Agreement')) {
			continue;
		}

		// Parse source
		if (line.startsWith('Source:') && !sourceCommittee) {
			sourceCommittee = line.replace(/^Source:\s*/, '').trim();
			continue;
		}

		// Detect sections
		if (line.startsWith('Abstract:')) {
			currentSection = 'abstract';
			const rest = line.replace(/^Abstract:\s*/, '').trim();
			if (rest) {
				abstract = rest;
			}
			continue;
		}
		if (line.startsWith('Background:')) {
			currentSection = 'background';
			const rest = line.replace(/^Background:\s*/, '').trim();
			if (rest) {
				background = rest;
			}
			continue;
		}
		if (line.startsWith('Publication Plan:')) {
			currentSection = null;
			continue;
		}
		if (line.startsWith('INTRODUCTION')) {
			currentSection = 'introduction';
			continue;
		}
		if (line.startsWith('3D SOUND CONTROLLERS DEFINITION')) {
			currentSection = 'definition';
			continue;
		}
		if (line.startsWith('GENERAL 3D SOUND CONTROLLERS PARAMETER FORMAT')) {
			currentSection = 'general_format';
			continue;
		}
		if (line.startsWith('Technical Notes')) {
			finalizeController();
			currentSection = 'tech_notes';
			continue;
		}

		// Parse general parameter format
		if (currentSection === 'general_format') {
			if (GENERAL_FORMAT_REGEX.test(line)) {
				generalParameterFormat = {
					raw: line,
					status_byte: 'B<n>',
					rpn_msb_cc: 64,
					param_placeholder: '<Param>',
					data_entry_msb_cc: 6,
					data_msb_placeholder: '<Data MSB>',
					data_entry_lsb_cc: 26,
					data_lsb_placeholder: '<Data LSB>'
				};
				continue;
			}

			// Parse data byte description lines
			const descMatch = line.match(DATA_BYTE_DESC_REGEX);
			if (descMatch) {
				generalFormatDescriptions.push({
					field: descMatch[1],
					description: descMatch[2].trim()
				});
				continue;
			}

			// Skip template format lines and explanations
			if (line.startsWith('Parameter Descriptions') || line.startsWith('<MSB/LSB>') || line.startsWith('{value}') || line.startsWith('{unit}') || line.startsWith('{s}') || line.startsWith('Positive') || line.startsWith('- \tNegative') || line.startsWith('~ \tApproximate') || line.startsWith("'Min'") || line.startsWith("'Max'") || line.startsWith("'Step'") || line.startsWith("'Default'") || line.startsWith("'Except'") || PARAM_ENTRY_REGEX.test(line)) {
				continue;
			}

			// Accumulate general format explanation text
			if (generalParameterFormat && !line.startsWith('AZIMUTH')) {
				continue;
			}
		}

		// Detect controller headers
		const controllerMatch = line.match(CONTROLLER_HEADER_REGEX);
		if (controllerMatch) {
			finalizeController();
			currentSection = 'controller';
			currentController = {
				name: controllerMatch[1].trim(),
				rpn_lsb: null,
				rpn_lsb_description: null,
				message_format: null,
				data_msb_description: null,
				data_lsb_description: null,
				parameters: [],
				description: []
			};
			continue;
		}

		// Parse controller content
		if (currentSection === 'controller' && currentController) {
			// Parse RPN LSB line
			const rpnMatch = line.match(RPN_LSB_REGEX);
			if (rpnMatch) {
				currentController.rpn_lsb = parseInt(rpnMatch[1], 10);
				currentController.rpn_lsb_description = rpnMatch[2].trim();
				continue;
			}

			// Parse message format
			const formatMatch = line.match(MESSAGE_FORMAT_REGEX);
			if (formatMatch) {
				currentController.message_format = {
					raw: line,
					status_byte: 'B<n>',
					rpn_msb_cc: 64,
					rpn_lsb_hex: formatMatch[1].toUpperCase(),
					data_entry_msb_cc: 6,
					data_entry_lsb_cc: 26
				};
				continue;
			}

			// Parse data byte descriptions
			const dataDescMatch = line.match(DATA_BYTE_DESC_REGEX);
			if (dataDescMatch) {
				if (dataDescMatch[1] === 'Data MSB') {
					currentController.data_msb_description = dataDescMatch[2].trim();
				} else {
					currentController.data_lsb_description = dataDescMatch[2].trim();
				}
				continue;
			}

			// Parse parameter table entries
			const paramMatch = line.match(PARAM_ENTRY_REGEX);
			if (paramMatch) {
				currentController.parameters.push({
					type: paramMatch[1],
					midi_value: paramMatch[2].toUpperCase(),
					real_world_value: paramMatch[3].trim()
				});
				continue;
			}

			// Accumulate description text (non-table, non-format lines)
			if (currentController.parameters.length > 0 || currentController.message_format) {
				if (!line.startsWith('See Technical') && !line.match(/^\d+\/\s/)) {
					currentController.description.push(line);
				}
				continue;
			}
		}

		// Parse technical notes
		if (currentSection === 'tech_notes') {
			const techNoteMatch = line.match(TECH_NOTE_HEADER_REGEX);
			if (techNoteMatch) {
				finalizeTechNote();
				currentTechNote = parseInt(techNoteMatch[1], 10);
				currentTechNoteTitle = techNoteMatch[2].trim();
				currentTechNoteDetails = [];
				continue;
			}

			if (currentTechNote) {
				currentTechNoteDetails.push(line);
				continue;
			}

			// Preamble before first tech note
			if (line.startsWith('The MIDI Pan event') || line.startsWith('The two controllers') || line.startsWith('Here are a few') || line.startsWith('With the default') || line.startsWith('This section describes') || line.startsWith('Based on this') || line.startsWith('The first parameter') || line.startsWith('Here are examples') || line.startsWith('Note that the') || line.startsWith('As a reference') || line.startsWith('One can deduct') || line.startsWith('If the need')) {
				currentTechNoteDetails.push(line);
				continue;
			}
		}

		// Accumulate abstract
		if (currentSection === 'abstract') {
			abstract += (abstract ? ' ' : '') + line;
			continue;
		}

		// Accumulate background
		if (currentSection === 'background') {
			background += (background ? ' ' : '') + line;
			continue;
		}
	}

	finalizeController();
	finalizeTechNote();

	const result = {
		metadata: {
			title: 'Three Dimensional Sound Controllers',
			doc_id: 'RP-049',
			protocol: 'midi1',
			source: path.basename(markdownPath),
			source_committee: sourceCommittee
		},
		abstract: abstract.trim(),
		background: background.trim(),
		general_parameter_format: generalParameterFormat,
		general_format_descriptions: generalFormatDescriptions,
		controllers: controllers,
		technical_notes: technicalNotes,
		summary: {
			controller_count: controllers.length,
			total_parameter_entries: controllers.reduce((sum, c) => sum + c.parameters.length, 0),
			technical_note_count: technicalNotes.length
		}
	};

	if (outDir) {
		await fs.mkdir(outDir, { recursive: true });
		await fs.writeFile(path.join(outDir, 'three-d-sound-controllers.json'), JSON.stringify(result, null, 2), 'utf-8');
	}

	return result;
}
