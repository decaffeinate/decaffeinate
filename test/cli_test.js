import assert, { equal } from 'assert';
import { execSync } from 'child_process';
import { existsSync } from 'fs';

import stripSharedIndent from '../src/utils/stripSharedIndent';

function runCli(argStr, stdin, expectedStdout) {
  if (stdin[0] === '\n') {
    stdin = stripSharedIndent(stdin);
  }
  if (expectedStdout[0] === '\n') {
    expectedStdout = stripSharedIndent(expectedStdout);
  }

  let stdout = execSync('./bin/decaffeinate ' + argStr, {
    input: stdin,
  }).toString();
  equal(stdout.trim(), expectedStdout.trim());
}

describe('decaffeinate CLI', () => {
  it('accepts a file on stdin', () => {
    runCli('', `
      a = require 'a'
      x = 1
      exports.b = 2
    `, `
      import a from 'a';
      let x = 1;
      export let b = 2;
    `);
  });

  it('respects the --literate flag', () => {
    runCli('--literate', `
      This is a literate file.
      
          literate = true
    `, `
      // This is a literate file.
      let literate = true;
    `);
  });

  it('respects the --keep-commonjs flag', () => {
    runCli('--keep-commonjs', `
      a = require 'a'
    `, `
      let a = require('a');
    `);
  });

  it('respects the --force-default-export flag', () => {
    runCli('--force-default-export', `
      exports.a = 1
      exports.b = 2
    `, `
      let defaultExport = {};
      defaultExport.a = 1;
      defaultExport.b = 2;
      export default defaultExport;
    `);
  });

  it('respects the --safe-import-function-identifiers option', () => {
    runCli('--safe-import-function-identifiers foo', `
      a = require 'a'
      foo()
      b = require 'b'
      bar()
      c = require 'c'
    `, `
      import a from 'a';
      foo();
      import b from 'b';
      bar();
      let c = require('c');
    `);
  });

  it('respects the --prefer-const option', () => {
    runCli('--prefer-const', `
      a = 1
    `, `
      const a = 1;
    `);
  });

  it('respects the --loose-default-params option', () => {
    runCli('--loose-default-params', `
      f = (x = 1) ->
        2
    `, `
      let f = (x = 1) => 2;
    `);
  });

  it('respects the --loose-for-expressions option', () => {
    runCli('--loose-for-expressions', `
      x = (a + 1 for a in b)
    `, `
      let x = (b.map((a) => a + 1));
    `);
  });

  it('respects the --loose-for-of option', () => {
    runCli('--loose-for-of', `
      for a in b
        c
    `, `
      for (let a of b) {
        c;
      }
    `);
  });

  it('respects the --loose-includes option', () => {
    runCli('--loose-includes', `
      a in b
    `, `
      b.includes(a);
    `);
  });

  it('respects the --loose-comparison-negation option', () => {
    runCli('--loose-comparison-negation', `
      unless a > b
        c
    `, `
      if (a <= b) {
        c;
      }
    `);
  });

  it('respects the --allow-invalid-constructors option', () => {
    runCli('--allow-invalid-constructors', `
      class A extends B
        constructor: ->
          @a = 1
          super
    `, `
      class A extends B {
        constructor() {
          this.a = 1;
          super(...arguments);
        }
      }
    `);
  });

  it('respects the --enable-babel-constructor-workaround option', () => {
    runCli('--enable-babel-constructor-workaround', `
      class A extends B
        constructor: ->
          @a = 1
          super
    `, `
      class A extends B {
        constructor() {
          {
            // Hack: trick babel into allowing this before super.
            if (false) { super(); }
            let thisFn = (() => { this; }).toString();
            let thisName = thisFn.slice(thisFn.indexOf('{') + 1, thisFn.indexOf(';')).trim();
            eval(\`\${thisName} = this;\`);
          }
          this.a = 1;
          super(...arguments);
        }
      }
    `);
  });

  it('discovers and converts CoffeeScript files when prompted', () => {
    runCli('./test/fixtures', '', `
      test/fixtures/A.coffee → test/fixtures/A.js
      test/fixtures/B.coffee.md → test/fixtures/B.js
      test/fixtures/C.litcoffee → test/fixtures/C.js
    `);
    assert(existsSync('test/fixtures/A.js'));
    assert(existsSync('test/fixtures/B.js'));
    assert(existsSync('test/fixtures/C.js'));
  });

  it('properly converts an unrecognized extension', () => {
    runCli('./test/fixtures/D.cjsx', '', `
      ./test/fixtures/D.cjsx → test/fixtures/D.js
    `);
    assert(existsSync('test/fixtures/D.js'));
  });

  it('properly converts an extensionless file', () => {
    runCli('./test/fixtures/E', '', `
      ./test/fixtures/E → test/fixtures/E.js
    `);
    assert(existsSync('test/fixtures/E.js'));
  });
});
