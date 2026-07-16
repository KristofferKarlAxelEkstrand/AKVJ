import { describe, it, expect } from 'vitest';
import path from 'node:path';
import { transformCCMessages } from '../../lib/transformers/ccMessagesTransformer.js';

describe('CC Messages Transformer', () => {
	it('should parse all 128 CC messages correctly', async () => {
		const docPath = path.resolve(__dirname, '../../data/control-change-messages-data-bytes.md');
		const result = await transformCCMessages(docPath);

		expect(result.metadata.title).toBe('Control Change Messages and RPNs');
		expect(result.control_changes).toBeDefined();
		expect(Array.isArray(result.control_changes)).toBe(true);

		// The table defines CCs 0 through 127
		expect(result.control_changes.length).toBe(128);

		// Verify CC 0 (Bank Select)
		const cc0 = result.control_changes.find(c => c.cc_number === 0);
		expect(cc0).toBeDefined();
		expect(cc0.hex).toBe('00');
		expect(cc0.name).toContain('Bank Select');
		expect(cc0.range).toContain('0-127');
		expect(cc0.type).toBe('MSB');

		// Verify CC 74 (Brightness)
		const cc74 = result.control_changes.find(c => c.cc_number === 74);
		expect(cc74).toBeDefined();
		expect(cc74.hex).toBe('4A');
		expect(cc74.name).toContain('Brightness');
		expect(cc74.type).toBe('LSB');

		// Verify CC 64 (Damper Pedal)
		const cc64 = result.control_changes.find(c => c.cc_number === 64);
		expect(cc64).toBeDefined();
		expect(cc64.name).toContain('Damper Pedal');
		expect(cc64.range).toContain('≤63');

		// Verify CC 122 (Local Control)
		const cc122 = result.control_changes.find(c => c.cc_number === 122);
		expect(cc122).toBeDefined();
		expect(cc122.name).toContain('Local Control');
		expect(cc122.range).toContain('0 off');
		expect(cc122.type).toBe('---');
	});
});
