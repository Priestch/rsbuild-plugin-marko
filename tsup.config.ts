import { defineConfig } from 'tsup';

export default defineConfig({
  entry: {
    index: './src/index.ts',
    'marko-loader': './tools/marko-loader.ts',
  },
  format: ['esm', 'cjs'],
  target: 'node18',
  dts: true,
  clean: true,
  shims: true,
  external: ['@rspack/core', '@marko/compiler'],
});
