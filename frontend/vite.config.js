import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // Use absolute root base '/' so nested routes (e.g. /snippet/:id) resolve script chunks correctly
  base: '/',
  build: {
    // Split vendor chunks so repeated visits only download changed code.
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'motion': ['framer-motion'],
          'codemirror': ['@uiw/react-codemirror'],
        },
      },
    },
  },
  server: {
    port: 5173,
  },
});
