import addVariableDeclarations from 'add-variable-declarations';
import { strictEqual } from 'assert';
import MagicString from 'magic-string';
import parse from '../../src/utils/parse.js';
import PatchError from '../../src/utils/PatchError.js';
import resolveToPatchError from '../../src/utils/resolveToPatchError.js';
import stripSharedIndent from '../../src/utils/stripSharedIndent.js';

describe('resolveToPatchError', () => {
  it('handles syntax errors in JavaScript code', () => {
    let content = stripSharedIndent(`
        let x = 3;
        f())
        console.log('test');`);
    try {
      addVariableDeclarations(content, new MagicString(content));
    } catch (e) {
      let patchError = resolveToPatchError(e, content, 'testStage');
      strictEqual(PatchError.prettyPrint(patchError), stripSharedIndent(`
        testStage failed to parse: Unexpected token (2:3)
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

  it('returns null for other errors', () => {
    let patchError = resolveToPatchError(
      new Error('a normal error'), 'test content', 'test stage name');
    strictEqual(patchError, null);
  });
});
