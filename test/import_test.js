import check from './support/check';

describe('imports', () => {
  it('converts commonjs code to JS modules with named exports when specified', () => {
    check(`
      x = require('x');
      module.exports.y = 3;
    `, `
      import x from 'x';
      export let y = 3;
    `, {
      options: {
        useJSModules: true,
        looseJSModules: true,
      },
    });
  });

  it('keeps commonjs by default', () => {
    check(`
      x = require('x');
      module.exports.y = 3;
    `, `
      const x = require('x');
      module.exports.y = 3;
    `);
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
        useJSModules: true,
        safeImportFunctionIdentifiers: ['foo'],
      },
    });
  });

  it('forces a default export by default', () => {
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
        useJSModules: true,
      },
    });
  });
});
