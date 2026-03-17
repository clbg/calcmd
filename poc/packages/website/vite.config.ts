import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  base: '/calcmd/', // GitHub Pages repo subpath
  optimizeDeps: {
    include: ['@calcmd/core'],
  },
  build: {
    commonjsOptions: {
      include: [/@calcmd\/core/, /node_modules/],
    },
  },
});
