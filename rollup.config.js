/**
 * NOTE: This file must only use node v0.12 features + ES modules.
 */

import babel from 'rollup-plugin-babel';
import json from 'rollup-plugin-json';
import babelrc from 'babelrc-rollup';
import ts from 'rollup-plugin-typescript';
import * as TypeScript from 'typescript';

var pkg = require('./package.json');
var external = Object.keys(pkg.dependencies).concat(['path', 'fs']);

export default {
  entry: 'src/index.ts',
  plugins: [
    json(),
    ts({ typescript: TypeScript }),
    babel(babelrc())
  ],
  external: external,
  sourceMap: true,
  targets: [
    {
      format: 'cjs',
      dest: pkg['main']
    },
    {
      format: 'es',
      dest: pkg['jsnext:main']
    }
  ]
};
