import { describe, it, expect, vi, afterEach } from 'vitest';
import { TimerService } from '../../src/core/TimerService.js';
import type { AgentRole } from '../../src/types/agents.js';

describe('TimerService', () => {
	let timerService: TimerService;

	afterEach(() => {
		if (timerService) {
			timerService.stopAll();
		}
		vi.useRealTimers();
	});

	it('calls callback when timer fires', () => {
		vi.useFakeTimers();
		const callback = vi.fn();
		timerService = new TimerService(callback);

		timerService.startAgent('overseer' as AgentRole, 1000, 1000);
		vi.advanceTimersByTime(1000);

		expect(callback).toHaveBeenCalledWith('overseer');
	});

	it('schedules next timer after callback fires', () => {
		vi.useFakeTimers();
		const callback = vi.fn();
		timerService = new TimerService(callback);

		timerService.startAgent('nitpicker' as AgentRole, 1000, 1000);
		vi.advanceTimersByTime(2000);

		expect(callback).toHaveBeenCalledTimes(2);
		expect(callback).toHaveBeenNthCalledWith(1, 'nitpicker');
		expect(callback).toHaveBeenNthCalledWith(2, 'nitpicker');
	});

	it('stopAgent prevents future callbacks', () => {
		vi.useFakeTimers();
		const callback = vi.fn();
		timerService = new TimerService(callback);

		timerService.startAgent('overseer' as AgentRole, 1000, 1000);
		timerService.stopAgent('overseer' as AgentRole);
		vi.advanceTimersByTime(5000);

		expect(callback).not.toHaveBeenCalled();
	});

	it('stopAll clears all timers', () => {
		vi.useFakeTimers();
		const callback = vi.fn();
		timerService = new TimerService(callback);

		timerService.startAgent('overseer' as AgentRole, 1000, 1000);
		timerService.startAgent('nitpicker' as AgentRole, 1000, 1000);
		timerService.stopAll();
		vi.advanceTimersByTime(5000);

		expect(callback).not.toHaveBeenCalled();
	});

	it('generates random intervals within range', () => {
		vi.useFakeTimers();
		const callback = vi.fn();
		timerService = new TimerService(callback);

		// Using a fixed range to verify timing
		timerService.startAgent('overseer' as AgentRole, 500, 500);
		vi.advanceTimersByTime(499);
		expect(callback).not.toHaveBeenCalled();
		vi.advanceTimersByTime(2);
		expect(callback).toHaveBeenCalledTimes(1);
	});
});
