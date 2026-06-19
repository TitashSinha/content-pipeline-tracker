import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Frontend dev server proxies /api to the Express backend on :4000, so the
// browser always talks to one origin (no CORS to think about in the app).
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5190,
    strictPort: true,
    proxy: { '/api': 'http://localhost:4000' },
  },
});
