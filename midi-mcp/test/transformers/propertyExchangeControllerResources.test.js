import { describe, it, expect, beforeAll } from 'vitest';
import path from 'node:path';
import { transformPropertyExchangeControllerResources } from '../../lib/transformers/propertyExchangeControllerResourcesTransformer.js';

describe('Property Exchange Controller Resources (M2-117-UM) Transformer', () => {
	let result;

	beforeAll(async () => {
		const docPath = path.resolve(__dirname, '../../data/m2-117-um-property-exchange-controller-resources.md');
		result = await transformPropertyExchangeControllerResources(docPath);
	});

	it('should produce correct metadata', () => {
		expect(result.metadata.title).toBe('Property Exchange Controller Resources');
		expect(result.metadata.doc_id).toBe('M2-117-UM');
		expect(result.metadata.protocol).toBe('midi2');
		expect(result.metadata.source).toBe('m2-117-um-property-exchange-controller-resources.md');
		expect(result.metadata.version).toBe('1.0');
	});

	describe('Version History', () => {
		it('should have 1 entry', () => {
			expect(result.version_history).toHaveLength(1);
			expect(result.summary.version_history_count).toBe(1);
		});

		it('should parse initial version', () => {
			const entry = result.version_history[0];
			expect(entry.version).toBe('1.0');
			expect(entry.publication_date).toContain('June 15, 2023');
			expect(entry.changes).toBe('Initial Version');
		});
	});

	describe('Conformance Words (Relating)', () => {
		it('should have 3 entries', () => {
			expect(result.conformance_words.relating_to_conformance).toHaveLength(3);
			expect(result.summary.conformance_relating_count).toBe(3);
		});

		it('should parse shall', () => {
			const entry = result.conformance_words.relating_to_conformance.find(w => w.word === 'shall');
			expect(entry).toBeDefined();
			expect(entry.reserved_for).toBe('Statements of requirement');
		});

		it('should parse should', () => {
			const entry = result.conformance_words.relating_to_conformance.find(w => w.word === 'should');
			expect(entry).toBeDefined();
			expect(entry.reserved_for).toBe('Statements of recommendation');
		});

		it('should parse may', () => {
			const entry = result.conformance_words.relating_to_conformance.find(w => w.word === 'may');
			expect(entry).toBeDefined();
			expect(entry.reserved_for).toBe('Statements of permission');
		});
	});

	describe('Conformance Words (Not Relating)', () => {
		it('should have 4 entries', () => {
			expect(result.conformance_words.not_relating_to_conformance).toHaveLength(4);
			expect(result.summary.conformance_not_relating_count).toBe(4);
		});

		it('should parse must', () => {
			const entry = result.conformance_words.not_relating_to_conformance.find(w => w.word === 'must');
			expect(entry).toBeDefined();
			expect(entry.reserved_for).toBe('Statements of unavoidability');
		});

		it('should parse will', () => {
			const entry = result.conformance_words.not_relating_to_conformance.find(w => w.word === 'will');
			expect(entry).toBeDefined();
			expect(entry.reserved_for).toBe('Statements of fact');
		});

		it('should parse can', () => {
			const entry = result.conformance_words.not_relating_to_conformance.find(w => w.word === 'can');
			expect(entry).toBeDefined();
			expect(entry.reserved_for).toBe('Statements of capability');
		});

		it('should parse might', () => {
			const entry = result.conformance_words.not_relating_to_conformance.find(w => w.word === 'might');
			expect(entry).toBeDefined();
			expect(entry.reserved_for).toBe('Statements of possibility');
		});
	});

	describe('Definitions', () => {
		it('should have multiple entries', () => {
			expect(result.definitions.length).toBeGreaterThanOrEqual(20);
			expect(result.summary.definition_count).toBeGreaterThanOrEqual(20);
		});

		it('should parse Active Controller Message', () => {
			const entry = result.definitions.find(d => d.term === 'Active Controller Message');
			expect(entry).toBeDefined();
			expect(entry.description).toContain('Controller Messages');
		});

		it('should parse DAW', () => {
			const entry = result.definitions.find(d => d.term === 'DAW');
			expect(entry).toBeDefined();
			expect(entry.description).toBe('Digital Audio Workstation');
		});

		it('should parse Initiator', () => {
			const entry = result.definitions.find(d => d.term === 'Initiator');
			expect(entry).toBeDefined();
			expect(entry.description).toContain('bidirectional communication');
		});

		it('should parse Responder', () => {
			const entry = result.definitions.find(d => d.term === 'Responder');
			expect(entry).toBeDefined();
			expect(entry.description).toContain('Inquiry');
		});

		it('should parse UMP', () => {
			const entry = result.definitions.find(d => d.term === 'UMP');
			expect(entry).toBeDefined();
			expect(entry.description).toContain('Universal MIDI Packet');
		});
	});

	describe('Normative References', () => {
		it('should have 11 entries', () => {
			expect(result.normative_references).toHaveLength(11);
			expect(result.summary.normative_reference_count).toBe(11);
		});

		it('should parse COMM01', () => {
			const entry = result.normative_references.find(r => r.ref_id === 'COMM01');
			expect(entry).toBeDefined();
			expect(entry.description).toContain('CommonMark');
		});

		it('should parse MA03 (MIDI-CI)', () => {
			const entry = result.normative_references.find(r => r.ref_id === 'MA03');
			expect(entry).toBeDefined();
			expect(entry.description).toContain('MIDI Capability Inquiry');
		});

		it('should parse MA07 (Bit Scaling)', () => {
			const entry = result.normative_references.find(r => r.ref_id === 'MA07');
			expect(entry).toBeDefined();
			expect(entry.description).toContain('Bit Scaling');
		});
	});

	describe('AllCtrlList Properties', () => {
		it('should have 15 entries', () => {
			expect(result.resources.allCtrlList.controller_message_properties).toHaveLength(15);
			expect(result.summary.all_ctrl_list_property_count).toBe(15);
		});

		it('should parse title property', () => {
			const entry = result.resources.allCtrlList.controller_message_properties.find(p => p.property_key === 'title');
			expect(entry).toBeDefined();
			expect(entry.property_value_type).toContain('string, required');
		});

		it('should parse ctrlType property', () => {
			const entry = result.resources.allCtrlList.controller_message_properties.find(p => p.property_key === 'ctrlType');
			expect(entry).toBeDefined();
			expect(entry.property_value_type).toContain('enum');
		});

		it('should parse priority property', () => {
			const entry = result.resources.allCtrlList.controller_message_properties.find(p => p.property_key === 'priority');
			expect(entry).toBeDefined();
			expect(entry.property_value_type).toContain('integer (1-5)');
		});

		it('should parse ctrlMapId property', () => {
			const entry = result.resources.allCtrlList.controller_message_properties.find(p => p.property_key === 'ctrlMapId');
			expect(entry).toBeDefined();
		});

		it('should parse minMax property', () => {
			const entry = result.resources.allCtrlList.controller_message_properties.find(p => p.property_key === 'minMax');
			expect(entry).toBeDefined();
			expect(entry.property_value_type).toContain('array of 2 integers');
		});
	});

	describe('ChCtrlList Properties', () => {
		it('should have 15 entries', () => {
			expect(result.resources.chCtrlList.controller_message_properties).toHaveLength(15);
			expect(result.summary.ch_ctrl_list_property_count).toBe(15);
		});

		it('should parse defaultCCMap property (unique to ChCtrlList)', () => {
			const entry = result.resources.chCtrlList.controller_message_properties.find(p => p.property_key === 'defaultCCMap');
			expect(entry).toBeDefined();
			expect(entry.property_value_type).toContain('boolean');
		});

		it('should parse Title property (capitalized in ChCtrlList)', () => {
			const entry = result.resources.chCtrlList.controller_message_properties.find(p => p.property_key === 'Title');
			expect(entry).toBeDefined();
		});
	});

	describe('CtrlMapList Properties', () => {
		it('should have 2 entries', () => {
			expect(result.resources.ctrlMapList.controller_map_properties).toHaveLength(2);
			expect(result.summary.ctrl_map_list_property_count).toBe(2);
		});

		it('should parse value property', () => {
			const entry = result.resources.ctrlMapList.controller_map_properties.find(p => p.property_key === 'value');
			expect(entry).toBeDefined();
			expect(entry.property_value_type).toContain('integer, required');
		});

		it('should parse title property', () => {
			const entry = result.resources.ctrlMapList.controller_map_properties.find(p => p.property_key === 'title');
			expect(entry).toBeDefined();
			expect(entry.property_value_type).toContain('string, required');
		});
	});

	describe('JSON Examples', () => {
		it('should have multiple entries', () => {
			expect(result.json_examples.length).toBeGreaterThanOrEqual(10);
			expect(result.summary.json_example_count).toBeGreaterThanOrEqual(10);
		});

		it('should parse AllCtrlList inquiry example', () => {
			const entry = result.json_examples.find(e => e.header_data && e.header_data.includes('AllCtrlList'));
			expect(entry).toBeDefined();
			expect(entry.header_data).toContain('resource');
		});

		it('should parse AllCtrlList reply with status 200', () => {
			const entry = result.json_examples.find(e => e.header_data && e.header_data.includes('200') && e.property_data.length > 10);
			expect(entry).toBeDefined();
		});

		it('should parse CtrlMapList inquiry with resId freq', () => {
			const entry = result.json_examples.find(e => e.header_data && e.header_data.includes('freq'));
			expect(entry).toBeDefined();
		});

		it('should parse CtrlMapList inquiry with resId lfoWaveType', () => {
			const entry = result.json_examples.find(e => e.header_data && e.header_data.includes('lfoWaveType'));
			expect(entry).toBeDefined();
		});
	});

	describe('ResourceList Integrations', () => {
		it('should have 6 entries (minimal + full for 3 resources)', () => {
			expect(result.resource_list_integrations).toHaveLength(6);
			expect(result.summary.resource_list_integration_count).toBe(6);
		});

		it('should have minimal entries with short data', () => {
			const minimal = result.resource_list_integrations.filter(e => e.property_data.length <= 5);
			expect(minimal.length).toBe(3);
		});

		it('should have full entries with longer data', () => {
			const full = result.resource_list_integrations.filter(e => e.property_data.length > 5);
			expect(full.length).toBe(3);
		});
	});

	describe('Summary', () => {
		it('should have correct counts', () => {
			expect(result.summary.version_history_count).toBe(1);
			expect(result.summary.conformance_relating_count).toBe(3);
			expect(result.summary.conformance_not_relating_count).toBe(4);
			expect(result.summary.normative_reference_count).toBe(11);
			expect(result.summary.all_ctrl_list_property_count).toBe(15);
			expect(result.summary.ch_ctrl_list_property_count).toBe(15);
			expect(result.summary.ctrl_map_list_property_count).toBe(2);
			expect(result.summary.resource_list_integration_count).toBe(6);
		});
	});
});
