import fs from 'node:fs/promises';
import path from 'node:path';

/**
 * Transforms the RP-018 Response to Data Inc/Dec Controllers specification
 * into a structured JSON object.
 *
 * @param {string} markdownPath - Absolute path to the source markdown file.
 * @param {string} [outDir] - Optional output directory for the JSON file.
 * @returns {Promise<object>} The structured JSON result.
 */
export async function transformRp18(markdownPath, outDir) {
	const content = await fs.readFile(markdownPath, 'utf-8');

	const result = {
		metadata: {},
		controllers: [],
		problems: [],
		recommendation: '',
		rpn_behavior: [],
		nrpn_behavior: '',
		receiving_device_rules: [],
		example: {
			description: '',
			steps: []
		},
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

		// Detect controllers
		if (trimmedLine.match(/Data Increment.*Controller #96/i) || trimmedLine.match(/MIDI controller #96/i)) {
			if (result.controllers.length === 0) {
				result.controllers.push({
					name: 'Data Increment',
					cc_number: 96,
					cc_hex: '0x60'
				});
				result.controllers.push({
					name: 'Data Decrement',
					cc_number: 97,
					cc_hex: '0x61'
				});
			}
			continue;
		}

		// Detect problems
		const problemMatch = trimmedLine.match(/^(\d+)\)\s+(.+)$/);
		if (problemMatch && currentSection !== 'example') {
			result.problems.push({
				step: parseInt(problemMatch[1], 10),
				description: problemMatch[2].trim()
			});
			continue;
		}

		// Detect recommendation start — accumulate all wrapped text
		if (trimmedLine.match(/^Under this recommendation/i)) {
			currentSection = 'recommendation';
			result.recommendation = trimmedLine;
			continue;
		}

		// Accumulate continuation lines for recommendation
		if (currentSection === 'recommendation' && !trimmedLine.match(/^Receiving devices|^For example|^RP-018/i)) {
			result.recommendation += ' ' + trimmedLine;
			continue;
		}

		// Detect receiving device rules
		if (trimmedLine.match(/^Receiving devices/i)) {
			currentSection = 'receiving_rules';
			result.receiving_device_rules.push(trimmedLine);
			continue;
		}

		if (currentSection === 'receiving_rules' && !trimmedLine.match(/^For example|^RP-018/i)) {
			result.receiving_device_rules.push(trimmedLine);
			continue;
		}

		// Detect example
		if (trimmedLine.match(/^For example/i)) {
			currentSection = 'example';
			result.example.description = trimmedLine;
			continue;
		}

		// Example steps: "$B0 $65 $0 ..."
		if (currentSection === 'example' && trimmedLine.match(/^\$B0/i)) {
			const stepMatch = trimmedLine.match(/^(\$\S+)\s+(\$\S+)\s+(\$\S+)\s+(.+)$/);
			if (stepMatch) {
				result.example.steps.push({
					raw: trimmedLine,
					description: stepMatch[4].trim()
				});
			}
			continue;
		}

		// Detect approval line
		if (trimmedLine.match(/^RP-018 Approved/i)) {
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

	// Extract RPN behavior from accumulated recommendation text
	const rpn01Match = result.recommendation.match(/(When applied to Registered Parameter numbers 0, and 1,.*?Addendum to MIDI 1\.0, page 20\)\.)/s);
	if (rpn01Match) {
		result.rpn_behavior.push(rpn01Match[1].trim());
	}

	const rpnFutureMatch = result.recommendation.match(/(For future Registered Parameters,.*?LSB by 1\.)/s);
	if (rpnFutureMatch) {
		result.rpn_behavior.push(rpnFutureMatch[1].trim());
	}

	// Extract NRPN behavior
	const nrpnMatch = result.recommendation.match(/(For Non-Registered Parameters,.*?each parameter\.)/s);
	if (nrpnMatch) {
		result.nrpn_behavior = nrpnMatch[1].trim();
	}

	result.summary = {
		controller_count: result.controllers.length,
		problem_count: result.problems.length,
		rpn_behavior_count: result.rpn_behavior.length,
		receiving_rule_count: result.receiving_device_rules.length,
		example_step_count: result.example.steps.length
	};

	if (outDir) {
		await fs.mkdir(outDir, { recursive: true });
		await fs.writeFile(path.join(outDir, 'rp18.json'), JSON.stringify(result, null, 2), 'utf-8');
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
