import fs from 'node:fs/promises';
import path from 'node:path';

/**
 * Transforms the MIDI.org Specs index page
 * into a structured JSON object.
 *
 * @param {string} markdownPath - Absolute path to the source markdown file.
 * @param {string} [outDir] - Optional output directory for the JSON file.
 * @returns {Promise<object>} The structured JSON result.
 */
export async function transformSpecsMidiOrg(markdownPath, outDir) {
	const content = await fs.readFile(markdownPath, 'utf-8');

	const result = {
		metadata: {},
		description: '',
		reference_tables: [],
		spec_categories: [],
		summary: {}
	};

	parseFrontmatter(content, result);

	const lines = content.split('\n');
	let currentSection = null;
	let currentCategory = null;

	for (const line of lines) {
		const trimmedLine = line.trim();

		if (!trimmedLine) {
			continue;
		}

		// Skip top-level headers and nav, but allow ### subheadings
		if (trimmedLine.match(/^#{1,2}\s/) || trimmedLine.match(/^Learn More$|^Sign up|^About|^MIDI Association|^MIDI Logo|^Media|^Privacy|^©|^Details$/i)) {
			continue;
		}

		// Detect description
		if (trimmedLine.match(/^The MIDI Association.*produces/i) && !result.description) {
			result.description = trimmedLine;
			continue;
		}

		// Detect reference tables section
		if (trimmedLine.match(/^### MIDI Reference Tables/i)) {
			currentSection = 'reference_tables';
			continue;
		}

		// Collect reference table list items
		if (currentSection === 'reference_tables' && trimmedLine.match(/^-\s+/)) {
			result.reference_tables.push(trimmedLine.replace(/^-\s+/, ''));
			continue;
		}

		// Detect spec category headers (### headings)
		const catMatch = trimmedLine.match(/^### (.+)$/);
		if (catMatch && !catMatch[1].match(/^MIDI Reference Tables|^MIDI 2\.0 Developer Information|^Join Us/i)) {
			currentSection = 'spec_category';
			currentCategory = {
				name: catMatch[1].trim(),
				description: '',
				file_formats: []
			};
			result.spec_categories.push(currentCategory);
			continue;
		}

		// Accumulate category descriptions
		if (currentSection === 'spec_category' && currentCategory && !trimmedLine.match(/^-\s+/)) {
			if (currentCategory.description.length === 0) {
				currentCategory.description = trimmedLine;
			} else {
				currentCategory.description += ' ' + trimmedLine;
			}
			continue;
		}

		// Collect file format list items within categories
		if (currentSection === 'spec_category' && currentCategory && trimmedLine.match(/^-\s+/)) {
			currentCategory.file_formats.push(trimmedLine.replace(/^-\s+/, ''));
			continue;
		}
	}

	result.summary = {
		reference_table_count: result.reference_tables.length,
		spec_category_count: result.spec_categories.length
	};

	if (outDir) {
		await fs.mkdir(outDir, { recursive: true });
		await fs.writeFile(path.join(outDir, 'specs-midi-org.json'), JSON.stringify(result, null, 2), 'utf-8');
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
