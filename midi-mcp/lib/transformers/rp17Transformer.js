import fs from 'node:fs/promises';
import path from 'node:path';

/**
 * Transforms the RP-017 SMF Lyric Meta Event Definition
 * specification into a structured JSON object.
 *
 * @param {string} markdownPath - Absolute path to the source markdown file.
 * @param {string} [outDir] - Optional output directory for the JSON file.
 * @returns {Promise<object>} The structured JSON result.
 */
export async function transformRp17(markdownPath, outDir) {
	const content = await fs.readFile(markdownPath, 'utf-8');

	const result = {
		metadata: {},
		description: '',
		rules: [],
		example: [],
		additional_recommendations: [],
		accepted_characters: '',
		reserved_characters: '',
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

		// Skip title repeats
		if (trimmedLine.match(/^Recommended Practice \(RP-017\)$/)) {
			continue;
		}

		if (trimmedLine.match(/^SMF Lyric Meta Event Definition$/)) {
			continue;
		}

		// Detect description
		if (trimmedLine.match(/^This is a recommended practice/i)) {
			currentSection = 'description';
			result.description = trimmedLine;
			continue;
		}

		if (currentSection === 'description' && !trimmedLine.match(/^Under this RP:/i)) {
			result.description += ' ' + trimmedLine;
			continue;
		}

		// Detect "Under this RP:" section
		if (trimmedLine.match(/^Under this RP:/i)) {
			currentSection = 'rules';
			continue;
		}

		// Parse numbered rules: "1) Each syllable..."
		const ruleMatch = trimmedLine.match(/^(\d+)\)\s+(.+)$/);
		if (ruleMatch && currentSection === 'rules') {
			result.rules.push({
				step: parseInt(ruleMatch[1], 10),
				title: ruleMatch[2],
				description: ''
			});
			continue;
		}

		// Accumulate rule descriptions and detect example lines
		if (currentSection === 'rules' && result.rules.length > 0) {
			const lastRule = result.rules[result.rules.length - 1];

			if (trimmedLine.match(/^\d+:\d+:\d+\s+/)) {
				// Example line
				result.example.push(trimmedLine);
				continue;
			}

			if (trimmedLine.match(/^Example:/i)) {
				result.example.push(trimmedLine);
				continue;
			}

			if (!trimmedLine.match(/^\d+\)/) && !trimmedLine.match(/^This RP also includes/i)) {
				lastRule.description += (lastRule.description ? ' ' : '') + trimmedLine;
				continue;
			}
		}

		// Detect additional recommendations
		if (trimmedLine.match(/^This RP also includes/i)) {
			currentSection = 'additional';
			continue;
		}

		if (currentSection === 'additional') {
			const addMatch = trimmedLine.match(/^(\d+)\)\s+(.+)$/);
			if (addMatch) {
				result.additional_recommendations.push({
					step: parseInt(addMatch[1], 10),
					title: addMatch[2],
					description: ''
				});
				continue;
			}

			if (result.additional_recommendations.length > 0) {
				const lastRec = result.additional_recommendations[result.additional_recommendations.length - 1];
				if (!trimmedLine.match(/^RP-017 Approved/i) && !trimmedLine.match(/^The following is the list/i) && !trimmedLine.match(/^The following characters/i)) {
					lastRec.description += (lastRec.description ? ' ' : '') + trimmedLine;
					continue;
				}
			}
		}

		// Detect accepted characters
		if (trimmedLine.match(/^The following is the list of characters/i)) {
			currentSection = 'accepted_chars';
			continue;
		}

		if (currentSection === 'accepted_chars' && !trimmedLine.match(/^The following characters/i)) {
			result.accepted_characters += (result.accepted_characters ? ' ' : '') + trimmedLine;
			continue;
		}

		// Detect reserved characters
		if (trimmedLine.match(/^The following characters/i)) {
			currentSection = 'reserved_chars';
			continue;
		}

		if (currentSection === 'reserved_chars' && !trimmedLine.match(/^RP-017 Approved/i)) {
			result.reserved_characters += (result.reserved_characters ? ' ' : '') + trimmedLine;
			continue;
		}

		// Detect approval
		if (trimmedLine.match(/^RP-017 Approved/i)) {
			currentSection = 'approval';
			const mmaMatch = trimmedLine.match(/Approved by MMA\s+([\d/]+)/i);
			const ameiMatch = trimmedLine.match(/Approved by AMEI\s+([\d/]+)/i);
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
		rule_count: result.rules.length,
		example_count: result.example.length,
		additional_recommendation_count: result.additional_recommendations.length
	};

	if (outDir) {
		await fs.mkdir(outDir, { recursive: true });
		await fs.writeFile(path.join(outDir, 'rp17.json'), JSON.stringify(result, null, 2), 'utf-8');
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
