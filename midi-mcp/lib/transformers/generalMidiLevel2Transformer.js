import fs from 'node:fs/promises';
import path from 'node:path';

/**
 * Regex to match CC message section headers.
 * Format: `3.3.1 Bank Select (cc#0/32)` or `3.3.4 	Channel Volume (cc#7)`
 */
const CC_HEADER_REGEX = /^3\.3\.(\d+)\s*\t?\s*(.+?)\s*\(.*?cc#(\d+(?:\/\d+)?)\)$/;

/**
 * Regex to match Default Value lines.
 * Format: `Default Value: 0` or `Default Value: 100 (64H)`
 */
const DEFAULT_VALUE_REGEX = /^Default Value:?\s*(.+)$/;

/**
 * Regex to match RPN section headers.
 * Format: `3.4.1 00H / 00H Pitch Bend Sensitivity`
 */
const RPN_HEADER_REGEX = /^3\.4\.(\d+)\s*\t?\s*([0-9A-Fa-f]{2}H\s*\/\s*[0-9A-Fa-f]{2}H)\s+(.+)$/;

/**
 * Regex to match Channel Mode section headers.
 * Format: `3.5.1 All Sound Off (cc#120)`
 */
const MODE_HEADER_REGEX = /^3\.5\.(\d+)\s*\t?\s*(.+?)\s*\(cc#(\d+)\)$/;

/**
 * Regex to match Reset All Controllers table entries.
 * Format: `1 \t01H \tModulation \t0 (off)`
 */
const RESET_ENTRY_REGEX = /^(\d+|-)\s*\t([0-9A-Fa-f]{2}H)?\s*\t?(.+?)\s*\t(.+)$/;

/**
 * Regex to match Reverb Type entries.
 * Format: `0: Small Room \tA small size room...`
 */
const REVERB_TYPE_REGEX = /^(\d+):\s*(.+?)\s*\t(.+)$/;

/**
 * Regex to match Reverb Time default entries.
 * Format: `0 \t44 (1.1s)`
 */
const REVERB_TIME_REGEX = /^(\d+)\s*\t(\d+)\s+\((.+?)\)$/;

/**
 * Regex to match Chorus Type entries.
 * Format: `0: Chorus 1 \t0 (0%) \t3 (0.4Hz) \t5 (1.9ms) \t0 (0%)`
 */
const CHORUS_TYPE_REGEX = /^(\d+):\s*(.+?)\s*\t(.+?)\s*\t(.+?)\s*\t(.+?)\s*\t(.+)$/;

/**
 * Regex to match Controller Destination parameter entries.
 * Format: `00 Pitch Control \t28H - 58H \t-24 - +24 semitones \t40H`
 */
const CONTROLLER_DEST_REGEX = /^(\d{2})\s+(.+?)\s*\t(.+?)\s*\t(.+?)\s*\t(.+)$/;

/**
 * Regex to match Key-Based Instrument Controller entries.
 * Format: `07 \t07H \tVolume \t00H-40H-7FH \t0 -100 - (127/64) * 100 (%) (Relative) \t40H`
 */
const KEY_BASED_REGEX = /^(\d+)\s*\t([0-9A-Fa-f]{2}H)\s*\t(.+?)\s*\t(.+?)\s*\t(.+?)\s*\t(.+)$/;

/**
 * Regex to match GM2 Sound Set category headers.
 * Format: `### Piano`
 */
const SOUND_CATEGORY_REGEX = /^###\s+(.+)$/;

/**
 * Regex to match GM2 Sound Set program entries with program number.
 * Format: `1(00H) \t79H 00H \tAcoustic Grand Piano \t21-108`
 */
const SOUND_ENTRY_PRIMARY_REGEX = /^(\d+)\(([0-9A-Fa-f]{2}H)\)\s*\t([0-9A-Fa-f]{2}H)\s([0-9A-Fa-f]{2}H)\s*\t(.+?)\s*\t(.+)$/;

/**
 * Regex to match GM2 Sound Set variation entries (no program number).
 * Format: `79H 01H \tAcoustic Grand Piano (wide) \t21-108`
 */
const SOUND_ENTRY_VARIATION_REGEX = /^([0-9A-Fa-f]{2}H)\s([0-9A-Fa-f]{2}H)\s*\t(.+?)\s*\t(.+)$/;

/**
 * Regex to match Percussion Set header lines.
 * Format: `PC#1 	PC#9 	PC#17`
 */
const PERCUSSION_PC_HEADER_REGEX = /^PC#(\d+)\s*\tPC#(\d+)\s*\tPC#(\d+)$/;

/**
 * Regex to match Percussion Set name lines.
 * Format: `STANDARD Set 	ROOM Set 	POWER Set`
 */
const PERCUSSION_SET_NAMES_REGEX = /^(.+?)\sSet\s*\t(.+?)\sSet\s*\t(.+?)\sSet$/;

/**
 * Regex to match Percussion Set column header.
 * Format: `NOTE# 	Inst.Name 	PAN Inst.Name 	PAN Inst.Name 	PAN`
 */
const PERCUSSION_COL_HEADER_REGEX = /^NOTE#\s*\tInst\.Name\s*\tPAN\s+Inst\.Name\s*\tPAN\s+Inst\.Name\s*\tPAN$/;

/**
 * Regex to match GM System Message headers.
 * Format: `4.9.1 GM2 System On`
 */
const GM_SYSTEM_HEADER_REGEX = /^4\.9\.(\d+)\s+(.+)$/;

/**
 * Regex to match Universal SysEx header lines.
 * Format: `F0 7E 	Universal Non-Real Time SysEx header`
 */
const SYSEX_LINE_REGEX = /^(F0\s+7[EF])\s*\t(.+)$/;

/**
 * Transforms the General MIDI Level 2 (RP-024) markdown document
 * into a structured JSON object.
 *
 * @param {string} markdownPath - Absolute path to the source markdown file.
 * @param {string} [outDir] - Optional output directory for the JSON file.
 * @returns {Promise<object>} The structured JSON result.
 */
export async function transformGeneralMidiLevel2(markdownPath, outDir) {
	const content = await fs.readFile(markdownPath, 'utf-8');
	const lines = content.split('\n');

	const controlChanges = [];
	const rpnEntries = [];
	const channelModeMessages = [];
	const resetAllControllers = [];
	const reverbTypes = [];
	const reverbTimeDefaults = [];
	const chorusTypes = [];
	const controllerDestParams = [];
	const keyBasedControllers = [];
	const gm2SoundSet = [];
	const percussionSets = [];
	const gmSystemMessages = [];
	const generalRequirements = [];

	let currentSection = null;
	let currentCcEntry = null;
	let currentRpnEntry = null;
	let currentModeEntry = null;
	let currentSoundCategory = null;
	let currentSoundProgram = null;
	let inResetTable = false;
	let inReverbTypes = false;
	let inReverbTime = false;
	let inChorusTypes = false;
	let inControllerDest = false;
	let inKeyBased = false;
	let inSoundSet = false;
	let inPercussionSet = false;
	let percussionPcNumbers = null;
	let percussionSetNames = null;
	let currentGmSystemMessage = null;

	const finalizeCcEntry = () => {
		if (currentCcEntry) {
			controlChanges.push(currentCcEntry);
			currentCcEntry = null;
		}
	};

	const finalizeRpnEntry = () => {
		if (currentRpnEntry) {
			rpnEntries.push(currentRpnEntry);
			currentRpnEntry = null;
		}
	};

	const finalizeModeEntry = () => {
		if (currentModeEntry) {
			channelModeMessages.push(currentModeEntry);
			currentModeEntry = null;
		}
	};

	const finalizeSoundProgram = () => {
		if (currentSoundProgram) {
			gm2SoundSet.push(currentSoundProgram);
			currentSoundProgram = null;
		}
	};

	const finalizeGmSystemMessage = () => {
		if (currentGmSystemMessage) {
			gmSystemMessages.push(currentGmSystemMessage);
			currentGmSystemMessage = null;
		}
	};

	for (let i = 0; i < lines.length; i++) {
		const rawLine = lines[i];
		const line = rawLine.trim();
		if (!line) {
			continue;
		}

		// Skip frontmatter, page headers, boilerplate
		if (line.startsWith('---') || line.startsWith('title:') || line.startsWith('version:') || line.startsWith('protocol:') || line.startsWith('source:') || line.startsWith('sourceType:') || line.startsWith('pages:') || line.startsWith('sha256:') || line.startsWith('extractedAt:') || line.startsWith('summary:') || line.startsWith('# General') || line.startsWith('## Page') || line.startsWith('General MIDI 2') || line.startsWith('February') || line.startsWith('Version 1') || line.startsWith('Including') || line.startsWith('Published') || line.startsWith('The MIDI Manufacturers') || line.startsWith('Los Angeles') || line.startsWith('PREFACE') || line.startsWith('Abstract:') || line.startsWith('General MIDI 2 is') || line.startsWith('New MIDI Messages') || line.startsWith('Numerous new') || line.startsWith('MIDI Tuning') || line.startsWith('Scale/Octave') || line.startsWith('Controller Destination') || line.startsWith('Key-Based Instrument') || line.startsWith('Global Parameter') || line.startsWith('Master Fine') || line.startsWith('Modulation Depth') || line.startsWith('General MIDI 2 Message') || line.startsWith('Universal Non-Realtime') || line.startsWith('Changes from') || line.startsWith('o ') || line.startsWith('General MIDI 2 Specification') || line.startsWith('RP-024') || line.startsWith('Copyright') || line.startsWith('ALL RIGHTS') || line.startsWith('NO PART') || line.startsWith('INFORMATION STORAGE') || line.startsWith('WITHOUT PERMISSION') || line.startsWith('Printed') || line.startsWith('MMA') || line.startsWith('PO Box') || line.startsWith('La Habra') || line.startsWith('Table Of Contents') || line.startsWith('General MIDI 2 v1.2a')) {
			continue;
		}

		// Skip TOC entries (lines with page numbers after tabs)
		if (line.match(/^\d+\.\d/) && line.match(/\t\d+$/)) {
			continue;
		}

		// Detect CC message headers
		const ccMatch = line.match(CC_HEADER_REGEX);
		if (ccMatch) {
			finalizeCcEntry();
			currentCcEntry = {
				cc_number: ccMatch[3],
				name: ccMatch[2].trim(),
				section: parseInt(ccMatch[1], 10),
				default_value: null,
				description: []
			};
			currentSection = 'cc_message';
			continue;
		}

		if (currentSection === 'cc_message' && currentCcEntry) {
			const defaultMatch = line.match(DEFAULT_VALUE_REGEX);
			if (defaultMatch) {
				currentCcEntry.default_value = defaultMatch[1].trim();
				continue;
			}
			if (line.startsWith('[recommended]') || line.startsWith('[optional]') || line.startsWith('[not allowed]') || line.startsWith('[required]') || line.startsWith('[New') || line.startsWith('[CC') || line.startsWith('[Refer')) {
				continue;
			}
			if (line.startsWith('3.3.') || line.startsWith('3.4') || line.startsWith('3.5')) {
				finalizeCcEntry();
				currentSection = null;
			} else if (line.length > 3) {
				currentCcEntry.description.push(line);
				continue;
			}
		}

		// Detect RPN headers
		const rpnMatch = line.match(RPN_HEADER_REGEX);
		if (rpnMatch) {
			finalizeRpnEntry();
			currentRpnEntry = {
				section: parseInt(rpnMatch[1], 10),
				rpn_value: rpnMatch[2].replace(/\s/g, ''),
				name: rpnMatch[3].trim(),
				default_value: null,
				description: []
			};
			currentSection = 'rpn';
			continue;
		}

		if (currentSection === 'rpn' && currentRpnEntry) {
			const defaultMatch = line.match(DEFAULT_VALUE_REGEX);
			if (defaultMatch) {
				currentRpnEntry.default_value = defaultMatch[1].trim();
				continue;
			}
			if (line.startsWith('[recommended]') || line.startsWith('[optional]') || line.startsWith('[Refer')) {
				continue;
			}
			if (line.startsWith('3.4.') || line.startsWith('3.5')) {
				finalizeRpnEntry();
				currentSection = null;
			} else if (line.length > 3 && !line.startsWith('Resolution:') && !line.startsWith('Range:') && !line.startsWith('Control Value') && !line.startsWith('MSB') && !line.startsWith('---') && !line.match(/^[0-9A-F]{2}H\s/)) {
				currentRpnEntry.description.push(line);
				continue;
			}
		}

		// Detect Channel Mode headers
		const modeMatch = line.match(MODE_HEADER_REGEX);
		if (modeMatch) {
			finalizeModeEntry();
			currentModeEntry = {
				section: parseInt(modeMatch[1], 10),
				name: modeMatch[2].trim(),
				cc_number: parseInt(modeMatch[3], 10),
				default_value: null,
				value: null,
				description: []
			};
			currentSection = 'channel_mode';
			continue;
		}

		if (currentSection === 'channel_mode' && currentModeEntry) {
			const defaultMatch = line.match(DEFAULT_VALUE_REGEX);
			if (defaultMatch) {
				currentModeEntry.default_value = defaultMatch[1].trim();
				continue;
			}
			if (line.startsWith('Value:')) {
				currentModeEntry.value = line.replace(/^Value:\s*/, '').trim();
				continue;
			}
			if (line.startsWith('[recommended]') || line.startsWith('[optional]')) {
				continue;
			}
			if (line.startsWith('CC#') && line.includes('nn')) {
				finalizeModeEntry();
				currentSection = null;
			} else if (line.startsWith('3.5.') || line.startsWith('3.6') || line.startsWith('3.7') || line.startsWith('4.')) {
				finalizeModeEntry();
				currentSection = null;
			} else if (line.length > 3) {
				currentModeEntry.description.push(line);
				continue;
			}
		}

		// Detect Reset All Controllers table
		if (line.startsWith('CC#') && line.includes('nn') && line.includes('Name') && !line.includes('vv') && !line.includes('Description')) {
			inResetTable = true;
			continue;
		}

		if (inResetTable) {
			if (line.startsWith('---')) {
				continue;
			}
			const resetMatch = line.match(RESET_ENTRY_REGEX);
			if (resetMatch) {
				resetAllControllers.push({
					cc_number: resetMatch[1] === '-' ? null : parseInt(resetMatch[1], 10),
					hex_value: resetMatch[2] || null,
					name: resetMatch[3].trim(),
					reset_value: resetMatch[4].trim()
				});
				continue;
			}
			if (line.startsWith('Program Change') || line.startsWith('Chorus Send')) {
				inResetTable = false;
				continue;
			}
		}

		// Detect Reverb Types
		if (line.match(/^\d+:\s+.+\t/) && currentSection === 'reverb_type_header') {
			inReverbTypes = true;
		}

		if (line.startsWith('4.4.1 Reverb Type')) {
			currentSection = 'reverb_type_header';
			continue;
		}

		if (inReverbTypes) {
			const reverbTypeMatch = line.match(REVERB_TYPE_REGEX);
			if (reverbTypeMatch) {
				reverbTypes.push({
					type_number: parseInt(reverbTypeMatch[1], 10),
					name: reverbTypeMatch[2].trim(),
					description: reverbTypeMatch[3].trim()
				});
				continue;
			}
			if (line.startsWith('4.4.2')) {
				inReverbTypes = false;
				currentSection = null;
			}
		}

		// Detect Reverb Time defaults
		if (line.startsWith('4.4.2 Reverb Time')) {
			currentSection = 'reverb_time_header';
			continue;
		}

		if (line.startsWith('Type') && line.includes('Value') && line.includes('Time')) {
			inReverbTime = true;
			continue;
		}

		if (inReverbTime) {
			if (line.startsWith('---')) {
				continue;
			}
			const reverbTimeMatch = line.match(REVERB_TIME_REGEX);
			if (reverbTimeMatch) {
				reverbTimeDefaults.push({
					reverb_type: parseInt(reverbTimeMatch[1], 10),
					value: parseInt(reverbTimeMatch[2], 10),
					time: reverbTimeMatch[3].trim()
				});
				continue;
			}
			if (line.startsWith('4.5')) {
				inReverbTime = false;
				continue;
			}
		}

		// Detect Chorus Types
		if (line.startsWith('4.5.1 Chorus Type')) {
			currentSection = 'chorus_type_header';
			continue;
		}

		if (line.startsWith('Type') && line.includes('Feedback') && line.includes('Mod Rate')) {
			inChorusTypes = true;
			continue;
		}

		if (inChorusTypes) {
			if (line.startsWith('---')) {
				continue;
			}
			const chorusMatch = line.match(CHORUS_TYPE_REGEX);
			if (chorusMatch) {
				chorusTypes.push({
					type_number: parseInt(chorusMatch[1], 10),
					name: chorusMatch[2].trim(),
					feedback: chorusMatch[3].trim(),
					mod_rate: chorusMatch[4].trim(),
					mod_depth: chorusMatch[5].trim(),
					reverb_send: chorusMatch[6] ? chorusMatch[6].trim() : '0 (0%)'
				});
				continue;
			}
			if (line.startsWith('Each parameter') || line.startsWith('4.5.2')) {
				inChorusTypes = false;
				continue;
			}
		}

		// Detect Controller Destination parameters
		if ((line.startsWith('Controlled Parameter') && line.includes('Range') && line.includes('Default')) || (line.startsWith('00 Pitch Control') && line.includes('\t'))) {
			inControllerDest = true;
		}

		if (inControllerDest) {
			if (line.startsWith('---')) {
				continue;
			}
			const destMatch = line.match(CONTROLLER_DEST_REGEX);
			if (destMatch) {
				controllerDestParams.push({
					param_number: parseInt(destMatch[1], 10),
					param_name: destMatch[2].trim(),
					range: destMatch[3].trim(),
					description: destMatch[4].trim(),
					default_value: destMatch[5].trim()
				});
				continue;
			}
			if (line.startsWith('The example') || line.startsWith('F0 7F') || line.startsWith('[recommended]')) {
				inControllerDest = false;
				continue;
			}
		}

		// Detect Key-Based Instrument Controllers
		if (line.startsWith('CC#') && line.includes('nn') && line.includes('vv') && line.includes('Description')) {
			inKeyBased = true;
			continue;
		}

		if (inKeyBased) {
			if (line.startsWith('---') || line === '--') {
				continue;
			}
			const keyBasedMatch = line.match(KEY_BASED_REGEX);
			if (keyBasedMatch) {
				keyBasedControllers.push({
					cc_number: parseInt(keyBasedMatch[1], 10),
					hex_value: keyBasedMatch[2].toUpperCase(),
					name: keyBasedMatch[3].trim(),
					value_range: keyBasedMatch[4].trim(),
					description: keyBasedMatch[5].trim(),
					default_value: keyBasedMatch[6].trim()
				});
				continue;
			}
			if (line.startsWith('[recommended]') || line.startsWith('Melody Channels')) {
				inKeyBased = false;
				continue;
			}
		}

		// Detect GM2 Sound Set
		if (line.startsWith('7. Appendix A') || (line.startsWith('PROG#') && line.includes('BANK#'))) {
			inSoundSet = true;
			continue;
		}

		if (inSoundSet) {
			// Skip page headers and column headers
			if (line.startsWith('General MIDI 2 Sound Set') || line.startsWith('PROG#') || line.startsWith('## Page')) {
				continue;
			}

			// Category headers
			const categoryMatch = line.match(SOUND_CATEGORY_REGEX);
			if (categoryMatch) {
				currentSoundCategory = categoryMatch[1].trim();
				continue;
			}

			// Primary program entry (with program number)
			const primaryMatch = line.match(SOUND_ENTRY_PRIMARY_REGEX);
			if (primaryMatch) {
				finalizeSoundProgram();
				currentSoundProgram = {
					program_number: parseInt(primaryMatch[1], 10),
					program_hex: primaryMatch[2].toUpperCase(),
					bank_msb: primaryMatch[3].toUpperCase(),
					bank_lsb: primaryMatch[4].toUpperCase(),
					timbre_name: primaryMatch[5].trim(),
					key_range: primaryMatch[6].trim(),
					category: currentSoundCategory
				};
				continue;
			}

			// Variation entry (no program number, inherits from previous)
			const variationMatch = line.match(SOUND_ENTRY_VARIATION_REGEX);
			if (variationMatch && currentSoundProgram) {
				gm2SoundSet.push(currentSoundProgram);
				currentSoundProgram = {
					program_number: currentSoundProgram.program_number,
					program_hex: currentSoundProgram.program_hex,
					bank_msb: variationMatch[1].toUpperCase(),
					bank_lsb: variationMatch[2].toUpperCase(),
					timbre_name: variationMatch[3].trim(),
					key_range: variationMatch[4].trim(),
					category: currentSoundCategory
				};
				continue;
			}

			if (line.startsWith('8. Appendix B') || (line.startsWith('## Page') && !line.includes('Sound Set'))) {
				finalizeSoundProgram();
				inSoundSet = false;
				continue;
			}
		}

		// Detect Percussion Sound Set
		if (line.startsWith('8. Appendix B') || (line.startsWith('PC#') && line.match(PERCUSSION_PC_HEADER_REGEX))) {
			inPercussionSet = true;
		}

		if (inPercussionSet) {
			if (line.startsWith('General MIDI 2 Percussion') || line.startsWith('## Page') || line.startsWith('8. Appendix B')) {
				continue;
			}

			// PC# header
			const pcHeaderMatch = line.match(PERCUSSION_PC_HEADER_REGEX);
			if (pcHeaderMatch) {
				percussionPcNumbers = [parseInt(pcHeaderMatch[1], 10), parseInt(pcHeaderMatch[2], 10), parseInt(pcHeaderMatch[3], 10)];
				continue;
			}

			// Set names
			const setNamesMatch = line.match(PERCUSSION_SET_NAMES_REGEX);
			if (setNamesMatch) {
				percussionSetNames = [setNamesMatch[1].trim(), setNamesMatch[2].trim(), setNamesMatch[3].trim()];
				continue;
			}

			// Column header
			if (PERCUSSION_COL_HEADER_REGEX.test(line)) {
				continue;
			}

			// Data entries - use tab split to handle variable column counts
			const noteMatch = line.match(/^(\d+)\s*\((.+?)\)\s*\t/);
			if (noteMatch && percussionPcNumbers && percussionSetNames) {
				const parts = line.split('\t').map(p => p.trim());
				const noteNumber = parseInt(noteMatch[1], 10);
				const noteName = noteMatch[2].trim();

				// Format: NOTE# \tInst1 \tPAN1 Inst2 \tPAN2 Inst3 \tPAN3
				// When a set uses @, the PAN and next inst may merge or be absent
				// parts[0] = note, parts[1] = set1 inst
				// parts[2..] alternate between "PAN inst" or just "inst" or "@"

				const set1Inst = parts[1] || '@';
				let set1Pan = '';
				let set2Inst = '@';
				let set2Pan = '';
				let set3Inst = '@';
				let set3Pan = '';

				if (parts.length >= 3) {
					const col2Parts = parts[2].split(/\s+/);
					// Check if first token is a number (PAN value)
					if (/^\d+$/.test(col2Parts[0])) {
						set1Pan = col2Parts[0];
						const restOfCol2 = col2Parts.slice(1).join(' ').trim();
						set2Inst = restOfCol2 || '@';
					} else {
						set2Inst = parts[2];
					}
				}

				if (parts.length >= 4) {
					const col3Parts = parts[3].split(/\s+/);
					if (/^\d+$/.test(col3Parts[0])) {
						set2Pan = col3Parts[0];
						const restOfCol3 = col3Parts.slice(1).join(' ').trim();
						set3Inst = restOfCol3 || '@';
					} else {
						set3Inst = parts[3];
					}
				}

				if (parts.length >= 5) {
					set3Pan = parts[4] || '';
				}

				const sets = [
					{ inst: set1Inst, pan: set1Pan, col: 0 },
					{ inst: set2Inst, pan: set2Pan, col: 1 },
					{ inst: set3Inst, pan: set3Pan, col: 2 }
				];

				for (const set of sets) {
					if (set.inst && set.inst !== '@' && set.inst !== '---') {
						percussionSets.push({
							pc_number: percussionPcNumbers[set.col],
							set_name: percussionSetNames[set.col],
							note_number: noteNumber,
							note_name: noteName,
							instrument: set.inst,
							pan: set.pan
						});
					}
				}
				continue;
			}

			// Notes section
			if (line.startsWith('Notes:') || line.startsWith('@ :') || line.startsWith('[EXC]') || line.startsWith('Program Change')) {
				continue;
			}
		}

		// Detect GM System Messages
		const gmHeaderMatch = line.match(GM_SYSTEM_HEADER_REGEX);
		if (gmHeaderMatch) {
			finalizeGmSystemMessage();
			currentGmSystemMessage = {
				section: parseInt(gmHeaderMatch[1], 10),
				name: gmHeaderMatch[2].trim(),
				sysex_bytes: [],
				description: []
			};
			currentSection = 'gm_system';
			continue;
		}

		if (currentSection === 'gm_system' && currentGmSystemMessage) {
			const sysexMatch = line.match(SYSEX_LINE_REGEX);
			if (sysexMatch) {
				currentGmSystemMessage.sysex_bytes.push({
					bytes: sysexMatch[1].trim(),
					description: sysexMatch[2].trim()
				});
				continue;
			}
			const subIdMatch = line.match(/^([0-9A-Fa-f]{2})\s+sub-ID#([12])\s*=?\s*(.+)$/);
			if (subIdMatch) {
				currentGmSystemMessage.sysex_bytes.push({
					bytes: subIdMatch[1],
					description: `sub-ID#${subIdMatch[2]} = ${subIdMatch[3].trim()}`
				});
				continue;
			}
			if (line === 'F7' || line === 'F7 \tEOX' || line.startsWith('F7')) {
				currentGmSystemMessage.sysex_bytes.push({
					bytes: 'F7',
					description: 'EOX'
				});
				continue;
			}
			if (line.startsWith('<device')) {
				currentGmSystemMessage.sysex_bytes.push({
					bytes: '<device ID>',
					description: line.replace(/^<device ID>\s*/, '').trim()
				});
				continue;
			}
			if (line.startsWith('5.') || line.startsWith('6.')) {
				finalizeGmSystemMessage();
				currentSection = null;
			} else if (line.length > 3 && !line.startsWith('When') && !line.startsWith('The reset')) {
				currentGmSystemMessage.description.push(line);
				continue;
			} else if (line.length > 3) {
				currentGmSystemMessage.description.push(line);
				continue;
			}
		}

		// Detect General Requirements
		const reqMatch = line.match(/^(\d+\.\d+)\s+(.+)$/);
		if (reqMatch && !line.includes('\t') && currentSection !== 'cc_message' && currentSection !== 'rpn' && currentSection !== 'channel_mode' && currentSection !== 'gm_system') {
			generalRequirements.push({
				section: reqMatch[1],
				name: reqMatch[2].trim()
			});
			continue;
		}
	}

	finalizeCcEntry();
	finalizeRpnEntry();
	finalizeModeEntry();
	finalizeSoundProgram();
	finalizeGmSystemMessage();

	const result = {
		metadata: {
			title: 'General MIDI Level 2',
			doc_id: 'RP-024',
			protocol: 'midi1',
			source: path.basename(markdownPath),
			version: '1.2a',
			date: 'February 6, 2007'
		},
		control_change_messages: controlChanges,
		rpn_entries: rpnEntries,
		channel_mode_messages: channelModeMessages,
		reset_all_controllers: resetAllControllers,
		reverb_types: reverbTypes,
		reverb_time_defaults: reverbTimeDefaults,
		chorus_types: chorusTypes,
		controller_destination_parameters: controllerDestParams,
		key_based_controllers: keyBasedControllers,
		gm2_sound_set: gm2SoundSet,
		percussion_sets: percussionSets,
		gm_system_messages: gmSystemMessages,
		general_requirements: generalRequirements,
		summary: {
			control_change_count: controlChanges.length,
			rpn_count: rpnEntries.length,
			channel_mode_count: channelModeMessages.length,
			reset_all_controllers_count: resetAllControllers.length,
			reverb_type_count: reverbTypes.length,
			reverb_time_default_count: reverbTimeDefaults.length,
			chorus_type_count: chorusTypes.length,
			controller_destination_param_count: controllerDestParams.length,
			key_based_controller_count: keyBasedControllers.length,
			gm2_sound_set_count: gm2SoundSet.length,
			percussion_set_entry_count: percussionSets.length,
			gm_system_message_count: gmSystemMessages.length,
			general_requirement_count: generalRequirements.length
		}
	};

	if (outDir) {
		await fs.mkdir(outDir, { recursive: true });
		await fs.writeFile(path.join(outDir, 'general-midi-level-2.json'), JSON.stringify(result, null, 2), 'utf-8');
	}

	return result;
}
