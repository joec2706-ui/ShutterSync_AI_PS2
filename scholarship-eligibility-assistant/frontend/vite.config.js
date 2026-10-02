import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// In dev, /api is proxied to the Express backend so the browser never needs CORS and never sees any key.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: { '/api': { target: 'http://localhost:5000', changeOrigin: true } }
  },
  preview: { port: 4173, proxy: { '/api': { target: 'http://localhost:5000', changeOrigin: true } } }
});
