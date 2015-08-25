import determineIndent from '../../src/utils/determineIndent';
import { strictEqual } from 'assert';

describe('determineIndent', () => {
  it('returns two spaces for an empty string', () => {
    strictEqual(determineIndent(''), '  ');
  });

  it('returns null for a string without a clear indent', () => {
    strictEqual(determineIndent(' b\n   n'), '  ');
  });

  it('returns two spaces when given source indented with two spaces', () => {
    strictEqual(determineIndent('if a\n  if b\n    c'), '  ');
  });

  it('returns four spaces when given source indented with four spaces', () => {
    strictEqual(determineIndent('if a\n    if b\n        c'), '    ');
  });

  it('returns a tab when given source indented with tabs', () => {
    strictEqual(determineIndent('if a\n\tb'), '\t');
  });
});
