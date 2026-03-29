import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import wasm from 'vite-plugin-wasm';
import path from 'path';

export default defineConfig({
  plugins: [react(), wasm()],
  base: '/calcmd/',
  build: {
    target: 'esnext', // required for WASM ESM
  },
  resolve: {
    alias: {
      // UI consumed as source — no build step needed
      '@calcmd/ui': path.resolve(__dirname, '../ui/src'),
      // @calcmd/core resolves via workspace dependency → dist/
    },
    dedupe: ['react', 'react-dom'],
  },
});
