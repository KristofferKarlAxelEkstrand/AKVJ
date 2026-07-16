import fs from 'node:fs/promises';
import path from 'node:path';

/**
 * Regex to match version history entries.
 * Format: `June 15, 2023 1.0.1 Initial release`
 */
const VERSION_HISTORY_REGEX = /^(\w+\s+\d+,\s+\d+)\s+(\d+\.\d+(?:\.\d+)?)\s+(.+)$/;

/**
 * Regex to match center value table entries.
 * Format: `7 bits 0x40 8'b 01000000`
 */
const CENTER_VALUE_REGEX = /^(\d+\s*bits)\s+(0x[0-9A-Fa-f]+)\s+(.+)$/;

/**
 * Regex to match scaling table entries.
 * Format: `0 0x00 0 0x0000` (src_dec src_hex dst_dec dst_hex)
 */
const SCALING_ENTRY_REGEX = /^(\d+)\s+(0x[0-9A-Fa-f]+)\s+(\d+)\s+(0x[0-9A-Fa-f]+)$/;

/**
 * Regex to match table markers.
 * Format: `Table 5 Numeric Example: Upscale 7 to 16 bits`
 */
const TABLE_MARKER_REGEX = /^Table\s+(\d+)\s+(.+)$/;

/**
 * Regex to detect pseudo code section headers.
 * Format: `3.3.1 Pseudo Code for the Upscaling Algorithm`
 */
const PSEUDO_CODE_HEADER_REGEX = /^\d+\.\d+\.\d+\s+Pseudo Code\s+for\s+(?:the\s+)?(.+?)\s+Algorithm$/i;

/**
 * Regex to detect code-like lines (function signatures, comments, braces, etc.).
 */
const CODE_LINE_REGEX = /^(\/\/|\{|\}|return |uint\d*_t |uint |if\s*\(|while\s*\(|scaleBits|repeat\w*|bitShifted|srcCenter|srcVal|shifted|maxValue|halfScaleRange|power_of_2|scaleUp|scaleDown|scaleDownRounding|\w+\s*[=;]|\w+\s*\()/;

/**
 * Regex to detect the end of pseudo code blocks.
 * Matches section headers, notes, or text paragraphs.
 */
const PSEUDO_CODE_END_REGEX = /^\d+\.\d|^Note:|^First, the scaled|^For values above/;

/**
 * Transforms the MIDI 2.0 Bit Scaling and Resolution markdown document
 * into a structured JSON object.
 *
 * @param {string} markdownPath - Absolute path to the source markdown file.
 * @param {string} [outDir] - Optional output directory for the JSON file.
 * @returns {Promise<object>} The structured JSON result.
 */
export async function transformBitScalingAndResolution(markdownPath, outDir) {
	const content = await fs.readFile(markdownPath, 'utf-8');
	const lines = content.split('\n');

	const versionHistory = [];
	const conformanceWords = [];
	const nonConformanceWords = [];
	const centerValueExamples = [];
	const scalingTables = [];
	const pseudoCodeBlocks = [];

	let currentTable = null;
	let currentScalingTable = null;
	let inPseudoCode = false;
	let currentPseudoCodeName = null;
	let currentPseudoCodeLines = [];
	let currentConformanceWord = null;
	let currentConformanceRelation = null;
	let currentConformanceDescription = [];
	let currentNonConformanceWord = null;
	let currentNonConformanceReservedFor = null;
	let currentNonConformanceRelation = [];
	let currentNonConformanceNotUsedFor = [];
	let inNonConformanceNotUsed = false;

	const finalizePseudoCode = () => {
		if (currentPseudoCodeName && currentPseudoCodeLines.length > 0) {
			pseudoCodeBlocks.push({
				name: currentPseudoCodeName,
				code: currentPseudoCodeLines.join('\n')
			});
		}
		inPseudoCode = false;
		currentPseudoCodeName = null;
		currentPseudoCodeLines = [];
	};

	const finalizeConformanceWord = () => {
		if (currentConformanceWord) {
			conformanceWords.push({
				word: currentConformanceWord,
				reserved_for: currentConformanceRelation || '',
				description: currentConformanceDescription.join(' ').trim()
			});
			currentConformanceWord = null;
			currentConformanceRelation = null;
			currentConformanceDescription = [];
		}
	};

	const finalizeNonConformanceWord = () => {
		if (currentNonConformanceWord) {
			nonConformanceWords.push({
				word: currentNonConformanceWord,
				reserved_for: currentNonConformanceReservedFor || '',
				relation: currentNonConformanceRelation.join(' ').trim(),
				not_used_for: currentNonConformanceNotUsedFor.join(' ').trim()
			});
			currentNonConformanceWord = null;
			currentNonConformanceReservedFor = null;
			currentNonConformanceRelation = [];
			currentNonConformanceNotUsedFor = [];
			inNonConformanceNotUsed = false;
		}
	};

	const finalizeScalingTable = () => {
		if (currentScalingTable) {
			scalingTables.push(currentScalingTable);
			currentScalingTable = null;
		}
	};

	for (const rawLine of lines) {
		const line = rawLine.trim();
		if (!line) {
			continue;
		}

		// Skip page headers and boilerplate
		if (line.startsWith('## Page') || line.startsWith('MIDI 2.0 Bit Scaling') || line.startsWith('MIDI Association Document') || line.startsWith('Document Version') || line.startsWith('Draft Date') || line.startsWith('Published') || line.startsWith('Developed and Published') || line.startsWith('The MIDI Association') || line.startsWith('Association of Musical') || line.startsWith('PREFACE') || line.startsWith('©') || line.startsWith('ALL RIGHTS') || line.startsWith('https://') || line.startsWith('http://') || line.startsWith('Contents') || line.startsWith('Figures') || line.startsWith('Figure ') || line.startsWith('Tables') || line.includes('....')) {
			continue;
		}

		// Detect table markers
		const tableMatch = line.match(TABLE_MARKER_REGEX);
		if (tableMatch) {
			finalizePseudoCode();
			finalizeScalingTable();
			finalizeConformanceWord();
			finalizeNonConformanceWord();
			const tableNum = parseInt(tableMatch[1], 10);
			const tableTitle = tableMatch[2].trim();

			if (tableNum === 1) {
				currentTable = 'version_history';
			} else if (tableNum === 2) {
				currentTable = 'conformance_words';
			} else if (tableNum === 3) {
				currentTable = 'non_conformance_words';
			} else if (tableNum === 4) {
				currentTable = 'center_values';
			} else if (tableNum >= 5 && tableNum <= 10) {
				currentTable = 'scaling_table';
				currentScalingTable = {
					table_number: tableNum,
					title: tableTitle,
					entries: []
				};
			} else {
				currentTable = null;
			}
			continue;
		}

		// Parse version history
		if (currentTable === 'version_history') {
			const vhMatch = line.match(VERSION_HISTORY_REGEX);
			if (vhMatch) {
				versionHistory.push({
					date: vhMatch[1].trim(),
					version: vhMatch[2],
					changes: vhMatch[3].trim()
				});
				continue;
			}
		}

		// Parse conformance words (Table 2)
		if (currentTable === 'conformance_words') {
			// Skip header line
			if (line.startsWith('Word Reserved For')) {
				continue;
			}

			// Check for new word entry
			const wordMatch = line.match(/^(shall|should|may)\s+(.+)$/);
			if (wordMatch) {
				finalizeConformanceWord();
				currentConformanceWord = wordMatch[1];
				currentConformanceRelation = wordMatch[2].trim();
				continue;
			}

			// Accumulate description lines
			if (currentConformanceWord) {
				// Skip known relation keywords on their own line
				if (line === 'Mandatory' || line === 'Recommended but not mandatory' || line === 'Optional') {
					continue;
				}
				currentConformanceDescription.push(line);
				continue;
			}
		}

		// Parse non-conformance words (Table 3)
		if (currentTable === 'non_conformance_words') {
			// Skip header line
			if (line.startsWith('Word Reserved For')) {
				continue;
			}

			// Check for new word entry
			const wordMatch = line.match(/^(must|will|can|might)\s+(.+)$/);
			if (wordMatch) {
				finalizeNonConformanceWord();
				currentNonConformanceWord = wordMatch[1];
				// The rest contains reserved_for + relation start
				const rest = wordMatch[2].trim();
				// Split on known reserved_for patterns
				const reservedForMatch = rest.match(/^(Statements of\s+\w+)\s+(.+)$/);
				if (reservedForMatch) {
					currentNonConformanceReservedFor = reservedForMatch[1];
					currentNonConformanceRelation.push(reservedForMatch[2]);
				} else {
					currentNonConformanceReservedFor = rest;
				}
				inNonConformanceNotUsed = false;
				continue;
			}

			// Accumulate continuation lines
			if (currentNonConformanceWord) {
				if (line.startsWith('Not used for')) {
					inNonConformanceNotUsed = true;
					currentNonConformanceNotUsedFor.push(line);
				} else if (inNonConformanceNotUsed) {
					currentNonConformanceNotUsedFor.push(line);
				} else {
					currentNonConformanceRelation.push(line);
				}
				continue;
			}
		}

		// Parse center value examples (Table 4)
		if (currentTable === 'center_values') {
			// Skip headers
			if (line.startsWith('Value Size') || line.startsWith('Hex') || line.startsWith('Binary')) {
				continue;
			}
			const cvMatch = line.match(CENTER_VALUE_REGEX);
			if (cvMatch) {
				centerValueExamples.push({
					value_size: cvMatch[1].trim(),
					center_value_hex: cvMatch[2].toUpperCase(),
					center_value_binary: cvMatch[3].trim()
				});
				continue;
			}
		}

		// Parse scaling tables (Tables 5-10)
		if (currentTable === 'scaling_table' && currentScalingTable) {
			// Skip header lines
			if (line.match(/^\d+-bit\s+decimal/) || (line.startsWith('7-bit') && line.includes('hex')) || (line.startsWith('16-bit') && line.includes('hex')) || (line.startsWith('32-bit') && line.includes('hex'))) {
				continue;
			}

			const scalingMatch = line.match(SCALING_ENTRY_REGEX);
			if (scalingMatch) {
				currentScalingTable.entries.push({
					src_decimal: parseInt(scalingMatch[1], 10),
					src_hex: scalingMatch[2].toUpperCase(),
					dst_decimal: parseInt(scalingMatch[3], 10),
					dst_hex: scalingMatch[4].toUpperCase()
				});
				continue;
			}
		}

		// Detect pseudo code by section headers
		const pseudoHeaderMatch = line.match(PSEUDO_CODE_HEADER_REGEX);
		if (pseudoHeaderMatch) {
			finalizePseudoCode();
			finalizeScalingTable();
			currentTable = null;
			inPseudoCode = true;
			currentPseudoCodeName = pseudoHeaderMatch[1].trim();
			currentPseudoCodeLines = [];
			continue;
		}

		// Accumulate pseudo code lines
		if (inPseudoCode) {
			if (PSEUDO_CODE_END_REGEX.test(line)) {
				finalizePseudoCode();
				// Don't continue — let the line be processed normally
			} else if (CODE_LINE_REGEX.test(line) || line === '}') {
				currentPseudoCodeLines.push(line);
				continue;
			} else {
				finalizePseudoCode();
			}
		}
	}

	finalizePseudoCode();
	finalizeScalingTable();
	finalizeConformanceWord();
	finalizeNonConformanceWord();

	const result = {
		metadata: {
			title: 'MIDI 2.0 Bit Scaling and Resolution',
			doc_id: 'M2-115-U',
			version: '1.0.2',
			source: path.basename(markdownPath)
		},
		version_history: versionHistory,
		conformance_words: conformanceWords,
		non_conformance_words: nonConformanceWords,
		center_value_examples: centerValueExamples,
		scaling_tables: scalingTables,
		pseudo_code_blocks: pseudoCodeBlocks,
		summary: {
			version_history_count: versionHistory.length,
			conformance_word_count: conformanceWords.length,
			non_conformance_word_count: nonConformanceWords.length,
			center_value_example_count: centerValueExamples.length,
			scaling_table_count: scalingTables.length,
			scaling_table_entry_total: scalingTables.reduce((sum, t) => sum + t.entries.length, 0),
			pseudo_code_block_count: pseudoCodeBlocks.length
		}
	};

	if (outDir) {
		await fs.mkdir(outDir, { recursive: true });
		await fs.writeFile(path.join(outDir, 'bit-scaling-and-resolution.json'), JSON.stringify(result, null, 2), 'utf-8');
	}

	return result;
}
