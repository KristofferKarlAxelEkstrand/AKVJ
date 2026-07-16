import fs from 'node:fs/promises';
import path from 'node:path';

/**
 * Regex to match section headers like `2.1.1.1 Melodic Instrument: Default`.
 */
const SECTION_HEADER_REGEX = /^(\d+(?:\.\d+)*)\s+(.+)$/;

/**
 * Regex to match key assignment table headers.
 */
const KEY_TABLE_HEADER_REGEX = /^Key number\s*\t(Pitch name|Instrument name)$/;

/**
 * Regex to match key assignment entries.
 * Format: `1 \tRoot` or `* \t10th`
 */
const KEY_ENTRY_REGEX = /^([0-9*#])\s*\t(.+)$/;

/**
 * Regex to match GM1 drum division table header.
 */
const GM1_DIVISION_HEADER_REGEX = /^Key#\s*\tInstrument\s*\tDrum1\s*\tDrum2\s*\tPerc\.1\s*\tPerc\.2$/;

/**
 * Regex to match GM1 drum division entries.
 * Format: `35 \tAcoustic Bass Drum \t*`
 */
const GM1_DIVISION_ENTRY_REGEX = /^(\d+)\s*\t(.+?)\s*\t(.*)$/;

/**
 * Regex to match center octave table header.
 */
const CENTER_OCTAVE_HEADER_REGEX = /^PC#\s*\tInstrument\s*\tCenter$/;

/**
 * Regex to match center octave entries (two per line).
 * Format: `0 \tAcoustic Grand Piano \t0 \t32 \tAcoustic Bass \t-2`
 */
const CENTER_OCTAVE_ENTRY_REGEX = /^(\d+)\s*\t(.+?)\s*\t([+-]?\d+)\s*\t(\d+)\s*\t(.+?)\s*\t([+-]?\d+)$/;

/**
 * Regex to match single center octave entries (last batch may have single entries).
 * Format: `64 \tSoprano Sax \t+1`
 */
const CENTER_OCTAVE_SINGLE_REGEX = /^(\d+)\s*\t(.+?)\s*\t([+-]?\d+)$/;

/**
 * Regex to match recommended setting headers.
 * Format: `4.1.1 \tInstrument type`
 */
const SETTING_HEADER_REGEX = /^4\.1\.(\d+)\s*\t(.+)$/;

/**
 * Regex to match Figure lines.
 */
const FIGURE_REGEX = /^Figure\s+\d+/;

/**
 * Transforms the Mobile Musical Interface (RP-048/amd1) markdown document
 * into a structured JSON object.
 *
 * @param {string} markdownPath - Absolute path to the source markdown file.
 * @param {string} [outDir] - Optional output directory for the JSON file.
 * @returns {Promise<object>} The structured JSON result.
 */
export async function transformMobileMusicalInterface(markdownPath, outDir) {
	const content = await fs.readFile(markdownPath, 'utf-8');
	const lines = content.split('\n');

	const numericKeypadMelodic = [];
	const numericKeypadDrum = [];
	const gm1DrumDivision = [];
	const centerOctave = [];
	const recommendedSettings = [];
	const directionalPadMelodic = [];
	const directionalPadDrum = [];

	let currentSection = null;
	let currentKeyTable = null;
	let currentSettingEntry = null;
	let inGm1Division = false;
	let inDirectionalPadMelodic = false;
	let inDirectionalPadDrum = false;

	const finalizeKeyTable = () => {
		if (currentKeyTable) {
			if (currentKeyTable.type === 'melodic') {
				numericKeypadMelodic.push(currentKeyTable);
			} else if (currentKeyTable.type === 'drum') {
				numericKeypadDrum.push(currentKeyTable);
			}
			currentKeyTable = null;
		}
	};

	const finalizeSettingEntry = () => {
		if (currentSettingEntry) {
			recommendedSettings.push(currentSettingEntry);
			currentSettingEntry = null;
		}
	};

	for (const rawLine of lines) {
		const line = rawLine.trim();
		if (!line) {
			continue;
		}

		// Skip frontmatter, page headers, boilerplate
		if (line.startsWith('---') || line.startsWith('title:') || line.startsWith('protocol:') || line.startsWith('source:') || line.startsWith('sourceType:') || line.startsWith('pages:') || line.startsWith('sha256:') || line.startsWith('extractedAt:') || line.startsWith('summary:') || line.startsWith('# Mobile') || line.startsWith('## Page') || line.startsWith('Mobile Musical Interface') || line.startsWith('Specification') || line.startsWith('Ver.') || line.startsWith('Association of') || line.startsWith('MMI Promotion') || line.startsWith('MMA Version') || line.startsWith('Feb.') || line.startsWith('Contents') || line.startsWith('History') || line.startsWith('Version') || line.startsWith('1.0.') || line.startsWith('RP48amd1')) {
			continue;
		}

		// Skip TOC entries (lines with lots of dots)
		if (line.includes('....')) {
			continue;
		}

		// Skip figure references
		if (FIGURE_REGEX.test(line)) {
			continue;
		}

		// Detect major sections
		if (line.startsWith('1 ') && line.includes('Background')) {
			currentSection = 'background';
			continue;
		}
		if (line.startsWith('2.1.1') && line.includes('Numeric keypad key assignment for melodic')) {
			currentSection = 'numeric_melodic';
			continue;
		}
		if (line.startsWith('2.1.2') && line.includes('Numeric keypad key assignment for drum')) {
			currentSection = 'numeric_drum';
			continue;
		}
		if (line.startsWith('2.2.1') && line.includes('Directional pad assignment for melodic')) {
			currentSection = 'dpad_melodic';
			inDirectionalPadMelodic = true;
			inDirectionalPadDrum = false;
			continue;
		}
		if (line.startsWith('2.2.2') && line.includes('Directional pad assignment for drum')) {
			currentSection = 'dpad_drum';
			inDirectionalPadMelodic = false;
			inDirectionalPadDrum = true;
			continue;
		}
		if (line.startsWith('2.3') && line.includes('Center octave')) {
			finalizeKeyTable();
			currentSection = 'center_octave';
			continue;
		}
		if (line.startsWith('3 ') && line.includes('QWERTY')) {
			finalizeKeyTable();
			currentSection = 'qwerty';
			continue;
		}
		if (line.startsWith('4 ') && line.includes('Guidelines') && !line.includes('- ')) {
			finalizeKeyTable();
			currentSection = 'settings';
			continue;
		}

		// Parse numeric keypad melodic/drum subsection headers
		if (currentSection === 'numeric_melodic' || currentSection === 'numeric_drum') {
			const sectionMatch = line.match(SECTION_HEADER_REGEX);
			if (sectionMatch && (sectionMatch[2].toLowerCase().includes('melodic instrument:') || sectionMatch[2].includes('Drum Set') || sectionMatch[2].includes('Percussion Set'))) {
				finalizeKeyTable();
				const isMelodic = sectionMatch[2].toLowerCase().includes('melodic');
				currentKeyTable = {
					name: sectionMatch[2].trim(),
					type: isMelodic ? 'melodic' : 'drum',
					entries: []
				};
				continue;
			}

			// Skip table headers
			if (KEY_TABLE_HEADER_REGEX.test(line)) {
				continue;
			}

			// Parse key entries
			if (currentKeyTable) {
				const keyMatch = line.match(KEY_ENTRY_REGEX);
				if (keyMatch) {
					currentKeyTable.entries.push({
						key: keyMatch[1],
						value: keyMatch[2].trim()
					});
					continue;
				}
			}
		}

		// Parse GM1 drum division table
		if (line.startsWith('The following table illustrates the division')) {
			inGm1Division = true;
			continue;
		}
		if (inGm1Division) {
			if (GM1_DIVISION_HEADER_REGEX.test(line)) {
				continue;
			}
			const divisionMatch = line.match(GM1_DIVISION_ENTRY_REGEX);
			if (divisionMatch) {
				gm1DrumDivision.push({
					key_number: parseInt(divisionMatch[1], 10),
					instrument: divisionMatch[2].trim(),
					key_assignment: divisionMatch[3].trim() || null
				});
				continue;
			}
			// Check if we've left the division table
			if (line.startsWith('2.2') || line.startsWith('## Page')) {
				inGm1Division = false;
			}
		}

		// Parse center octave table
		if (currentSection === 'center_octave') {
			if (CENTER_OCTAVE_HEADER_REGEX.test(line) || line === 'Oct.') {
				continue;
			}

			// Try two-per-line format
			const doubleMatch = line.match(CENTER_OCTAVE_ENTRY_REGEX);
			if (doubleMatch) {
				centerOctave.push({
					pc_number: parseInt(doubleMatch[1], 10),
					instrument: doubleMatch[2].trim(),
					center_octave: doubleMatch[3].trim()
				});
				centerOctave.push({
					pc_number: parseInt(doubleMatch[4], 10),
					instrument: doubleMatch[5].trim(),
					center_octave: doubleMatch[6].trim()
				});
				continue;
			}

			// Try single entry format
			const singleMatch = line.match(CENTER_OCTAVE_SINGLE_REGEX);
			if (singleMatch && !line.startsWith('Figure')) {
				centerOctave.push({
					pc_number: parseInt(singleMatch[1], 10),
					instrument: singleMatch[2].trim(),
					center_octave: singleMatch[3].trim()
				});
				continue;
			}
		}

		// Parse directional pad assignments
		if (inDirectionalPadMelodic) {
			if (line.startsWith('[Note]') || line.startsWith('(*') || line.startsWith('•') || line.startsWith('A system') || line.startsWith('Alternatively') || line.startsWith('It is also') || line.startsWith('The depth') || line.startsWith('The volumes')) {
				continue;
			}
			if (line.startsWith('1)') || line.startsWith('2)')) {
				continue;
			}
			if (line.startsWith('[↑]') || line.startsWith('[↓]') || line.startsWith('[→]') || line.startsWith('[←]') || line.startsWith('z ')) {
				const cleaned = line.replace(/^z\s*/, '').trim();
				directionalPadMelodic.push(cleaned);
				continue;
			}
			// Skip figure-related lines
			if (line.startsWith('↑') || line.startsWith('#') || line.startsWith('→') || line.startsWith('↓') || line.startsWith('Basic') || line.startsWith('Pitch') || line.startsWith('b down') || line.startsWith('Oct.')) {
				continue;
			}
		}

		if (inDirectionalPadDrum) {
			if (line.startsWith('[Note]') || line.startsWith('The volumes')) {
				continue;
			}
			if (line.startsWith('[↑]') || line.startsWith('[↓]') || line.startsWith('[→]') || line.startsWith('[←]') || line.startsWith('z ') || line.startsWith('¾')) {
				const cleaned = line.replace(/^z\s*/, '').replace(/^¾\s*/, '').trim();
				if (cleaned) {
					directionalPadDrum.push(cleaned);
				}
				continue;
			}
			if (line.startsWith('↑') || line.startsWith('→') || line.startsWith('↓') || line.startsWith('Basic') || line.startsWith('Accent') || line.startsWith('Assign') || line.startsWith('Change') || line.startsWith('Reserved')) {
				continue;
			}
		}

		// Parse recommended settings
		if (currentSection === 'settings') {
			const settingMatch = line.match(SETTING_HEADER_REGEX);
			if (settingMatch) {
				finalizeSettingEntry();
				currentSettingEntry = {
					setting_number: parseInt(settingMatch[1], 10),
					setting_name: settingMatch[2].trim(),
					description: '',
					numeric_keypad_range: null,
					qwerty_keypad_range: null,
					range: null,
					default_value: null
				};
				continue;
			}

			if (currentSettingEntry) {
				if (line.startsWith('Numeric keypad range:')) {
					currentSettingEntry.numeric_keypad_range = line.replace(/^Numeric keypad range:\s*/, '').trim();
					continue;
				}
				if (line.startsWith('QWERTY keypad range:')) {
					currentSettingEntry.qwerty_keypad_range = line.replace(/^QWERTY keypad range:\s*/, '').trim();
					continue;
				}
				if (line.startsWith('Range:')) {
					const rangeText = line.replace(/^Range:\s*/, '').trim();
					currentSettingEntry.range = rangeText;
					const defaultMatch = rangeText.match(/\(Default:\s*(.+)\)/);
					if (defaultMatch) {
						currentSettingEntry.default_value = defaultMatch[1].trim();
					}
					continue;
				}
				if (line.startsWith('(Default:')) {
					currentSettingEntry.default_value = line
						.replace(/^\(Default:\s*/, '')
						.replace(/\)$/, '')
						.trim();
					continue;
				}
				if (line.startsWith('However,')) {
					continue;
				}
				if (line.startsWith('Scale type setting')) {
					currentSettingEntry.description += (currentSettingEntry.description ? ' ' : '') + line;
					continue;
				}
				// Accumulate description text
				if (!line.startsWith('4.1.') && !line.startsWith('4 ')) {
					currentSettingEntry.description += (currentSettingEntry.description ? ' ' : '') + line;
					continue;
				}
			}
		}
	}

	finalizeKeyTable();
	finalizeSettingEntry();

	const result = {
		metadata: {
			title: 'Mobile Musical Interface Specification',
			doc_id: 'RP-048/amd1',
			protocol: 'midi1',
			source: path.basename(markdownPath),
			version: '1.0.6',
			date: 'Nov. 30th 2009'
		},
		numeric_keypad_melodic_assignments: numericKeypadMelodic,
		numeric_keypad_drum_assignments: numericKeypadDrum,
		gm1_drum_division: gm1DrumDivision,
		directional_pad_melodic: directionalPadMelodic,
		directional_pad_drum: directionalPadDrum,
		center_octave_table: centerOctave,
		recommended_settings: recommendedSettings,
		summary: {
			melodic_assignment_count: numericKeypadMelodic.length,
			drum_assignment_count: numericKeypadDrum.length,
			gm1_drum_division_count: gm1DrumDivision.length,
			directional_pad_melodic_count: directionalPadMelodic.length,
			directional_pad_drum_count: directionalPadDrum.length,
			center_octave_count: centerOctave.length,
			recommended_setting_count: recommendedSettings.length
		}
	};

	if (outDir) {
		await fs.mkdir(outDir, { recursive: true });
		await fs.writeFile(path.join(outDir, 'mobile-musical-interface.json'), JSON.stringify(result, null, 2), 'utf-8');
	}

	return result;
}
