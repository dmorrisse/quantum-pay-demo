import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Vite configuration for the Quantum Pay demo.  The development server
// proxies API requests to the backend so that calls to `/api` reach
// the Express server on port 8080.  In production, the backend serves
// the built assets directly.
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': 'http://localhost:8080'
    }
  }
});