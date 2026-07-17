import fs from 'node:fs/promises';
import path from 'node:path';

/**
 * Transforms the "Standards that Incorporate MIDI" reference page
 * into a structured JSON object.
 *
 * @param {string} markdownPath - Absolute path to the source markdown file.
 * @param {string} [outDir] - Optional output directory for the JSON file.
 * @returns {Promise<object>} The structured JSON result.
 */
export async function transformStandardsIncorporateMidi(markdownPath, outDir) {
	const content = await fs.readFile(markdownPath, 'utf-8');

	const result = {
		metadata: {},
		standards: [],
		summary: {}
	};

	parseFrontmatter(content, result);

	const lines = content.split('\n');

	for (const line of lines) {
		const trimmedLine = line.trim();

		if (!trimmedLine) {
			continue;
		}

		// Detect the pipe-separated table line
		if (trimmedLine.includes('|') && trimmedLine.match(/SDO.*Specification.*Number.*Reference/i)) {
			// Extract the data part after "MMA References "
			const mmaRefIdx = trimmedLine.indexOf('MMA References ');
			if (mmaRefIdx === -1) {
				continue;
			}

			const dataPart = trimmedLine.substring(mmaRefIdx + 'MMA References '.length);

			// Split on " | " to get tokens
			const tokens = dataPart.split(/\s*\|\s*/);

			// Known SDO names that appear at the start of each entry
			const knownSdos = ['1394TA', '3GPP/ETSI', 'CMIA', 'IEC', 'IEEE', 'IETF', 'ISO/IEC JTC1', 'Khronos', 'USB-IF'];

			// Group tokens into entries: each entry starts with a known SDO
			// Pattern: <SDO> | <spec name> | <spec num> | <form of ref> | <mma refs>
			// But <mma refs> may be merged with next SDO: "RP-27 and Complete MIDI 3GPP/ETSI"
			const entries = [];
			let currentTokens = [];

			for (const token of tokens) {
				const startsWithSdo = knownSdos.find(sdo => token.startsWith(sdo));
				const endsWithSdo = knownSdos.find(sdo => token.endsWith(sdo) && token !== sdo);

				if (startsWithSdo && currentTokens.length >= 4) {
					entries.push(parseEntry(currentTokens));
					currentTokens = [token];
				} else if (endsWithSdo && currentTokens.length >= 3) {
					const mmaRefs = token.substring(0, token.length - endsWithSdo.length).trim();
					currentTokens.push(mmaRefs);
					entries.push(parseEntry(currentTokens));
					currentTokens = [endsWithSdo];
				} else {
					currentTokens.push(token);
				}
			}

			// Don't forget the last entry
			if (currentTokens.length >= 4) {
				entries.push(parseEntry(currentTokens));
			}

			result.standards = entries;
			break;
		}
	}

	result.summary = {
		standard_count: result.standards.length
	};

	if (outDir) {
		await fs.mkdir(outDir, { recursive: true });
		await fs.writeFile(path.join(outDir, 'standards-that-incorporate-midi.json'), JSON.stringify(result, null, 2), 'utf-8');
	}

	return result;
}

function parseEntry(tokens) {
	return {
		sdo: tokens[0] || '',
		specification_name: tokens[1] || '',
		specification_number: tokens[2] || '',
		form_of_reference: tokens[3] || '',
		mma_references: tokens.slice(4).join(' | ') || ''
	};
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
