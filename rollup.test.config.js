import babel from 'rollup-plugin-babel';
import multiEntry, { entry } from 'rollup-plugin-multi-entry';

export default {
  entry,
  plugins: [babel(), multiEntry('test/**/*_test.js')],
  format: 'cjs',
  dest: 'build/test-bundle.js'
};
