import path from 'path';
import { fileURLToPath } from 'url';
import { defineConfig } from 'vitest/config';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * Heavy UI tests (jsdom + canvas-heavy components).
 *
 * Vitest hardcodes worker *start* timeout at 60s (`START_TIMEOUT` in the pool
 * runner) — not configurable via this file. Forks + jsdom under concurrent suite
 * load often exceeds that before the worker sends "started".
 *
 * Mitigations here:
 * - `pool: 'threads'` + `singleThread` — no second Node process to fork under RAM pressure
 * - `maxWorkers: 1`, `isolate: false`, `fileParallelism: false` — one worker for all four files
 * - Longer test/hook timeouts (separate from the hard worker-start limit)
 *
 * Intermittent start timeouts are retried by `scripts/runHeavyUiTests.mjs`
 * (`npm run test:ui:heavy`). Prefer not running heavy concurrent with other vitest pools.
 */
export default defineConfig({
	root: __dirname,
	test: {
		globals: true,
		environment: 'jsdom',
		css: true,
		include: ['test/AkvjMainframe.test.js', 'test/PianoRoll.test.js', 'test/StagingPreview.test.js', 'test/PreviewClip.test.js'],
		pool: 'threads',
		threads: {
			singleThread: true
		},
		maxWorkers: 1,
		isolate: false,
		testTimeout: 120000,
		hookTimeout: 120000,
		fileParallelism: false
	}
});
