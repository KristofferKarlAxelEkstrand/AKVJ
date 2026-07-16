import fs from 'node:fs/promises';
import path from 'node:path';

/**
 * Regex to match control source lines in the sub-ID#2 table.
 * Format: `01 Channel Pressure (Aftertouch)`
 */
const CONTROL_SOURCE_REGEX = /^([0-9A-Fa-f]{2})\s+(.+)$/;

/**
 * Regex to match controlled parameter lines.
 * Format: `00 Pitch Control defined by R/P`
 * Also matches the reserved range line: `06 – 7f are reserved for future definition by the MMA/AMEI.`
 */
const CONTROLLED_PARAM_REGEX = /^([0-9A-Fa-f]{2})\s+(.+)$/;

/**
 * Regex to match message format lines starting with F0.
 * Format: `F0 7F <device ID> 09 01/02 0n [pp rr] ... F7`
 */
const MESSAGE_FORMAT_REGEX = /^F0\s+7F\s+.+/;

/**
 * Regex to match example field lines.
 * Format: `7F device ID (7F = all devices)` or `09 sub-ID#1 "Controller Destination Setting"`
 */
const EXAMPLE_FIELD_REGEX = /^([0-9A-Fa-f]{2})\s+(.+)$/;

/**
 * Transforms the CA-022 Controller Destination Setting markdown document
 * into a structured JSON object.
 *
 * The document contains:
 * - 3 control sources (sub-ID#2 values: 01, 02, 03)
 * - 2 message formats (Channel Pressure/Polyphonic Key Pressure, Control Change)
 * - 6 controlled parameters (00-05) plus a reserved range (06-7F)
 * - 1 SysEx example with 3 destination/range pairs
 *
 * @param {string} markdownPath - Absolute path to the source markdown file.
 * @param {string} [outDir] - Optional output directory for the JSON file.
 * @returns {Promise<object>} The structured JSON result.
 */
export async function transformCa22(markdownPath, outDir) {
	const content = await fs.readFile(markdownPath, 'utf-8');
	const lines = content.split('\n').map(l => l.trim());

	const controlSources = [];
	const messageFormats = [];
	const controlledParameters = [];
	const exampleFields = [];

	let inControlSources = false;
	let inControlledParams = false;
	let inExample = false;

	for (let i = 0; i < lines.length; i++) {
		const line = lines[i];

		if (!line) {
			continue;
		}

		// Detect control source section
		if (line === 'sub-ID#2 control source') {
			inControlSources = true;
			inControlledParams = false;
			inExample = false;
			continue;
		}

		// Detect controlled parameters section
		if (line === 'Controlled Parameters and Ranges:') {
			inControlSources = false;
			inControlledParams = true;
			inExample = false;
			continue;
		}

		// Detect example section
		if (line === 'Example:' || line.startsWith('This example follows the GM 2')) {
			inControlSources = false;
			inControlledParams = false;
			inExample = true;
			continue;
		}

		// Skip separator lines
		if (line.startsWith('---')) {
			continue;
		}

		// Parse control sources
		if (inControlSources) {
			const match = line.match(CONTROL_SOURCE_REGEX);
			if (match && !line.startsWith('sub-ID#2') && !line.includes('Confirmation')) {
				controlSources.push({
					sub_id_2: match[1].toUpperCase(),
					name: match[2].trim()
				});
			}
			// Stop after hitting the "The complete message" line
			if (line.startsWith('The complete message')) {
				inControlSources = false;
			}
			continue;
		}

		// Parse message formats - only capture lines that look like actual message templates
		// (must contain < or [ brackets, not just field description lines)
		if (line.match(MESSAGE_FORMAT_REGEX) && (line.includes('<') || line.includes('['))) {
			const formatLines = [line];
			// Collect following field description lines until F7 or blank
			for (let j = i + 1; j < lines.length; j++) {
				const nextLine = lines[j].trim();
				if (!nextLine || nextLine === 'F7 EOX' || nextLine.startsWith('Control Change:') || nextLine.startsWith('## Page')) {
					if (nextLine === 'F7 EOX') {
						formatLines.push('F7 EOX');
					}
					break;
				}
				formatLines.push(nextLine);
			}
			messageFormats.push({
				message: line,
				fields: formatLines.slice(1)
			});
			continue;
		}

		// Parse controlled parameters
		if (inControlledParams) {
			// Check for reserved range line
			if (line.includes('are reserved for future definition')) {
				controlledParameters.push({
					range_start: '06',
					range_end: '7F',
					name: 'reserved for future definition by the MMA/AMEI',
					reserved: true
				});
				inControlledParams = false;
				continue;
			}
			const match = line.match(CONTROLLED_PARAM_REGEX);
			if (match && !line.startsWith('controlled parameter') && !line.startsWith('Additional') && !line.startsWith('Manufacturers') && !line.startsWith('Response to')) {
				controlledParameters.push({
					code: match[1].toUpperCase(),
					name: match[2].replace(/\s+defined by R\/P$/, '').trim(),
					range_definition: 'R/P'
				});
			}
			// Stop at non-parameter lines
			if (line.startsWith('Additional') || line.startsWith('Manufacturers') || line.startsWith('Response to')) {
				inControlledParams = false;
			}
			continue;
		}

		// Parse example fields
		if (inExample) {
			if (line === 'F7 EOX') {
				exampleFields.push({ hex: 'F7', description: 'EOX' });
				inExample = false;
				continue;
			}
			if (line.startsWith('F0 7F')) {
				exampleFields.push({
					hex: 'F0 7F',
					description: 'Universal Real Time SysEx header'
				});
				continue;
			}
			const match = line.match(EXAMPLE_FIELD_REGEX);
			if (match && !line.includes('Confirmation')) {
				exampleFields.push({
					hex: match[1].toUpperCase(),
					description: match[2].trim()
				});
			}
			continue;
		}
	}

	const result = {
		metadata: {
			title: 'Controller Destination Setting',
			doc_id: 'CA-022',
			version: '1.0.0',
			source: path.basename(markdownPath)
		},
		control_sources: controlSources,
		message_formats: messageFormats,
		controlled_parameters: controlledParameters,
		example: {
			fields: exampleFields
		},
		summary: {
			control_source_count: controlSources.length,
			message_format_count: messageFormats.length,
			controlled_parameter_count: controlledParameters.length,
			example_field_count: exampleFields.length
		}
	};

	if (outDir) {
		await fs.mkdir(outDir, { recursive: true });
		await fs.writeFile(path.join(outDir, 'ca22-controller-destination.json'), JSON.stringify(result, null, 2), 'utf-8');
	}

	return result;
}
