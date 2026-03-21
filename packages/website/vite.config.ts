import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  base: '/calcmd/',
  resolve: {
    alias: {
      // Import source directly — no build step, changes picked up instantly
      '@calcmd/ui': path.resolve(__dirname, '../ui/src'),
      '@calcmd/core': path.resolve(__dirname, '../core/src'),
    },
  },
});
