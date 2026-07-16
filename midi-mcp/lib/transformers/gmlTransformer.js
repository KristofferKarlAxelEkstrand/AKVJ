import fs from 'node:fs/promises';
import path from 'node:path';

const MELODY_SOUND_REGEX = /^(\d+)\(([0-9A-Fa-f]+)H\)\s+(.+?)\s+(\d+-\d+|\*)$/;
const MELODY_TWO_COL_REGEX = /^(\d+)\(([0-9A-Fa-f]+)H\)\s+(.+?)\s+(\d+-\d+|\*)\s+(\d+)\(([0-9A-Fa-f]+)H\)\s+(.+?)\s+(\d+-\d+|\*)$/;
const PERCUSSION_NOTE_SEQUENCE = [56, 57, 58, 59, 60, 61, 62, 63, 64, 65, 66, 35, 67, 36, 68, 37, 69, 38, 70, 39, 71, 40, 72, 41, 73, 42, 74, 43, 75, 44, 76, 45, 77, 46, 78, 47, 79, 48, 80, 49, 81, 50, 51, 52, 53, 54, 55];

function parseMelodyLine(line, outputArray) {
	const twoCol = line.match(MELODY_TWO_COL_REGEX);
	if (twoCol) {
		outputArray.push({
			program: parseInt(twoCol[1], 10),
			hex: twoCol[2] + 'H',
			timbre: twoCol[3],
			key_range: twoCol[4]
		});
		outputArray.push({
			program: parseInt(twoCol[5], 10),
			hex: twoCol[6] + 'H',
			timbre: twoCol[7],
			key_range: twoCol[8]
		});
		return true;
	}
	const oneCol = line.match(MELODY_SOUND_REGEX);
	if (oneCol) {
		outputArray.push({
			program: parseInt(oneCol[1], 10),
			hex: oneCol[2] + 'H',
			timbre: oneCol[3],
			key_range: oneCol[4]
		});
		return true;
	}
	return false;
}

let percussionSeqIdx = 0;

function resetPercussionParser() {
	percussionSeqIdx = 0;
}

function parsePercussionLine(line, outputArray) {
	const parts = line.split(/\s+/);
	if (parts.length < 3 || !parts[0].match(/^\d+$/)) {
		return false;
	}
	let entryStart = -1;
	for (let k = 0; k < parts.length; k++) {
		if (percussionSeqIdx < PERCUSSION_NOTE_SEQUENCE.length && parts[k].match(/^\d+$/) && parseInt(parts[k], 10) === PERCUSSION_NOTE_SEQUENCE[percussionSeqIdx]) {
			if (entryStart >= 0) {
				const note = parseInt(parts[entryStart], 10);
				const pan = parseInt(parts[k - 1], 10);
				const timbreParts = parts.slice(entryStart + 1, k - 1);
				if (timbreParts.length > 0 && !isNaN(pan)) {
					outputArray.push({ note, timbre: timbreParts.join(' '), pan });
				}
			}
			entryStart = k;
			percussionSeqIdx++;
		}
	}
	if (entryStart >= 0) {
		const note = parseInt(parts[entryStart], 10);
		const lastNum = parseInt(parts[parts.length - 1], 10);
		const secondLastNum = parseInt(parts[parts.length - 2], 10);
		let pan;
		let timbreEnd;
		if (entryStart === 0 && !isNaN(lastNum) && lastNum > 81) {
			pan = secondLastNum;
			timbreEnd = parts.length - 2;
		} else {
			pan = lastNum;
			timbreEnd = parts.length - 1;
		}
		const timbreParts = parts.slice(entryStart + 1, timbreEnd);
		if (timbreParts.length > 0 && !isNaN(pan)) {
			outputArray.push({ note, timbre: timbreParts.join(' '), pan });
		}
	}
	return outputArray.length > 0;
}

const RESET_TABLE_CONTROLLERS = new Set([1, 11, 64, 100, 101]);

export async function transformGml(markdownPath, outDir) {
	const content = await fs.readFile(markdownPath, 'utf-8');
	const lines = content.split('\n');

	const technicalTerms = [];
	const controlChangeMessages = [];
	const rpnMessages = [];
	const channelModeMessages = [];
	const resetAllControllersTable = [];
	const melodySoundSet = [];
	const percussionSoundSet = [];
	const setUpBarEvents = [];
	const channelAssignments = [];
	const references = [];

	let inTechnicalTerms = false;
	let inControlChange = false;
	let inRpn = false;
	let inChannelMode = false;
	let inResetTable = false;
	let inMelodySoundSet = false;
	let inPercussionSoundSet = false;
	let inSetUpBar = false;
	let inChannelAssignment = false;
	let inReferences = false;

	for (let i = 0; i < lines.length; i++) {
		const line = lines[i].trim();

		if (!line || line.startsWith('## Page') || line.startsWith('Version 1.0 Page')) {
			continue;
		}

		if (line === '1.4 Guide To Technical Terms') {
			inTechnicalTerms = true;
			continue;
		}
		if (inTechnicalTerms) {
			if (line.startsWith('2 MOBILE MIDI') || line.startsWith('2.1 Functional')) {
				inTechnicalTerms = false;
			} else if (line.startsWith('\u2022') || line.startsWith('o ')) {
				technicalTerms.push({ term: line.replace(/^[\u2022o]\s*/, ''), description: line });
				continue;
			}
		}

		if (line === '3.2.3 Control Change Messages') {
			inControlChange = true;
			continue;
		}
		if (inControlChange) {
			if (line.startsWith('3.2.4') || line.startsWith('3.2.5')) {
				inControlChange = false;
			} else {
				const ccMatch = line.match(/^(\d+\.\d+\.\d+\.\d+)\s+CC#(\d+):\s*(.+)$/);
				if (ccMatch) {
					controlChangeMessages.push({
						section: ccMatch[1],
						cc_number: parseInt(ccMatch[2], 10),
						name: ccMatch[3]
					});
					continue;
				}
				const ccSimpleMatch = line.match(/^CC#(\d+):\s*(.+)$/);
				if (ccSimpleMatch) {
					controlChangeMessages.push({
						section: '',
						cc_number: parseInt(ccSimpleMatch[1], 10),
						name: ccSimpleMatch[2]
					});
					continue;
				}
			}
		}

		if (line === '3.2.4 RPN (Registered Parameter Numbers)') {
			inRpn = true;
			continue;
		}
		if (inRpn) {
			if (line.startsWith('3.2.5')) {
				inRpn = false;
			} else {
				const rpnMatch = line.match(/^([0-9A-Fa-f]+H)\/([0-9A-Fa-f]+H):\s*(.+)$/);
				if (rpnMatch) {
					rpnMessages.push({
						rpn: rpnMatch[1] + '/' + rpnMatch[2],
						name: rpnMatch[3]
					});
					continue;
				}
			}
		}

		if (line === '3.2.5 Channel Mode Messages') {
			inChannelMode = true;
			continue;
		}
		if (inChannelMode) {
			if (line.startsWith('3.2.6') || line.startsWith('3.3 ')) {
				inChannelMode = false;
			} else {
				const modeMatch = line.match(/^(\d+\.\d+\.\d+\.\d+)\s+CC#(\d+):\s*(.+)$/);
				if (modeMatch) {
					channelModeMessages.push({
						section: modeMatch[1],
						cc_number: parseInt(modeMatch[2], 10),
						name: modeMatch[3]
					});
					continue;
				}
			}
		}

		if (line.includes('Controller Message Value Comment') && !line.includes('Figure') && !inResetTable && resetAllControllersTable.length === 0) {
			inResetTable = true;
			continue;
		}
		if (inResetTable) {
			const parts = line.split(/\s+/);
			if (parts.length >= 4 && parts[0].match(/^\d+$/) && RESET_TABLE_CONTROLLERS.has(parseInt(parts[0], 10))) {
				resetAllControllersTable.push({
					controller: parseInt(parts[0], 10),
					message: parts[1],
					value: parts[2],
					comment: parts.slice(3).join(' ')
				});
				continue;
			}
			if (line.startsWith('Pitch Bend') && parts.length >= 5) {
				resetAllControllersTable.push({
					controller: null,
					message: 'Pitch Bend Change',
					value: parts[3],
					comment: parts.slice(4).join(' ')
				});
				continue;
			}
			inResetTable = false;
		}

		if (line.includes('PC# Timbre') && line.includes('Recommended') && !line.includes('Figure')) {
			inMelodySoundSet = true;
			continue;
		}
		if (inMelodySoundSet) {
			if (parseMelodyLine(line, melodySoundSet)) {
				continue;
			}
			if (line.startsWith('PC# =') || line.startsWith('3.4.2') || line.startsWith('4 AUTHORING')) {
				inMelodySoundSet = false;
				continue;
			}
		}

		if (line.includes('Note Timbre Pan') && !line.includes('Figure')) {
			inPercussionSoundSet = true;
			resetPercussionParser();
			continue;
		}
		if (inPercussionSoundSet) {
			if (parsePercussionLine(line, percussionSoundSet)) {
				continue;
			}
			if (line.startsWith('[Note]') || line.startsWith('4 AUTHORING')) {
				inPercussionSoundSet = false;
				continue;
			}
		}

		if (line === '4.1.2 Channel Assignment') {
			inChannelAssignment = true;
			continue;
		}
		if (inChannelAssignment) {
			if (line.startsWith('4.1.3')) {
				inChannelAssignment = false;
			} else if (line.startsWith('[Recommended]') || line.startsWith('Ch.')) {
				continue;
			} else {
				const chMatch = line.match(/^(\d+)\s+(.+)$/);
				if (chMatch) {
					channelAssignments.push({
						channel: parseInt(chMatch[1], 10),
						recommended_part: chMatch[2]
					});
					continue;
				}
			}
		}

		if (line.includes('Set-Up / Beat') || line.includes('Set-Up / Set Tempo') || line.includes('Set-Up / System Exclusive')) {
			inSetUpBar = true;
		}
		if (inSetUpBar) {
			if (line.startsWith('[recommended]') || line.startsWith('Time Index') || line.startsWith('Time') || line.startsWith('2 1 000')) {
				if (line.startsWith('[recommended]')) {
					inSetUpBar = false;
				}
				continue;
			}
			const setupMatch = line.match(/^(\d+\s+\d+\s+\d+)\s+(.+)$/);
			if (setupMatch) {
				setUpBarEvents.push({
					time_index: setupMatch[1],
					description: setupMatch[2]
				});
				continue;
			}
		}

		if (line === '7 REFERENCES' || (line.startsWith('7 REFERENCES') && !line.includes('...'))) {
			inReferences = true;
			continue;
		}
		if (inReferences) {
			if (line.startsWith('\u2022')) {
				references.push(line.replace(/^\u2022\s*/, ''));
				continue;
			}
		}
	}

	const result = {
		metadata: {
			title: 'General MIDI Lite And Guidelines for Use In Mobile Applications',
			doc_id: 'RP-033',
			protocol: 'midi1',
			version: '1.0',
			date: '2001-10-05'
		},
		technical_terms: technicalTerms,
		control_change_messages: controlChangeMessages,
		rpn_messages: rpnMessages,
		channel_mode_messages: channelModeMessages,
		reset_all_controllers_table: resetAllControllersTable,
		melody_sound_set: melodySoundSet,
		percussion_sound_set: percussionSoundSet,
		channel_assignments: channelAssignments,
		set_up_bar_events: setUpBarEvents,
		references: references,
		summary: {
			technical_terms_count: technicalTerms.length,
			control_change_count: controlChangeMessages.length,
			rpn_count: rpnMessages.length,
			channel_mode_count: channelModeMessages.length,
			reset_all_controllers_count: resetAllControllersTable.length,
			melody_sound_count: melodySoundSet.length,
			percussion_sound_count: percussionSoundSet.length,
			channel_assignment_count: channelAssignments.length,
			set_up_bar_event_count: setUpBarEvents.length,
			reference_count: references.length
		}
	};

	if (outDir) {
		const outPath = path.join(outDir, 'gml.json');
		await fs.mkdir(outDir, { recursive: true });
		await fs.writeFile(outPath, JSON.stringify(result, null, 2), 'utf-8');
	}

	return result;
}
