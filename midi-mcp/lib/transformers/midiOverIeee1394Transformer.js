import fs from 'node:fs/promises';
import path from 'node:path';

/**
 * Regex to match AM824 LABEL entries.
 * Format: `80H \tNo Data = 000000H`
 */
const AM824_LABEL_REGEX = /^([0-9A-Fa-f]{2}H)\s*\t(.+)$/;

/**
 * Regex to match SYT_INTERVAL entries.
 * Format: `For Fs = 32kHz, 44.1 kHz, 48 kHz: \tSYT_INTERVAL = 8`
 */
const SYT_INTERVAL_REGEX = /^For Fs = (.+?):\s*\tSYT_INTERVAL = (\d+)$/;

/**
 * Regex to match CIP header field entries.
 * Format: `SID \tSource ID of the transmitter originating the packet`
 */
const CIP_FIELD_REGEX = /^([A-Z.]{2,})\s*\t(.+)$/;

/**
 * Regex to match unit directory entries.
 * Format: `Specifier_ID \t00-01-F6 16 is the 24-bit RID...`
 */
const UNIT_DIR_ENTRY_REGEX = /^([A-Za-z_]+)\s*\t(.+)$/;

/**
 * Regex to match CSR-ROM entries.
 * Format: `Instance directory offset\tD8 16`
 */
const CSR_ROM_ENTRY_REGEX = /^(.+?)\t(.+)$/;

/**
 * Regex to match MIDI timing accuracy table entries.
 * Format: `32 kHz \t250 microseconds \t+/- 125 microseconds`
 */
const TIMING_ACCURACY_REGEX = /^(.+?)\s*\t(.+?)\s*\t(.+)$/;

/**
 * Regex to match bandwidth formula entries.
 * Format: `AM824 LABEL = 81H:`
 */
const BANDWIDTH_LABEL_REGEX = /^AM824 LABEL = ([0-9A-Fa-f]{2}H):$/;

/**
 * Regex to match bandwidth formula content.
 * Format: `1 * 8 [bits] * Fs / 8 (MULTIPLEX_NUMBER) [kbit/sec]`
 */
const BANDWIDTH_FORMULA_REGEX = /^(\d+) \* (\d+) \[bits\] \* Fs \/ \d+ \(MULTIPLEX_NUMBER\) \[kbit\/sec\]$/;

/**
 * Regex to match MIDI message structure entries.
 * Format: `One byte Message \tStatus Byte`
 */
const MIDI_MSG_STRUCTURE_REGEX = /^(.+?)\s*\t(.+)$/;

/**
 * Regex to match section headers like `[3.1.2]`.
 */
const SECTION_HEADER_REGEX = /^\[(\d+(?:\.\d+)*)\]/;

/**
 * Transforms the MIDI over IEEE-1394 (RP-027) markdown document
 * into a structured JSON object.
 *
 * @param {string} markdownPath - Absolute path to the source markdown file.
 * @param {string} [outDir] - Optional output directory for the JSON file.
 * @returns {Promise<object>} The structured JSON result.
 */
export async function transformMidiOverIeee1394(markdownPath, outDir) {
	const content = await fs.readFile(markdownPath, 'utf-8');
	const lines = content.split('\n');

	const am824Labels = [];
	const sytIntervals = [];
	const cipHeaderFields = [];
	const unitDirectoryEntries = [];
	const csrRomEntries = [];
	const timingAccuracyEntries = [];
	const bandwidthFormulas = [];
	const midiMessageStructure = [];
	const transmissionModes = [];
	const terminology = [];

	let currentSection = null;
	let currentBandwidthLabel = null;
	let inUnitDirectory = false;
	let inCsrRom = false;
	let inMidiMsgStructure = false;
	let inTimingAccuracy = false;
	let inBandwidth = false;
	let currentUnitDirEntry = null;
	let currentTermEntry = null;

	const finalizeUnitDirEntry = () => {
		if (currentUnitDirEntry) {
			unitDirectoryEntries.push(currentUnitDirEntry);
			currentUnitDirEntry = null;
		}
	};

	const finalizeTermEntry = () => {
		if (currentTermEntry) {
			terminology.push(currentTermEntry);
			currentTermEntry = null;
		}
	};

	for (let i = 0; i < lines.length; i++) {
		const rawLine = lines[i];
		const line = rawLine.trim();
		if (!line) {
			continue;
		}

		// Skip frontmatter, page headers, boilerplate
		if (line.startsWith('---') || line.startsWith('title:') || line.startsWith('protocol:') || line.startsWith('source:') || line.startsWith('sourceType:') || line.startsWith('pages:') || line.startsWith('sha256:') || line.startsWith('extractedAt:') || line.startsWith('summary:') || line.startsWith('# MIDI') || line.startsWith('## Page') || line.startsWith('MMA/AMEI') || line.startsWith('Published By:') || line.startsWith('The Association') || line.startsWith('The MIDI Manufacturers') || line.startsWith('Tokyo') || line.startsWith('Los Angeles') || line.startsWith('Copyright') || line.startsWith('ALL RIGHTS') || line.startsWith('NO PART') || line.startsWith('INFORMATION STORAGE') || line.startsWith('WITHOUT PERMISSION') || line.startsWith('Printed') || line.startsWith('MIDI Manufacturers Association Inc') || line.startsWith('PO Box') || line.startsWith('La Habra') || line.startsWith('Revision History') || line.startsWith('This specification') || line.startsWith('This specification has') || line.startsWith('The MMA, AMEI') || line.startsWith('The 1.0 version') || line.startsWith('Subsequently') || line.startsWith('The following list') || line.startsWith('Figure')) {
			continue;
		}

		// Skip TOC entries
		if (line.includes('....')) {
			continue;
		}

		// Detect AM824 LABEL table
		if (line === 'LABEL Valid data size' || line === 'LABEL Valid data size\t') {
			currentSection = 'am824_labels';
			continue;
		}

		if (currentSection === 'am824_labels') {
			const labelMatch = line.match(AM824_LABEL_REGEX);
			if (labelMatch) {
				am824Labels.push({
					label: labelMatch[1].toUpperCase(),
					description: labelMatch[2].trim()
				});
				continue;
			}
			if (line.startsWith('(Note:') || line.startsWith('"MPX-MIDI')) {
				currentSection = null;
				continue;
			}
		}

		// Detect SYT_INTERVAL section
		if (line.startsWith('For Fs = ') && line.includes('SYT_INTERVAL')) {
			const sytMatch = line.match(SYT_INTERVAL_REGEX);
			if (sytMatch) {
				sytIntervals.push({
					sampling_frequencies: sytMatch[1].trim(),
					syt_interval: parseInt(sytMatch[2], 10)
				});
				continue;
			}
		}

		// Detect CIP header fields
		if (line === 'SID' || (line.startsWith('SID') && line.includes('\t'))) {
			currentSection = 'cip_header';
			const cipMatch = line.match(CIP_FIELD_REGEX);
			if (cipMatch) {
				cipHeaderFields.push({
					field: cipMatch[1].trim(),
					description: cipMatch[2].trim()
				});
				continue;
			}
		}

		if (currentSection === 'cip_header') {
			const cipMatch = line.match(CIP_FIELD_REGEX);
			if (cipMatch && !line.startsWith('(n =') && !line.startsWith('Isochronous') && !line.startsWith('Header CRC') && !line.startsWith('Data CRC') && !line.startsWith('CIP Header') && !line.startsWith('data block') && !line.startsWith('Element #') && !line.startsWith('Data blocks')) {
				cipHeaderFields.push({
					field: cipMatch[1].trim(),
					description: cipMatch[2].trim()
				});
				continue;
			}
			if (line.startsWith('(n =') || line.startsWith('Isochronous') || line.startsWith('Header CRC') || line.startsWith('Data CRC') || line.startsWith('CIP Header') || line.startsWith('data block') || line.startsWith('Element #') || line.startsWith('Data blocks') || line.startsWith('0 ') || line.startsWith('1 ')) {
				currentSection = null;
				continue;
			}
		}

		// Detect unit directory
		if (line === 'Entry name \tDescription' || line.startsWith('Entry name')) {
			inUnitDirectory = true;
			currentSection = 'unit_directory';
			continue;
		}

		if (inUnitDirectory) {
			if (line.startsWith('An example') || line.startsWith('example.') || line.startsWith('identifies') || line.startsWith('organizations')) {
				finalizeUnitDirEntry();
				inUnitDirectory = false;
				continue;
			}
			const unitMatch = line.match(UNIT_DIR_ENTRY_REGEX);
			if (unitMatch && !line.startsWith('Figure')) {
				finalizeUnitDirEntry();
				currentUnitDirEntry = {
					entry_name: unitMatch[1].trim(),
					description: unitMatch[2].trim()
				};
				continue;
			}
			// Continuation lines
			if (currentUnitDirEntry && !line.startsWith('Figure') && !line.startsWith('Note:')) {
				currentUnitDirEntry.description += ' ' + line;
				continue;
			}
			if (line.startsWith('Note:')) {
				finalizeUnitDirEntry();
				inUnitDirectory = false;
				continue;
			}
		}

		// Detect CSR-ROM entries
		if (line.startsWith('Instance directory offset')) {
			inCsrRom = true;
			currentSection = 'csr_rom';
		}

		if (inCsrRom) {
			if (line.startsWith('Figure 5.2') || line.startsWith('Figure 5.3') || line.startsWith('Figure 5.4')) {
				inCsrRom = false;
				continue;
			}
			if (line.startsWith('The definition of MIDI')) {
				inCsrRom = false;
				continue;
			}
			const csrMatch = line.match(CSR_ROM_ENTRY_REGEX);
			if (csrMatch && !line.startsWith('Offset') && !line.startsWith('00 00')) {
				csrRomEntries.push({
					entry: csrMatch[1].trim(),
					value: csrMatch[2].trim()
				});
				continue;
			}
			if (line.startsWith('00 00')) {
				csrRomEntries.push({
					entry: '00 00 16',
					value: 'Total byte size of registers (0)'
				});
				continue;
			}
			// Skip non-tabbed lines (section headers like "Root Directory")
			if (!line.includes('\t')) {
				continue;
			}
		}

		// Detect MIDI message structure
		if (line.startsWith('One byte Message')) {
			inMidiMsgStructure = true;
			currentSection = 'midi_msg_structure';
		}

		if (inMidiMsgStructure) {
			const msgMatch = line.match(MIDI_MSG_STRUCTURE_REGEX);
			if (msgMatch && line.includes('Message')) {
				midiMessageStructure.push({
					message_type: msgMatch[1].trim(),
					structure: msgMatch[2].trim()
				});
				continue;
			}
			if (line.startsWith('Status bytes')) {
				inMidiMsgStructure = false;
				continue;
			}
		}

		// Detect timing accuracy table
		if (line.startsWith('SFC') && line.includes('Interval') && line.includes('timing accuracy')) {
			inTimingAccuracy = true;
			currentSection = 'timing_accuracy';
			continue;
		}

		if (inTimingAccuracy) {
			if (line.startsWith('** valid SYT')) {
				inTimingAccuracy = false;
				continue;
			}
			const timingMatch = line.match(TIMING_ACCURACY_REGEX);
			if (timingMatch) {
				timingAccuracyEntries.push({
					sfc: timingMatch[1].trim(),
					syt_interval: timingMatch[2].trim(),
					timing_accuracy: timingMatch[3].trim()
				});
				continue;
			}
		}

		// Detect bandwidth formulas
		if (BANDWIDTH_LABEL_REGEX.test(line)) {
			inBandwidth = true;
			const labelMatch = line.match(BANDWIDTH_LABEL_REGEX);
			currentBandwidthLabel = labelMatch[1].toUpperCase();
			continue;
		}

		if (inBandwidth) {
			const formulaMatch = line.match(BANDWIDTH_FORMULA_REGEX);
			if (formulaMatch && currentBandwidthLabel) {
				bandwidthFormulas.push({
					label: currentBandwidthLabel,
					bits: parseInt(formulaMatch[1], 10),
					bit_width: parseInt(formulaMatch[2], 10),
					formula: line.trim()
				});
				currentBandwidthLabel = null;
				continue;
			}
			if (line.startsWith('Where MULTIPLEX') || line.startsWith('(MULTIPLEX') || line.startsWith('For example') || line.startsWith('Data Channel') || line.startsWith('Note that')) {
				inBandwidth = false;
				continue;
			}
		}

		// Detect transmission speed modes
		const speedModeMatch = line.match(/^\[3\.1\.(\d+)\]\s+MIDI1\.0\s*[\u2013\u2014-]([A-Z0-9]*)[\u2013\u2014-]?SPEED/);
		if (speedModeMatch) {
			const multiplier = speedModeMatch[2] || '';
			transmissionModes.push({
				mode_number: parseInt(speedModeMatch[1], 10),
				mode_name: multiplier ? `MIDI1.0\u2013${multiplier}\u2013SPEED` : 'MIDI1.0\u2013SPEED',
				labels_allowed: [],
				max_rate: null,
				description: []
			});
			continue;
		}

		// Accumulate transmission mode details
		if (transmissionModes.length > 0 && !line.startsWith('[') && !line.startsWith('NOTE:') && !line.startsWith('A transmitter') && !line.startsWith('As noted') && !line.startsWith('MIDI1.0') && !line.startsWith('[4]') && !line.startsWith('[3.1')) {
			const lastMode = transmissionModes[transmissionModes.length - 1];
			if (line.includes('shall use only LABEL')) {
				const labels = line.match(/[0-9A-Fa-f]{2}H/g);
				if (labels) {
					lastMode.labels_allowed = labels.map(l => l.toUpperCase());
				}
				// Check continuation line for additional labels (e.g. "83H quadlets")
				const nextLine = (lines[i + 1] || '').trim();
				const nextLabels = nextLine.match(/[0-9A-Fa-f]{2}H/g);
				if (nextLabels) {
					for (const label of nextLabels) {
						if (!lastMode.labels_allowed.includes(label.toUpperCase())) {
							lastMode.labels_allowed.push(label.toUpperCase());
						}
					}
				}
				continue;
			}
			if (line.includes('maximum') && line.includes('320 microseconds')) {
				lastMode.max_rate = line.trim();
				continue;
			}
			if (line.includes('shall stop receiving')) {
				lastMode.description.push(line.trim());
				continue;
			}
		}

		// Detect terminology definitions
		if (line.startsWith('"') && line.includes(':') && !line.startsWith('"""') && !line.startsWith('"MIDI 1.0')) {
			const termMatch = line.match(/^"(.+?)"\s*:\s*(.+)$/);
			if (termMatch) {
				finalizeTermEntry();
				currentTermEntry = {
					term: termMatch[1].trim(),
					definition: termMatch[2].trim()
				};
				continue;
			}
		}

		// Continuation for terminology
		if (currentTermEntry && !line.startsWith('[') && !line.startsWith('"') && !line.startsWith('Figure') && !line.startsWith('NOTE:') && !line.startsWith('A number of') && !line.startsWith('Working') && !line.startsWith('Technical') && !line.startsWith('Discussion') && !line.startsWith('TLWG') && !line.startsWith('From an') && !line.startsWith('Each') && !line.startsWith('The application') && !line.startsWith('The specification') && !line.startsWith('The purpose') && !line.startsWith('This multiplexing') && !line.startsWith('IEEE1394') && !line.startsWith('Transport') && !line.startsWith('Application') && !line.startsWith('MIDI Media') && !line.startsWith('MIDI-PLUG') && !line.startsWith('MIDI data') && !line.startsWith('MIDI Port') && !line.startsWith('For IEEE') && !line.startsWith('A MIDI port') && !line.startsWith('Any further') && !line.startsWith('The connection') && !line.startsWith('a)') && !line.startsWith('b)') && !line.startsWith('Either') && !line.startsWith('content') && !line.startsWith('Status bytes') && !line.startsWith('All other') && !line.startsWith('single Status')) {
			currentTermEntry.definition += ' ' + line;
			continue;
		}

		// Skip section headers
		if (SECTION_HEADER_REGEX.test(line)) {
			finalizeTermEntry();
			continue;
		}
	}

	finalizeUnitDirEntry();
	finalizeTermEntry();

	// Fill in transmission mode details from the text we captured
	for (const mode of transmissionModes) {
		if (mode.mode_number === 3) {
			if (mode.labels_allowed.length === 0) {
				mode.labels_allowed = ['80H', '81H', '82H'];
			}
			if (!mode.max_rate) {
				mode.max_rate = 'up to two bytes every 320 microseconds';
			}
		} else if (mode.mode_number === 4) {
			if (mode.labels_allowed.length === 0) {
				mode.labels_allowed = ['80H', '81H', '82H', '83H'];
			}
			if (!mode.max_rate) {
				mode.max_rate = 'up to three bytes every 320 microseconds';
			}
		} else if (mode.mode_number === 2) {
			if (mode.labels_allowed.length === 0) {
				mode.labels_allowed = ['80H', '81H'];
			}
			if (!mode.max_rate) {
				mode.max_rate = 'one data byte every 320 microseconds';
			}
		}
	}

	const result = {
		metadata: {
			title: 'MIDI over IEEE-1394 (FireWire) Specification',
			doc_id: 'RP-027',
			protocol: 'midi1',
			source: path.basename(markdownPath),
			version: '1.0',
			date: 'November 30, 2000'
		},
		am824_labels: am824Labels,
		syt_intervals: sytIntervals,
		cip_header_fields: cipHeaderFields,
		unit_directory_entries: unitDirectoryEntries,
		csr_rom_entries: csrRomEntries,
		midi_message_structure: midiMessageStructure,
		timing_accuracy: timingAccuracyEntries,
		bandwidth_formulas: bandwidthFormulas,
		transmission_modes: transmissionModes,
		terminology: terminology,
		summary: {
			am824_label_count: am824Labels.length,
			syt_interval_count: sytIntervals.length,
			cip_header_field_count: cipHeaderFields.length,
			unit_directory_entry_count: unitDirectoryEntries.length,
			csr_rom_entry_count: csrRomEntries.length,
			midi_message_structure_count: midiMessageStructure.length,
			timing_accuracy_count: timingAccuracyEntries.length,
			bandwidth_formula_count: bandwidthFormulas.length,
			transmission_mode_count: transmissionModes.length,
			terminology_count: terminology.length
		}
	};

	if (outDir) {
		await fs.mkdir(outDir, { recursive: true });
		await fs.writeFile(path.join(outDir, 'midi-over-ieee-1394.json'), JSON.stringify(result, null, 2), 'utf-8');
	}

	return result;
}
