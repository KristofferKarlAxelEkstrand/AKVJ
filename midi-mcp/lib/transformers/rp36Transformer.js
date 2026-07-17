import fs from 'node:fs/promises';
import path from 'node:path';

/**
 * Transforms the RP-036 Default Pan Formula specification
 * into a structured JSON object.
 *
 * @param {string} markdownPath - Absolute path to the source markdown file.
 * @param {string} [outDir] - Optional output directory for the JSON file.
 * @returns {Promise<object>} The structured JSON result.
 */
export async function transformRp36(markdownPath, outDir) {
	const content = await fs.readFile(markdownPath, 'utf-8');

	const result = {
		metadata: {},
		pan_formula: {
			cc_number: 10,
			cc_name: 'Pan',
			default_value: 64,
			default_value_hex: '0x40',
			center_note: '64 (40H) is Center',
			range_min: 0,
			range_max: 127,
			hard_left_values: [0, 1],
			description: '',
			formulas: {},
			amends: ''
		},
		approval: {},
		summary: {}
	};

	parseFrontmatter(content, result);

	const lines = content.split('\n');
	let inDescription = false;

	for (const line of lines) {
		const trimmedLine = line.trim();

		if (!trimmedLine || trimmedLine.match(/^## Page \d+$/)) {
			continue;
		}

		// Detect formula lines
		if (trimmedLine.match(/^Left Channel Gain/i)) {
			result.pan_formula.formulas.left_channel_gain_db = trimmedLine;
			continue;
		}
		if (trimmedLine.match(/^Right Channel Gain/i)) {
			result.pan_formula.formulas.right_channel_gain_db = trimmedLine;
			continue;
		}

		// Detect amends line
		if (trimmedLine.match(/^The General MIDI 2/i)) {
			result.pan_formula.amends = trimmedLine;
			continue;
		}

		// Detect description start
		if (trimmedLine.match(/^Sets the stereo position/i)) {
			inDescription = true;
			result.pan_formula.description = trimmedLine;
			continue;
		}

		// Accumulate description continuation
		if (inDescription && !trimmedLine.match(/^\[Note\]|^The following|^The General|^Approved/i)) {
			result.pan_formula.description += ' ' + trimmedLine;
			continue;
		}

		// Detect notes
		if (trimmedLine.match(/^\[Note\]/i)) {
			if (!result.pan_formula.notes) {
				result.pan_formula.notes = [];
			}
			result.pan_formula.notes.push(trimmedLine.replace(/^\[Note\]\s*/, ''));
			continue;
		}

		// Detect approval line
		if (trimmedLine.match(/^Approved by MMA/i)) {
			inDescription = false;
			const mmaMatch = trimmedLine.match(/Approved by MMA\s+(\d+\/\d+)/);
			const ameiMatch = trimmedLine.match(/Approved by AMEI\s+(\d+\/\d+)/);
			const copyrightMatch = trimmedLine.match(/Copyright\s+(\d+(?:-\d+)?)/);
			result.approval = {
				mma_date: mmaMatch ? mmaMatch[1] : '',
				amei_date: ameiMatch ? ameiMatch[1] : '',
				copyright: copyrightMatch ? copyrightMatch[1] : ''
			};
		}
	}

	result.summary = {
		formula_count: Object.keys(result.pan_formula.formulas).length,
		note_count: result.pan_formula.notes ? result.pan_formula.notes.length : 0
	};

	if (outDir) {
		await fs.mkdir(outDir, { recursive: true });
		await fs.writeFile(
			path.join(outDir, 'rp36.json'),
			JSON.stringify(result, null, 2),
			'utf-8'
		);
	}

	return result;
}

function parseFrontmatter(content, result) {
	const fmMatch = content.match(/^---\n([\s\S]*?)\n---/);
	if (!fmMatch) {
		return;
	}

	const fm = fmMatch[1];
	for (const line of fm.split('\n')) {
		const match = line.match(/^(\w+):\s*(.+)$/);
		if (match) {
			const key = match[1];
			const value = match[2].trim();
			if (key === 'title') {
				result.metadata.title = value;
			} else if (key === 'docId') {
				result.metadata.doc_id = value;
			} else if (key === 'protocol') {
				result.metadata.protocol = value;
			} else if (key === 'source') {
				result.metadata.source = value;
			} else if (key === 'pages') {
				result.metadata.pages = parseInt(value, 10);
			} else if (key === 'summary') {
				result.metadata.summary = value;
			}
		}
	}
}
