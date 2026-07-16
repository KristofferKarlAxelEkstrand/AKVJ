import fs from 'node:fs/promises';
import path from 'node:path';

/**
 * Regex to match Profile ID byte lines.
 * Format: `Profile ID Byte 1 0x7E (Standard Defined Profile)`
 */
const PROFILE_ID_REGEX = /^Profile ID Byte (\d)\s+(0x[0-9A-Fa-fX]{2})\s+\((.+)\)$/;

/**
 * Regex to match version history entries.
 * Format: `2025-01-31 1.0 Initial release`
 */
const VERSION_HISTORY_REGEX = /^(\d{4}-\d{2}-\d{2})\s+(\d+\.\d+(?:\.\d+)?)\s+(.+)$/;

/**
 * Regex to match a drum note map entry.
 * Format: `27 0x1B High Q Left 23% 2 0`
 * Or with MES: `29 0x1D Scratch Push MES 7 Left 16% 2 2`
 * Groups: decimal, hex, rest (name + optional MES + pan + bitmap byte + bitmap bit)
 */
const DRUM_ENTRY_REGEX = /^(\d+)\s+(0x[0-9A-Fa-f]{2})\s+(.+)$/;

/**
 * Regex to match volume curve entries.
 * Format: `0xFFFFFFFF 0 dB` or `0x00000000 -infinity`
 */
const VOLUME_CURVE_REGEX = /^(0x[0-9A-Fa-f]{8})\s+([-\d.]+\s*(?:dB|infinity))$/;

/**
 * Regex to match key-based instrument controller entries.
 * Format: `7 Volume See Section 6.1.1`
 */
const KEY_BASED_CONTROLLER_REGEX = /^(\d+)\s+(.+?)\s+See Section\s+(.+)$/;

/**
 * Regex to match SysEx message format entries.
 * Format: `F0 System Exclusive Start` or `7E Universal System Exclusive`
 */
const SYSEX_MESSAGE_REGEX = /^(14 00|1 byte|4 bytes|5 bytes|11 bytes|[0-9A-Fa-f]{4}|[0-9A-Fa-f]{2})\s+(.+)$/;

/**
 * Regex to match Profile Features Supported bitmap entries.
 * Format: `D0: Default Sound on Note Number 27`
 * Or range: `D2-D6: Reserved`
 */
const FEATURE_BIT_REGEX = /^D(\d)(?:-D(\d))?:\s+(.+)$/;

/**
 * Regex to match MES definition lines.
 * Format: `• MES 1: Closed HH (42) / Pedal HH (44) / Open HH (46)`
 */
const MES_REGEX = /^•\s+MES\s+(\d+):\s+(.+)$/;

/**
 * Regex to match Profile Level definition lines.
 * Format: `• 0x00 Some implementation but does not comply with minimum requirements`
 * Or range: `• 0x02-0x7E Reserved`
 */
const PROFILE_LEVEL_REGEX = /^•\s+(0x[0-9A-Fa-f]{2}(?:-0x[0-9A-Fa-f]{2})?)\s+(.+)$/;

/**
 * Parses the drum note map entry's rest field to extract name, MES, pan, and bitmap fields.
 *
 * @param {string} rest - Everything after decimal and hex.
 * @returns {object} Parsed fields: name, mes, pan_position, bitmap_byte, bitmap_bit.
 */
function parseDrumEntryRest(rest) {
	// Check if MES is present
	const mesMatch = rest.match(/(.+?)\s+MES\s+(\d+)\s+(.+)$/);

	if (mesMatch) {
		const name = mesMatch[1].trim();
		const mes = parseInt(mesMatch[2], 10);
		const afterMes = mesMatch[3].trim();
		// afterMes: "Left 23% 2 0" or "Center 2 4"
		const parts = afterMes.split(/\s+/);
		const bitmapBit = parseInt(parts.pop(), 10);
		const bitmapByte = parseInt(parts.pop(), 10);
		const panPosition = parts.join(' ');
		return { name, mes, pan_position: panPosition, bitmap_byte: bitmapByte, bitmap_bit: bitmapBit };
	}

	// No MES: "High Q Left 23% 2 0" or "Sticks Center 2 4"
	const parts = rest.split(/\s+/);
	const bitmapBit = parseInt(parts.pop(), 10);
	const bitmapByte = parseInt(parts.pop(), 10);
	// Pan position is the last non-number token(s) before bitmap
	// Pan can be "Left 23%", "Right 32%", "Center", "Left 16%", etc.
	// Work backwards: after removing bitmap byte and bit, the remaining is name + pan
	const remaining = parts.join(' ');
	// Extract pan position: it's either "Center" or "Left/Right XX%"
	const panMatch = remaining.match(/^(.+?)\s+(Center|Left\s+\d+%|Right\s+\d+%)$/);
	if (panMatch) {
		return {
			name: panMatch[1].trim(),
			mes: null,
			pan_position: panMatch[2],
			bitmap_byte: bitmapByte,
			bitmap_bit: bitmapBit
		};
	}

	// Fallback: assume last token is pan
	const pan = parts.pop();
	return {
		name: parts.join(' ').trim(),
		mes: null,
		pan_position: pan,
		bitmap_byte: bitmapByte,
		bitmap_bit: bitmapBit
	};
}

/**
 * Transforms the Default Drum Note Map Profile markdown document
 * into a structured JSON object.
 *
 * @param {string} markdownPath - Absolute path to the source markdown file.
 * @param {string} [outDir] - Optional output directory for the JSON file.
 * @returns {Promise<object>} The structured JSON result.
 */
export async function transformDefaultDrumNoteMapProfile(markdownPath, outDir) {
	const content = await fs.readFile(markdownPath, 'utf-8');
	const lines = content.split('\n');

	const profileIdBytes = [];
	const drumNoteMap = [];
	const volumeCurveCc7 = [];
	const volumeCurveRpnc7 = [];
	const keyBasedControllers = [];
	const sysexInquiryMessage = [];
	const sysexReplyMessage = [];
	const profileFeatures = [];
	const mesDefinitions = [];
	const profileLevels = [];
	const versionHistory = [];

	let currentTable = null;
	let currentFeatureByte = null;
	let currentFeatureBits = [];

	const finalizeFeatureByte = () => {
		if (currentFeatureByte !== null) {
			profileFeatures.push({
				byte_number: currentFeatureByte,
				bits: currentFeatureBits
			});
			currentFeatureByte = null;
			currentFeatureBits = [];
		}
	};

	for (const rawLine of lines) {
		const line = rawLine.trim();
		if (!line) {
			continue;
		}

		// Skip page headers and boilerplate
		if (line.startsWith('## Page') || line.startsWith('MIDI-CI Profile for Default Drum') || line.startsWith('MIDI Association Document') || line.startsWith('Document Version') || line.startsWith('Draft Date') || line.startsWith('Published') || line.startsWith('Developed and Published') || line.startsWith('The MIDI Association') || line.startsWith('Association of Musical') || line.startsWith('PREFACE') || line.startsWith('©') || line.startsWith('ALL RIGHTS') || line.startsWith('https://') || line.startsWith('http://') || line.startsWith('Contents') || line.startsWith('Figures') || line.startsWith('Tables') || (line.startsWith('Table ') && line.includes('...'))) {
			continue;
		}

		// Detect table markers
		if (line === 'Table 1 Version History') {
			currentTable = 'version_history';
			continue;
		}
		if (line === 'Table 4 Five Bytes Profile ID') {
			currentTable = 'profile_id';
			continue;
		}
		if (line === 'Table 5 Drum Note Map') {
			currentTable = 'drum_note_map';
			continue;
		}
		if (line === 'Table 6 Response to CC#7 Volume') {
			currentTable = 'volume_cc7';
			continue;
		}
		if (line === 'Table 7 Response to RPNC#7 Volume') {
			currentTable = 'volume_rpnc7';
			continue;
		}
		if (line === 'Table 8 Key-Based Instrument Controllers List') {
			currentTable = 'key_based_controllers';
			continue;
		}
		if (line === 'Table 9 Profile Details Inquiry Message') {
			currentTable = 'sysex_inquiry';
			continue;
		}
		if (line === 'Table 10 Reply to Profile Details Inquiry Message') {
			currentTable = 'sysex_reply';
			continue;
		}
		if (line === 'Table 11 Profile Features Supported') {
			currentTable = 'profile_features';
			continue;
		}

		// Parse Profile ID bytes
		const profileMatch = line.match(PROFILE_ID_REGEX);
		if (profileMatch) {
			profileIdBytes.push({
				byte_number: parseInt(profileMatch[1], 10),
				value: profileMatch[2].toUpperCase(),
				description: profileMatch[3].trim()
			});
			continue;
		}

		// Parse version history
		if (currentTable === 'version_history') {
			const vhMatch = line.match(VERSION_HISTORY_REGEX);
			if (vhMatch) {
				versionHistory.push({
					date: vhMatch[1],
					version: vhMatch[2],
					changes: vhMatch[3].trim()
				});
				continue;
			}
		}

		// Parse Profile Level definitions
		const levelMatch = line.match(PROFILE_LEVEL_REGEX);
		if (levelMatch) {
			profileLevels.push({
				value: levelMatch[1].toUpperCase(),
				description: levelMatch[2].trim()
			});
			continue;
		}

		// Parse MES definitions
		const mesMatch = line.match(MES_REGEX);
		if (mesMatch) {
			mesDefinitions.push({
				set_number: parseInt(mesMatch[1], 10),
				description: mesMatch[2].trim()
			});
			continue;
		}

		// Parse drum note map entries
		if (currentTable === 'drum_note_map') {
			// Skip column headers
			if (line.startsWith('Note #') || line.startsWith('Decimal') || line.startsWith('Hex') || line.startsWith('Name') || line.startsWith('Mutually') || line.startsWith('Exclusive') || line.startsWith('Set') || line.startsWith('Recommended') || line.startsWith('Pan Position') || line.startsWith('(optional)') || line.startsWith('Profile Details') || line.startsWith('Discovery') || line.startsWith('Bitmap') || line.startsWith('Byte') || line.startsWith('Bit') || line.startsWith('Sound Names:')) {
				continue;
			}

			const drumMatch = line.match(DRUM_ENTRY_REGEX);
			if (drumMatch) {
				const fields = parseDrumEntryRest(drumMatch[3]);
				drumNoteMap.push({
					note_decimal: parseInt(drumMatch[1], 10),
					note_hex: drumMatch[2].toUpperCase(),
					name: fields.name,
					mes: fields.mes,
					pan_position: fields.pan_position,
					bitmap_byte: fields.bitmap_byte,
					bitmap_bit: fields.bitmap_bit
				});
				continue;
			}
		}

		// Parse volume curve entries (CC#7 and RPNC#7)
		if (currentTable === 'volume_cc7' || currentTable === 'volume_rpnc7') {
			// Skip headers
			if (line.startsWith('CC#7') || line.startsWith('RPNC#7') || line.startsWith('Amplitude')) {
				continue;
			}

			const volMatch = line.match(VOLUME_CURVE_REGEX);
			if (volMatch) {
				const entry = {
					value: volMatch[1].toUpperCase(),
					amplitude: volMatch[2].trim()
				};
				if (currentTable === 'volume_cc7') {
					volumeCurveCc7.push(entry);
				} else {
					volumeCurveRpnc7.push(entry);
				}
				continue;
			}
		}

		// Parse key-based instrument controllers
		if (currentTable === 'key_based_controllers') {
			// Skip headers
			if (line.startsWith('nn') || line.startsWith('Controller') || line.startsWith('Number') || line.startsWith('Name') || line.startsWith('Equivalent') || line.startsWith('vv')) {
				continue;
			}

			const kbcMatch = line.match(KEY_BASED_CONTROLLER_REGEX);
			if (kbcMatch) {
				keyBasedControllers.push({
					controller_number: parseInt(kbcMatch[1], 10),
					name: kbcMatch[2].trim(),
					equivalent_rpnc: kbcMatch[3].trim()
				});
				continue;
			}
		}

		// Parse SysEx message format entries
		if (currentTable === 'sysex_inquiry' || currentTable === 'sysex_reply') {
			// Skip headers
			if (line.startsWith('Value') || line.startsWith('Parameter')) {
				continue;
			}

			// Match various SysEx message line formats
			// Format: `F0 System Exclusive Start` or `1 byte Destination` or `00–0F: To/from MIDI Channels 1-16`
			const sysexMatch = line.match(SYSEX_MESSAGE_REGEX);
			if (sysexMatch) {
				const entry = {
					value: sysexMatch[1],
					parameter: sysexMatch[2].trim()
				};
				if (currentTable === 'sysex_inquiry') {
					sysexInquiryMessage.push(entry);
				} else {
					sysexReplyMessage.push(entry);
				}
				continue;
			}

			// Handle multi-line parameter descriptions (continuation lines)
			// e.g., "00–0F: To/from MIDI Channels 1-16"
			if (line.match(/^[0-9A-Fa-f]{2}[–-][0-9A-Fa-f]{2}:/)) {
				const target = currentTable === 'sysex_inquiry' ? sysexInquiryMessage : sysexReplyMessage;
				if (target.length > 0) {
					target[target.length - 1].parameter += ' ' + line;
				}
				continue;
			}
		}

		// Parse Profile Features Supported bitmap
		if (currentTable === 'profile_features') {
			// Skip headers
			if (line.startsWith('Bytes') || line.startsWith('Features') || line.startsWith('Supported') || (line.startsWith('Byte ') && line.includes('(bitmap'))) {
				// Check if this is a "Byte N" header
				const byteHeaderMatch = line.match(/^Byte\s+(\d+)\s*\(bitmap/);
				if (byteHeaderMatch) {
					finalizeFeatureByte();
					currentFeatureByte = parseInt(byteHeaderMatch[1], 10);
				}
				continue;
			}

			// Parse bit entries
			const bitMatch = line.match(FEATURE_BIT_REGEX);
			if (bitMatch && currentFeatureByte !== null) {
				const bitStart = parseInt(bitMatch[1], 10);
				const bitEnd = bitMatch[2] ? parseInt(bitMatch[2], 10) : bitStart;
				const description = bitMatch[3].trim();
				if (bitEnd > bitStart) {
					// Range entry (e.g. D2-D6: Reserved)
					currentFeatureBits.push({
						bit_range: `${bitStart}-${bitEnd}`,
						description
					});
				} else {
					currentFeatureBits.push({
						bit_number: bitStart,
						description
					});
				}
				continue;
			}

			// Handle continuation lines for feature bit descriptions
			// e.g. "Controllers (Universal SysEx)" continues D1 description
			if (currentFeatureByte !== null && currentFeatureBits.length > 0) {
				const lastBit = currentFeatureBits[currentFeatureBits.length - 1];
				if (!line.startsWith('Byte ') && !line.startsWith('(bitmap') && !line.startsWith('D') && !line.startsWith('*Bitmap') && !line.startsWith('Figure ')) {
					// Only append if this looks like a continuation (not explanatory text after the last byte)
					if (currentFeatureByte < 10 || lastBit.bit_number !== 6) {
						lastBit.description += ' ' + line;
						continue;
					}
				}
			}

			// Check for "Byte N" without (bitmap*)
			const byteMatch = line.match(/^Byte\s+(\d+)$/);
			if (byteMatch) {
				finalizeFeatureByte();
				currentFeatureByte = parseInt(byteMatch[1], 10);
				continue;
			}
		}
	}

	finalizeFeatureByte();

	const result = {
		metadata: {
			title: 'Default Drum Note Map Profile',
			doc_id: 'M2-125-UM',
			version: '1.0',
			source: path.basename(markdownPath)
		},
		profile_id: profileIdBytes,
		profile_levels: profileLevels,
		drum_note_map: drumNoteMap,
		mes_definitions: mesDefinitions,
		volume_curve_cc7: volumeCurveCc7,
		volume_curve_rpnc7: volumeCurveRpnc7,
		key_based_controllers: keyBasedControllers,
		sysex_inquiry_message: sysexInquiryMessage,
		sysex_reply_message: sysexReplyMessage,
		profile_features: profileFeatures,
		version_history: versionHistory,
		summary: {
			profile_id_byte_count: profileIdBytes.length,
			profile_level_count: profileLevels.length,
			drum_note_count: drumNoteMap.length,
			mes_definition_count: mesDefinitions.length,
			volume_curve_cc7_count: volumeCurveCc7.length,
			volume_curve_rpnc7_count: volumeCurveRpnc7.length,
			key_based_controller_count: keyBasedControllers.length,
			sysex_inquiry_message_count: sysexInquiryMessage.length,
			sysex_reply_message_count: sysexReplyMessage.length,
			profile_feature_byte_count: profileFeatures.length,
			version_history_count: versionHistory.length
		}
	};

	if (outDir) {
		await fs.mkdir(outDir, { recursive: true });
		await fs.writeFile(path.join(outDir, 'default-drum-note-map-profile.json'), JSON.stringify(result, null, 2), 'utf-8');
	}

	return result;
}
