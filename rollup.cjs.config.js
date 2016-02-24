import config from './rollup.config.js';

config.format = 'cjs';
config.dest = 'dist/decaffeinate.cjs.js';

export default config;
