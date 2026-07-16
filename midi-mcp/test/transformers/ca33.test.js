import { describe, it, expect, beforeAll } from 'vitest';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { transformCa33 } from '../../lib/transformers/ca33Transformer.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

describe('CA-033 5-Pin DIN Electrical Specification Transformer', () => {
	let result;

	beforeAll(async () => {
		const docPath = path.resolve(__dirname, '../../data/ca33-5-pin-din-electrical-spec.md');
		result = await transformCa33(docPath);
	});

	describe('metadata', () => {
		it('should produce correct metadata', () => {
			expect(result.metadata.title).toBe('MIDI 1.0 5-Pin DIN Electrical Specification');
			expect(result.metadata.doc_id).toBe('CA-033');
			expect(result.metadata.version).toBe('1.0.0');
			expect(result.metadata.source).toBe('ca33-5-pin-din-electrical-spec.md');
			expect(result.metadata.protocol).toBe('midi1');
		});
	});

	describe('document_info', () => {
		it('should parse CA number from title', () => {
			expect(result.document_info.ca_number).toBe(33);
		});

		it('should parse document title', () => {
			expect(result.document_info.title).toContain('MIDI 1.0 Electrical Specification');
		});

		it('should have null for fields not in this document', () => {
			expect(result.document_info.reference_tsbb_item).toBeNull();
			expect(result.document_info.volume).toBeNull();
			expect(result.document_info.related_items).toBeNull();
		});
	});

	describe('electrical_interface', () => {
		it('should parse baud rate', () => {
			expect(result.electrical_interface.baud_rate).toBe('31.25');
			expect(result.electrical_interface.baud_rate_tolerance).toBe('+/- 1%');
		});

		it('should parse data format', () => {
			expect(result.electrical_interface.data_bits).toBe(8);
			expect(result.electrical_interface.data_bit_range).toBe('D0 to D7');
			expect(result.electrical_interface.total_bits_per_byte).toBe(10);
			expect(result.electrical_interface.byte_period_microseconds).toBe(320);
		});

		it('should parse start and stop bits', () => {
			expect(result.electrical_interface.start_bit.logical_value).toBe(0);
			expect(result.electrical_interface.start_bit.meaning).toBe('current ON');
			expect(result.electrical_interface.stop_bit.logical_value).toBe(1);
			expect(result.electrical_interface.stop_bit.meaning).toBe('current OFF');
		});

		it('should parse bit order', () => {
			expect(result.electrical_interface.bit_order).toBe('LSB first');
		});

		it('should parse current loop', () => {
			expect(result.electrical_interface.current_loop_ma).toBe(5);
			expect(result.electrical_interface.logical_0).toBe('current ON');
			expect(result.electrical_interface.logical_1).toBe('current OFF');
		});
	});

	describe('resistor_values', () => {
		it('should have two signaling voltage entries', () => {
			expect(result.resistor_values.signaling_voltages).toHaveLength(2);
		});

		it('should parse 5V signaling', () => {
			const v5 = result.resistor_values.signaling_voltages[0];
			expect(v5.voltage).toBe('+5V');
			expect(v5.tolerance).toBe('±10%');
			expect(v5.resistors.RA.value).toBe('220Ω');
			expect(v5.resistors.RA.tolerance).toBe('5%');
			expect(v5.resistors.RA.power_rating).toBe('0.25W');
			expect(v5.resistors.RC.value).toBe('220Ω');
			expect(v5.resistors.RC.power_rating).toBe('0.25W');
		});

		it('should parse 3.3V signaling', () => {
			const v33 = result.resistor_values.signaling_voltages[1];
			expect(v33.voltage).toBe('+3.3V');
			expect(v33.tolerance).toBe('±5%');
			expect(v33.resistors.RA.value).toBe('33Ω');
			expect(v33.resistors.RA.power_rating).toBe('0.5W');
			expect(v33.resistors.RC.value).toBe('10Ω');
			expect(v33.resistors.RC.power_rating).toBe('0.25W');
		});

		it('should parse ferrite bead info', () => {
			expect(result.resistor_values.ferrite_beads.impedance).toBe('1kΩ at 100MHz');
			expect(result.resistor_values.ferrite_beads.example_part).toBe('MMZ1608Y102BT');
			expect(result.resistor_values.ferrite_beads.optional).toBe(true);
		});
	});

	describe('connectors', () => {
		it('should parse connector type', () => {
			expect(result.connectors.type).toBe('DIN 5-pin (180 degree) female panel-mount');
		});

		it('should parse example part', () => {
			expect(result.connectors.example_part).toContain('SWITCHCRAFT');
		});

		it('should list three jacks', () => {
			expect(result.connectors.jacks).toHaveLength(3);
			expect(result.connectors.jacks.find(j => j.name === 'MIDI OUT').required).toBe(true);
			expect(result.connectors.jacks.find(j => j.name === 'MIDI IN').required).toBe(true);
			expect(result.connectors.jacks.find(j => j.name === 'MIDI THRU').required).toBe(false);
		});

		it('should have 5 pin assignments', () => {
			expect(result.connectors.pin_assignments).toHaveLength(5);
			const pin1 = result.connectors.pin_assignments.find(p => p.pin === 1);
			expect(pin1.connection).toContain('not used');
			const pin2 = result.connectors.pin_assignments.find(p => p.pin === 2);
			expect(pin2.connection).toContain('ground');
		});

		it('should parse shield grounding info', () => {
			expect(result.connectors.shield_grounding.midi_out).toContain('optional');
			expect(result.connectors.shield_grounding.midi_in).toContain('capacitor');
		});
	});

	describe('cable', () => {
		it('should parse max length', () => {
			expect(result.cable.max_length_feet).toBe(50);
			expect(result.cable.max_length_meters).toBe(15);
		});

		it('should parse cable type', () => {
			expect(result.cable.cable_type).toBe('shielded twisted pair');
		});

		it('should parse shield connection', () => {
			expect(result.cable.shield_connection).toBe('pin 2 at both ends');
		});

		it('should note shield barrel rule', () => {
			expect(result.cable.shield_barrel).toContain('do not connect');
		});
	});

	describe('opto_isolators', () => {
		it('should list recommended parts', () => {
			expect(result.opto_isolators.recommended_parts).toHaveLength(2);
			expect(result.opto_isolators.recommended_parts[0].part).toBe('Sharp PC-900V');
			expect(result.opto_isolators.recommended_parts[1].part).toBe('HP 6N138');
		});

		it('should parse receiver turn-on current', () => {
			expect(result.opto_isolators.receiver_turn_on_current_ma).toBe(5);
		});

		it('should parse rise/fall time', () => {
			expect(result.opto_isolators.rise_fall_time_max_microseconds).toBe(2);
		});

		it('should parse PC900V specs', () => {
			expect(result.opto_isolators.pc900v_specs).not.toBeNull();
			expect(result.opto_isolators.pc900v_specs.forward_current_ma).toBe(4);
			expect(result.opto_isolators.pc900v_specs.recommended_rd).toBe('280Ω');
			expect(result.opto_isolators.pc900v_specs.vrx).toBe('5V');
		});

		it('should parse LED max forward voltage', () => {
			expect(result.opto_isolators.led_max_forward_voltage).toBe('1.9V');
		});
	});

	describe('low_voltage_signaling', () => {
		it('should parse minimum transmitter voltage', () => {
			expect(result.low_voltage_signaling.minimum_transmitter_voltage).toBe('3.0V');
		});

		it('should parse formula', () => {
			expect(result.low_voltage_signaling.formula).toContain('RA + RC');
		});

		it('should parse minimum total resistance', () => {
			expect(result.low_voltage_signaling.minimum_total_resistance).toBe('27Ω');
		});

		it('should parse recommended resistors', () => {
			expect(result.low_voltage_signaling.recommended_resistors.RA).toBe('33Ω');
			expect(result.low_voltage_signaling.recommended_resistors.RC).toBe('10Ω');
		});

		it('should parse recommended total resistance', () => {
			expect(result.low_voltage_signaling.recommended_total_resistance).toBe('43Ω');
		});

		it('should parse worst case current', () => {
			expect(result.low_voltage_signaling.worst_case_current_ma).toBe(4.472);
		});

		it('should parse max short circuit current', () => {
			expect(result.low_voltage_signaling.max_short_circuit_current).toBe('0.111A');
		});

		it('should parse max short circuit power', () => {
			expect(result.low_voltage_signaling.max_short_circuit_power).toBe('0.383W');
		});

		it('should parse RA power rating', () => {
			expect(result.low_voltage_signaling.ra_power_rating).toBe('0.5W');
		});

		it('should parse nominal forward current', () => {
			expect(result.low_voltage_signaling.nominal_forward_current_ma).toBe(7.2);
		});

		it('should list known incompatibilities', () => {
			expect(result.low_voltage_signaling.known_incompatibilities).toHaveLength(2);
			expect(result.low_voltage_signaling.known_incompatibilities[0]).toContain('non-opto-isolated');
		});
	});
});
