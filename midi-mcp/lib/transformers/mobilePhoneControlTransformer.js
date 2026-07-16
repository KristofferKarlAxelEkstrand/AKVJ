import fs from 'node:fs/promises';
import path from 'node:path';

/**
 * Regex to match DeviceClassID table entry start.
 * Format: `0 \tReserved for future MMA / AMEI Definition`
 * Or range: `6-126 \tReserved for future MMA / AMEI Definition`
 */
const DEVICE_CLASS_ENTRY_REGEX = /^(\d+|\d+-\d+)\s*\t(.+)$/;

/**
 * Regex to match DeviceIndex table entry start.
 * Format: `0-126 \tValid common deviceIndex`
 */
const DEVICE_INDEX_ENTRY_REGEX = /^(\d+|\d+-\d+)\s*\t(.+)$/;

/**
 * Regex to match CmdID table entry start.
 * Format: `0 \tReserved for future MMA / AMEI Definition`
 */
const CMD_ID_ENTRY_REGEX = /^(\d+|\d+-\d+)\s*\t(.+)$/;

/**
 * Regex to match example message section headers.
 * Format: `3.1. Reset All Available Devices in the Mobile Phone`
 */
const EXAMPLE_HEADER_REGEX = /^3\.(\d+)\.\s+(.+)$/;

/**
 * Regex to match example message byte lines.
 * Format: `F0 7F <phone ID> 0C 00 \t// Universal Sys Ex header`
 */
const EXAMPLE_BYTE_LINE_REGEX = /^(.+?)\t\/\/\s*(.+)$/;

/**
 * Regex to detect per-device-class behavior lines in CmdID entries.
 * Format: `For Vibrators: Turn vibrator off`
 */
const DEVICE_BEHAVIOR_REGEX = /^For\s+(Vibrators?|LEDs?|Displays\s*&\s*Keypads\s*\/\s*Keyboards?):\s*(.+)$/;

/**
 * Regex to detect data byte description lines.
 * Format: `No data bytes` or `3 data bytes: R, G, B ...`
 */
const DATA_BYTES_REGEX = /^(No data bytes|\d+\s+data bytes?:\s*.+|Variable number of data bytes.+)$/;

/**
 * Transforms the Mobile Phone Control Message (RP-046) markdown document
 * into a structured JSON object.
 *
 * @param {string} markdownPath - Absolute path to the source markdown file.
 * @param {string} [outDir] - Optional output directory for the JSON file.
 * @returns {Promise<object>} The structured JSON result.
 */
export async function transformMobilePhoneControl(markdownPath, outDir) {
	const content = await fs.readFile(markdownPath, 'utf-8');
	const lines = content.split('\n');

	const deviceClassDefinitions = [];
	const deviceIndexDefinitions = [];
	const cmdIdDefinitions = [];
	const exampleMessages = [];
	const playerBehaviorRequirements = [];

	let currentSection = null;
	let currentDeviceClass = null;
	let currentDeviceIndex = null;
	let currentCmdId = null;
	let currentExample = null;
	let currentExampleBytes = [];

	const finalizeDeviceClass = () => {
		if (currentDeviceClass) {
			deviceClassDefinitions.push(currentDeviceClass);
			currentDeviceClass = null;
		}
	};

	const finalizeDeviceIndex = () => {
		if (currentDeviceIndex) {
			deviceIndexDefinitions.push(currentDeviceIndex);
			currentDeviceIndex = null;
		}
	};

	const finalizeCmdId = () => {
		if (currentCmdId) {
			cmdIdDefinitions.push(currentCmdId);
			currentCmdId = null;
		}
	};

	const finalizeExample = () => {
		if (currentExample) {
			currentExample.bytes = currentExampleBytes;
			exampleMessages.push(currentExample);
			currentExample = null;
			currentExampleBytes = [];
		}
	};

	for (const rawLine of lines) {
		const line = rawLine.trim();
		if (!line) {
			continue;
		}

		// Skip page headers and boilerplate
		if (line.startsWith('## Page') || line.startsWith('MMA Technical Standards') || line.startsWith('AMEI MIDI Committee') || line.startsWith('Letter of Agreement') || line.startsWith('Mobile Phone Control') || line.startsWith('Universal Real Time') || line.startsWith('Source:') || line.startsWith('Abstract:') || line.startsWith('Background:') || line.startsWith('Publication Plan:') || line.startsWith('Details:') || line.startsWith('https://') || line.startsWith('http://')) {
			continue;
		}

		// Detect section headers
		if (line.startsWith('2.2. DeviceClassID Definitions')) {
			finalizeDeviceClass();
			finalizeDeviceIndex();
			finalizeCmdId();
			finalizeExample();
			currentSection = 'device_class';
			continue;
		}
		if (line.startsWith('2.3. DeviceIndex Definitions')) {
			finalizeDeviceClass();
			finalizeDeviceIndex();
			finalizeCmdId();
			finalizeExample();
			currentSection = 'device_index';
			continue;
		}
		if (line.startsWith('2.4. CmdID Definitions')) {
			finalizeDeviceClass();
			finalizeDeviceIndex();
			finalizeCmdId();
			finalizeExample();
			currentSection = 'cmd_id';
			continue;
		}
		if (line.startsWith('3. Example Messages')) {
			finalizeDeviceClass();
			finalizeDeviceIndex();
			finalizeCmdId();
			finalizeExample();
			currentSection = 'examples';
			continue;
		}
		if (line.startsWith('4. Player Behavior Requirements')) {
			finalizeDeviceClass();
			finalizeDeviceIndex();
			finalizeCmdId();
			finalizeExample();
			currentSection = 'player_behavior';
			continue;
		}
		if (line.startsWith('5. References')) {
			finalizeDeviceClass();
			finalizeDeviceIndex();
			finalizeCmdId();
			finalizeExample();
			currentSection = null;
			continue;
		}

		// Parse DeviceClassID definitions
		if (currentSection === 'device_class') {
			// Skip header
			if (line.startsWith('deviceClass ID') && line.includes('\t')) {
				continue;
			}

			const classMatch = line.match(DEVICE_CLASS_ENTRY_REGEX);
			if (classMatch) {
				finalizeDeviceClass();
				currentDeviceClass = {
					class_id: classMatch[1],
					meaning: classMatch[2].trim(),
					notes: []
				};
				continue;
			}

			// Accumulate continuation lines as notes
			if (currentDeviceClass) {
				currentDeviceClass.notes.push(line);
				continue;
			}
		}

		// Parse DeviceIndex definitions
		if (currentSection === 'device_index') {
			// Skip header
			if (line.startsWith('deviceIndex') && line.includes('\t')) {
				continue;
			}

			const indexMatch = line.match(DEVICE_INDEX_ENTRY_REGEX);
			if (indexMatch) {
				finalizeDeviceIndex();
				currentDeviceIndex = {
					index_range: indexMatch[1],
					meaning: indexMatch[2].trim(),
					notes: []
				};
				continue;
			}

			// Accumulate continuation lines as notes
			if (currentDeviceIndex) {
				currentDeviceIndex.notes.push(line);
				continue;
			}
		}

		// Parse CmdID definitions
		if (currentSection === 'cmd_id') {
			// Skip header
			if (line.startsWith('cmdID') && line.includes('\t')) {
				continue;
			}

			const cmdMatch = line.match(CMD_ID_ENTRY_REGEX);
			if (cmdMatch) {
				finalizeCmdId();
				currentCmdId = {
					cmd_id: cmdMatch[1],
					meaning: cmdMatch[2].trim(),
					data_bytes: null,
					device_behaviors: [],
					notes: []
				};
				continue;
			}

			if (currentCmdId) {
				// Check for data bytes line
				const dataBytesMatch = line.match(DATA_BYTES_REGEX);
				if (dataBytesMatch && !currentCmdId.data_bytes) {
					currentCmdId.data_bytes = dataBytesMatch[1];
					continue;
				}

				// Check for device behavior line
				const behaviorMatch = line.match(DEVICE_BEHAVIOR_REGEX);
				if (behaviorMatch) {
					currentCmdId.device_behaviors.push({
						device_class: behaviorMatch[1].trim(),
						behavior: behaviorMatch[2].trim()
					});
					continue;
				}

				// Accumulate as notes
				currentCmdId.notes.push(line);
				continue;
			}
		}

		// Parse example messages
		if (currentSection === 'examples') {
			// Check for example header
			const exampleHeaderMatch = line.match(EXAMPLE_HEADER_REGEX);
			if (exampleHeaderMatch) {
				finalizeExample();
				currentExample = {
					example_number: parseInt(exampleHeaderMatch[1], 10),
					title: exampleHeaderMatch[2].trim(),
					bytes: []
				};
				continue;
			}

			if (currentExample) {
				// Parse byte lines
				const byteMatch = line.match(EXAMPLE_BYTE_LINE_REGEX);
				if (byteMatch) {
					currentExampleBytes.push({
						bytes: byteMatch[1].trim(),
						description: byteMatch[2].trim()
					});
					continue;
				}

				// Also handle lines without tabs (raw byte lines)
				if (line.match(/^[0-9A-Fa-f<]/)) {
					currentExampleBytes.push({
						bytes: line,
						description: ''
					});
					continue;
				}
			}
		}

		// Parse player behavior requirements
		if (currentSection === 'player_behavior') {
			// Detect sub-section headers
			if (line.match(/^4\.\d/)) {
				playerBehaviorRequirements.push({
					section: line,
					details: []
				});
				continue;
			}

			// Accumulate details
			if (playerBehaviorRequirements.length > 0) {
				const last = playerBehaviorRequirements[playerBehaviorRequirements.length - 1];
				last.details.push(line);
			}
		}
	}

	finalizeDeviceClass();
	finalizeDeviceIndex();
	finalizeCmdId();
	finalizeExample();

	const result = {
		metadata: {
			title: 'Mobile Phone Control Message Specification',
			doc_id: 'RP-046',
			protocol: 'midi1',
			source: path.basename(markdownPath)
		},
		message_format: {
			header: 'F0 7F <phone ID> 0C 00',
			sub_id_1: '0C',
			sub_id_2: '00',
			fields: [
				{ name: 'F0', description: 'System Exclusive Start' },
				{ name: '7F', description: 'Universal System Exclusive' },
				{ name: '<phone ID>', description: 'Device ID' },
				{ name: '0C', description: 'Sub-ID#1: Mobile Phone Control' },
				{ name: '00', description: 'Sub-ID#2: Mobile Phone Control' },
				{ name: '<deviceClassID>', description: 'Device Class ID' },
				{ name: '<deviceIndex>', description: 'Device Index' },
				{ name: '<cmdID>', description: 'Command ID' },
				{ name: '<dataBytes>', description: 'Data bytes (command-specific)' }
			]
		},
		device_class_definitions: deviceClassDefinitions,
		device_index_definitions: deviceIndexDefinitions,
		cmd_id_definitions: cmdIdDefinitions,
		example_messages: exampleMessages,
		player_behavior_requirements: playerBehaviorRequirements,
		summary: {
			device_class_count: deviceClassDefinitions.length,
			device_index_count: deviceIndexDefinitions.length,
			cmd_id_count: cmdIdDefinitions.length,
			example_message_count: exampleMessages.length,
			player_behavior_requirement_count: playerBehaviorRequirements.length
		}
	};

	if (outDir) {
		await fs.mkdir(outDir, { recursive: true });
		await fs.writeFile(path.join(outDir, 'mobile-phone-control.json'), JSON.stringify(result, null, 2), 'utf-8');
	}

	return result;
}
