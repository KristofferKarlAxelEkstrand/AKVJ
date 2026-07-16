import { beforeAll, describe, expect, it } from 'vitest';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { transformDls2 } from '../../lib/transformers/dls2Transformer.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

describe('DLS 2.2 Transformer', () => {
	let result;

	beforeAll(async () => {
		result = await transformDls2(path.resolve(__dirname, '../../data/dls2amd2-all-a-pub.md'));
	});

	it('parses source metadata', () => {
		expect(result.metadata).toEqual({
			title: 'Downloadable Sounds Level 2.2 Specification',
			doc_id: 'DLS-2',
			protocol: 'midi1',
			version: '1.0',
			date: '2006-04'
		});
	});

	describe('note exclusivity', () => {
		it('parses both Table 1 capabilities', () => {
			expect(result.note_exclusivity).toEqual([
				{ feature: 'Oscillator Shutdown with EG1_SHUTDOWNTIME', value: 'Yes' },
				{ feature: 'Channels capable for mutually exclusive mode', value: 'Any channel' }
			]);
		});
	});

	describe('modulation routing', () => {
		it('parses all 56 legal routes', () => {
			expect(result.modulation_routes).toHaveLength(56);
		});

		it('preserves the Mod LFO frequency route', () => {
			const route = result.modulation_routes.find(entry => entry.articulator_name === '0Mod LFO Frequency');
			expect(route).toMatchObject({ section: 'Modulator LFO', source: 'SRC_NONE', destination: 'DST_LFO_FREQ', source_bipolar: false });
		});

		it('parses Gain routes with boolean input flags', () => {
			const route = result.modulation_routes.find(entry => entry.articulator_name === 'Velocity to Gain');
			expect(route).toMatchObject({ section: 'Gain', source: 'SRC_KEYONVELOCITY', source_invert: true, source_transform: 'Concave', destination: 'DST_GAIN' });
		});

		it('parses line-wrapped channel-pressure routes', () => {
			const route = result.modulation_routes.find(entry => entry.articulator_name === 'Vib LFO Channel Pressure to Pitch');
			expect(route).toMatchObject({ section: 'Pitch', source: 'SRC_VIBRATO', control: 'SRC_CHANNELPRESSURE', destination: 'DST_PITCH' });
		});

		it('has correct route counts by section', () => {
			const count = section => result.modulation_routes.filter(entry => entry.section === section).length;
			expect(count('Volume EG')).toBe(10);
			expect(count('Modulator EG')).toBe(9);
			expect(count('Pitch')).toBe(11);
		});
	});

	describe('connection defaults', () => {
		it('parses all 56 Table 5/6 entries', () => {
			expect(result.connection_defaults).toHaveLength(56);
		});

		it('parses filter cutoff range', () => {
			const entry = result.connection_defaults.find(value => value.articulator === 'Initial Fc');
			expect(entry).toMatchObject({ section: 'Filter', default_value: '0x7FFFFFFFh', min_value: '5535 cents', max_value: '11921 cents', units: 'Absolute Pitch' });
		});

		it('parses Volume EG shutdown defaults', () => {
			const entry = result.connection_defaults.find(value => value.articulator === 'Vol EG Shutdown Time');
			expect(entry).toMatchObject({ section: 'Vol EG', default_value: '15 msecs', max_value: '40 secs', units: 'Absolute Time' });
		});

		it('parses output reverb and chorus defaults', () => {
			expect(result.connection_defaults.filter(value => value.section === 'Output')).toHaveLength(6);
		});
	});

	describe('DLS system exclusive messages', () => {
		it('parses all four messages with their five byte descriptions', () => {
			expect(result.dls_system_messages).toHaveLength(4);
			result.dls_system_messages.forEach(message => expect(message.bytes).toHaveLength(5));
		});

		it('parses DLS On as universal non-real-time SysEx', () => {
			const message = result.dls_system_messages.find(entry => entry.name === 'Turn DLS On');
			expect(message.message).toBe('F0 7E < device ID > 0A 01 F7');
			expect(message.bytes[0].description).toBe('Universal Non-Real Time SysEx header');
		});

		it('distinguishes static voice allocation commands', () => {
			expect(result.dls_system_messages.find(entry => entry.name.endsWith('Off')).message).toContain('0A 02 F7');
			expect(result.dls_system_messages.find(entry => entry.name === 'Turn DLS Static Voice Allocation On').message).toContain('0A 04 F7');
		});
	});

	describe('RIFF definitions', () => {
		it('parses all 13 Table 7 definitions', () => {
			expect(result.riff_definitions).toHaveLength(13);
		});

		it('includes the Level 2 art2 and conditional cdl chunks', () => {
			expect(result.riff_definitions.find(entry => entry.chunk === '<art2-ck>').definition).toContain('Level 2 articulator');
			expect(result.riff_definitions.find(entry => entry.chunk === '<cdl-ck>').definition).toContain('conditional chunk');
		});
	});

	describe('connection constants', () => {
		it('parses all DLS Level 1 constants', () => {
			expect(result.level1_connection_constants).toHaveLength(33);
			expect(result.level1_connection_constants.find(entry => entry.name === 'CONN_SRC_CC1')).toMatchObject({ value: '0x0081', category: 'MIDI Controller Sources' });
		});

		it('parses all DLS Level 2 constants', () => {
			expect(result.level2_connection_constants).toHaveLength(58);
			expect(result.level2_connection_constants.find(entry => entry.name === 'CONN_DST_EG1_SHUTDOWNTIME')).toMatchObject({ value: '0x020D', category: 'EG Destinations' });
		});

		it('includes all four transforms', () => {
			expect(result.level2_connection_constants.filter(entry => entry.category === 'Transforms').map(entry => entry.name)).toEqual(['CONN_TRN_NONE', 'CONN_TRN_CONCAVE', 'CONN_TRN_CONVEX', 'CONN_TRN_SWITCH']);
		});
	});

	it('reports accurate summary counts', () => {
		expect(result.summary).toEqual({
			note_exclusivity_count: 2,
			modulation_route_count: 56,
			connection_default_count: 56,
			dls_system_message_count: 4,
			riff_definition_count: 13,
			level1_connection_constant_count: 33,
			level2_connection_constant_count: 58
		});
	});
});
