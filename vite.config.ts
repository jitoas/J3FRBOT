import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig, Plugin} from 'vite';

function apiPlugin(): Plugin {
  return {
    name: 'api-server-middleware',
    async configureServer(server) {
      try {
        const { initDatabase } = await import('./bot/src/database/index.js');
        const { createApp } = await import('./bot/src/server.js');
        await initDatabase();
        const app = createApp(null);
        server.middlewares.use(app);
      } catch (err) {
        console.error('Failed to mount API middleware in Vite dev server:', err);
      }
    }
  };
}

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss(), apiPlugin()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
