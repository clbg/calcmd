import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  base: '/calcmd/',
  resolve: {
    alias: {
      // Allow importing UI component source directly (no build step)
      '@calcmd/ui': path.resolve(__dirname, '../ui/src'),
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
