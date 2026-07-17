import fs from 'node:fs/promises';
import path from 'node:path';

/**
 * Transforms the MIDI 1.0 Universal System Exclusive Messages
 * reference page into a structured JSON object.
 *
 * @param {string} markdownPath - Absolute path to the source markdown file.
 * @param {string} [outDir] - Optional output directory for the JSON file.
 * @returns {Promise<object>} The structured JSON result.
 */
export async function transformUniversalSysexMidiOrg(markdownPath, outDir) {
	const content = await fs.readFile(markdownPath, 'utf-8');

	const result = {
		metadata: {},
		description: '',
		warning: '',
		categories: [],
		summary: {}
	};

	parseFrontmatter(content, result);

	const lines = content.split('\n');
	let currentCategory = null;
	let currentEntry = null;
	let inTable = false;

	for (const line of lines) {
		const trimmedLine = line.trim();

		if (!trimmedLine) {
			continue;
		}

		// Skip headers and nav
		if (trimmedLine.match(/^#{1,2}\s/) || trimmedLine.match(/^Download$|^Sign up|^About|^MIDI Association|^MIDI Logo|^Media|^Privacy|^©|^Join Us/i)) {
			continue;
		}

		// Detect description
		if (trimmedLine.match(/^The following table/i) && !result.description) {
			result.description = trimmedLine;
			continue;
		}

		if (trimmedLine.match(/^Universal System Exclusive Messages are defined/i)) {
			result.description += ' ' + trimmedLine;
			continue;
		}

		if (trimmedLine.match(/^Many of these messages/i)) {
			result.description += ' ' + trimmedLine;
			continue;
		}

		if (trimmedLine.match(/^WARNING!/i)) {
			result.warning = trimmedLine;
			continue;
		}

		// Detect table header
		if (trimmedLine.match(/^Table 4:/i)) {
			inTable = true;
			continue;
		}

		// Detect category headers
		if (inTable && trimmedLine.match(/^Non-Real Time/i)) {
			currentCategory = { name: 'Non-Real Time (7EH)', entries: [] };
			result.categories.push(currentCategory);
			continue;
		}

		if (inTable && trimmedLine.match(/^Real Time/i)) {
			currentCategory = { name: 'Real Time (7FH)', entries: [] };
			result.categories.push(currentCategory);
			continue;
		}

		// Skip column headers
		if (trimmedLine.match(/^SUB-ID/i) || trimmedLine.match(/^\| {2}\| {2}\|$/)) {
			continue;
		}

		// Parse table rows within a category
		if (inTable && currentCategory) {
			// Top-level entries: "01 |  | Sample Dump Header" or "7B | — | End of File"
			const topMatch = trimmedLine.match(/^([0-9A-Fa-f]{2})\s*\|\s*(—|nn|[0-9A-Fa-f]{2})?\s*\|\s*(.+)$/);
			if (topMatch && !trimmedLine.match(/^\s*\|/)) {
				currentEntry = {
					sub_id_1: topMatch[1],
					sub_id_2: topMatch[2]?.trim() || '',
					description: topMatch[3].trim(),
					sub_entries: []
				};
				currentCategory.entries.push(currentEntry);
				continue;
			}

			// Sub-entries: " | 01 |  | Full Message"
			const subMatch = trimmedLine.match(/^\|\s*([0-9A-Fa-f]{2})\s*\|\s*\|\s*(.+)$/);
			if (subMatch && currentEntry) {
				currentEntry.sub_entries.push({
					sub_id_2: subMatch[1],
					description: subMatch[2].trim()
				});
				continue;
			}
		}

		// Separator line
		if (trimmedLine === '---' && inTable) {
			continue;
		}
	}

	const totalEntries = result.categories.reduce((sum, cat) => sum + cat.entries.length, 0);

	result.summary = {
		category_count: result.categories.length,
		total_entries: totalEntries
	};

	if (outDir) {
		await fs.mkdir(outDir, { recursive: true });
		await fs.writeFile(path.join(outDir, 'midi-1-0-universal-system-exclusive-messages-midi-org.json'), JSON.stringify(result, null, 2), 'utf-8');
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
			} else if (key === 'version') {
				result.metadata.version = value;
			} else if (key === 'protocol') {
				result.metadata.protocol = value;
			} else if (key === 'source') {
				result.metadata.source = value;
			} else if (key === 'summary') {
				result.metadata.summary = value;
			}
		}
	}
}
