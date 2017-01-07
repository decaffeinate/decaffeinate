import { strictEqual } from 'assert';
import adjustIndent from '../../src/utils/adjustIndent';

describe('adjustIndent', () => {
  it('returns the existing indent when the adjustment is 0', () => {
    strictEqual(adjustIndent('  a', 2, 0), '  ');
  });

  it('increases a two-space indent by a number of levels', () => {
    strictEqual(adjustIndent('  a', 2, 3), '        ');
  });

  it('increases a four-space indent by a number of levels', () => {
    strictEqual(adjustIndent('if a\n    b', 5, 1), '        ');
  });

  it('increases a tab indent by a number of levels', () => {
    strictEqual(adjustIndent('if a\n\tb', 5, 2), '\t\t\t');
  });

  it('decreases a two-space indent by a number of levels', () => {
    strictEqual(adjustIndent('  a', 2, -1), '');
  });

  it('decreases a four-space indent by a number of levels', () => {
    strictEqual(adjustIndent('if a\n    if b\n        c', 14, -1), '    ');
  });

  it('decreases a tab indent by a number of levels', () => {
    strictEqual(adjustIndent('if a\n\tif b\n\t\tc', 11, -1), '\t');
  });

  it('uses two-space indent by default', () => {
    strictEqual(adjustIndent('', 0, 1), '  ');
  });
});
