// vite.config.js
import { defineConfig } from 'vite';
import path from 'path';

/**
 * Plugin to trigger full page reload when animation files change.
 * The animations are loaded once at startup, so HMR won't work - we need a full reload.
 */
function reloadOnAnimationChange() {
	return {
		name: 'reload-on-animation-change',
		handleHotUpdate({ file, server }) {
			if (file.includes('/public/animations/')) {
				console.log('[vite] animation change detected, reloading...');
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
	plugins: [reloadOnAnimationChange()],
	server: {
		watch: {
			// Use polling in dev containers where inotify may not work.
			// Detect common container environments via env vars.
			usePolling: !!(process.env.REMOTE_CONTAINERS || process.env.CODESPACES || process.env.GITPOD_WORKSPACE_ID),
			interval: 300
		}
	}
});
