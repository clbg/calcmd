import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  base: '/calcmd/',
  resolve: {
    alias: {
      // Allow importing playground source directly (component library, no build step)
      '@calcmd/playground': path.resolve(__dirname, '../playground/src'),
    },
  },
  optimizeDeps: {
    include: ['@calcmd/core'],
  },
  build: {
    commonjsOptions: {
      include: [/@calcmd\/core/, /node_modules/],
    },
  },
});
