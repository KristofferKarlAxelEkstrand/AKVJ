// vite.config.js
import { defineConfig } from 'vite';
import path from 'path';

/**
 * Plugin to trigger full page reload when clip files change.
 * The clips are loaded once at startup, so HMR won't work - we need a full reload.
 */
function reloadOnClipChange() {
	return {
		name: 'reload-on-clip-change',
		handleHotUpdate({ file, server }) {
			if (file.includes('/public/clips/')) {
				console.log('[vite] clip change detected, reloading...');
				server.ws.send({ type: 'full-reload' });
				return [];
			}
		}
	};
}

export default defineConfig({
	root: './src',
	build: {
		outDir: path.resolve(__dirname, 'dist'),
		rollupOptions: {
			input: path.resolve(__dirname, 'src/index.html')
		}
	},
	plugins: [reloadOnClipChange()],
	server: {
		watch: {
			// Use polling in dev containers where inotify may not work.
			// Detect common container environments via env vars.
			usePolling: !!(process.env.REMOTE_CONTAINERS || process.env.CODESPACES || process.env.GITPOD_WORKSPACE_ID),
			interval: 300
		}
	}
});
