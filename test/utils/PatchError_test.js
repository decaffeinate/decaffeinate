import { strictEqual } from 'assert';
import PatchError from '../../src/utils/PatchError.js';
import stripSharedIndent from '../../src/utils/stripSharedIndent.js';

describe('PatchError', function() {
  it('handles files not ending in newlines', () => {
    let error = new PatchError('Sample error', 'abcdefg', 2, 4);
    let expected = stripSharedIndent(`
      Sample error
      > 1 | abcdefg
          |   ^^
    `) + '\n';
    strictEqual(PatchError.prettyPrint(error), expected);
  });
});
