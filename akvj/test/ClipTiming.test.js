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

	test('getFrameInterval uses injected bpmProvider (BPM sync formula)', () => {
		const timing = new ClipTiming({
			frameRatesForFrames: { 0: 10 },
			frameDurationBeats: 0.5,
			frames: 2,
			bpmProvider: () => 120
		});
		expect(timing.isUsingBPMSync).toBe(true);
		expect(timing.getFrameInterval(0)).toBe((0.5 * MS_PER_MINUTE) / 120);
	});

	test('getFrameInterval clamps BPM to settings.bpm.min', () => {
		const timing = new ClipTiming({
			frameRatesForFrames: {},
			frameDurationBeats: 1,
			frames: 1,
			bpmProvider: () => 1
		});
		const minBPM = settings.bpm.min > 0 ? settings.bpm.min : 1;
		expect(timing.getFrameInterval(0)).toBe((1 * MS_PER_MINUTE) / minBPM);
	});

	test('getFrameInterval falls back to frameDurationBeats[0] for out-of-range index', () => {
		const timing = new ClipTiming({
			frameRatesForFrames: {},
			frameDurationBeats: [0.25, 1],
			frames: 2,
			bpmProvider: () => 120
		});
		expect(timing.getFrameInterval(99)).toBe((0.25 * MS_PER_MINUTE) / 120);
	});

	test('getFrameInterval falls back to DEFAULT_FRAME_DURATION_BEATS (0.25) when beats missing', () => {
		const timing = new ClipTiming({
			frameRatesForFrames: {},
			frameDurationBeats: [null, null],
			frames: 2,
			bpmProvider: () => 120
		});
		expect(timing.getFrameInterval(0)).toBe((0.25 * MS_PER_MINUTE) / 120);
	});

	test('getFrameInterval FPS mode falls back to default frame rate', () => {
		const timing = new ClipTiming({
			frameRatesForFrames: { 0: 10 },
			frameDurationBeats: null,
			frames: 4
		});
		expect(timing.getFrameInterval(3)).toBe(1000 / 10);
	});

	test('isClockDriven reflects injected clockSource.bpmSource', () => {
		const clockSource = {
			bpmSource: BPM_SOURCE_CLOCK,
			subscribe: vi.fn(() => () => {})
		};
		const timing = new ClipTiming({
			frameRatesForFrames: {},
			frameDurationBeats: 0.25,
			frames: 1,
			bpmProvider: () => 120,
			clockSource
		});
		expect(timing.isClockDriven).toBe(true);
		clockSource.bpmSource = 'default';
		expect(timing.isClockDriven).toBe(false);
	});

	test('setCurrentFrameIndex affects which interval advanceFrame uses', () => {
		const advances = [];
		const timing = new ClipTiming({
			frameRatesForFrames: { 0: 10, 1: 2 },
			frameDurationBeats: null,
			frames: 2
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

	test('advanceFrame early-returns when clock-driven (no time-based advance)', () => {
		const clockSource = {
			bpmSource: BPM_SOURCE_CLOCK,
			subscribe: vi.fn(() => () => {})
		};
		const timing = new ClipTiming({
			frameRatesForFrames: { 0: 10 },
			frameDurationBeats: 0.25,
			frames: 1,
			bpmProvider: () => 120,
			clockSource
		});
		const onAdvance = vi.fn(() => true);
		timing.advanceFrame(0, onAdvance);
		timing.advanceFrame(5000, onAdvance);
		expect(onAdvance).not.toHaveBeenCalled();
	});

	test('subscribeToClock advances after correct pulse count', () => {
		const { clockSource, handlers } = createCapturingClockSource();
		const timing = new ClipTiming({
			frameRatesForFrames: {},
			frameDurationBeats: 0.25, // 0.25 * 24 PPQN = 6 pulses
			frames: 1,
			bpmProvider: () => 120,
			clockSource
		});
		const onAdvance = vi.fn(() => true);
		timing.subscribeToClock(onAdvance);
		expect(clockSource.subscribe).toHaveBeenCalledWith(EVENT_MIDI_CLOCK, expect.any(Function));
		expect(clockSource.subscribe).toHaveBeenCalledWith(EVENT_MIDI_START, expect.any(Function));
		expect(handlers[EVENT_MIDI_CLOCK]).toBeTypeOf('function');

		for (let i = 0; i < 5; i++) {
			handlers[EVENT_MIDI_CLOCK]();
		}
		expect(onAdvance).not.toHaveBeenCalled();
		handlers[EVENT_MIDI_CLOCK]();
		expect(onAdvance).toHaveBeenCalledTimes(1);
	});

	test('MIDI Start resets mid-frame pulse phase so next advance needs a full pulse window', () => {
		const { clockSource, handlers } = createCapturingClockSource();
		const timing = new ClipTiming({
			frameRatesForFrames: {},
			frameDurationBeats: 0.25, // 6 pulses per frame
			frames: 1,
			bpmProvider: () => 120,
			clockSource
		});
		const onAdvance = vi.fn(() => true);
		timing.subscribeToClock(onAdvance);

		for (let i = 0; i < 3; i++) {
			handlers[EVENT_MIDI_CLOCK]();
		}
		expect(onAdvance).not.toHaveBeenCalled();

		handlers[EVENT_MIDI_START]();

		for (let i = 0; i < 5; i++) {
			handlers[EVENT_MIDI_CLOCK]();
		}
		expect(onAdvance).not.toHaveBeenCalled();
		handlers[EVENT_MIDI_CLOCK]();
		expect(onAdvance).toHaveBeenCalledTimes(1);
	});

	test('MIDI Continue does not clear pulse phase', () => {
		const { clockSource, handlers } = createCapturingClockSource();
		const timing = new ClipTiming({
			frameRatesForFrames: {},
			frameDurationBeats: 0.25, // 6 pulses per frame
			frames: 1,
			bpmProvider: () => 120,
			clockSource
		});
		const onAdvance = vi.fn(() => true);
		timing.subscribeToClock(onAdvance);

		expect(clockSource.subscribe).not.toHaveBeenCalledWith(EVENT_MIDI_CONTINUE, expect.any(Function));

		for (let i = 0; i < 3; i++) {
			handlers[EVENT_MIDI_CLOCK]();
		}
		// Continue is intentionally ignored — residual phase must remain
		handlers[EVENT_MIDI_CONTINUE]?.();

		for (let i = 0; i < 2; i++) {
			handlers[EVENT_MIDI_CLOCK]();
		}
		expect(onAdvance).not.toHaveBeenCalled();
		handlers[EVENT_MIDI_CLOCK]();
		expect(onAdvance).toHaveBeenCalledTimes(1);
	});

	test('unsubscribeFromClock stops further advances and swallows unsubscribe errors', () => {
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
			frameDurationBeats: 0.25,
			frames: 1,
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

	test('reset clears lastTimestamp and pulseCount so next advance starts fresh', () => {
		const timing = new ClipTiming({
			frameRatesForFrames: { 0: 10 },
			frameDurationBeats: null,
			frames: 1
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

	test('initBPMSync throws on zero or negative frameDurationBeats', () => {
		expect(
			() =>
				new ClipTiming({
					frameRatesForFrames: {},
					frameDurationBeats: 0,
					frames: 1
				})
		).toThrow(/invalid frameDurationBeats/);
		expect(
			() =>
				new ClipTiming({
					frameRatesForFrames: {},
					frameDurationBeats: -1,
					frames: 1
				})
		).toThrow(/invalid frameDurationBeats/);
	});
});
