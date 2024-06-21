import { addVariableDeclarations } from 'add-variable-declarations';
import assert, { ok, strictEqual } from 'assert';
import MagicString from 'magic-string';

import DecaffeinateContext from '../../src/utils/DecaffeinateContext';
import PatchError from '../../src/utils/PatchError';
import resolveToPatchError from '../../src/utils/resolveToPatchError';
import stripSharedIndent from '../../src/utils/stripSharedIndent';

describe('resolveToPatchError', () => {
  it('handles syntax errors in JavaScript code', () => {
    const content = stripSharedIndent(`
        let x = 3;
        f())
        console.log('test');`);
    try {
      addVariableDeclarations(content, new MagicString(content));
      ok(false, 'Expected an exception to be thrown.');
    } catch (e: unknown) {
      assert(e instanceof Error);
      const patchError = resolveToPatchError(e, content, 'testStage');
      if (!patchError) {
        throw new Error('Expected non-null error.');
      }
      strictEqual(
        PatchError.prettyPrint(patchError),
        stripSharedIndent(`
        testStage failed to parse: Missing semicolon. (2:3)
          1 | let x = 3;
        > 2 | f())
            |    ^
          3 | console.log('test');`) + '\n',
      );
    }
  });

  it('handles syntax errors in CoffeeScript code', () => {
    const content = stripSharedIndent(`
        x = 3
          f()
        console.log 'test'`);
    try {
      DecaffeinateContext.create(content, false);
      ok(false, 'Expected an exception to be thrown.');
    } catch (e: unknown) {
      assert(e instanceof Error);
      const patchError = resolveToPatchError(e, content, 'testStage');
      if (!patchError) {
        throw new Error('Expected non-null error.');
      }
      strictEqual(
        PatchError.prettyPrint(patchError),
        stripSharedIndent(`
        testStage failed to parse: unexpected indentation
          1 | x = 3
        > 2 |   f()
            | ^^
          3 | console.log 'test'`) + '\n',
      );
    }
  });

  it('returns null for other errors', () => {
    const patchError = resolveToPatchError(new Error('a normal error'), 'test content', 'test stage name');
    strictEqual(patchError, null);
  });
});
