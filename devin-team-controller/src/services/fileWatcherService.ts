import { existsSync } from 'node:fs';
import fsp from 'node:fs/promises';
import path from 'node:path';
import type { ApplicationEventBus, FileChangeEvent } from '../core/eventBus.js';

export interface FileWatcherServiceOptions {
	teamDir: string;
	eventBus: ApplicationEventBus;
}

export class FileWatcherService {
	readonly #teamDir: string;
	readonly #eventBus: ApplicationEventBus;
	#abortController = new AbortController();

	constructor(options: FileWatcherServiceOptions) {
		this.#teamDir = options.teamDir;
		this.#eventBus = options.eventBus;
	}

	async start(): Promise<void> {
		const dirsToWatch = ['inbox', 'outbox', 'tasks'].map(folder => path.join(this.#teamDir, folder));

		const slackDir = path.join(this.#teamDir, 'slack');
		for (const entry of await this.#readDir(slackDir)) {
			if (entry.isDirectory()) {
				dirsToWatch.push(path.join(slackDir, entry.name));
			}
		}

		for (const dir of dirsToWatch) {
			if (!existsSync(dir)) {
				continue;
			}
			this.#watchDir(dir).catch(() => {});
		}
	}

	stop(): void {
		this.#abortController.abort();
	}

	async scanInbox(): Promise<void> {
		const inboxDir = path.join(this.#teamDir, 'inbox');
		if (!existsSync(inboxDir)) {
			return;
		}
		for (const entry of await this.#readDir(inboxDir)) {
			if (entry.isFile() && entry.name.endsWith('.md')) {
				this.#emitFileChange('inbox', entry.name);
			}
		}
	}

	async #watchDir(dir: string): Promise<void> {
		try {
			const watcher = fsp.watch(dir, { recursive: false, signal: this.#abortController.signal });
			for await (const event of watcher) {
				if (!event.filename?.endsWith('.md')) {
					continue;
				}
				const folder = path.relative(this.#teamDir, dir).replace(/\\/g, '/');
				this.#emitFileChange(folder, event.filename);
			}
		} catch {
			/* dir may not exist yet */
		}
	}

	#emitFileChange(folder: string, filename: string): void {
		const event: FileChangeEvent = { type: 'file-change', folder, filename };
		this.#eventBus.emitEvent(event);
	}

	async #readDir(dir: string) {
		try {
			return await fsp.readdir(dir, { withFileTypes: true });
		} catch {
			return [];
		}
	}
}
