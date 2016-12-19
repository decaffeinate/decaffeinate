import { strictEqual } from 'assert';
import getIndent from '../../src/utils/getIndent';

describe('getIndent', function() {
  context('with an empty source string', function() {
    it('returns an empty string', () => {
      strictEqual(getIndent('', 0), '');
    });
  });

  context('with a single-line source string without an indent', function() {
    it('return zero', () => {
      strictEqual(getIndent('abc', 0), '');
    });
  });

  context('with a single-line source string with an indent', function() {
    it('returns the leading spaces', () => {
      strictEqual(getIndent('  abc', 0), '  ');
    });

    it('returns the leading tabs', () => {
      strictEqual(getIndent('\t\tabc', 0), '\t\t');
    });
  });

  context('with a multi-line source string', function() {
    it('returns the indent for the line containing offset', () => {
      let i;
      let source = '->\n  abc';
      let line1 = '->\n';

      for (i = 0; i < line1.length; i++) {
        strictEqual(getIndent(source, i), '');
      }

      for (i = line1.length; i < source.length; i++) {
        strictEqual(getIndent(source, i), '  ');
      }
    });

    it('considers newlines as part of the previous line', () => {
      strictEqual(getIndent('a\n  b: c', 1), '');
    });
  });
});
