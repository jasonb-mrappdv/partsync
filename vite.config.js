import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// https://vite.dev/config/
export default defineConfig({
  logLevel: 'error',
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    proxy: {
      // In dev, hit the Pages Functions worker via `wrangler pages dev` on 8788.
      // Run `npm run dev` and `npx wrangler pages dev . --port 8788` side-by-side.
      '/api': 'http://127.0.0.1:8788',
    },
  },
});
