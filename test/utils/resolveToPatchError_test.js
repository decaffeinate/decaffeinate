import addVariableDeclarations from 'add-variable-declarations';
import { fail, strictEqual } from 'assert';
import { convert } from 'esnext';
import MagicString from 'magic-string';

import parse from '../../src/utils/parse';
import PatchError from '../../src/utils/PatchError';
import resolveToPatchError from '../../src/utils/resolveToPatchError';
import stripSharedIndent from '../../src/utils/stripSharedIndent';

describe('resolveToPatchError', () => {
  it('handles syntax errors in JavaScript code', () => {
    let content = stripSharedIndent(`
        let x = 3;
        f())
        console.log('test');`);
    try {
      addVariableDeclarations(content, new MagicString(content));
      fail('Expected an exception to be thrown.');
    } catch (e) {
      let patchError = resolveToPatchError(e, content, 'testStage');
      strictEqual(PatchError.prettyPrint(patchError), stripSharedIndent(`
        testStage failed to parse: Unexpected token, expected ; (2:3)
          1 | let x = 3;
        > 2 | f())
            |    ^
          3 | console.log('test');`) + '\n');
    }
  });

  it('handles syntax errors in CoffeeScript code', () => {
    let content = stripSharedIndent(`
        x = 3
          f()
        console.log 'test'`);
    try {
      parse(content);
      fail('Expected an exception to be thrown.');
    } catch (e) {
      let patchError = resolveToPatchError(e, content, 'testStage');
      strictEqual(PatchError.prettyPrint(patchError), stripSharedIndent(`
        testStage failed to parse: unexpected indentation
          1 | x = 3
        > 2 |   f()
            | ^^
          3 | console.log 'test'`) + '\n');
    }
  });

  it('handles syntax errors seen by esnext', () => {
    let content = stripSharedIndent(`
        var x = 3;
        if (
        }
    `);
    try {
      convert(content);
      fail('Expected an exception to be thrown.');
    } catch (e) {
      // It's hard to exercise an actual intermediate failure in esnext, so just
      // simulate one based on a normal initial syntax error.
      e.source = content;
      let patchError = resolveToPatchError(e, 'This should be ignored', 'esnext');
      strictEqual(PatchError.prettyPrint(patchError), stripSharedIndent(`
        esnext failed to parse: Unexpected token (3:0)
          1 | var x = 3;
          2 | if (
        > 3 | }
            | ^`) + '\n');
    }
  });

  it('returns null for other errors', () => {
    let patchError = resolveToPatchError(
      new Error('a normal error'), 'test content', 'test stage name');
    strictEqual(patchError, null);
  });
});
