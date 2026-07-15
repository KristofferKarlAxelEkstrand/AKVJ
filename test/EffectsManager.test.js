/**
 * Unit tests for EffectsManager - effect routing, activation, deactivation, and lifecycle.
 * Complements integration.test.js with edge cases and lifecycle methods.
 */
import { describe, test, expect, beforeEach } from 'vitest';
import EffectsManager from '../src/js/visuals/EffectsManager.js';
import settings from '../src/js/core/settings.js';

describe('EffectsManager', () => {
	let em;

	beforeEach(() => {
		em = new EffectsManager();
	});

	test('handlesChannel returns true for mixed output and global effects channels', () => {
		expect(em.handlesChannel(settings.channelMapping.mixedOutputEffects)).toBe(true);
		expect(em.handlesChannel(settings.channelMapping.globalEffects)).toBe(true);
	});

	test('handlesChannel returns false for non-effect channels', () => {
		expect(em.handlesChannel(0)).toBe(false);
		expect(em.handlesChannel(5)).toBe(false);
		expect(em.handlesChannel(-1)).toBe(false);
	});

	test('noteOn with velocity 0 acts as noteOff', () => {
		const channel = settings.channelMapping.mixedOutputEffects;
		em.noteOn(channel, 50, 100);
		expect(em.hasMixedOutputEffects()).toBe(true);

		// velocity 0 should deactivate
		const result = em.noteOn(channel, 50, 0);
		expect(em.hasMixedOutputEffects()).toBe(false);
		expect(result).toBe(true); // noteOff returns true when it deactivates
	});

	test('noteOn returns false for unhandled channel', () => {
		expect(em.noteOn(0, 50, 100)).toBe(false);
	});

	test('noteOff returns false for unhandled channel', () => {
		expect(em.noteOff(0, 50)).toBe(false);
	});

	test('noteOff does not deactivate if different note was last active for that type', () => {
		const channel = settings.channelMapping.mixedOutputEffects;

		// Activate color with note 50
		em.noteOn(channel, 50, 100);
		expect(em.hasMixedOutputEffects()).toBe(true);

		// Replace with note 55 (same type 'color')
		em.noteOn(channel, 55, 80);
		const colorEffect = em.getActiveMixedOutputEffects().find(e => e.type === 'color');
		expect(colorEffect.note).toBe(55);

		// noteOff for note 50 should NOT deactivate (current is 55)
		const result = em.noteOff(channel, 50);
		expect(result).toBe(false);
		expect(em.hasMixedOutputEffects()).toBe(true);

		// noteOff for note 55 SHOULD deactivate
		const result2 = em.noteOff(channel, 55);
		expect(result2).toBe(true);
		expect(em.hasMixedOutputEffects()).toBe(false);
	});

	test('getActiveMixedOutputEffects returns sorted by note ascending', () => {
		const channel = settings.channelMapping.mixedOutputEffects;

		// Activate in non-sorted order: color(48-63) at note 55, offset(32-47) at note 40
		em.noteOn(channel, 55, 100);
		em.noteOn(channel, 40, 80);

		const active = em.getActiveMixedOutputEffects();
		expect(active.length).toBe(2);
		expect(active[0].note).toBe(40); // offset note 40 < color note 55
		expect(active[1].note).toBe(55);
	});

	test('getActiveGlobalEffects returns sorted by note ascending', () => {
		const channel = settings.channelMapping.globalEffects;

		em.noteOn(channel, 70, 100); // glitch
		em.noteOn(channel, 85, 80); // strobe

		const active = em.getActiveGlobalEffects();
		expect(active.length).toBe(2);
		expect(active[0].note).toBe(70);
		expect(active[1].note).toBe(85);
	});

	test('clear removes all active effects from both channels', () => {
		const mixedChannel = settings.channelMapping.mixedOutputEffects;
		const globalChannel = settings.channelMapping.globalEffects;

		em.noteOn(mixedChannel, 50, 100);
		em.noteOn(globalChannel, 70, 100);
		expect(em.hasMixedOutputEffects()).toBe(true);
		expect(em.hasGlobalEffects()).toBe(true);

		em.clear();
		expect(em.hasMixedOutputEffects()).toBe(false);
		expect(em.hasGlobalEffects()).toBe(false);
	});

	test('destroy clears all effects and is idempotent', () => {
		const mixedChannel = settings.channelMapping.mixedOutputEffects;
		em.noteOn(mixedChannel, 50, 100);
		expect(em.hasMixedOutputEffects()).toBe(true);

		em.destroy();
		expect(em.hasMixedOutputEffects()).toBe(false);
		expect(em.hasGlobalEffects()).toBe(false);

		// Second destroy should not throw
		expect(() => em.destroy()).not.toThrow();
	});

	test('noteOn with NaN note returns false', () => {
		const channel = settings.channelMapping.mixedOutputEffects;
		expect(em.noteOn(channel, NaN, 100)).toBe(false);
	});

	test('noteOn with negative note returns false', () => {
		const channel = settings.channelMapping.mixedOutputEffects;
		expect(em.noteOn(channel, -1, 100)).toBe(false);
	});

	test('noteOn with note > 127 returns false', () => {
		const channel = settings.channelMapping.mixedOutputEffects;
		expect(em.noteOn(channel, 128, 100)).toBe(false);
	});

	test('noteOff with out-of-range note returns false', () => {
		const channel = settings.channelMapping.mixedOutputEffects;
		expect(em.noteOff(channel, 200)).toBe(false);
		expect(em.noteOff(channel, -1)).toBe(false);
	});

	test('reserved notes (96-127) do not activate effects', () => {
		const channel = settings.channelMapping.mixedOutputEffects;
		expect(em.noteOn(channel, 100, 100)).toBe(false);
		expect(em.noteOn(channel, 127, 100)).toBe(false);
		expect(em.hasMixedOutputEffects()).toBe(false);
	});

	test('global effects and mixed output effects are independent', () => {
		const mixedChannel = settings.channelMapping.mixedOutputEffects;
		const globalChannel = settings.channelMapping.globalEffects;

		em.noteOn(mixedChannel, 50, 100);
		em.noteOn(globalChannel, 70, 80);

		expect(em.hasMixedOutputEffects()).toBe(true);
		expect(em.hasGlobalEffects()).toBe(true);

		// Deactivate mixed output only
		em.noteOff(mixedChannel, 50);
		expect(em.hasMixedOutputEffects()).toBe(false);
		expect(em.hasGlobalEffects()).toBe(true);
	});
});
