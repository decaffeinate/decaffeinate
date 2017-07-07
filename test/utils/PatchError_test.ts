import { strictEqual } from 'assert';
import PatchError from '../../src/utils/PatchError';
import stripSharedIndent from '../../src/utils/stripSharedIndent';

describe('PatchError', () => {
  it('handles files not ending in newlines', () => {
    let error = new PatchError('Sample error', 'abcdefg', 2, 4);
    let expected = stripSharedIndent(`
      Sample error
      > 1 | abcdefg
          |   ^^
    `) + '\n';
    strictEqual(PatchError.prettyPrint(error), expected);
  });

  it('does not crash on an out-of-order range', () => {
    let error = new PatchError('Sample error', 'abcdefg', 4, 2);
    let expected = stripSharedIndent(`
      Sample error
      > 1 | abcdefg
          |     ^
    `) + '\n';
    strictEqual(PatchError.prettyPrint(error), expected);
  });
});
