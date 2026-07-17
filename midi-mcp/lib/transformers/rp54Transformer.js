import fs from 'node:fs/promises';
import path from 'node:path';

/**
 * Transforms the RP-054 Specification for Use of TRS Connectors
 * with MIDI Devices into a structured JSON object.
 *
 * @param {string} markdownPath - Absolute path to the source markdown file.
 * @param {string} [outDir] - Optional output directory for the JSON file.
 * @returns {Promise<object>} The structured JSON result.
 */
export async function transformRp54(markdownPath, outDir) {
	const content = await fs.readFile(markdownPath, 'utf-8');

	const result = {
		metadata: {},
		abstract: '',
		background: '',
		details: [],
		notes: [],
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

		// Skip copyright/header lines
		if (trimmedLine.match(/^\(C\)\s+\d/) || trimmedLine.match(/^MMA Technical Standards Board\/$/) || trimmedLine.match(/^AMEI MIDI Committee$/)) {
			continue;
		}

		if (trimmedLine.match(/^Letter of Agreement/i)) {
			continue;
		}

		// Detect abstract
		if (trimmedLine.match(/^Abstract:/i)) {
			currentSection = 'abstract';
			result.abstract = trimmedLine.replace(/^Abstract:\s*/, '');
			continue;
		}

		if (currentSection === 'abstract' && !trimmedLine.match(/^Background:/i)) {
			result.abstract += ' ' + trimmedLine;
			continue;
		}

		// Detect background
		if (trimmedLine.match(/^Background:/i)) {
			currentSection = 'background';
			result.background = trimmedLine.replace(/^Background:\s*/, '');
			continue;
		}

		if (currentSection === 'background' && !trimmedLine.match(/^Details:/i)) {
			result.background += ' ' + trimmedLine;
			continue;
		}

		// Detect details section
		if (trimmedLine.match(/^Details:/i)) {
			currentSection = 'details';
			continue;
		}

		// Parse numbered detail items: "(1) Pin-out Correspondence:" (can appear on any page)
		const detailMatch = trimmedLine.match(/^\((\d+)\)\s+(.+)$/);
		if (detailMatch) {
			currentSection = 'details';
			result.details.push({
				step: parseInt(detailMatch[1], 10),
				title: detailMatch[2].replace(/:$/, ''),
				description: ''
			});
			continue;
		}

		// Accumulate detail descriptions
		if (currentSection === 'details' && result.details.length > 0) {
			const lastDetail = result.details[result.details.length - 1];
			if (!trimmedLine.match(/^Notes:|^Note:|^Originated By:|^MMA Approval|^AMEI Approval|^Related Items:|^Adapter cables|^Direct connection/i)) {
				lastDetail.description += (lastDetail.description ? ' ' : '') + trimmedLine;
				continue;
			}
		}

		// Detect notes (can appear after any detail item)
		if (trimmedLine.match(/^Notes:/i)) {
			currentSection = 'notes';
			continue;
		}

		// Collect note lines (including "Note:" singular and continuation lines)
		if (currentSection === 'notes' && !trimmedLine.match(/^Originated By:|^MMA Approval|^AMEI Approval|^Related Items:/i)) {
			result.notes.push(trimmedLine);
			continue;
		}

		// Detect approval info
		if (trimmedLine.match(/^Originated By:/i)) {
			currentSection = 'approval';
			const match = trimmedLine.match(/Originated By:\s*(.+?)\s+Reference.*?#:?\s*(.+?)\s+Version.*?#:?\s*(.+)$/i);
			if (match) {
				result.approval.originated_by = match[1].trim();
				result.approval.reference = match[2].trim();
				result.approval.version = match[3].trim();
			}
			continue;
		}

		if (trimmedLine.match(/^MMA Approval Date:/i)) {
			const mmaMatch = trimmedLine.match(/MMA Approval Date:\s*(.+?)(?:\s+AMEI|$)/i);
			const ameiMatch = trimmedLine.match(/AMEI Approval Date:\s*(.+)$/i);
			if (mmaMatch) {
				result.approval.mma_date = mmaMatch[1].trim();
			}
			if (ameiMatch) {
				result.approval.amei_date = ameiMatch[1].trim();
			}
			continue;
		}

		if (trimmedLine.match(/^Related Items:/i)) {
			result.approval.related_items = trimmedLine.replace(/^Related Items:\s*/, '');
			continue;
		}
	}

	result.summary = {
		detail_count: result.details.length,
		note_count: result.notes.length
	};

	if (outDir) {
		await fs.mkdir(outDir, { recursive: true });
		await fs.writeFile(path.join(outDir, 'rp54.json'), JSON.stringify(result, null, 2), 'utf-8');
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
