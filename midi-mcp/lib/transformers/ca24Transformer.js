import fs from 'node:fs/promises';
import path from 'node:path';

/**
 * Regex to match byte field definition lines.
 * Format: `sw Slot Path Length.` or `pp Parameter ID, MSB first.`
 */
const BYTE_FIELD_REGEX = /^([a-z]{2})\s+(.+)$/;

/**
 * Regex to match example field description lines.
 * Format: `02 Slot Path Length = 2` or `vl Value LSB for the parameter`
 */
const EXAMPLE_FIELD_REGEX = /^([0-9A-Fa-f]{2}|[a-z]{2})\s+(.+)$/;

/**
 * Regex to match reverb type lines.
 * Format: `0: Small Room A small size room with a length of 5m or so.`
 */
const REVERB_TYPE_REGEX = /^(\d+):\s+(.+)$/;

/**
 * Regex to match reverb time default lines.
 * Format: `0 44 (1.1s)`
 */
const REVERB_TIME_REGEX = /^(\d+)\s+(\d+)\s+\((.+)\)$/;

/**
 * Regex to match formula lines.
 * Format: `mr = val * 0.122` or `val = ln(rt) / 0.025 + 40`
 */
const FORMULA_REGEX = /^([a-z]{2,3})\s*=\s*(.+)$/;

/**
 * Valid byte field codes in the message format template.
 */
const VALID_BYTE_FIELD_CODES = new Set(['sw', 'pw', 'vw', 'sh', 'sl', 'pp', 'vv']);

/**
 * Transforms the CA-024 Global Parameter Control markdown document
 * into a structured JSON object.
 *
 * @param {string} markdownPath - Absolute path to the source markdown file.
 * @param {string} [outDir] - Optional output directory for the JSON file.
 * @returns {Promise<object>} The structured JSON result.
 */
export async function transformCa24(markdownPath, outDir) {
	const content = await fs.readFile(markdownPath, 'utf-8');
	const lines = content.split('\n').map(l => l.trim());

	const byteFields = [];
	const exampleFields = [];
	const reverbTypes = [];
	const reverbTimeDefaults = [];
	const chorusTypes = [];
	const chorusParamDefs = [];

	let inByteFields = false;
	let inExample = false;
	let inReverbTypes = false;
	let inReverbTimeDefaults = false;
	let inChorusTypes = false;
	let lastByteField = null;
	let templateSeen = false;

	for (let i = 0; i < lines.length; i++) {
		const line = lines[i];

		if (!line) {
			continue;
		}

		// Skip page headers and boilerplate
		if (line.startsWith('## Page') || line.startsWith('Confirmation of') || line.startsWith('MMA Technical') || line.startsWith('AMEI MIDI')) {
			continue;
		}

		// Detect message format template line (first F0 7F line)
		if (line.startsWith('F0 7F <device ID> 04 05') && !templateSeen) {
			inByteFields = true;
			inExample = false;
			inReverbTypes = false;
			inReverbTimeDefaults = false;
			inChorusTypes = false;
			lastByteField = null;
			templateSeen = true;
			continue;
		}

		// Detect example message line (has 'vl vh' in it)
		if (line.startsWith('F0 7F <device ID> 04 05') && templateSeen && line.includes('vl vh')) {
			inByteFields = false;
			inExample = true;
			inReverbTypes = false;
			inReverbTimeDefaults = false;
			inChorusTypes = false;
			continue;
		}

		// Skip GM2 slot definition lines (have [pp vv] in them)
		if (line.startsWith('F0 7F <device ID> 04 05') && templateSeen && line.includes('[pp vv]')) {
			inByteFields = false;
			inExample = false;
			inReverbTypes = false;
			inReverbTimeDefaults = false;
			inChorusTypes = false;
			continue;
		}

		// Detect reverb type section
		if (line === 'pp = 0 : Reverb Type') {
			inByteFields = false;
			inExample = false;
			inReverbTypes = true;
			inReverbTimeDefaults = false;
			inChorusTypes = false;
			continue;
		}

		// Detect reverb time defaults table
		if (line === 'Type Time') {
			inReverbTypes = false;
			inReverbTimeDefaults = true;
			continue;
		}

		// Detect reverb time parameter header
		if (line === 'pp = 1 : Reverb Time') {
			inReverbTypes = false;
			inReverbTimeDefaults = false;
			continue;
		}

		// Detect chorus type section
		if (line === 'pp = 0 : Chorus Type') {
			inByteFields = false;
			inExample = false;
			inReverbTypes = false;
			inReverbTimeDefaults = false;
			inChorusTypes = true;
			continue;
		}

		// Detect chorus parameter definitions (pp = 1 through pp = 4)
		const chorusParamMatch = line.match(/^pp\s*=\s*([1-4])\s*:\s*(.+)$/);
		if (chorusParamMatch && !line.includes('Chorus Type') && !line.includes('Reverb Type') && !line.includes('Reverb Time')) {
			inChorusTypes = false;
			const paramDef = {
				param_id: parseInt(chorusParamMatch[1], 10),
				name: chorusParamMatch[2].trim(),
				formula: null,
				description: null
			};
			for (let j = i + 1; j < lines.length; j++) {
				const nextLine = lines[j].trim();
				if (!nextLine || nextLine.startsWith('pp =') || nextLine.startsWith('Slot ') || nextLine.startsWith('F0 7F')) {
					break;
				}
				const formulaMatch = nextLine.match(FORMULA_REGEX);
				if (formulaMatch && !paramDef.formula) {
					paramDef.formula = nextLine;
				} else if (!paramDef.description) {
					paramDef.description = nextLine;
				}
			}
			chorusParamDefs.push(paramDef);
			continue;
		}

		// Parse byte fields
		if (inByteFields) {
			// Stop at descriptive text sections (but NOT at section markers like "(optional)" or "Variable length")
			if (line.startsWith('The variable') || line.startsWith('Multiple') || line.startsWith('Comments:') || line.startsWith('In general') || line.startsWith('In order') || line.startsWith('Example Message:') || line.startsWith('The following')) {
				inByteFields = false;
				continue;
			}
			const match = line.match(BYTE_FIELD_REGEX);
			if (match && VALID_BYTE_FIELD_CODES.has(match[1])) {
				const field = {
					code: match[1],
					description: match[2].trim()
				};
				byteFields.push(field);
				lastByteField = field;
			} else if (lastByteField && !line.startsWith('F0') && !line.startsWith('<') && !line.match(BYTE_FIELD_REGEX)) {
				lastByteField.description += ' ' + line;
			}
			continue;
		}

		// Parse example fields
		if (inExample) {
			if (line === '... F7' || line === 'F7') {
				inExample = false;
				continue;
			}
			// Stop at non-field lines
			if (line.startsWith('Example of') || line.startsWith('The following') || line.startsWith('On today') || line.startsWith('The Recommended') || line.startsWith('Although this') || line.startsWith('here for') || line.startsWith('The send levels') || line.startsWith('Slot ') || line.startsWith('pp =') || line.startsWith('Each parameter') || line.startsWith('The modulation') || line.startsWith('Type ') || line.match(REVERB_TYPE_REGEX) || line.match(REVERB_TIME_REGEX)) {
				inExample = false;
			} else {
				// Capture <device ID> lines
				if (line.startsWith('<device ID>')) {
					exampleFields.push({
						hex: '<device ID>',
						description: line.replace(/^<device ID>\s*/, '').trim()
					});
					continue;
				}
				const match = line.match(EXAMPLE_FIELD_REGEX);
				if (match && !line.startsWith('F0 7F')) {
					exampleFields.push({
						hex: match[1].toUpperCase(),
						description: match[2].trim()
					});
				}
				continue;
			}
		}

		// Parse reverb types
		if (inReverbTypes) {
			// Only stop at "On General" (not "When a Reverb" which is a split sentence)
			if (line.startsWith('On General')) {
				inReverbTypes = false;
				continue;
			}
			const match = line.match(REVERB_TYPE_REGEX);
			if (match) {
				// Description always starts with "A " (e.g. "A small size room...")
				const descMatch = match[2].match(/^(.+?)\s+(A\s.+)$/);
				reverbTypes.push({
					type_id: parseInt(match[1], 10),
					name: descMatch ? descMatch[1].trim() : match[2].trim(),
					description: descMatch ? descMatch[2].trim() : ''
				});
			}
			continue;
		}

		// Parse reverb time defaults
		if (inReverbTimeDefaults) {
			if (line.startsWith('Slot ') || line.startsWith('F0 7F')) {
				inReverbTimeDefaults = false;
				continue;
			}
			const match = line.match(REVERB_TIME_REGEX);
			if (match) {
				reverbTimeDefaults.push({
					reverb_type: parseInt(match[1], 10),
					value: parseInt(match[2], 10),
					time: match[3].trim()
				});
			}
			continue;
		}

		// Parse chorus types
		if (inChorusTypes) {
			if (line.startsWith('Each parameter') || line.startsWith('The modulation') || line.startsWith('Type 2') || line.startsWith('On General')) {
				inChorusTypes = false;
				continue;
			}
			const match = line.match(/^(\d+):\s+(.+)$/);
			if (match) {
				const rest = match[2];
				const nameMatch = rest.match(/^(.+?)\s+(\d+)\s+\((\d+%)\)\s+(\d+)\s+\((.+?)\)\s+(\d+)\s+\((.+?)\)\s+(\d+)\s+\((\d+%)\)$/);
				if (nameMatch) {
					chorusTypes.push({
						type_id: parseInt(match[1], 10),
						name: nameMatch[1].trim(),
						feedback: { value: parseInt(nameMatch[2], 10), display: nameMatch[3] },
						mod_rate: { value: parseInt(nameMatch[4], 10), display: nameMatch[5] },
						mod_depth: { value: parseInt(nameMatch[6], 10), display: nameMatch[7] },
						rev_send: { value: parseInt(nameMatch[8], 10), display: nameMatch[9] }
					});
				}
			}
			continue;
		}
	}

	const result = {
		metadata: {
			title: 'Global Parameter Control',
			doc_id: 'CA-024',
			version: '1.0.0',
			source: path.basename(markdownPath)
		},
		message_format: {
			template: 'F0 7F <device ID> 04 05 sw pw vw [[sh sl] ... ] [pp vv] ... F7',
			byte_fields: byteFields
		},
		example: {
			fields: exampleFields
		},
		gm2_reverb: {
			types: reverbTypes,
			time_defaults: reverbTimeDefaults
		},
		gm2_chorus: {
			types: chorusTypes,
			param_definitions: chorusParamDefs
		},
		summary: {
			byte_field_count: byteFields.length,
			example_field_count: exampleFields.length,
			reverb_type_count: reverbTypes.length,
			reverb_time_default_count: reverbTimeDefaults.length,
			chorus_type_count: chorusTypes.length,
			chorus_param_def_count: chorusParamDefs.length
		}
	};

	if (outDir) {
		await fs.mkdir(outDir, { recursive: true });
		await fs.writeFile(path.join(outDir, 'ca24-global-parameter-control.json'), JSON.stringify(result, null, 2), 'utf-8');
	}

	return result;
}
