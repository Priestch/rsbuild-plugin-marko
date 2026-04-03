import { defineConfig } from '@rsbuild/core';
import { pluginMarko } from 'rsbuild-plugin-marko';

export default defineConfig({
  plugins: [pluginMarko({})],
  tools: {
    rspack: {
      externals: [
        'express',
        'fsevents',
        'yaml',
        'tsx/cjs/api',
        '@rsbuild/core',
      ],
    },
  },
  environments: {
    node: {
      output: {
        target: 'node',
      },
      source: {
        entry: {
          index: {
            import: ['./server/server.mjs'],
          },
        },
      },
    },
    web: {
      source: {
        entry: {
          index: {
            import: ['./src/index.mjs'],
          },
        },
      },
    },
  },
});
