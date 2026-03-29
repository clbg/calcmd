import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm'],
  dts: false, // types generated separately via tsc
  clean: true,
  // Don't bundle the WASM pkg — it's referenced via relative path at runtime
  external: ['../pkg/calcmd_wasm.js'],
});
