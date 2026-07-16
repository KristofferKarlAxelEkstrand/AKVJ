import { defineConfig } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
	root: path.resolve(__dirname, 'src'),
	publicDir: path.resolve(__dirname, 'public'),
	build: {
		outDir: path.resolve(__dirname, 'dist'),
		emptyOutDir: true
	},
	server: {
		port: 5174,
		strictPort: true,
		proxy: {
			'/api': {
				target: 'http://127.0.0.1:8787',
				changeOrigin: true
			}
		},
		watch: {
			usePolling: !!(process.env.REMOTE_CONTAINERS || process.env.CODESPACES || process.env.GITPOD_WORKSPACE_ID),
			interval: 300
		}
	}
});
