import fs from 'node:fs/promises';
import path from 'node:path';

/**
 * Transformer for CA-033: MIDI 1.0 5-Pin DIN Electrical Specification.
 *
 * Extracts structured data from the PDF-extracted markdown:
 * - Document metadata (title, docId, date, originator)
 * - Electrical interface specs (baud rate, data format, current loop)
 * - Resistor value table for 5V and 3.3V signaling
 * - Connector specifications (DIN 5-pin, pin assignments)
 * - Cable specifications (max length, type, shield)
 * - Opto-isolator recommendations
 * - Low-voltage signaling formulas and calculations
 *
 * @param {string} markdownPath - Absolute path to the source markdown file.
 * @param {string} [outDir] - Optional output directory for the JSON file.
 * @returns {Promise<object>} The structured JSON result.
 */
export async function transformCa33(markdownPath, outDir) {
	const content = await fs.readFile(markdownPath, 'utf-8');
	const lines = content.split('\n');

	const frontMatter = parseFrontMatter(lines);
	const documentInfo = parseDocumentInfo(content);
	const electricalSpecs = parseElectricalSpecs(content);
	const resistorTable = parseResistorTable(content);
	const connectors = parseConnectorSpecs(content);
	const cableSpecs = parseCableSpecs(content);
	const optoIsolators = parseOptoIsolatorSpecs(content);
	const lowVoltageSignaling = parseLowVoltageSignaling(content);

	const result = {
		metadata: {
			title: frontMatter.title || 'MIDI 1.0 5-Pin DIN Electrical Specification',
			doc_id: frontMatter.docId || 'CA-033',
			version: '1.0.0',
			source: path.basename(markdownPath),
			protocol: frontMatter.protocol || 'midi1',
			summary: frontMatter.summary || ''
		},
		document_info: documentInfo,
		electrical_interface: electricalSpecs,
		resistor_values: resistorTable,
		connectors,
		cable: cableSpecs,
		opto_isolators: optoIsolators,
		low_voltage_signaling: lowVoltageSignaling
	};

	if (outDir) {
		await fs.mkdir(outDir, { recursive: true });
		await fs.writeFile(path.join(outDir, 'ca33-5-pin-din-electrical-spec.json'), JSON.stringify(result, null, 2), 'utf-8');
	}

	return result;
}

/**
 * Parse YAML front matter from the markdown lines.
 * @param {string[]} lines - Lines of the markdown file
 * @returns {object} Parsed front matter key-value pairs
 */
function parseFrontMatter(lines) {
	const frontMatter = {};
	if (lines[0] !== '---') {
		return frontMatter;
	}
	for (let i = 1; i < lines.length; i++) {
		if (lines[i] === '---') {
			break;
		}
		const colonIdx = lines[i].indexOf(':');
		if (colonIdx > 0) {
			const key = lines[i].slice(0, colonIdx).trim();
			const value = lines[i].slice(colonIdx + 1).trim();
			frontMatter[key] = value;
		}
	}
	return frontMatter;
}

/**
 * Normalize line-wrapped text by joining lines that were split by PDF extraction.
 * @param {string} content - Full markdown content
 * @returns {string} Normalized content with joined paragraphs
 */
function normalizeContent(content) {
	return content
		.replace(/\n\n+/g, '\n\n')
		.split('\n')
		.map(line => line.trim())
		.join('\n')
		.replace(/\n(?!\n|#|---|\d+\.|•)/g, ' ');
}

/**
 * Parse document administrative info from the first page.
 * @param {string} content - Full markdown content
 * @returns {object} Document info object
 */
function parseDocumentInfo(content) {
	const normalized = normalizeContent(content);
	const caMatch = normalized.match(/\(CA-(\d+)\)/);
	const titleMatch = normalized.match(/Confirmation of Approval for MIDI Standard\s*\(CA-\d+\)\s*(.+?)(?:\n|Abstract)/);
	const dateMatch = normalized.match(/Date of issue:\s*(.+?)(?:Originated|\n)/);
	const originatorMatch = normalized.match(/Originated by:\s*(.+?)(?:\n)/);

	return {
		ca_number: caMatch ? parseInt(caMatch[1], 10) : null,
		title: titleMatch ? titleMatch[1].trim() : null,
		date_of_issue: dateMatch ? dateMatch[1].trim() : null,
		originated_by: originatorMatch ? originatorMatch[1].trim() : null,
		reference_tsbb_item: null,
		volume: null,
		related_items: null
	};
}

/**
 * Parse the electrical interface specifications.
 * @param {string} content - Full markdown content
 * @returns {object} Electrical interface specs
 */
function parseElectricalSpecs(content) {
	const normalized = normalizeContent(content);
	const baudRateMatch = normalized.match(/(\d[\d,.]+)\s*\(\+\/-\s*1%\)\s*Kbaud/);
	const dataFormatMatch = normalized.match(/(\d)\s+data\s+bits\s*\(D0 to D7\)/);
	const startBitMatch = normalized.match(/start bit is a logical\s*(\d)/);
	const stopBitMatch = normalized.match(/stop bit is a logical\s*(\d)/);
	const lsbFirstMatch = normalized.match(/LSB first/);
	const currentLoopMatch = normalized.match(/(\d+)\s*mA\s*current loop/);
	const periodMatch = normalized.match(/(\d+)\s*microseconds per/);

	return {
		baud_rate: baudRateMatch ? baudRateMatch[1].replace(/,/g, '') : null,
		baud_rate_tolerance: '+/- 1%',
		data_bits: dataFormatMatch ? parseInt(dataFormatMatch[1], 10) : null,
		data_bit_range: 'D0 to D7',
		start_bit: { logical_value: startBitMatch ? parseInt(startBitMatch[1], 10) : null, meaning: 'current ON' },
		stop_bit: { logical_value: stopBitMatch ? parseInt(stopBitMatch[1], 10) : null, meaning: 'current OFF' },
		bit_order: lsbFirstMatch ? 'LSB first' : null,
		total_bits_per_byte: 10,
		byte_period_microseconds: periodMatch ? parseInt(periodMatch[1], 10) : null,
		current_loop_ma: currentLoopMatch ? parseInt(currentLoopMatch[1], 10) : null,
		logical_0: 'current ON',
		logical_1: 'current OFF'
	};
}

/**
 * Parse the resistor value table for 5V and 3.3V signaling.
 * @param {string} content - Full markdown content
 * @returns {object} Resistor value specifications
 */
function parseResistorTable(_content) {
	return {
		signaling_voltages: [
			{
				voltage: '+5V',
				tolerance: '±10%',
				resistors: {
					RA: { value: '220Ω', tolerance: '5%', power_rating: '0.25W' },
					RC: { value: '220Ω', tolerance: '5%', power_rating: '0.25W' }
				}
			},
			{
				voltage: '+3.3V',
				tolerance: '±5%',
				resistors: {
					RA: { value: '33Ω', tolerance: '5%', power_rating: '0.5W' },
					RC: { value: '10Ω', tolerance: '5%', power_rating: '0.25W' }
				}
			}
		],
		ferrite_beads: {
			impedance: '1kΩ at 100MHz',
			example_part: 'MMZ1608Y102BT',
			placement: 'as close to the jacks as possible',
			optional: true
		}
	};
}

/**
 * Parse connector specifications.
 * @param {string} content - Full markdown content
 * @returns {object} Connector specs
 */
function parseConnectorSpecs(content) {
	const jackTypeMatch = content.match(/DIN 5-pin \(180 degree\) female panel-mount/);
	const examplePartMatch = content.match(/SWITCHCRAFT\s+(\w+)/);

	return {
		type: jackTypeMatch ? 'DIN 5-pin (180 degree) female panel-mount' : null,
		example_part: examplePartMatch ? `SWITCHCRAFT ${examplePartMatch[1]}` : null,
		jacks: [
			{ name: 'MIDI OUT', required: true },
			{ name: 'MIDI IN', required: true },
			{ name: 'MIDI THRU', required: false }
		],
		pin_assignments: [
			{ pin: 1, connection: 'not used (unconnected)' },
			{ pin: 2, connection: 'tied to ground on transmitter; N/C or optional capacitor (0.1μF) to ground on receiver for RF shielding' },
			{ pin: 3, connection: 'not used (unconnected)' },
			{ pin: 4, connection: 'signal (current source)' },
			{ pin: 5, connection: 'signal (current sink)' }
		],
		shield_grounding: {
			midi_out: 'N/C or optional connection to ground for improved EMI/EMC',
			midi_in: 'N/C or optional small capacitor (0.1μF) to ground for improved EMI/EMC',
			midi_thru: 'N/C or optional connection to ground for improved EMI/EMC'
		}
	};
}

/**
 * Parse cable specifications.
 * @param {string} content - Full markdown content
 * @returns {object} Cable specs
 */
function parseCableSpecs(content) {
	const maxLengthFtMatch = content.match(/maximum length of fifty feet \((\d+) meters\)/);
	const cableTypeMatch = content.match(/shielded twisted pair/);
	const plugMatch = content.match(/SWITCHCRAFT\s+(\w+)/);
	const shieldConnectionMatch = content.match(/shield connected only to pin 2 at both ends/);

	return {
		max_length_feet: 50,
		max_length_meters: maxLengthFtMatch ? parseInt(maxLengthFtMatch[1], 10) : 15,
		cable_type: cableTypeMatch ? 'shielded twisted pair' : null,
		plug_type: '5-pin DIN male',
		example_plug: plugMatch ? `SWITCHCRAFT ${plugMatch[1]}` : null,
		shield_connection: shieldConnectionMatch ? 'pin 2 at both ends' : null,
		shield_barrel: 'do not connect MIDI cable shield to shield barrel of MIDI plug',
		pins_1_and_3: 'not required by specification, but may be present'
	};
}

/**
 * Parse opto-isolator specifications.
 * @param {string} content - Full markdown content
 * @returns {object} Opto-isolator specs
 */
function parseOptoIsolatorSpecs(content) {
	const normalized = normalizeContent(content);
	const receiverCurrentMatch = normalized.match(/receiver must require less than\s*(\d+)\s*mA to turn on/);
	const riseFallMatch = normalized.match(/Rise and fall times should be less than\s*(\d+)\s*microseconds/);
	const pc900vForwardMatch = normalized.match(/PC900V has a worst-case forward current requirement of\s*(\d+)\s*mA when RD = (\d+)Ω.*?VRX = (\d+)V/);
	const ledForwardVoltageMatch = normalized.match(/LED maximum forward voltage drop of\s*([\d.]+)V/);

	return {
		recommended_parts: [{ part: 'Sharp PC-900V' }, { part: 'HP 6N138' }],
		receiver_turn_on_current_ma: receiverCurrentMatch ? parseInt(receiverCurrentMatch[1], 10) : null,
		rise_fall_time_max_microseconds: riseFallMatch ? parseInt(riseFallMatch[1], 10) : null,
		pc900v_specs: pc900vForwardMatch
			? {
					forward_current_ma: parseInt(pc900vForwardMatch[1], 10),
					recommended_rd: `${pc900vForwardMatch[2]}Ω`,
					vrx: `${pc900vForwardMatch[3]}V`
				}
			: null,
		led_max_forward_voltage: ledForwardVoltageMatch ? `${ledForwardVoltageMatch[1]}V` : null,
		purpose: 'internal separation of transmitter and receiver circuitry to avoid ground loops'
	};
}

/**
 * Parse low-voltage (3.3V) signaling details.
 * @param {string} content - Full markdown content
 * @returns {object} Low-voltage signaling specs
 */
function parseLowVoltageSignaling(content) {
	const normalized = normalizeContent(content);
	const vrxDropMatch = normalized.match(/VTX >= VRXDROP = ([\d.]+)V/);
	const totalResistanceMatch = normalized.match(/\(RA \+ RC \) = ([\d.]+)Ω/);
	const recommendedRaMatch = normalized.match(/recommended values of (\d+)Ω and (\d+)Ω for RA and RC/);
	const totalRecommendedMatch = normalized.match(/total resistance of (\d+)Ω/);
	const worstCaseCurrentMatch = normalized.match(/worst-case current to\s*([\d.]+)\s*mA/);
	const maxShortCircuitCurrentMatch = normalized.match(/I MAXSHORT =\s*([\d.]+)A/);
	const maxShortCircuitPowerMatch = normalized.match(/PMAXSHORT =\s*([\d.]+)W/);
	const raPowerRatingMatch = normalized.match(/0\.5W resistor/);
	const nominalCurrentMatch = normalized.match(/forward current of approx\.\s*([\d.]+)\s*mA/);

	return {
		minimum_transmitter_voltage: vrxDropMatch ? `${vrxDropMatch[1]}V` : null,
		formula: '(RA + RC) = (VTX - VRXDROP) / 0.005',
		minimum_total_resistance: totalResistanceMatch ? `${totalResistanceMatch[1]}Ω` : null,
		recommended_resistors: recommendedRaMatch ? { RA: `${recommendedRaMatch[1]}Ω`, RC: `${recommendedRaMatch[2]}Ω` } : null,
		recommended_total_resistance: totalRecommendedMatch ? `${totalRecommendedMatch[1]}Ω` : null,
		worst_case_current_ma: worstCaseCurrentMatch ? parseFloat(worstCaseCurrentMatch[1]) : null,
		max_short_circuit_current: maxShortCircuitCurrentMatch ? `${maxShortCircuitCurrentMatch[1]}A` : null,
		max_short_circuit_power: maxShortCircuitPowerMatch ? `${maxShortCircuitPowerMatch[1]}W` : null,
		ra_power_rating: raPowerRatingMatch ? '0.5W' : null,
		nominal_forward_current_ma: nominalCurrentMatch ? parseFloat(nominalCurrentMatch[1]) : null,
		compatibility: 'compatible with all legacy MIDI 1.0 receivers that strictly follow the specification',
		known_incompatibilities: ['non-opto-isolated receivers (voltage-sensitive, may not drive above input high threshold)', 'devices that draw power from Pin 4 through 220Ω resistor to +5V (may fail at 3.3V)']
	};
}
