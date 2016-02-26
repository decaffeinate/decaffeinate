/**
 * NOTE: This file must only use node v0.12 features + ES modules.
 */

import babel from 'rollup-plugin-babel';
import { readFileSync } from 'fs';

var babelConfig = JSON.parse(readFileSync('.babelrc', { encoding: 'utf8' }));
babelConfig.babelrc = false;
babelConfig.presets = babelConfig.presets.map(function(preset) {
  return preset === 'es2015' ? 'es2015-rollup' : preset;
});

export default {
  entry: 'src/index.js',
  plugins: [
    babel(babelConfig)
  ]
};
