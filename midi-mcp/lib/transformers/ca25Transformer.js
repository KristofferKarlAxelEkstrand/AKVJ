import fs from 'node:fs/promises';
import path from 'node:path';

/**
 * Regex to match message format field lines.
 * Handles codes like: F0, 7F, <device ID>, 04, 03, lsb, msb, 00, F7
 */
const FIELD_REGEX = /^([0-9A-Fa-f]{2}|[a-z]{3}|<.+?>)\s+(.+)$/;

/**
 * Regex to match tuning value table rows.
 * Format: `00 00 100/8192*(-8192)` or `00 40 100/8192*0` or `00 7F 100 cents *(+63)`
 */
const TUNING_ROW_REGEX = /^([0-9A-Fa-f]{2})\s+([0-9A-Fa-f]{2})\s+(.+)$/;

/**
 * Transforms the CA-025 Master Fine/Coarse Tuning markdown document
 * into a structured JSON object.
 *
 * The document contains:
 * - Master Fine Tuning message format with byte fields
 * - Fine tuning value table (3 entries: LSB/MSB/displacement)
 * - Master Coarse Tuning message format with byte fields
 * - Coarse tuning value table (3 entries: LSB/MSB/displacement)
 * - Notes about total displacement and key-based instruments
 *
 * @param {string} markdownPath - Absolute path to the source markdown file.
 * @param {string} [outDir] - Optional output directory for the JSON file.
 * @returns {Promise<object>} The structured JSON result.
 */
export async function transformCa25(markdownPath, outDir) {
	const content = await fs.readFile(markdownPath, 'utf-8');
	const lines = content.split('\n').map(l => l.trim());

	const fineTuningFields = [];
	const coarseTuningFields = [];
	const fineTuningTable = [];
	const coarseTuningTable = [];
	const notes = [];

	let currentMessage = null; // 'fine' | 'coarse' | null
	let inFineTable = false;
	let inCoarseTable = false;
	let inNotes = false;

	for (const line of lines) {
		if (!line) {
			continue;
		}

		// Skip page headers and boilerplate
		if (line.startsWith('## Page') || line.startsWith('Confirmation of') || line.startsWith('MMA Technical') || line.startsWith('AMEI MIDI')) {
			continue;
		}

		// Detect Master Fine Tuning message format
		if (line === 'MASTER FINE TUNING') {
			currentMessage = 'fine';
			inFineTable = false;
			inCoarseTable = false;
			inNotes = false;
			continue;
		}

		// Detect Master Coarse Tuning message format
		if (line === 'MASTER COARSE TUNING') {
			currentMessage = 'coarse';
			inFineTable = false;
			inCoarseTable = false;
			inNotes = false;
			continue;
		}

		// Detect fine tuning value table header
		if (line === 'fine tuning value Displacement in cents from A440') {
			currentMessage = null;
			inFineTable = true;
			inCoarseTable = false;
			inNotes = false;
			continue;
		}

		// Detect coarse tuning value table header
		if (line === 'coarse tuning value Displacement in cents from A440') {
			currentMessage = null;
			inFineTable = false;
			inCoarseTable = true;
			inNotes = false;
			continue;
		}

		// Detect LSB MSB sub-header (skip, it's just a column header)
		if (line === 'LSB MSB') {
			continue;
		}

		// Parse message format fields
		if (currentMessage === 'fine') {
			// Skip the template line (contains 'lsb msb' and ends with F7)
			if (line.includes('lsb msb') && line.endsWith('F7')) {
				continue;
			}
			if (line === 'F7 EOX') {
				fineTuningFields.push({ code: 'F7', description: 'EOX' });
				currentMessage = null;
				continue;
			}
			const match = line.match(FIELD_REGEX);
			if (match) {
				fineTuningFields.push({
					code: match[1],
					description: match[2].trim()
				});
			}
			continue;
		}

		if (currentMessage === 'coarse') {
			// Skip the template line (contains '00 msb' and ends with F7)
			if (line.includes('00 msb') && line.endsWith('F7')) {
				continue;
			}
			if (line === 'F7 EOX') {
				coarseTuningFields.push({ code: 'F7', description: 'EOX' });
				currentMessage = null;
				continue;
			}
			const match = line.match(FIELD_REGEX);
			if (match) {
				coarseTuningFields.push({
					code: match[1],
					description: match[2].trim()
				});
			}
			continue;
		}

		// Parse fine tuning table rows
		if (inFineTable) {
			const match = line.match(TUNING_ROW_REGEX);
			if (match) {
				fineTuningTable.push({
					lsb: match[1].toUpperCase(),
					msb: match[2].toUpperCase(),
					displacement: match[3].trim()
				});
				continue;
			}
			// Stop at non-matching lines
			if (!line.startsWith('00') && !line.startsWith('7F')) {
				inFineTable = false;
				inNotes = true;
				notes.push(line);
				continue;
			}
		}

		// Parse coarse tuning table rows
		if (inCoarseTable) {
			const match = line.match(TUNING_ROW_REGEX);
			if (match) {
				coarseTuningTable.push({
					lsb: match[1].toUpperCase(),
					msb: match[2].toUpperCase(),
					displacement: match[3].trim()
				});
				continue;
			}
			// Stop at non-matching lines
			if (!line.startsWith('00') && !line.startsWith('7F')) {
				inCoarseTable = false;
				inNotes = true;
				notes.push(line);
				continue;
			}
		}

		// Parse remaining notes
		if (inNotes) {
			notes.push(line);
			continue;
		}

		// Capture notes that appear between sections
		if (line.startsWith('The total displacement') || line.startsWith('Note that') || line.startsWith('Displacement in cents') || line.startsWith('The relationship') || line.startsWith('For devices')) {
			notes.push(line);
			continue;
		}
	}

	const result = {
		metadata: {
			title: 'Master Fine/Coarse Tuning',
			doc_id: 'CA-025',
			version: '1.0.0',
			source: path.basename(markdownPath)
		},
		master_fine_tuning: {
			message: 'F0 7F <device ID> 04 03 lsb msb F7',
			fields: fineTuningFields,
			tuning_table: fineTuningTable
		},
		master_coarse_tuning: {
			message: 'F0 7F <device ID> 04 04 00 msb F7',
			fields: coarseTuningFields,
			tuning_table: coarseTuningTable
		},
		notes,
		summary: {
			fine_tuning_field_count: fineTuningFields.length,
			fine_tuning_table_count: fineTuningTable.length,
			coarse_tuning_field_count: coarseTuningFields.length,
			coarse_tuning_table_count: coarseTuningTable.length,
			note_count: notes.length
		}
	};

	if (outDir) {
		await fs.mkdir(outDir, { recursive: true });
		await fs.writeFile(path.join(outDir, 'ca25-master-fine-coarse-tuning.json'), JSON.stringify(result, null, 2), 'utf-8');
	}

	return result;
}
