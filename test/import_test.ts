import check from './support/check';

describe('imports', () => {
  it('converts commonjs code to JS modules with named exports when specified', () => {
    check(
      `
      x = require('x');
      module.exports.y = 3;
    `,
      `
      import x from 'x';
      export let y = 3;
    `,
      {
        options: {
          useJSModules: true,
          looseJSModules: true
        }
      }
    );
  });

  it('keeps commonjs by default', () => {
    check(
      `
      x = require('x');
      module.exports.y = 3;
    `,
      `
      const x = require('x');
      module.exports.y = 3;
    `
    );
  });

  it('properly passes down function identifiers', () => {
    check(
      `
      x = require('x');
      foo()
      y = require('y');
      bar()
      z = require('z');
    `,
      `
      import x from 'x';
      foo();
      import y from 'y';
      bar();
      const z = require('z');
    `,
      {
        options: {
          useJSModules: true,
          safeImportFunctionIdentifiers: ['foo']
        }
      }
    );
  });

  it('forces a default export by default', () => {
    check(
      `
      exports.a = b;
      exports.c = d;
    `,
      `
      let defaultExport = {};
      defaultExport.a = b;
      defaultExport.c = d;
      export default defaultExport;
    `,
      {
        options: {
          useJSModules: true
        }
      }
    );
  });

  it('handles ES module default import', () => {
    check(
      `
      import a from 'b'
    `,
      `
      import a from 'b';
    `
    );
  });

  it('handles ES module namespace import', () => {
    check(
      `
      import * as a from 'b'
    `,
      `
      import * as a from 'b';
    `
    );
  });

  it('handles ES module aliased named import', () => {
    check(
      `
      import {a as b, c} from 'd'
    `,
      `
      import {a as b, c} from 'd';
    `
    );
  });

  it('handles ES import without specifiers', () => {
    check(
      `
      import 'd'
    `,
      `
      import 'd';
    `
    );
  });

  it('handles ES import with specifiers on multiple lines without separators', () => {
    check(
      `
      import {
        a
        b
      } from 'c'
    `,
      `
      import {
        a,
        b
      } from 'c';
    `
    );
  });

  it('handles ES module export binding list', () => {
    check(
      `
      export {a as b, c}
    `,
      `
      export {a as b, c};
    `
    );
  });

  it('handles ES module export binding list on multiple lines without separators', () => {
    check(
      `
      export {
        a as b
        c
      }
    `,
      `
      export {
        a as b,
        c
      };
    `
    );
  });

  it('handles ES module default export', () => {
    check(
      `
      export default a b
    `,
      `
      export default a(b);
    `
    );
  });

  it('handles ES module star export', () => {
    check(
      `
      export * from 'a'
    `,
      `
      export * from 'a';
    `
    );
  });

  it('handles ES module export default from source', () => {
    check(
      `
      export { default } from 'a'
      `,
      `
      export { default } from 'a';
      `
    );
  });

  it('handles ES module assignment named export', () => {
    check(
      `
      export a = 1
    `,
      `
      export var a = 1;
    `
    );
  });

  it('handles ES module class named export', () => {
    check(
      `
      export class A
        b: ->
          c
    `,
      `
      export class A {
        b() {
          return c;
        }
      }
    `
    );
  });
});
