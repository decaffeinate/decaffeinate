import { equal, ok } from 'assert';
import { execSync } from 'child_process';
import { existsSync, readFileSync } from 'fs';
import { copySync } from 'fs-extra';

import stripSharedIndent from '../src/utils/stripSharedIndent';

function runCli(argStr: string, stdin: string, expectedStdout: string): void {
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

function runCliExpectError(argStr: string, stdin: string, expectedStderr: string): void {
  if (stdin[0] === '\n') {
    stdin = stripSharedIndent(stdin);
  }
  if (expectedStderr[0] === '\n') {
    expectedStderr = stripSharedIndent(expectedStderr);
  }

  try {
    execSync('./bin/decaffeinate ' + argStr, {input: stdin,});
    ok(false, 'Expected the CLI to fail.');
  } catch (e) {
    equal(e.output[2].toString().trim(), expectedStderr.trim());
  }
}

describe('decaffeinate CLI', () => {
  it('accepts a file on stdin', () => {
    runCli('', `
      a = require 'a'
      x = 1
      exports.b = 2
    `, `
      const a = require('a');
      const x = 1;
      exports.b = 2;
    `);
  });

  it('respects the --literate flag', () => {
    runCli('--literate', `
      This is a literate file.
      
          literate = true
    `, `
      // This is a literate file.
      const literate = true;
    `);
  });

  it('keeps imports as commonjs by default', () => {
    runCli('', `
      a = require 'a'
    `, `
      const a = require('a');
    `);
  });

  it('treats the --keep-commonjs option as a no-op', () => {
    runCli('--keep-commonjs', `
      a = require 'a'
    `, `
      const a = require('a');
    `);
  });

  it('respects the --use-js-modules flag', () => {
    runCli('--use-js-modules', `
      exports.a = 1
      exports.b = 2
    `, `
      let defaultExport = {};
      defaultExport.a = 1;
      defaultExport.b = 2;
      export default defaultExport;
    `);
  });

  it('treats the --force-default-export flag as an alias for --use-js-modules', () => {
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
    runCli('--use-js-modules --safe-import-function-identifiers foo', `
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
      const c = require('c');
    `);
  });

  it('respects the --loose-js-modules option', () => {
    runCli('--use-js-modules --loose-js-modules', `
      exports.a = 1
      exports.b = 2
    `, `
      export let a = 1;
      export let b = 2;
    `);
  });

  it('respects the --no-array-includes option', () => {
    runCli('--no-array-includes', `
      a in b
    `, `
      __in__(a, b);
      function __in__(needle, haystack) {
        return Array.from(haystack).indexOf(needle) >= 0;
      }
    `);
  });

  it('prefers const with no options specified', () => {
    runCli('', `
      a = 1
    `, `
      const a = 1;
    `);
  });

  it('allows the --prefer-const option, which is a no-op', () => {
    runCli('--prefer-const', `
      a = 1
    `, `
      const a = 1;
    `);
  });

  it('respects the --prefer-let option', () => {
    runCli('--prefer-let', `
      a = 1
    `, `
      let a = 1;
    `);
  });

  it('respects the --loose option', () => {
    runCli('--loose', `
      f = (x = 1) ->
        unless x < 0
          for a in b
            c
        return
    `, `
      const f = function(x = 1) {
        if (x >= 0) {
          for (let a of b) {
            c;
          }
        }
      };
    `);
  });

  it('respects the --loose-default-params option', () => {
    runCli('--loose-default-params', `
      f = (x = 1) ->
        2
    `, `
      /*
       * decaffeinate suggestions:
       * DS102: Remove unnecessary code created because of implicit returns
       * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
       */
      const f = (x = 1) => 2;
    `);
  });

  it('respects the --loose-for-expressions option', () => {
    runCli('--loose-for-expressions', `
      x = (a + 1 for a in b)
    `, `
      const x = (b.map((a) => a + 1));
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

  it('adds the Babel constructor workaround by default', () => {
    runCli('', `
      class A extends B
        constructor: ->
          @a = 1
          super
    `, `
      /*
       * decaffeinate suggestions:
       * DS001: Remove Babel/TypeScript constructor workaround
       * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
       */
      class A extends B {
        constructor() {
          {
            // Hack: trick Babel/TypeScript into allowing this before super.
            if (false) { super(); }
            let thisFn = (() => { this; }).toString();
            let thisName = thisFn.slice(thisFn.indexOf('{') + 1, thisFn.indexOf(';')).trim();
            eval(\`$\{thisName} = this;\`);
          }
          this.a = 1;
          super(...arguments);
        }
      }
    `);
  });

  it('treats the --enable-babel-constructor-workaround option as a no-op', () => {
    runCli('--enable-babel-constructor-workaround', `
      class A extends B
        constructor: ->
          @a = 1
          super
    `, `
      /*
       * decaffeinate suggestions:
       * DS001: Remove Babel/TypeScript constructor workaround
       * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
       */
      class A extends B {
        constructor() {
          {
            // Hack: trick Babel/TypeScript into allowing this before super.
            if (false) { super(); }
            let thisFn = (() => { this; }).toString();
            let thisName = thisFn.slice(thisFn.indexOf('{') + 1, thisFn.indexOf(';')).trim();
            eval(\`$\{thisName} = this;\`);
          }
          this.a = 1;
          super(...arguments);
        }
      }
    `);
  });

  it('respects the --disable-babel-constructor-workaround option', () => {
    runCli('--disable-babel-constructor-workaround', `
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

  it('respects the --allow-invalid-constructors option as an alias for --disable-babel-constructor-workaround', () => {
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

  it('respects the --disallow-invalid-constructors option', () => {
    runCliExpectError('--disallow-invalid-constructors', `
      class A extends B
        constructor: ->
          @a = 1
          super
    `, `
      stdin: Cannot automatically convert a subclass with a constructor that uses \`this\` before \`super\`.
  
      JavaScript requires all subclass constructors to call \`super\` and to do so
      before the first use of \`this\`, so the following cases cannot be converted
      automatically:
      * Constructors in subclasses that use \`this\` before \`super\`.
      * Constructors in subclasses that omit the \`super\` call.
      * Subclasses that use \`=>\` method syntax to automatically bind methods.
      
      To convert these cases to JavaScript anyway, remove the option
      --disallow-invalid-constructors when running decaffeinate.
        1 | class A extends B
      > 2 |   constructor: ->
      > 3 |     @a = 1
      > 4 |     super(arguments...)
    `);
  });

  it('enables suggestions by default', () => {
    runCli('', `
      a?
    `, `
      /*
       * decaffeinate suggestions:
       * DS207: Consider shorter variations of null checks
       * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
       */
      typeof a !== 'undefined' && a !== null;
    `);
  });


  it('respects the --disable-suggestion-comment option', () => {
    runCli('--disable-suggestion-comment', `
      a?
    `, `
      typeof a !== 'undefined' && a !== null;
    `);
  });

  it('discovers and converts CoffeeScript files when prompted', () => {
    runCli('./test/fixtures', '', `
      test/fixtures/A.coffee → test/fixtures/A.js
      test/fixtures/B.coffee.md → test/fixtures/B.js
      test/fixtures/C.litcoffee → test/fixtures/C.js
    `);
    ok(existsSync('test/fixtures/A.js'));
    ok(existsSync('test/fixtures/B.js'));
    ok(existsSync('test/fixtures/C.js'));
  });

  it('properly converts an unrecognized extension', () => {
    runCli('./test/fixtures/D.cjsx', '', `
      ./test/fixtures/D.cjsx → test/fixtures/D.js
    `);
    ok(existsSync('test/fixtures/D.js'));
  });

  it('properly converts an extensionless file', () => {
    runCli('./test/fixtures/E', '', `
      ./test/fixtures/E → test/fixtures/E.js
    `);
    ok(existsSync('test/fixtures/E.js'));
  });

  it('properly modernizes a JS file', () => {
    copySync('./test/fixtures/F.js', './test/fixtures/F.tmp.js');
    runCli('test/fixtures/F.tmp.js --modernize-js --use-js-modules', '', `
      test/fixtures/F.tmp.js → test/fixtures/F.tmp.js
    `);
    let contents = readFileSync('./test/fixtures/F.tmp.js').toString();
    equal(stripSharedIndent(contents), stripSharedIndent(`
      import path from 'path';
      const b = 1;
    `));
  });

  it('allows --modernize-js on stdin', () => {
    runCli('--modernize-js', 'var a;', 'let a;');
  });

  it('discovers JS files with --modernize-js specified', () => {
    copySync('./test/fixtures/F.js', './test/fixtures/searchDir/F.js');
    runCli('test/fixtures/searchDir --modernize-js --use-js-modules', '', `
      test/fixtures/searchDir/F.js → test/fixtures/searchDir/F.js
    `);
    let contents = readFileSync('./test/fixtures/searchDir/F.js').toString();
    equal(stripSharedIndent(contents), stripSharedIndent(`
      import path from 'path';
      const b = 1;
    `));
  });
});
