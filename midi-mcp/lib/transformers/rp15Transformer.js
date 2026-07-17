import fs from 'node:fs/promises';
import path from 'node:path';

/**
 * Transforms the RP-015 Response to Reset All Controllers specification
 * into a structured JSON object.
 *
 * @param {string} markdownPath - Absolute path to the source markdown file.
 * @param {string} [outDir] - Optional output directory for the JSON file.
 * @returns {Promise<object>} The structured JSON result.
 */
export async function transformRp15(markdownPath, outDir) {
	const content = await fs.readFile(markdownPath, 'utf-8');

	const result = {
		metadata: {},
		description: '',
		spec_quote: '',
		background: '',
		details: {
			reset_actions: [],
			do_not_reset: [],
			other_controllers_note: ''
		},
		documentation: '',
		entering_gm1: '',
		global_controllers: '',
		approval: {},
		summary: {}
	};

	parseFrontmatter(content, result);

	const lines = content.split('\n');
	let currentSection = null;

	for (const line of lines) {
		const trimmedLine = line.trim();

		if (!trimmedLine || trimmedLine.match(/^## Page \d+$/) || trimmedLine.match(/^Page \d+ of \d+$/)) {
			continue;
		}

		// Skip title/header repeats
		if (trimmedLine.match(/^Recommended Practice \(RP-015\)$/)) {
			continue;
		}

		if (trimmedLine.match(/^Response to Reset All Controllers$/)) {
			continue;
		}

		// Detect description start (In MIDI 1.0...)
		if (trimmedLine.match(/^In MIDI 1\.0/i)) {
			currentSection = 'description';
			result.description = trimmedLine;
			continue;
		}

		if (currentSection === 'description' && !trimmedLine.match(/^"/) && !trimmedLine.match(/^However,/i)) {
			result.description += ' ' + trimmedLine;
			continue;
		}

		// Detect spec quote (starts with "When a device receives)
		if (trimmedLine.match(/^"When a device/i)) {
			currentSection = 'spec_quote';
			result.spec_quote = trimmedLine;
			continue;
		}

		if (currentSection === 'spec_quote' && !trimmedLine.match(/^However,/i)) {
			result.spec_quote += ' ' + trimmedLine;
			continue;
		}

		// Detect background
		if (trimmedLine.match(/^However,/i)) {
			currentSection = 'background';
			result.background = trimmedLine;
			continue;
		}

		if (currentSection === 'background' && !trimmedLine.match(/^DETAILS:/i)) {
			result.background += ' ' + trimmedLine;
			continue;
		}

		// Detect DETAILS section
		if (trimmedLine.match(/^DETAILS:/i)) {
			currentSection = 'details';
			continue;
		}

		// Parse reset actions (bullet items starting with "Set" or "Reset")
		if (currentSection === 'details' && trimmedLine.match(/^[•]\s+(Set|Reset)/i)) {
			result.details.reset_actions.push(trimmedLine.replace(/^[•]\s+/, ''));
			continue;
		}

		// Parse do-not-reset items (bullet items starting with "Do NOT")
		if (currentSection === 'details' && trimmedLine.match(/^[•]\s+Do NOT/i)) {
			result.details.do_not_reset.push(trimmedLine.replace(/^[•]\s+/, ''));
			continue;
		}

		// Parse other controllers note
		if (currentSection === 'details' && trimmedLine.match(/^Any other controllers/i)) {
			result.details.other_controllers_note = trimmedLine;
			currentSection = 'other_note';
			continue;
		}

		if (currentSection === 'other_note' && !trimmedLine.match(/^Documentation/i)) {
			result.details.other_controllers_note += ' ' + trimmedLine;
			continue;
		}

		// Detect documentation section
		if (trimmedLine.match(/^Documentation$/i)) {
			currentSection = 'documentation';
			continue;
		}

		if (currentSection === 'documentation' && !trimmedLine.match(/^Entering General MIDI/i)) {
			result.documentation += (result.documentation ? ' ' : '') + trimmedLine;
			continue;
		}

		// Detect entering GM1 section
		if (trimmedLine.match(/^Entering General MIDI/i)) {
			currentSection = 'entering_gm1';
			result.entering_gm1 = trimmedLine;
			continue;
		}

		if (currentSection === 'entering_gm1' && !trimmedLine.match(/^"Global"/i) && !trimmedLine.match(/^RP-015 Approved/i)) {
			result.entering_gm1 += ' ' + trimmedLine;
			continue;
		}

		// Detect global controllers section
		if (trimmedLine.match(/^[""]Global""/i) || trimmedLine.match(/^"Global"/i)) {
			currentSection = 'global_controllers';
			result.global_controllers = trimmedLine.replace(/^[""]Global""\s*/i, '').replace(/^"Global"\s*/i, '');
			continue;
		}

		if (currentSection === 'global_controllers' && !trimmedLine.match(/^RP-015 Approved/i)) {
			result.global_controllers += ' ' + trimmedLine;
			continue;
		}

		// Detect approval
		if (trimmedLine.match(/^RP-015 Approved/i)) {
			currentSection = 'approval';
			const mmaMatch = trimmedLine.match(/Approved by MMA\s+(\d+\/\d+)/i);
			const ameiMatch = trimmedLine.match(/Approved by AMEI\s+(\d+\/\d+)/i);
			if (mmaMatch) {
				result.approval.mma_date = mmaMatch[1];
			}
			if (ameiMatch) {
				result.approval.amei_date = ameiMatch[1];
			}
			continue;
		}
	}

	result.summary = {
		reset_action_count: result.details.reset_actions.length,
		do_not_reset_count: result.details.do_not_reset.length
	};

	if (outDir) {
		await fs.mkdir(outDir, { recursive: true });
		await fs.writeFile(path.join(outDir, 'rp15.json'), JSON.stringify(result, null, 2), 'utf-8');
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
