import fs from 'node:fs/promises';
import path from 'node:path';

/**
 * Transforms the RP-023 Renaming of CC91 and CC93 specification
 * into a structured JSON object.
 *
 * @param {string} markdownPath - Absolute path to the source markdown file.
 * @param {string} [outDir] - Optional output directory for the JSON file.
 * @returns {Promise<object>} The structured JSON result.
 */
export async function transformRp23(markdownPath, outDir) {
	const content = await fs.readFile(markdownPath, 'utf-8');

	const result = {
		metadata: {},
		cc_renames: [],
		note: '',
		approval: {},
		summary: {}
	};

	parseFrontmatter(content, result);

	const lines = content.split('\n');

	for (const line of lines) {
		const trimmedLine = line.trim();

		if (!trimmedLine || trimmedLine.match(/^## Page \d+$/)) {
			continue;
		}

		// Detect CC rename table rows: "91 (5BH) \t[Effect 1 Depth] \tReverb Send Level"
		const ccMatch = trimmedLine.match(/^(\d+)\s+\(([0-9A-Fa-f]{2})H\)\s+(.+)$/);
		if (ccMatch) {
			const rest = ccMatch[3];
			const parts = rest.split(/\t/).map(s => s.trim().replace(/^\[|\]$/g, '')).filter(Boolean);
			result.cc_renames.push({
				cc_number: parseInt(ccMatch[1], 10),
				cc_hex: `0x${ccMatch[2].toUpperCase()}`,
				old_name: parts[0] || '',
				new_name: parts[1] || ''
			});
			continue;
		}

		// Detect note about actual response
		if (trimmedLine.match(/^The actual response/i)) {
			result.note = trimmedLine;
			continue;
		}

		// Detect approval line
		if (trimmedLine.match(/^Approved by MMA/i)) {
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
		cc_rename_count: result.cc_renames.length
	};

	if (outDir) {
		await fs.mkdir(outDir, { recursive: true });
		await fs.writeFile(
			path.join(outDir, 'rp23.json'),
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
