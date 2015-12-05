import config from './rollup.config';

config.format = 'cjs';
config.dest = 'dist/decaffeinate.cjs.js';

export default config;
