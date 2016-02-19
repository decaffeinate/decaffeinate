import babel from 'rollup-plugin-babel';
import { readFileSync } from 'fs';

let babelConfig = JSON.parse(readFileSync('.babelrc', { encoding: 'utf8' }));
babelConfig.babelrc = false;
babelConfig.presets = babelConfig.presets.map(
  preset => preset === 'es2015' ? 'es2015-rollup' : preset
);

export default {
  entry: 'src/index.js',
  plugins: [
    babel(babelConfig)
  ]
};
