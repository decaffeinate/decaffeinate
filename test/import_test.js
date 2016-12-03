import check from './support/check.js';

describe('imports', () => {
  it('converts commonjs code to JS modules by default', () => {
    check(`
      x = require('x');
      module.exports.y = 3;
    `, `
      import x from 'x';
      export let y = 3;
    `);
  });

  it('keeps commonjs when the preference is specified', () => {
    check(`
      x = require('x');
      module.exports.y = 3;
    `, `
      let x = require('x');
      module.exports.y = 3;
    `, {
      keepCommonJS: true
    });
  });
});
