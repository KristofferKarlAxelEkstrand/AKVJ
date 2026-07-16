import { describe, it, expect, beforeAll } from 'vitest';
import path from 'node:path';
import { transformCa22 } from '../../lib/transformers/ca22Transformer.js';

describe('CA-022 Controller Destination Setting Transformer', () => {
	let result;

	beforeAll(async () => {
		const docPath = path.resolve(__dirname, '../../data/ca22-controller-destination-sysex-message.md');
		result = await transformCa22(docPath);
	});

	it('should produce correct metadata', () => {
		expect(result.metadata.title).toBe('Controller Destination Setting');
		expect(result.metadata.doc_id).toBe('CA-022');
		expect(result.metadata.version).toBe('1.0.0');
		expect(result.metadata.source).toBe('ca22-controller-destination-sysex-message.md');
	});

	describe('Control sources', () => {
		it('should have 3 control sources', () => {
			expect(result.control_sources).toHaveLength(3);
			expect(result.summary.control_source_count).toBe(3);
		});

		it('should parse 01 Channel Pressure', () => {
			const cs = result.control_sources.find(s => s.sub_id_2 === '01');
			expect(cs).toBeDefined();
			expect(cs.name).toBe('Channel Pressure (Aftertouch)');
		});

		it('should parse 02 Polyphonic Key Pressure', () => {
			const cs = result.control_sources.find(s => s.sub_id_2 === '02');
			expect(cs).toBeDefined();
			expect(cs.name).toBe('Polyphonic Key Pressure (Aftertouch)');
		});

		it('should parse 03 Control Change message', () => {
			const cs = result.control_sources.find(s => s.sub_id_2 === '03');
			expect(cs).toBeDefined();
			expect(cs.name).toBe('Control Change message');
		});
	});

	describe('Message formats', () => {
		it('should have 2 message formats', () => {
			expect(result.message_formats).toHaveLength(2);
			expect(result.summary.message_format_count).toBe(2);
		});

		it('should parse Channel Pressure/Polyphonic Key Pressure format', () => {
			const fmt = result.message_formats[0];
			expect(fmt.message).toContain('F0 7F');
			expect(fmt.message).toContain('01/02');
			expect(fmt.message).toContain('[pp rr]');
			expect(fmt.fields.length).toBeGreaterThan(0);
			expect(fmt.fields).toContain('F0 7F Universal Real Time SysEx header');
			expect(fmt.fields).toContain('F7 EOX');
		});

		it('should parse Control Change format', () => {
			const fmt = result.message_formats[1];
			expect(fmt.message).toContain('F0 7F');
			expect(fmt.message).toContain('09 03');
			expect(fmt.message).toContain('cc');
			expect(fmt.fields.length).toBeGreaterThan(0);
			expect(fmt.fields).toContain('F0 7F Universal Real Time SysEx header');
		});
	});

	describe('Controlled parameters', () => {
		it('should have 7 controlled parameters (6 defined + 1 reserved)', () => {
			expect(result.controlled_parameters).toHaveLength(7);
			expect(result.summary.controlled_parameter_count).toBe(7);
		});

		it('should parse 00 Pitch Control', () => {
			const param = result.controlled_parameters.find(p => p.code === '00');
			expect(param).toBeDefined();
			expect(param.name).toBe('Pitch Control');
			expect(param.range_definition).toBe('R/P');
			expect(param.reserved).toBeUndefined();
		});

		it('should parse 01 Filter Cutoff Control', () => {
			const param = result.controlled_parameters.find(p => p.code === '01');
			expect(param).toBeDefined();
			expect(param.name).toBe('Filter Cutoff Control');
		});

		it('should parse 02 Amplitude Control', () => {
			const param = result.controlled_parameters.find(p => p.code === '02');
			expect(param).toBeDefined();
			expect(param.name).toBe('Amplitude Control');
		});

		it('should parse 03 LFO Pitch Depth', () => {
			const param = result.controlled_parameters.find(p => p.code === '03');
			expect(param).toBeDefined();
			expect(param.name).toBe('LFO Pitch Depth');
		});

		it('should parse 04 LFO Filter Depth', () => {
			const param = result.controlled_parameters.find(p => p.code === '04');
			expect(param).toBeDefined();
			expect(param.name).toBe('LFO Filter Depth');
		});

		it('should parse 05 LFO Amplitude Depth', () => {
			const param = result.controlled_parameters.find(p => p.code === '05');
			expect(param).toBeDefined();
			expect(param.name).toBe('LFO Amplitude Depth');
		});

		it('should parse 06-7F reserved range', () => {
			const reserved = result.controlled_parameters.find(p => p.reserved === true);
			expect(reserved).toBeDefined();
			expect(reserved.range_start).toBe('06');
			expect(reserved.range_end).toBe('7F');
			expect(reserved.name).toContain('reserved');
		});
	});

	describe('Example', () => {
		it('should have 12 example fields', () => {
			expect(result.example.fields).toHaveLength(12);
			expect(result.summary.example_field_count).toBe(12);
		});

		it('should start with F0 7F Universal Real Time SysEx header', () => {
			expect(result.example.fields[0].hex).toBe('F0 7F');
			expect(result.example.fields[0].description).toBe('Universal Real Time SysEx header');
		});

		it('should have device ID 7F as second field', () => {
			expect(result.example.fields[1].hex).toBe('7F');
			expect(result.example.fields[1].description).toContain('device ID');
		});

		it('should have sub-ID#1 09 as third field', () => {
			expect(result.example.fields[2].hex).toBe('09');
			expect(result.example.fields[2].description).toContain('Controller Destination Setting');
		});

		it('should have sub-ID#2 01 (Channel Pressure) as fourth field', () => {
			expect(result.example.fields[3].hex).toBe('01');
			expect(result.example.fields[3].description).toContain('Channel Pressure');
		});

		it('should have channel 06 as fifth field', () => {
			expect(result.example.fields[4].hex).toBe('06');
			expect(result.example.fields[4].description).toContain('Channel');
		});

		it('should have destination 00 (Pitch Control) with range 42', () => {
			const dest00 = result.example.fields.find(f => f.hex === '00' && f.description.includes('Pitch Control'));
			expect(dest00).toBeDefined();
			const range42 = result.example.fields.find(f => f.hex === '42');
			expect(range42).toBeDefined();
			expect(range42.description).toContain('+2 semitones');
		});

		it('should have destination 01 (Filter Cutoff Control) with range 60', () => {
			const dest01 = result.example.fields.find(f => f.hex === '01' && f.description.includes('Filter Cutoff'));
			expect(dest01).toBeDefined();
			const range60 = result.example.fields.find(f => f.hex === '60');
			expect(range60).toBeDefined();
			expect(range60.description).toContain('+4800 cents');
		});

		it('should have destination 05 (LFO Amplitude Depth) with range 20', () => {
			const dest05 = result.example.fields.find(f => f.hex === '05' && f.description.includes('LFO Amplitude'));
			expect(dest05).toBeDefined();
			const range20 = result.example.fields.find(f => f.hex === '20');
			expect(range20).toBeDefined();
			expect(range20.description).toContain('25%');
		});

		it('should end with F7 EOX', () => {
			const last = result.example.fields[result.example.fields.length - 1];
			expect(last.hex).toBe('F7');
			expect(last.description).toBe('EOX');
		});
	});

	describe('Data integrity', () => {
		it('should have all control sources with sub_id_2 and name', () => {
			for (const cs of result.control_sources) {
				expect(cs.sub_id_2).toMatch(/^[0-9A-F]{2}$/);
				expect(cs.name).toBeTruthy();
			}
		});

		it('should have all message formats with message and fields array', () => {
			for (const fmt of result.message_formats) {
				expect(fmt.message).toBeTruthy();
				expect(Array.isArray(fmt.fields)).toBe(true);
				expect(fmt.fields.length).toBeGreaterThan(0);
			}
		});

		it('should have all controlled parameters with either code or range_start', () => {
			for (const param of result.controlled_parameters) {
				if (param.reserved) {
					expect(param.range_start).toBeTruthy();
					expect(param.range_end).toBeTruthy();
				} else {
					expect(param.code).toMatch(/^[0-9A-F]{2}$/);
					expect(param.name).toBeTruthy();
				}
			}
		});

		it('should have all example fields with hex and description', () => {
			for (const field of result.example.fields) {
				expect(field.hex).toBeTruthy();
				expect(field.description).toBeTruthy();
			}
		});
	});
});
