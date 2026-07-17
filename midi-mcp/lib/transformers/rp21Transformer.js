import fs from 'node:fs/promises';
import path from 'node:path';

/**
 * Transforms the RP-021 Sound Controller Defaults (Revised) specification
 * into a structured JSON object.
 *
 * @param {string} markdownPath - Absolute path to the source markdown file.
 * @param {string} [outDir] - Optional output directory for the JSON file.
 * @returns {Promise<object>} The structured JSON result.
 */
export async function transformRp21(markdownPath, outDir) {
	const content = await fs.readFile(markdownPath, 'utf-8');

	const result = {
		metadata: {},
		sound_controllers: [],
		comments: [],
		approval: {},
		summary: {}
	};

	parseFrontmatter(content, result);

	const lines = content.split('\n');
	let inComments = false;

	for (const line of lines) {
		const trimmedLine = line.trim();

		if (!trimmedLine || trimmedLine.match(/^## Page \d+$/)) {
			continue;
		}

		// Detect sound controller table rows: "70 (46H) \tSound Controller 1 \t*Sound Variation"
		const ccMatch = trimmedLine.match(/^(\d+)\s+\(([0-9A-Fa-f]{2})H\)\s+(.+)$/);
		if (ccMatch && !inComments) {
			const rest = ccMatch[3];
			const parts = rest.split(/\t/).map(s => s.trim()).filter(Boolean);
			result.sound_controllers.push({
				cc_number: parseInt(ccMatch[1], 10),
				cc_hex: `0x${ccMatch[2].toUpperCase()}`,
				control_function: parts[0] || '',
				default_name: parts[1] || ''
			});
			continue;
		}

		// Detect comments section
		if (trimmedLine.match(/^Comments$/i)) {
			inComments = true;
			continue;
		}

		// Accumulate comment lines
		if (inComments && !trimmedLine.match(/^Approved by MMA/i)) {
			result.comments.push(trimmedLine);
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
		sound_controller_count: result.sound_controllers.length,
		comment_count: result.comments.length
	};

	if (outDir) {
		await fs.mkdir(outDir, { recursive: true });
		await fs.writeFile(
			path.join(outDir, 'rp21.json'),
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
