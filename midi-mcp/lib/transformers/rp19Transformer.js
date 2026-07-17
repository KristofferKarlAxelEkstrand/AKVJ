import fs from 'node:fs/promises';
import path from 'node:path';

/**
 * Transforms the RP-019 SMF Device Name and Program Name Meta Events
 * specification into a structured JSON object.
 *
 * @param {string} markdownPath - Absolute path to the source markdown file.
 * @param {string} [outDir] - Optional output directory for the JSON file.
 * @returns {Promise<object>} The structured JSON result.
 */
export async function transformRp19(markdownPath, outDir) {
	const content = await fs.readFile(markdownPath, 'utf-8');

	const result = {
		metadata: {},
		meta_events: [],
		usage_rules: [],
		device_naming_recommendations: [],
		approval: {},
		summary: {}
	};

	parseFrontmatter(content, result);

	const lines = content.split('\n');
	let currentSection = null;

	for (const line of lines) {
		const trimmedLine = line.trim();

		if (!trimmedLine || trimmedLine.match(/^## Page \d+$/)) {
			continue;
		}

		// Detect meta event definitions: "FF 09 len text \tDEVICE NAME"
		const metaEventMatch = trimmedLine.match(/^FF\s+([0-9A-Fa-f]{2})\s+len\s+text\s+(.+)$/);
		if (metaEventMatch) {
			result.meta_events.push({
				meta_event_type: `0x${metaEventMatch[1].toUpperCase()}`,
				format: `FF ${metaEventMatch[1]} len text`,
				label: metaEventMatch[2].trim(),
				name: '',
				description: ''
			});
			currentSection = 'meta_event_description';
			continue;
		}

		// Detect section headers
		if (trimmedLine.match(/^Use in Type 0 and Type 1 SMF/i)) {
			currentSection = 'usage_rules';
			continue;
		}
		if (trimmedLine.match(/^Recommendation Regarding Device Naming/i)) {
			currentSection = 'device_naming';
			continue;
		}

		// Detect approval line
		if (trimmedLine.match(/^RP-019 Approved/i)) {
			const mmaMatch = trimmedLine.match(/Approved by MMA\s+(\d+\/\d+\/\d+)/);
			const ameiMatch = trimmedLine.match(/Approved by AMEI\s+(\d+\/\d+\/\d+)/);
			result.approval = {
				mma_date: mmaMatch ? mmaMatch[1] : '',
				amei_date: ameiMatch ? ameiMatch[1] : '',
				copyright: trimmedLine.match(/Copyright\s+(\d+)/)?.[1] || ''
			};
			currentSection = null;
			continue;
		}

		// Handle meta event descriptions
		if (currentSection === 'meta_event_description') {
			const lastEvent = result.meta_events[result.meta_events.length - 1];
			if (lastEvent && !trimmedLine.match(/^Use in|^Recommendation|^RP-019|^Page \d/i)) {
				// First line after format is the name/description
				if (!lastEvent.description) {
					lastEvent.description = trimmedLine;
				} else {
					lastEvent.description += ' ' + trimmedLine;
				}
			}
		}

		// Handle usage rules
		if (currentSection === 'usage_rules') {
			if (!trimmedLine.match(/^Recommendation|^RP-019|^Page \d/i)) {
				result.usage_rules.push(trimmedLine);
			}
		}

		// Handle device naming recommendations
		if (currentSection === 'device_naming') {
			if (!trimmedLine.match(/^RP-019|^Page \d/i)) {
				result.device_naming_recommendations.push(trimmedLine);
			}
		}
	}

	// Extract names from descriptions
	for (const event of result.meta_events) {
		if (event.label === 'DEVICE NAME') {
			event.name = 'Device Name Meta Event';
		} else if (event.label === 'PROGRAM NAME') {
			event.name = 'Program Name Meta Event';
		}
	}

	result.summary = {
		meta_event_count: result.meta_events.length,
		usage_rule_count: result.usage_rules.length,
		device_naming_recommendation_count: result.device_naming_recommendations.length
	};

	if (outDir) {
		await fs.mkdir(outDir, { recursive: true });
		await fs.writeFile(
			path.join(outDir, 'rp19.json'),
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
			} else if (key === 'version') {
				result.metadata.version = value;
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
