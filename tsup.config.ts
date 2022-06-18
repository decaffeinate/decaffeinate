import { defineConfig } from 'tsup';
import * as pkg from './package.json';

export default defineConfig([
  {
    entry: ['src/index.ts'],
    dts: true,
    format: ['cjs', 'esm'],
    target: 'es2020',

    esbuildOptions(options) {
      // Make __PACKAGE__ and __VERSION__ available at build time.
      options.define = {
        ...options.define,
        __PACKAGE__: JSON.stringify(pkg.name),
        __VERSION__: JSON.stringify(pkg.version),
      };
    },
  },
]);
