import fs from 'node:fs/promises';
import path from 'node:path';

/**
 * Regex to match SysEx ID table entries.
 * 1-byte format: `01H | Sequential Circuits`
 * 3-byte format: `00H 00H 01H | Time/Warner Interactive`
 * Range format: `40H to 5FH | [Assigned by AMEI for Japanese Manufacturers]`
 */
const ENTRY_REGEX = /^([0-9A-Fa-f]{2}H(?:\s+to\s+[0-9A-Fa-f]{2}H)?(?:\s+[0-9A-Fa-f]{2}H)*)\s*\|\s*(.+)$/;

/**
 * Section headers detected in the document.
 */
const SECTION_ONE_BYTE = '### Assigned Manufacturer MIDI SysEx ID Numbers';
const SECTION_JAPANESE_AMEI_GROUP = '## Japanese (AMEI) Group';
const SECTION_JAPANESE_AMEI_SYSEX_HOLDERS = '## Japanese (AMEI) SysEx Id Holders';

/**
 * Transforms the SysEx ID Table markdown document into a structured JSON object.
 *
 * The document contains 4 sections of pipe-delimited manufacturer ID entries:
 * 1. 1-byte IDs (00H-7FH) — assigned manufacturer SysEx IDs
 * 2. 3-byte IDs (00H 00H 01H through 00H 22H 39H) — extended manufacturer IDs
 * 3. Japanese (AMEI) Group — 1-byte 40H-5FH and 3-byte 00H 40H xxH
 * 4. Japanese (AMEI) SysEx Id Holders — 3-byte 00H 48H xxH
 *
 * @param {string} markdownPath - Absolute path to the source markdown file.
 * @param {string} [outDir] - Optional output directory for the JSON file.
 * @returns {Promise<object>} The structured JSON result.
 */
export async function transformSysexIdTable(markdownPath, outDir) {
	const content = await fs.readFile(markdownPath, 'utf-8');
	const lines = content.split('\n').map(l => l.trim());

	const oneByteIds = [];
	const threeByteIds = [];
	const japaneseAmeiGroup = [];
	const japaneseAmeiSysexHolders = [];

	let currentSection = null;

	for (const line of lines) {
		if (!line) {
			continue;
		}

		// Detect section headers
		if (line === SECTION_ONE_BYTE) {
			currentSection = 'one_byte';
			continue;
		}
		if (line === SECTION_JAPANESE_AMEI_GROUP) {
			currentSection = 'japanese_amei_group';
			continue;
		}
		if (line === SECTION_JAPANESE_AMEI_SYSEX_HOLDERS) {
			currentSection = 'japanese_amei_sysex_holders';
			continue;
		}

		// Skip boilerplate
		if (line.startsWith('#') || line.startsWith('Download') || line.startsWith('Sign up') || line.startsWith('About') || line.startsWith('MIDI Association') || line.startsWith('Privacy') || line.startsWith('©') || line.startsWith('Media') || line.startsWith('MIDI Logo') || line === 'ID Number | Company Name' || line === 'SysEx ID Number | Company Name') {
			continue;
		}

		// Skip empty separator lines (just a pipe)
		if (line === '|' || line === '| |') {
			continue;
		}

		// Parse entries
		const match = line.match(ENTRY_REGEX);
		if (match) {
			const id = match[1].trim().replace(/[0-9A-Fa-f]{2}H/g, h => h.toUpperCase());
			const companyName = match[2].trim();
			const entry = { id, company_name: companyName };

			// Determine if 1-byte or 3-byte based on number of hex groups
			const hexCount = (id.match(/[0-9A-Fa-f]{2}H/g) || []).length;
			const isRange = id.includes(' to ');

			if (currentSection === 'one_byte') {
				if (hexCount === 3 && !isRange) {
					threeByteIds.push(entry);
				} else {
					oneByteIds.push(entry);
				}
			} else if (currentSection === 'japanese_amei_group') {
				japaneseAmeiGroup.push(entry);
			} else if (currentSection === 'japanese_amei_sysex_holders') {
				japaneseAmeiSysexHolders.push(entry);
			} else if (hexCount === 3 && !isRange) {
				// 3-byte IDs appear after the 1-byte section without a header
				threeByteIds.push(entry);
			} else if (hexCount === 1 || isRange) {
				oneByteIds.push(entry);
			}
		}
	}

	const result = {
		metadata: {
			title: 'SysEx ID Table',
			doc_id: 'SYSEX-ID-TABLE',
			version: '1.0.0',
			source: path.basename(markdownPath)
		},
		one_byte_ids: oneByteIds,
		three_byte_ids: threeByteIds,
		japanese_amei_group: japaneseAmeiGroup,
		japanese_amei_sysex_holders: japaneseAmeiSysexHolders,
		summary: {
			one_byte_count: oneByteIds.length,
			three_byte_count: threeByteIds.length,
			japanese_amei_group_count: japaneseAmeiGroup.length,
			japanese_amei_sysex_holders_count: japaneseAmeiSysexHolders.length,
			total: oneByteIds.length + threeByteIds.length + japaneseAmeiGroup.length + japaneseAmeiSysexHolders.length
		}
	};

	if (outDir) {
		await fs.mkdir(outDir, { recursive: true });
		await fs.writeFile(path.join(outDir, 'sysex-id-table.json'), JSON.stringify(result, null, 2), 'utf-8');
	}

	return result;
}
