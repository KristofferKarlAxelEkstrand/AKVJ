import { describe, it, expect, beforeAll } from 'vitest';
import path from 'node:path';
import { transformCa19 } from '../../lib/transformers/ca19Transformer.js';

describe('CA-019 Sample Dump Extensions Transformer', () => {
	let result;

	beforeAll(async () => {
		const docPath = path.resolve(__dirname, '../../data/ca19.md');
		result = await transformCa19(docPath);
	});

	it('should produce correct metadata', () => {
		expect(result.metadata.title).toBe('Sample Dump Size, Rate and Name Extensions');
		expect(result.metadata.doc_id).toBe('CA-019');
		expect(result.metadata.version).toBe('1.0.0');
		expect(result.metadata.source).toBe('ca19.md');
	});

	describe('Sub-commands', () => {
		it('should have 5 sub-commands', () => {
			expect(result.sub_commands).toHaveLength(5);
		});

		describe('Sub-command 05: Extended Dump Header', () => {
			const sub = () => result.sub_commands.find(s => s.sub_command === '05');

			it('should have correct name', () => {
				expect(sub().name).toBe('EXTENDED DUMP HEADER');
			});

			it('should have 8 byte fields', () => {
				expect(sub().byte_fields).toHaveLength(8);
			});

			it('should parse ee (Sample Format)', () => {
				const field = sub().byte_fields.find(f => f.variable === 'ee');
				expect(field).toBeDefined();
				expect(field.description).toContain('Sample Format');
				expect(field.description).toContain('8 - 28');
			});

			it('should parse ff ff ff ff (Sample rate integer)', () => {
				const field = sub().byte_fields.find(f => f.variable === 'ff ff ff ff');
				expect(field).toBeDefined();
				expect(field.description).toContain('Sample rate integer');
				expect(field.description).toContain('Hertz');
				expect(field.description).toContain('LSB first');
			});

			it('should parse gg gg gg gg (Sample rate fractional)', () => {
				const field = sub().byte_fields.find(f => f.variable === 'gg gg gg gg');
				expect(field).toBeDefined();
				expect(field.description).toContain('Sample rate fractional');
			});

			it('should parse hh hh hh hh hh (Sample length)', () => {
				const field = sub().byte_fields.find(f => f.variable === 'hh hh hh hh hh');
				expect(field).toBeDefined();
				expect(field.description).toContain('Sample length');
				expect(field.description).toContain('32 GB');
			});

			it('should parse ii ii ii ii ii (Sustain Loop start)', () => {
				const field = sub().byte_fields.find(f => f.variable === 'ii ii ii ii ii');
				expect(field).toBeDefined();
				expect(field.description).toContain('Sustain Loop start');
			});

			it('should parse jj jj jj jj jj (Sustain Loop end)', () => {
				const field = sub().byte_fields.find(f => f.variable === 'jj jj jj jj jj');
				expect(field).toBeDefined();
				expect(field.description).toContain('Sustain Loop end');
			});

			it('should parse kk (Loop type)', () => {
				const field = sub().byte_fields.find(f => f.variable === 'kk');
				expect(field).toBeDefined();
				expect(field.description).toBe('Loop type');
			});

			it('should parse ll (Number of channels)', () => {
				const field = sub().byte_fields.find(f => f.variable === 'll');
				expect(field).toBeDefined();
				expect(field.description).toContain('Number of channels');
			});
		});

		describe('Sub-command 06: Extended Loop Point Transmission', () => {
			const sub = () => result.sub_commands.find(s => s.sub_command === '06');

			it('should have correct name', () => {
				expect(sub().name).toBe('EXTENDED LOOP POINT Transmission');
			});

			it('should have 4 byte fields', () => {
				expect(sub().byte_fields).toHaveLength(4);
			});

			it('should parse bb bb (Loop Number)', () => {
				const field = sub().byte_fields.find(f => f.variable === 'bb bb');
				expect(field).toBeDefined();
				expect(field.description).toContain('Loop Number');
				expect(field.description).toContain('7F 7F');
				expect(field.description).toContain('delete all loops');
			});

			it('should parse cc (Loop Type)', () => {
				const field = sub().byte_fields.find(f => f.variable === 'cc');
				expect(field).toBeDefined();
				expect(field.description).toContain('Loop Type');
			});

			it('should parse dd dd dd dd dd (Loop Start Address)', () => {
				const field = sub().byte_fields.find(f => f.variable === 'dd dd dd dd dd');
				expect(field).toBeDefined();
				expect(field.description).toContain('Loop Start Address');
			});

			it('should parse ee ee ee ee ee (Loop End Address)', () => {
				const field = sub().byte_fields.find(f => f.variable === 'ee ee ee ee ee');
				expect(field).toBeDefined();
				expect(field.description).toContain('Loop End Address');
			});
		});

		describe('Sub-command 07: Extended Loop Point Request', () => {
			const sub = () => result.sub_commands.find(s => s.sub_command === '07');

			it('should have correct name', () => {
				expect(sub().name).toBe('EXTENDED LOOP POINT Request');
			});

			it('should have 1 byte field', () => {
				expect(sub().byte_fields).toHaveLength(1);
			});

			it('should parse bb bb (Loop Number with request all)', () => {
				const field = sub().byte_fields.find(f => f.variable === 'bb bb');
				expect(field).toBeDefined();
				expect(field.description).toContain('Loop Number');
				expect(field.description).toContain('7F 7F');
				expect(field.description).toContain('request all loops');
			});
		});

		describe('Sub-command 03: Sample Name Transmission', () => {
			const sub = () => result.sub_commands.find(s => s.sub_command === '03');

			it('should have correct name', () => {
				expect(sub().name).toBe('SAMPLE NAME TRANSMISSION');
			});

			it('should have 2 byte fields', () => {
				expect(sub().byte_fields).toHaveLength(2);
			});

			it('should parse tt (Language Tag Length)', () => {
				const field = sub().byte_fields.find(f => f.variable === 'tt');
				expect(field).toBeDefined();
				expect(field.description).toContain('Language Tag Length');
				expect(field.description).toContain('default: 00');
			});

			it('should parse nn (Sample Name Length)', () => {
				const field = sub().byte_fields.find(f => f.variable === 'nn');
				expect(field).toBeDefined();
				expect(field.description).toContain('Sample Name Length');
				expect(field.description).toContain('127');
			});
		});

		describe('Sub-command 04: Sample Name Request', () => {
			const sub = () => result.sub_commands.find(s => s.sub_command === '04');

			it('should have correct name', () => {
				expect(sub().name).toBe('SAMPLE NAME REQUEST');
			});

			it('should have 0 byte fields', () => {
				expect(sub().byte_fields).toHaveLength(0);
			});
		});
	});

	describe('Loop types', () => {
		it('should have 10 loop types', () => {
			expect(result.loop_types).toHaveLength(10);
		});

		it('should parse 00 (Forward unidirectional)', () => {
			const lt = result.loop_types.find(l => l.value === '00');
			expect(lt).toBeDefined();
			expect(lt.description).toContain('Forward playback');
			expect(lt.description).toContain('unidirectional loop');
		});

		it('should parse 01 (Forward bi-directional)', () => {
			const lt = result.loop_types.find(l => l.value === '01');
			expect(lt).toBeDefined();
			expect(lt.description).toContain('Forward playback');
			expect(lt.description).toContain('bi-directional loop');
		});

		it('should parse 02 (Forward unidirectional with release)', () => {
			const lt = result.loop_types.find(l => l.value === '02');
			expect(lt).toBeDefined();
			expect(lt.description).toContain('Forward playback');
			expect(lt.description).toContain('unidirectional loop and release');
		});

		it('should parse 03 (Forward bi-directional with release)', () => {
			const lt = result.loop_types.find(l => l.value === '03');
			expect(lt).toBeDefined();
			expect(lt.description).toContain('Forward playback');
			expect(lt.description).toContain('bi-directional loop and release');
		});

		it('should parse 40 (Backward unidirectional)', () => {
			const lt = result.loop_types.find(l => l.value === '40');
			expect(lt).toBeDefined();
			expect(lt.description).toContain('Backward playback');
			expect(lt.description).toContain('unidirectional loop');
		});

		it('should parse 41 (Backward bi-directional)', () => {
			const lt = result.loop_types.find(l => l.value === '41');
			expect(lt).toBeDefined();
			expect(lt.description).toContain('Backward playback');
			expect(lt.description).toContain('bi-directional loop');
		});

		it('should parse 42 (Backward unidirectional with release)', () => {
			const lt = result.loop_types.find(l => l.value === '42');
			expect(lt).toBeDefined();
			expect(lt.description).toContain('Backward playback');
			expect(lt.description).toContain('unidirectional loop and release');
		});

		it('should parse 43 (Backward bi-directional with release)', () => {
			const lt = result.loop_types.find(l => l.value === '43');
			expect(lt).toBeDefined();
			expect(lt.description).toContain('Backward playback');
			expect(lt.description).toContain('bi-directional loop and release');
		});

		it('should parse 7E (Backward one-shot)', () => {
			const lt = result.loop_types.find(l => l.value === '7E');
			expect(lt).toBeDefined();
			expect(lt.description).toContain('Backward one-shot');
			expect(lt.description).toContain('no looping');
		});

		it('should parse 7F (Forward one-shot)', () => {
			const lt = result.loop_types.find(l => l.value === '7F');
			expect(lt).toBeDefined();
			expect(lt.description).toContain('Forward one-shot');
			expect(lt.description).toContain('no looping');
		});
	});

	describe('Examples', () => {
		it('should have 3 examples', () => {
			expect(result.examples).toHaveLength(3);
		});

		it('should parse example 1 (Name Request)', () => {
			const ex = result.examples[0];
			expect(ex.message).toBe('F0 7E 01 05 04 00 01 F7');
			expect(ex.description).toContain('Requests name of sample #1');
		});

		it('should parse example 2 (Name Transmit "Test Sample")', () => {
			const ex = result.examples[1];
			expect(ex.message).toContain('F0 7E 01 05 03 00 01 00 0B');
			expect(ex.message).toContain('54 65 73 74');
			expect(ex.message.endsWith('F7')).toBe(true);
			expect(ex.description).toContain('Test Sample');
		});

		it('should parse example 3 (Name Transmit "Renamed Sample")', () => {
			const ex = result.examples[2];
			expect(ex.message).toContain('F0 7E 01 05 03 00 01 00 0E');
			expect(ex.message).toContain('52 65 6E 61 6D 65 64');
			expect(ex.message.endsWith('F7')).toBe(true);
			expect(ex.description).toContain('Renamed Sample');
		});
	});

	describe('Data integrity', () => {
		it('should not have any hallucinated or dropped data', () => {
			expect(result.sub_commands).toHaveLength(5);
			expect(result.loop_types).toHaveLength(10);
			expect(result.examples).toHaveLength(3);

			const totalByteFields = result.sub_commands.reduce((sum, s) => sum + s.byte_fields.length, 0);
			expect(totalByteFields).toBe(15);
		});
	});
});
