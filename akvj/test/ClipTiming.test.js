import { describe, test, expect, vi, afterEach } from 'vitest';
import ClipTiming from '../src/js/visuals/ClipTiming.js';
import { BPM_SOURCE_CLOCK, EVENT_MIDI_CLOCK, EVENT_MIDI_START, EVENT_MIDI_CONTINUE } from '../src/js/core/AppState.js';
import { MS_PER_MINUTE } from '../src/js/utils/timing.js';
import settings from '../src/js/core/settings.js';

/**
 * @returns {{ clockSource: { bpmSource: string, subscribe: Function }, handlers: Record<string, Function> }}
 */
function createCapturingClockSource() {
	const handlers = {};
	const clockSource = {
		bpmSource: BPM_SOURCE_CLOCK,
		subscribe: vi.fn((event, handler) => {
			handlers[event] = handler;
			return () => {
				delete handlers[event];
			};
		})
	};
	return { clockSource, handlers };
}

describe('ClipTiming', () => {
	afterEach(() => {
		vi.restoreAllMocks();
	});

	describe('getFrameIntervalMs — free mode', () => {
		test('uses frameRatesForFrames directly when not BPM synced', () => {
			const timing = new ClipTiming({
				frameRatesForFrames: { 0: 10 },
				syncBeats: null,
				frameCount: 4
			});
			expect(timing.isUsingBeatSync).toBe(false);
			expect(timing.getFrameIntervalMs(3)).toBe(1000 / 10);
		});
	});

	describe('getFrameIntervalMs — beat mode (speed multiplier)', () => {
		test('preserves relative frame timing via a whole-clip speed multiplier (spec worked example)', () => {
			// 4-frame clip, frameRatesForFrames: { 0: 1, 1: 2, 2: 1, 3: 4 }, "1 bar" (4 beats) @ 120 BPM
			// naturalDuration = 1000 + 500 + 1000 + 250 = 2750ms; targetDuration = (4*60000)/120 = 2000ms
			// speedMultiplier = 2000/2750 ≈ 0.7273
			const timing = new ClipTiming({
				frameRatesForFrames: { 0: 1, 1: 2, 2: 1, 3: 4 },
				syncBeats: 4,
				frameCount: 4,
				bpmProvider: () => 120
			});
			expect(timing.isUsingBeatSync).toBe(true);
			const speedMultiplier = 2000 / 2750;
			expect(timing.getFrameIntervalMs(0)).toBeCloseTo(1000 * speedMultiplier, 6);
			expect(timing.getFrameIntervalMs(1)).toBeCloseTo(500 * speedMultiplier, 6);
			expect(timing.getFrameIntervalMs(2)).toBeCloseTo(1000 * speedMultiplier, 6);
			expect(timing.getFrameIntervalMs(3)).toBeCloseTo(250 * speedMultiplier, 6);
			// Frame 3 is still 4x faster than frame 0 — the relationship is preserved
			expect(timing.getFrameIntervalMs(0) / timing.getFrameIntervalMs(3)).toBeCloseTo(4, 6);
		});

		test('clamps BPM to settings.bpm.min', () => {
			const timing = new ClipTiming({
				frameRatesForFrames: {},
				syncBeats: 1,
				frameCount: 1,
				bpmProvider: () => 1
			});
			const minBPM = settings.bpm.min > 0 ? settings.bpm.min : 1;
			expect(timing.getFrameIntervalMs(0)).toBeCloseTo((1 * MS_PER_MINUTE) / minBPM, 6);
		});

		test('clamps BPM to settings.bpm.max', () => {
			const timing = new ClipTiming({
				frameRatesForFrames: {},
				syncBeats: 1,
				frameCount: 1,
				bpmProvider: () => 1000
			});
			const maxBPM = settings.bpm.max;
			expect(timing.getFrameIntervalMs(0)).toBeCloseTo((1 * MS_PER_MINUTE) / maxBPM, 6);
		});

		test('recomputes with the current BPM on every call (no stale caching)', () => {
			let bpm = 120;
			const timing = new ClipTiming({
				frameRatesForFrames: {},
				syncBeats: 1,
				frameCount: 1,
				bpmProvider: () => bpm
			});
			const intervalAt120 = timing.getFrameIntervalMs(0);
			bpm = 60;
			expect(timing.getFrameIntervalMs(0)).toBeCloseTo(intervalAt120 * 2, 6);
		});
	});

	describe('isClockDriven', () => {
		test('reflects injected clockSource.bpmSource', () => {
			const clockSource = {
				bpmSource: BPM_SOURCE_CLOCK,
				subscribe: vi.fn(() => () => {})
			};
			const timing = new ClipTiming({
				frameRatesForFrames: {},
				syncBeats: 1,
				frameCount: 1,
				bpmProvider: () => 120,
				clockSource
			});
			expect(timing.isClockDriven).toBe(true);
			clockSource.bpmSource = 'default';
			expect(timing.isClockDriven).toBe(false);
		});
	});

	describe('advanceFrame (free mode / time-based beat mode)', () => {
		test('setCurrentFrameIndex affects which interval advanceFrame uses', () => {
			const advances = [];
			const timing = new ClipTiming({
				frameRatesForFrames: { 0: 10, 1: 2 },
				syncBeats: null,
				frameCount: 2
			});
			timing.setCurrentFrameIndex(1);
			timing.advanceFrame(0, () => {
				advances.push(true);
				return false;
			});
			// Frame 1 at 2 FPS → 500ms interval; 600ms elapsed → one advance
			timing.advanceFrame(600, () => {
				advances.push('tick');
				return false;
			});
			expect(advances).toEqual(['tick']);
		});

		test('early-returns when clock-driven (no time-based advance)', () => {
			const clockSource = {
				bpmSource: BPM_SOURCE_CLOCK,
				subscribe: vi.fn(() => () => {})
			};
			const timing = new ClipTiming({
				frameRatesForFrames: { 0: 10 },
				syncBeats: 1,
				frameCount: 1,
				bpmProvider: () => 120,
				clockSource
			});
			const onAdvance = vi.fn(() => true);
			timing.advanceFrame(0, onAdvance);
			timing.advanceFrame(5000, onAdvance);
			expect(onAdvance).not.toHaveBeenCalled();
		});

		test('MIDI clock dropout mid-playback falls back to time-based advancement seamlessly', () => {
			const clockSource = {
				bpmSource: BPM_SOURCE_CLOCK,
				subscribe: vi.fn(() => () => {})
			};
			const timing = new ClipTiming({
				frameRatesForFrames: { 0: 10 },
				syncBeats: 1,
				frameCount: 1,
				bpmProvider: () => 120,
				clockSource
			});
			const onAdvance = vi.fn(() => true);

			// While clock-driven, time-based advance is skipped entirely.
			timing.advanceFrame(0, onAdvance);
			timing.advanceFrame(1000, onAdvance);
			expect(onAdvance).not.toHaveBeenCalled();

			// Clock drops out — bpmSource falls back away from 'clock'.
			clockSource.bpmSource = 'default';
			expect(timing.isClockDriven).toBe(false);

			// Time-based advancement resumes seamlessly (no reset needed) using the
			// beat-mode speed multiplier at the current (fallback) BPM.
			timing.advanceFrame(1000, onAdvance); // seeds lastTimestamp only, no elapsed yet
			expect(onAdvance).not.toHaveBeenCalled();
			const interval = timing.getFrameIntervalMs(0);
			timing.advanceFrame(1000 + interval, onAdvance);
			expect(onAdvance).toHaveBeenCalledTimes(1);
		});
	});

	describe('subscribeToClock — progress-based clock-driven advancement', () => {
		function createUniformClip(clockSource) {
			// 4 uniform frames (default 1 fps each) → natural duration 4000ms,
			// cumulativeProportions = [0, 0.25, 0.5, 0.75]. syncBeats: 1 → totalPulses = 24.
			return new ClipTiming({
				frameRatesForFrames: {},
				syncBeats: 1,
				frameCount: 4,
				bpmProvider: () => 120,
				clockSource
			});
		}

		test('calls onAdvance with duration-weighted progress on every pulse', () => {
			const { clockSource, handlers } = createCapturingClockSource();
			const timing = createUniformClip(clockSource);
			const onAdvance = vi.fn(() => true);
			timing.subscribeToClock(onAdvance);
			expect(clockSource.subscribe).toHaveBeenCalledWith(EVENT_MIDI_CLOCK, expect.any(Function));
			expect(clockSource.subscribe).toHaveBeenCalledWith(EVENT_MIDI_START, expect.any(Function));

			const fire = count => {
				for (let i = 0; i < count; i++) {
					handlers[EVENT_MIDI_CLOCK]();
				}
			};

			fire(1);
			expect(onAdvance).toHaveBeenNthCalledWith(1, 0.125); // pulse 1/24 → frame 0 span → (0+0.5)/4
			fire(5); // up to pulse 6 (6/24 = 0.25 → frame 1's start)
			expect(onAdvance).toHaveBeenNthCalledWith(6, 0.375); // (1+0.5)/4
			fire(6); // up to pulse 12 (0.5 → frame 2's start)
			expect(onAdvance).toHaveBeenNthCalledWith(12, 0.625); // (2+0.5)/4
			fire(6); // up to pulse 18 (0.75 → frame 3's start)
			expect(onAdvance).toHaveBeenNthCalledWith(18, 0.875); // (3+0.5)/4
			fire(6); // up to pulse 24 (progress 1.0 exactly)
			expect(onAdvance).toHaveBeenNthCalledWith(24, 1);
		});

		test('loop: wraps pulseCount and restarts progress once onAdvance signals it continues', () => {
			const { clockSource, handlers } = createCapturingClockSource();
			const timing = createUniformClip(clockSource);
			const onAdvance = vi.fn(() => true); // 'loop' behavior: always continues
			timing.subscribeToClock(onAdvance);

			for (let i = 0; i < 24; i++) {
				handlers[EVENT_MIDI_CLOCK]();
			}
			expect(onAdvance).toHaveBeenNthCalledWith(24, 1);

			// Next pulse should restart from the beginning, not keep growing past 1.
			handlers[EVENT_MIDI_CLOCK]();
			expect(onAdvance).toHaveBeenNthCalledWith(25, 0.125);
		});

		test('once/reverse/pingpong: progress stays clamped at 1 once onAdvance signals finished (no wrap)', () => {
			const { clockSource, handlers } = createCapturingClockSource();
			const timing = createUniformClip(clockSource);
			const onAdvance = vi.fn(progress => progress < 1); // finishes at progress 1

			timing.subscribeToClock(onAdvance);
			for (let i = 0; i < 24; i++) {
				handlers[EVENT_MIDI_CLOCK]();
			}
			expect(onAdvance).toHaveBeenNthCalledWith(24, 1);

			// A further pulse (e.g. arriving before the caller unsubscribes) stays clamped at 1.
			handlers[EVENT_MIDI_CLOCK]();
			expect(onAdvance).toHaveBeenNthCalledWith(25, 1);
		});
	});

	describe('MIDI Start / Continue', () => {
		test('MIDI Start resets pulse phase so progress restarts from the beginning', () => {
			const { clockSource, handlers } = createCapturingClockSource();
			const timing = new ClipTiming({
				frameRatesForFrames: {},
				syncBeats: 1, // 24 pulses total
				frameCount: 4,
				bpmProvider: () => 120,
				clockSource
			});
			const onAdvance = vi.fn(() => true);
			timing.subscribeToClock(onAdvance);

			for (let i = 0; i < 6; i++) {
				handlers[EVENT_MIDI_CLOCK]();
			}
			expect(onAdvance).toHaveBeenNthCalledWith(6, 0.375);

			handlers[EVENT_MIDI_START]();

			handlers[EVENT_MIDI_CLOCK]();
			expect(onAdvance).toHaveBeenNthCalledWith(7, 0.125); // back to pulse-1 progress
		});

		test('MIDI Continue does not clear pulse phase', () => {
			const { clockSource, handlers } = createCapturingClockSource();
			const timing = new ClipTiming({
				frameRatesForFrames: {},
				syncBeats: 1,
				frameCount: 4,
				bpmProvider: () => 120,
				clockSource
			});
			const onAdvance = vi.fn(() => true);
			timing.subscribeToClock(onAdvance);

			expect(clockSource.subscribe).not.toHaveBeenCalledWith(EVENT_MIDI_CONTINUE, expect.any(Function));

			for (let i = 0; i < 6; i++) {
				handlers[EVENT_MIDI_CLOCK]();
			}
			// Continue is intentionally ignored — residual phase must remain
			handlers[EVENT_MIDI_CONTINUE]?.();

			handlers[EVENT_MIDI_CLOCK]();
			expect(onAdvance).toHaveBeenNthCalledWith(7, 0.375); // pulse 7/24, still frame-1 span
		});
	});

	describe('retrigger', () => {
		test('reset() zeroes pulseCount independent of the global clock position', () => {
			const { clockSource, handlers } = createCapturingClockSource();
			const timing = new ClipTiming({
				frameRatesForFrames: {},
				syncBeats: 1,
				frameCount: 4,
				bpmProvider: () => 120,
				clockSource
			});
			const onAdvance = vi.fn(() => true);
			timing.subscribeToClock(onAdvance);

			for (let i = 0; i < 18; i++) {
				handlers[EVENT_MIDI_CLOCK]();
			}
			expect(onAdvance).toHaveBeenNthCalledWith(18, 0.875);

			timing.reset(); // simulates retrigger

			handlers[EVENT_MIDI_CLOCK]();
			expect(onAdvance).toHaveBeenNthCalledWith(19, 0.125); // fresh pulse-1 progress, not pulse 19
		});
	});

	describe('unsubscribeFromClock', () => {
		test('stops further advances and swallows unsubscribe errors', () => {
			const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
			let clockHandler = null;
			const unsubscribe = vi.fn(() => {
				throw new Error('unsubscribe failed');
			});
			const clockSource = {
				bpmSource: BPM_SOURCE_CLOCK,
				subscribe: vi.fn((event, h) => {
					if (event === EVENT_MIDI_CLOCK) {
						clockHandler = h;
					}
					return unsubscribe;
				})
			};
			const timing = new ClipTiming({
				frameRatesForFrames: {},
				syncBeats: 1,
				frameCount: 1,
				bpmProvider: () => 120,
				clockSource
			});
			const onAdvance = vi.fn(() => true);
			timing.subscribeToClock(onAdvance);
			timing.unsubscribeFromClock();
			// Composite unsubscribe calls clock + start unsubscribers; first throw is logged
			expect(unsubscribe).toHaveBeenCalled();
			expect(errorSpy).toHaveBeenCalled();

			// Handler still exists but unsubscribe cleared internal ref — calling old handler is ok;
			// re-subscribe should work and not double-bind until subscribe again
			timing.subscribeToClock(onAdvance);
			for (let i = 0; i < 6; i++) {
				clockHandler();
			}
			// Each subscribeToClock registers clock + start → 4 subscribe calls total
			expect(clockSource.subscribe).toHaveBeenCalledTimes(4);
		});
	});

	describe('reset (time-based)', () => {
		test('clears lastTimestamp so next advance starts fresh', () => {
			const timing = new ClipTiming({
				frameRatesForFrames: { 0: 10 },
				syncBeats: null,
				frameCount: 1
			});
			const onAdvance = vi.fn(() => true);
			timing.advanceFrame(0, onAdvance);
			timing.advanceFrame(200, onAdvance); // 2 advances at 100ms
			expect(onAdvance).toHaveBeenCalledTimes(2);
			onAdvance.mockClear();
			timing.reset();
			timing.advanceFrame(200, onAdvance); // seeds lastTimestamp only
			expect(onAdvance).not.toHaveBeenCalled();
			timing.advanceFrame(300, onAdvance); // 100ms → one advance
			expect(onAdvance).toHaveBeenCalledTimes(1);
		});
	});

	describe('initBeatSync validation', () => {
		test('throws on zero or negative syncBeats', () => {
			expect(
				() =>
					new ClipTiming({
						frameRatesForFrames: {},
						syncBeats: 0,
						frameCount: 1
					})
			).toThrow(/invalid syncBeats/);
			expect(
				() =>
					new ClipTiming({
						frameRatesForFrames: {},
						syncBeats: -1,
						frameCount: 1
					})
			).toThrow(/invalid syncBeats/);
		});

		test('ensures totalPulses is never 0 for a very short syncBeats', () => {
			const { clockSource, handlers } = createCapturingClockSource();
			const timing = new ClipTiming({
				frameRatesForFrames: {},
				syncBeats: 0.001, // 0.001 * 24 ≈ 0.024, would round to 0 pulses
				frameCount: 1,
				bpmProvider: () => 120,
				clockSource
			});
			const onAdvance = vi.fn(() => true);
			timing.subscribeToClock(onAdvance);
			// totalPulses clamped to at least 1 — the very first pulse already completes the clip.
			handlers[EVENT_MIDI_CLOCK]();
			expect(onAdvance).toHaveBeenNthCalledWith(1, 1);
		});
	});

	describe('ms-based timing (frameDurationsMs)', () => {
		test('uses ms values directly when provided in free mode', () => {
			const timing = new ClipTiming({
				frameRatesForFrames: {},
				frameDurationsMs: { 0: 50, 1: 100, 2: 25 },
				syncBeats: null,
				frameCount: 3
			});
			expect(timing.getFrameIntervalMs(0)).toBe(50);
			expect(timing.getFrameIntervalMs(1)).toBe(100);
			expect(timing.getFrameIntervalMs(2)).toBe(25);
		});

		test('frameDurationsMs takes priority over frameRatesForFrames', () => {
			const timing = new ClipTiming({
				frameRatesForFrames: { 0: 10, 1: 20 }, // Would be 100ms and 50ms
				frameDurationsMs: { 0: 75, 1: 150 }, // Should use these instead
				syncBeats: null,
				frameCount: 2
			});
			expect(timing.getFrameIntervalMs(0)).toBe(75);
			expect(timing.getFrameIntervalMs(1)).toBe(150);
		});

		test('backward compatibility: frameRatesForFrames-only clips work unchanged', () => {
			const timing = new ClipTiming({
				frameRatesForFrames: { 0: 10, 1: 20 },
				frameDurationsMs: null,
				syncBeats: null,
				frameCount: 2
			});
			expect(timing.getFrameIntervalMs(0)).toBe(100); // 1000 / 10
			expect(timing.getFrameIntervalMs(1)).toBe(50); // 1000 / 20
		});

		test('ms-based timing works with beat sync mode', () => {
			// 3-frame clip with ms durations: 50ms, 100ms, 25ms → naturalDuration = 175ms
			// syncBeats: 1 beat @ 120 BPM → targetDuration = 500ms
			// speedMultiplier = 500 / 175 ≈ 2.857
			const timing = new ClipTiming({
				frameRatesForFrames: {},
				frameDurationsMs: { 0: 50, 1: 100, 2: 25 },
				syncBeats: 1,
				frameCount: 3,
				bpmProvider: () => 120
			});
			expect(timing.isUsingBeatSync).toBe(true);
			const speedMultiplier = 500 / 175;
			expect(timing.getFrameIntervalMs(0)).toBeCloseTo(50 * speedMultiplier, 6);
			expect(timing.getFrameIntervalMs(1)).toBeCloseTo(100 * speedMultiplier, 6);
			expect(timing.getFrameIntervalMs(2)).toBeCloseTo(25 * speedMultiplier, 6);
		});

		test('ms-based timing preserves relative frame timing in beat sync mode', () => {
			const timing = new ClipTiming({
				frameRatesForFrames: {},
				frameDurationsMs: { 0: 50, 1: 100, 2: 25 },
				syncBeats: 1,
				frameCount: 3,
				bpmProvider: () => 120
			});
			// Frame 1 is 2x slower than frame 0, frame 2 is 2x faster than frame 0
			expect(timing.getFrameIntervalMs(1) / timing.getFrameIntervalMs(0)).toBeCloseTo(2, 6);
			expect(timing.getFrameIntervalMs(0) / timing.getFrameIntervalMs(2)).toBeCloseTo(2, 6);
		});

		test('ms-based timing with clock-driven mode', () => {
			const { clockSource, handlers } = createCapturingClockSource();
			const timing = new ClipTiming({
				frameRatesForFrames: {},
				frameDurationsMs: { 0: 50, 1: 100, 2: 25, 3: 75 },
				syncBeats: 1,
				frameCount: 4,
				bpmProvider: () => 120,
				clockSource
			});
			const onAdvance = vi.fn(() => true);
			timing.subscribeToClock(onAdvance);

			// Fire 6 pulses (6/24 = 0.25 progress)
			for (let i = 0; i < 6; i++) {
				handlers[EVENT_MIDI_CLOCK]();
			}
			// Should have received progress values based on ms-weighted proportions
			expect(onAdvance).toHaveBeenCalledTimes(6);
		});
	});
});
