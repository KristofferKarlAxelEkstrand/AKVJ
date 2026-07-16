import fs from 'node:fs/promises';
import path from 'node:path';

export async function transformCCMessages(markdownPath, outDir) {
	const content = await fs.readFile(markdownPath, 'utf-8');
	const lines = content.split('\n').map(l => l.trim());

	const ccMessages = [];
	let currentCC = null;

	// Regex to match the start of a CC definition
	// e.g., "74   01001010 4A Sound Controller 5 (default: Brightness)   0-127   LSB"
	// e.g., "91   01011011 5B"
	const startRegex = /^(\d{1,3})\s+([01]{8})\s+([0-9A-F]{2})(?:\s+(.*))?$/i;

	for (const line of lines) {
		if (line.includes('Table 3a: Registered Parameter Numbers')) {
			if (currentCC) {
				flushCC(currentCC, ccMessages);
				currentCC = null;
			}
			break; // End of CC table
		}

		const match = line.match(startRegex);
		if (match) {
			if (currentCC) {
				flushCC(currentCC, ccMessages);
			}
			currentCC = {
				cc_number: parseInt(match[1], 10),
				binary: match[2],
				hex: match[3],
				remainder: match[4] || ''
			};
		} else if (currentCC && line !== '' && !line.startsWith('## Page')) {
			// Append multiline descriptions
			currentCC.remainder += ' ' + line;
		}
	}
	if (currentCC) {
		flushCC(currentCC, ccMessages);
	}

	const result = {
		metadata: {
			title: 'Control Change Messages and RPNs',
			version: '1.0.0',
			source: path.basename(markdownPath)
		},
		control_changes: ccMessages
	};

	if (outDir) {
		await fs.mkdir(outDir, { recursive: true });
		await fs.writeFile(path.join(outDir, 'cc-messages.json'), JSON.stringify(result, null, 2), 'utf-8');
	}

	return result;
}

function flushCC(current, outArray) {
	// The remainder contains the name, the value range, and the type (MSB, LSB, or ---)
	// Example remainder: "Sound Controller 5 (default: Brightness)   0-127   LSB"
	// Example remainder: "LSB for Control 7 (Channel Volume, formerly Main Volume) 0-127   LSB"
	// Example remainder: "[Channel Mode Message] Local Control On/Off   0 off, 127 on   ---"

	let remainder = current.remainder.replace(/\s+/g, ' ').trim();

	// The last token is the type (MSB, LSB, ---)
	const typeMatch = remainder.match(/(.*?)\s+(MSB|LSB|---)$/i);
	let type = '---';
	if (typeMatch) {
		type = typeMatch[2].toUpperCase();
		remainder = typeMatch[1].trim();
	}

	// Now we need to split name and range. Range might be "0-127", "≤63 off, ≥64 on", "0 off, 127 on", "N/A", "---"
	let range = '---';
	let name = remainder;

	// Better logic: The name usually ends before digits or specific range words
	// Since range is tricky due to OCR, let's look for the last logical boundary
	const lastPartMatch = remainder.match(/(.*?)\s+(0-127|≤63.*?|0\s*off.*?|0|---|N\/A)$/i);
	if (lastPartMatch) {
		name = lastPartMatch[1].trim();
		range = lastPartMatch[2].trim();
	} else if (remainder.includes('Note:')) {
		// Special case for line 126
		const parts = remainder.split('Note:');
		name = parts[0].trim();
		range = 'Note: ' + parts[1].trim();
	}

	outArray.push({
		cc_number: current.cc_number,
		hex: current.hex.toUpperCase(),
		binary: current.binary,
		name: name,
		range: range,
		type: type
	});
}
