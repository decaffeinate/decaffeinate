import { equal, ok } from 'assert';
import { existsSync, readFileSync } from 'fs';
import { copySync } from 'fs-extra';
import { join } from 'path';
import { PassThrough } from 'stream';
import run from '../src/cli';
import stripSharedIndent from '../src/utils/stripSharedIndent';

async function readAllFromStream(stream: NodeJS.ReadableStream): Promise<string> {
  return new Promise((resolve, reject) => {
    let data = '';

    stream
      .on('data', (chunk: string) => {
        data += chunk;
      })
      .on('end', () => {
        resolve(data);
      })
      .on('error', (err: Error) => {
        reject(err);
      });
  });
}

/**
 * Run the CLI with the given arguments & stdin, and check the output.
 */
async function runCli(
  args: ReadonlyArray<string>,
  stdin: string,
  expectedStdout: string,
  expectedStderr = '',
  expectedExitCode = 0,
): Promise<void> {
  if (stdin[0] === '\n') {
    stdin = stripSharedIndent(stdin);
  }
  if (expectedStdout[0] === '\n') {
    expectedStdout = stripSharedIndent(expectedStdout);
  }
  if (expectedStderr[0] === '\n') {
    expectedStderr = stripSharedIndent(expectedStderr);
  }

  // Prepare the IO streams.
  const stdinStream = new PassThrough().setEncoding('utf8');
  const stdoutStream = new PassThrough().setEncoding('utf8');
  const stderrStream = new PassThrough().setEncoding('utf8');

  // Write the input to the stdin stream and close it.
  stdinStream.end(stdin);

  // Run the CLI.
  const exitCode = await run([process.argv[0], join(__dirname, '../bin/decaffeinate'), ...args], {
    stdin: stdinStream,
    stdout: stdoutStream,
    stderr: stderrStream,
  });

  // Close the output streams.
  stdoutStream.end();
  stderrStream.end();

  // Read the output from the streams.
  const stdout = await readAllFromStream(stdoutStream);
  const stderr = await readAllFromStream(stderrStream);

  // Check the exit code and output streams.
  expect({ exitCode, stdout: stdout.trim(), stderr: stderr.trim() }).toEqual({
    exitCode: expectedExitCode,
    stdout: expectedStdout.trim(),
    stderr: expectedStderr.trim(),
  });
}

describe('decaffeinate CLI', () => {
  it('print current version', async () => {
    await runCli(['--version'], '', 'decaffeinate v0.0.0-test');
    await runCli(['-v'], '', 'decaffeinate v0.0.0-test');
  });

  it('accepts a file on stdin', async () => {
    await runCli(
      [],
      `
      a = require 'a'
      x = 1
      exports.b = 2
    `,
      `
      const a = require('a');
      const x = 1;
      exports.b = 2;
    `,
    );
  });

  it('respects the --use-cs2 flag', async () => {
    await runCli(
      ['--use-cs2'],
      `
      a = [...b, c]
    `,
      `
      const a = [...b, c];
    `,
    );
  });

  it('respects the --literate flag', async () => {
    await runCli(
      ['--literate'],
      `
      This is a literate file.
      
          literate = true
    `,
      `
      // This is a literate file.
      const literate = true;
    `,
    );
  });

  it('keeps imports as commonjs by default', async () => {
    await runCli(
      [],
      `
      a = require 'a'
    `,
      `
      const a = require('a');
    `,
    );
  });

  it('treats the --keep-commonjs option as a no-op', async () => {
    await runCli(
      ['--keep-commonjs'],
      `
      a = require 'a'
    `,
      `
      const a = require('a');
    `,
    );
  });

  it('respects the --use-js-modules flag', async () => {
    await runCli(
      ['--use-js-modules'],
      `
      exports.a = 1
      exports.b = 2
    `,
      `
      const defaultExport = {};
      defaultExport.a = 1;
      defaultExport.b = 2;
      export default defaultExport;
    `,
    );
  });

  it('treats the --force-default-export flag as an alias for --use-js-modules', async () => {
    await runCli(
      ['--force-default-export'],
      `
      exports.a = 1
      exports.b = 2
    `,
      `
      const defaultExport = {};
      defaultExport.a = 1;
      defaultExport.b = 2;
      export default defaultExport;
    `,
    );
  });

  it('respects the --safe-import-function-identifiers option', async () => {
    await runCli(
      ['--use-js-modules', '--safe-import-function-identifiers', 'foo'],
      `
      a = require 'a'
      foo()
      b = require 'b'
      bar()
      c = require 'c'
    `,
      `
      import a from 'a';
      foo();
      import b from 'b';
      bar();
      const c = require('c');
    `,
    );
  });

  it('respects the --loose-js-modules option', async () => {
    await runCli(
      ['--use-js-modules', '--loose-js-modules'],
      `
      exports.a = 1
      exports.b = 2
    `,
      `
      export let a = 1;
      export let b = 2;
    `,
    );
  });

  it('respects the --no-array-includes option', async () => {
    await runCli(
      ['--no-array-includes'],
      `
      a in b
    `,
      `
      __in__(a, b);
      function __in__(needle, haystack) {
        return Array.from(haystack).indexOf(needle) >= 0;
      }
    `,
    );
  });

  it('prefers const with no options specified', async () => {
    await runCli(
      [],
      `
      a = 1
    `,
      `
      const a = 1;
    `,
    );
  });

  it('allows the --prefer-const option, which is a no-op', async () => {
    await runCli(
      ['--prefer-const'],
      `
      a = 1
    `,
      `
      const a = 1;
    `,
    );
  });

  it('respects the --prefer-let option', async () => {
    await runCli(
      ['--prefer-let'],
      `
      a = 1
    `,
      `
      let a = 1;
    `,
    );
  });

  it('respects the --loose option', async () => {
    await runCli(
      ['--loose'],
      `
      f = (x = 1) ->
        unless x < 0
          for a in b
            c
        return
    `,
      `
      const f = function(x = 1) {
        if (x >= 0) {
          for (let a of b) {
            c;
          }
        }
      };
    `,
    );
  });

  it('respects the --loose-default-params option', async () => {
    await runCli(
      ['--loose-default-params'],
      `
      f = (x = 1) ->
        2
    `,
      `
      /*
       * decaffeinate suggestions:
       * DS102: Remove unnecessary code created because of implicit returns
       * Full docs: https://github.com/decaffeinate/decaffeinate/blob/main/docs/suggestions.md
       */
      const f = (x = 1) => 2;
    `,
    );
  });

  it('respects the --loose-for-expressions option', async () => {
    await runCli(
      ['--loose-for-expressions'],
      `
      x = (a + 1 for a in b)
    `,
      `
      const x = (b.map((a) => a + 1));
    `,
    );
  });

  it('respects the --loose-for-of option', async () => {
    await runCli(
      ['--loose-for-of'],
      `
      for a in b
        c
    `,
      `
      for (let a of b) {
        c;
      }
    `,
    );
  });

  it('respects the --loose-includes option', async () => {
    await runCli(
      ['--loose-includes'],
      `
      a in b
    `,
      `
      b.includes(a);
    `,
    );
  });

  it('respects the --loose-comparison-negation option', async () => {
    await runCli(
      ['--loose-comparison-negation'],
      `
      unless a > b
        c
    `,
      `
      if (a <= b) {
        c;
      }
    `,
    );
  });

  it('treats the --disable-babel-constructor-workaround option as a no-op', async () => {
    await runCli(
      ['--disable-babel-constructor-workaround'],
      `
      class A extends B
        constructor: ->
          @a = 1
          super
    `,
      `
      /*
       * decaffeinate suggestions:
       * DS002: Fix invalid constructor
       * Full docs: https://github.com/decaffeinate/decaffeinate/blob/main/docs/suggestions.md
       */
      class A extends B {
        constructor() {
          this.a = 1;
          super(...arguments);
        }
      }
    `,
      '--disable-babel-constructor-workaround no longer has any effect as it is the only supported behavior',
    );
  });

  it('respects the --allow-invalid-constructors option as a no-op', async () => {
    await runCli(
      ['--allow-invalid-constructors'],
      `
      class A extends B
        constructor: ->
          @a = 1
          super
    `,
      `
      /*
       * decaffeinate suggestions:
       * DS002: Fix invalid constructor
       * Full docs: https://github.com/decaffeinate/decaffeinate/blob/main/docs/suggestions.md
       */
      class A extends B {
        constructor() {
          this.a = 1;
          super(...arguments);
        }
      }
    `,
    );
  });

  it('respects the --disallow-invalid-constructors option', async () => {
    await runCli(
      ['--disallow-invalid-constructors'],
      `
      class A extends B
        constructor: ->
          @a = 1
          super
    `,
      '',
      `
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
    `,
      1,
    );
  });

  it('enables suggestions by default', async () => {
    await runCli(
      [],
      `
      a?
    `,
      `
      /*
       * decaffeinate suggestions:
       * DS207: Consider shorter variations of null checks
       * Full docs: https://github.com/decaffeinate/decaffeinate/blob/main/docs/suggestions.md
       */
      typeof a !== 'undefined' && a !== null;
    `,
    );
  });

  it('respects the --disable-suggestion-comment option', async () => {
    await runCli(
      ['--disable-suggestion-comment'],
      `
      a?
    `,
      `
      typeof a !== 'undefined' && a !== null;
    `,
    );
  });

  it('discovers and converts CoffeeScript files when prompted', async () => {
    await runCli(
      ['./test_fixtures'],
      '',
      `
      test_fixtures/A.coffee → test_fixtures/A.js
      test_fixtures/B.coffee.md → test_fixtures/B.js
      test_fixtures/C.litcoffee → test_fixtures/C.js
      test_fixtures/level1/level2/file.coffee → test_fixtures/level1/level2/file.js
    `,
    );
    ok(existsSync('test_fixtures/A.js'));
    ok(existsSync('test_fixtures/B.js'));
    ok(existsSync('test_fixtures/C.js'));
  });

  it('properly converts an unrecognized extension', async () => {
    await runCli(
      ['./test_fixtures/D.cjsx'],
      '',
      `
      ./test_fixtures/D.cjsx → test_fixtures/D.js
    `,
    );
    ok(existsSync('test_fixtures/D.js'));
  });

  it('properly converts an extensionless file', async () => {
    await runCli(
      ['./test_fixtures/E'],
      '',
      `
      ./test_fixtures/E → test_fixtures/E.js
    `,
    );
    ok(existsSync('test_fixtures/E.js'));
  });

  it('properly modernizes a JS file', async () => {
    copySync('./test_fixtures/F.js', './test_fixtures/F.tmp.js');
    await runCli(
      ['test_fixtures/F.tmp.js', '--modernize-js', '--use-js-modules'],
      '',
      `
      test_fixtures/F.tmp.js → test_fixtures/F.tmp.js
    `,
    );
    const contents = readFileSync('./test_fixtures/F.tmp.js').toString();
    expect(stripSharedIndent(contents)).toEqual(
      stripSharedIndent(`
      import path from 'path';
      const b = 1;
    `),
    );
  });

  it('allows --modernize-js on stdin', async () => {
    await runCli(['--modernize-js'], 'var a;', 'let a;');
  });

  it('allows --modernize-js with --no-bare', async () => {
    await runCli(['--modernize-js', '--no-bare'], 'var a;', '(function() {\nlet a;\n}).call(this);');
  });

  it('discovers JS files with --modernize-js specified', async () => {
    copySync('./test_fixtures/F.js', './test_fixtures/searchDir/F.js');
    await runCli(
      ['test_fixtures/searchDir', '--modernize-js', '--use-js-modules'],
      '',
      `
      test_fixtures/searchDir/F.js → test_fixtures/searchDir/F.js
    `,
    );
    const contents = readFileSync('./test_fixtures/searchDir/F.js').toString();
    expect(stripSharedIndent(contents)).toEqual(
      stripSharedIndent(`
      import path from 'path';
      const b = 1;
    `),
    );
  });

  it('recursively scans directories', async () => {
    await runCli(
      ['test_fixtures/level1'],
      '',
      `
      test_fixtures/level1/level2/file.coffee → test_fixtures/level1/level2/file.js 
    `,
    );
    const contents = readFileSync('./test_fixtures/level1/level2/file.js').toString();
    equal(
      stripSharedIndent(contents),
      stripSharedIndent(`
      const a = 1;
    `),
    );
  });

  it('can wrap output in an IIFE', async () => {
    await runCli(['--no-bare'], '', `(function() {\n\n}).call(this);`);
  });

  it('cannot use --use-js-modules with --no-bare', async () => {
    await runCli(
      ['--no-bare', '--use-js-modules'],
      '',
      '',
      `
      cannot use --use-js-modules with --no-bare
    `,
      1,
    );
  });
});
