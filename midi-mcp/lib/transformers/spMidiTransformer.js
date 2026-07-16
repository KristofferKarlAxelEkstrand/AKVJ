import fs from 'node:fs/promises';
import path from 'node:path';

const REFERENCE_REGEX = /^\[(\d+)\]\s+(.+)$/;
const TOC_DOT_PATTERN = /\.{3,}/;

const MELODY_SOUND_REGEX = /^(\d+)\(([0-9A-Fa-f]+)H\)\s+(.+?)\s+(\d+–\d+|\*)$/;
const MELODY_TWO_COL_REGEX = /^(\d+)\(([0-9A-Fa-f]+)H\)\s+(.+?)\s+(\d+–\d+|\*)\s+(\d+)\(([0-9A-Fa-f]+)H\)\s+(.+?)\s+(\d+–\d+|\*)$/;
const MIN_MELODY_REGEX = /^(\d+)\s+\(([0-9A-Fa-f]+)H\)\s+([0-9A-Fa-f]+)H\s+([0-9A-Fa-f]+)H\s+(.+?)\s+(\d+–\d+)$/;
const MIN_PERCUSSION_REGEX = /^(\d+)\s+\(([A-G#]+\d+)\)\s+(.+?)\s+(\d+)$/;
const MIN_PERCUSSION_TWO_COL_REGEX = /^(\d+)\s+\(([A-G#]+\d+)\)\s+(.+?)\s+(\d+)\s+(\d+)\s+\(([A-G#]+\d+)\)\s+(.+?)\s+(\d+)$/;

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

const PERCUSSION_NOTE_SEQUENCE = [56, 57, 58, 59, 60, 61, 62, 63, 64, 65, 66, 35, 67, 36, 68, 37, 69, 38, 70, 39, 71, 40, 72, 41, 73, 42, 74, 43, 75, 44, 76, 45, 77, 46, 78, 47, 79, 48, 80, 49, 81, 50, 51, 52, 53, 54, 55];
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

export async function transformSpMidi(markdownPath, outDir) {
	const content = await fs.readFile(markdownPath, 'utf-8');
	const lines = content.split('\n');

	const terminology = [];
	const mipMessageSyntax = [];
	const references = [];
	const melodySoundSet = [];
	const percussionSoundSet = [];
	const minimumMelodicSounds = [];
	const minimumPercussionSounds = [];
	const requiredMidiMessages = [];

	let inTerminology = false;
	let inMipSyntax = false;
	let inReferences = false;
	let inMelodySoundSet = false;
	let inPercussionSoundSet = false;
	let inMinMelodic = false;
	let inMinPercussion = false;
	let inRequiredMessages = false;

	for (let i = 0; i < lines.length; i++) {
		const line = lines[i].trim();

		if (!line || line.startsWith('## Page') || line.startsWith('# Scalable Polyphony')) {
			continue;
		}

		if (line === '1.3 Terminology') {
			inTerminology = true;
			continue;
		}
		if (inTerminology) {
			if (line.startsWith('2. Maximum') || line.startsWith('2.') || line.match(TOC_DOT_PATTERN)) {
				inTerminology = false;
			} else {
				const termMatch = line.match(/^([A-Za-z][A-Za-z\s/()]+?)(?:\s+refers to|\s+is used|\s+defines|\s+means|\s+specifies)\s+(.+)$/i);
				if (termMatch) {
					terminology.push({
						term: termMatch[1].trim(),
						description: line
					});
					continue;
				}
			}
		}

		if (line === '2.1 MIP Message Syntax') {
			inMipSyntax = true;
			continue;
		}
		if (inMipSyntax) {
			if (line.startsWith('2.2 ') || (line.startsWith('F0 7F') && line.includes('F7') && inMipSyntax && mipMessageSyntax.length > 0)) {
				if (line.startsWith('2.2 ')) {
					inMipSyntax = false;
				}
			}
			if (inMipSyntax && line) {
				const parts = line.split(/\s+/);
				if (parts[0] === 'F0' || parts[0] === 'F7' || parts[0] === '<device' || parts[0] === '0B' || parts[0] === '01' || parts[0] === 'cc' || parts[0] === 'vv' || parts[0] === '[UNIVERSAL') {
					mipMessageSyntax.push(line);
					continue;
				}
				if (line.startsWith('2.2 ')) {
					inMipSyntax = false;
				}
			}
		}

		if (line.startsWith('4. References') && !line.match(TOC_DOT_PATTERN)) {
			inReferences = true;
			continue;
		}
		if (inReferences) {
			if (line.startsWith('Scalable Polyphony MIDI Device') || line.startsWith('SP-MIDI Device')) {
				inReferences = false;
			} else {
				const refMatch = line.match(REFERENCE_REGEX);
				if (refMatch) {
					const descriptionLines = [refMatch[2]];
					for (let j = i + 1; j < lines.length; j++) {
						const nextLine = lines[j].trim();
						if (!nextLine || nextLine.match(/^\[\d+\]/) || nextLine.startsWith('## Page') || nextLine.startsWith('Scalable Polyphony MIDI Device') || nextLine.startsWith('SP-MIDI Device')) {
							break;
						}
						descriptionLines.push(nextLine);
					}
					references.push({
						ref_id: parseInt(refMatch[1], 10),
						description: descriptionLines.join(' ')
					});
					continue;
				}
			}
		}

		if (line === 'Figure 1: Melody Channel Sound Set (PC# 1–64)') {
			inMelodySoundSet = false;
			continue;
		}
		if (line === 'Figure 2: Melody Channel Sound Set (PC# 65–128)') {
			inMelodySoundSet = false;
			continue;
		}
		if (line.includes('PC# Timbre') && line.includes('Recommended') && !line.includes('Figure')) {
			inMelodySoundSet = true;
			continue;
		}
		if (inMelodySoundSet) {
			if (parseMelodyLine(line, melodySoundSet)) {
				continue;
			}
			if (line.startsWith('Figure ') || line.startsWith('Note:')) {
				inMelodySoundSet = false;
				continue;
			}
		}

		if (line === 'Figure 3: Percussion Channel Sound Set') {
			inPercussionSoundSet = false;
			continue;
		}
		if (line.includes('Note Timbre Pan') || line.includes('MIDI Key Drum Sound')) {
			inPercussionSoundSet = true;
			resetPercussionParser();
			continue;
		}
		if (inPercussionSoundSet) {
			if (parsePercussionLine(line, percussionSoundSet)) {
				continue;
			}
			if (line.startsWith('Figure ') || line.startsWith('[Note]')) {
				inPercussionSoundSet = false;
				continue;
			}
		}

		if (line === 'Figure 4: Minimum Sound Bank (Melodic Sound Set Timbres)') {
			inMinMelodic = false;
			continue;
		}
		if (line.startsWith('PROG# BANK#') && line.includes('GM2 TIMBRE') && !line.includes('Figure')) {
			inMinMelodic = true;
			continue;
		}
		if (inMinMelodic) {
			if (line.startsWith('###')) {
				continue;
			}
			const match = line.match(MIN_MELODY_REGEX);
			if (match) {
				minimumMelodicSounds.push({
					program: parseInt(match[1], 10),
					bank_msb: match[3] + 'H',
					bank_lsb: match[4] + 'H',
					timbre: match[5],
					key_range: match[6]
				});
				continue;
			}
			if (line.startsWith('Figure ')) {
				inMinMelodic = false;
				continue;
			}
		}

		if (line === 'Figure 5: Minimum Sound Bank (Percussion Sound Set Timbres)') {
			inMinPercussion = false;
			continue;
		}
		if (line.startsWith('NOTE# INSTRUMENT NAME PAN') && !line.includes('Figure')) {
			inMinPercussion = true;
			continue;
		}
		if (inMinPercussion) {
			const twoColMatch = line.match(MIN_PERCUSSION_TWO_COL_REGEX);
			if (twoColMatch) {
				minimumPercussionSounds.push({
					note: parseInt(twoColMatch[1], 10),
					note_name: twoColMatch[2],
					instrument: twoColMatch[3],
					pan: parseInt(twoColMatch[4], 10)
				});
				minimumPercussionSounds.push({
					note: parseInt(twoColMatch[5], 10),
					note_name: twoColMatch[6],
					instrument: twoColMatch[7],
					pan: parseInt(twoColMatch[8], 10)
				});
				continue;
			}
			const match = line.match(MIN_PERCUSSION_REGEX);
			if (match) {
				minimumPercussionSounds.push({
					note: parseInt(match[1], 10),
					note_name: match[2],
					instrument: match[3],
					pan: parseInt(match[4], 10)
				});
				continue;
			}
			if (line.startsWith('Figure ')) {
				inMinPercussion = false;
				continue;
			}
		}

		if (line === '3.1 Supported Messages' || line.includes('Response to MIDI Channel Messages')) {
			inRequiredMessages = true;
			continue;
		}
		if (inRequiredMessages) {
			if (line.startsWith('3.1.1') || line.startsWith('3.2 ')) {
				inRequiredMessages = false;
				continue;
			}
			if (line.startsWith('Note On/') || line.startsWith('Program Change') || line.startsWith('Control Change') || line.startsWith('Bank Select') || line.startsWith('Modulation') || line.startsWith('Portamento') || line.startsWith('Channel Volume') || line.startsWith('Pan (') || line.startsWith('Expression') || line.startsWith('Hold1') || line.startsWith('Sostenuto') || line.startsWith('Soft (') || line.startsWith('Filter Resonance') || line.startsWith('Release Time') || line.startsWith('Attack time') || line.startsWith('Brightness') || line.startsWith('Decay Time') || line.startsWith('Vibrato') || line.startsWith('Reverb Send') || line.startsWith('Chorus Send') || line.startsWith('Data Entry') || line.startsWith('RPN LSB') || line.startsWith('Pitch Bend') || line.startsWith('Channel Pressure') || line.startsWith('All Sound') || line.startsWith('Reset All') || line.startsWith('All Notes') || line.startsWith('Omni Mode') || line.startsWith('Mono Mode') || line.startsWith('Poly Mode')) {
				const required = line.includes(' n') || line.endsWith('n');
				const cleanLine = line
					.replace(/\s+n$/, '')
					.replace(/\s+n\s+/, ' ')
					.trim();
				requiredMidiMessages.push({
					message: cleanLine,
					required: required
				});
				continue;
			}
			if (line.match(/^[0-9A-Fa-f]+H\s*\/\s*[0-9A-Fa-f]+H/)) {
				const rpnMatch = line.match(/^([0-9A-Fa-f]+H)\s*\/\s*([0-9A-Fa-f]+H)\s+(.+?)(?:\s+n)?$/);
				if (rpnMatch) {
					requiredMidiMessages.push({
						message: `RPN ${rpnMatch[1]}/${rpnMatch[2]} ${rpnMatch[3]}`.trim(),
						required: line.endsWith('n')
					});
					continue;
				}
			}
		}
	}

	const result = {
		metadata: {
			title: 'Scalable Polyphony MIDI (SP-MIDI) Specification and Device Profiles',
			doc_id: 'RP-034/RP-035',
			protocol: 'midi1',
			version: '1.0b',
			date: '2004-11-15'
		},
		terminology: terminology,
		mip_message_syntax: mipMessageSyntax,
		references: references,
		melody_sound_set: melodySoundSet,
		percussion_sound_set: percussionSoundSet,
		minimum_melodic_sounds: minimumMelodicSounds,
		minimum_percussion_sounds: minimumPercussionSounds,
		required_midi_messages: requiredMidiMessages,
		summary: {
			terminology_count: terminology.length,
			mip_message_syntax_line_count: mipMessageSyntax.length,
			reference_count: references.length,
			melody_sound_count: melodySoundSet.length,
			percussion_sound_count: percussionSoundSet.length,
			minimum_melodic_count: minimumMelodicSounds.length,
			minimum_percussion_count: minimumPercussionSounds.length,
			required_midi_message_count: requiredMidiMessages.length
		}
	};

	if (outDir) {
		const outPath = path.join(outDir, 'sp-midi.json');
		await fs.mkdir(outDir, { recursive: true });
		await fs.writeFile(outPath, JSON.stringify(result, null, 2), 'utf-8');
	}

	return result;
}
