import fs from 'node:fs/promises';
import path from 'node:path';

/**
 * Transforms the RP-022 Redefinition of RPN 01/02 specification
 * into a structured JSON object.
 *
 * @param {string} markdownPath - Absolute path to the source markdown file.
 * @param {string} [outDir] - Optional output directory for the JSON file.
 * @returns {Promise<object>} The structured JSON result.
 */
export async function transformRp22(markdownPath, outDir) {
	const content = await fs.readFile(markdownPath, 'utf-8');

	const result = {
		metadata: {},
		rpn_changes: [],
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

		// Detect RPN change lines: "1) Change current..."
		const changeMatch = trimmedLine.match(/^(\d+)\)\s+(.+)$/);
		if (changeMatch) {
			result.rpn_changes.push({
				step: parseInt(changeMatch[1], 10),
				description: changeMatch[2].trim()
			});
			continue;
		}

		// Accumulate continuation lines for the last RPN change
		const lastChange = result.rpn_changes[result.rpn_changes.length - 1];
		if (lastChange && !trimmedLine.match(/^Approved|^Page \d|^Details:|^Recommended Practice/i)) {
			lastChange.description += ' ' + trimmedLine;
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
		rpn_change_count: result.rpn_changes.length
	};

	if (outDir) {
		await fs.mkdir(outDir, { recursive: true });
		await fs.writeFile(path.join(outDir, 'rp22.json'), JSON.stringify(result, null, 2), 'utf-8');
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
