import check from './support/check';

describe('imports', () => {
  it('converts commonjs code to JS modules by default', () => {
    check(`
      x = require('x');
      module.exports.y = 3;
    `, `
      import x from 'x';
      export let y = 3;
    `, {
      options: {
        keepCommonJS: false,
      },
    });
  });

  it('keeps commonjs when the preference is specified', () => {
    check(`
      x = require('x');
      module.exports.y = 3;
    `, `
      const x = require('x');
      module.exports.y = 3;
    `, {
      options: {
        keepCommonJS: true,
      },
    });
  });

  it('properly passes down function identifiers', () => {
    check(`
      x = require('x');
      foo()
      y = require('y');
      bar()
      z = require('z');
    `, `
      import x from 'x';
      foo();
      import y from 'y';
      bar();
      const z = require('z');
    `, {
      options: {
        keepCommonJS: false,
        safeImportFunctionIdentifiers: ['foo'],
      },
    });
  });

  it('allows forcing a default export', () => {
    check(`
      exports.a = b;
      exports.c = d;
    `, `
      let defaultExport = {};
      defaultExport.a = b;
      defaultExport.c = d;
      export default defaultExport;
    `, {
      options: {
        keepCommonJS: false,
        forceDefaultExport: true,
      },
    });
  });
});
