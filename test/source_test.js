const assert = require('assert');
const source = require('../lib/source');
const nodes = require('coffee-script').nodes;

describe('source', function() {
  describe('#isWrappedInside', function() {
    it('is true for function expressions with trails', function() {
      const code = '(->\n  if a\n    a\n)';
      const node = nodes(code).expressions[0].base.body;
      assert.ok(source.isWrappedInside(code, node, '(', ')'));
    });

    it('is false when the wrapping characters are not present', function() {
      const code = '->\n  if a\n    a';
      const node = nodes(code).expressions[0];
      assert.ok(!source.isWrappedInside(code, node, '(', ')'));
    });
  });

  describe('#rangeOfLongestBalancedString', function() {
    it('returns up to the first imbalanced closing parenthesis', function() {
      assert.deepEqual(
        source.rangeOfLongestBalancedString('a((1)))', 0, 7),
        { start: 0, end: 6, string: 'a((1))' }
      );
    });

    it('returns up to the first imbalanced opening parenthesis', function() {
      assert.deepEqual(
        source.rangeOfLongestBalancedString('a(1, 2, b(3, 4)', 0, 15),
        { start: 0, end: 1, string: 'a' }
      );
    });

    it('returns up to the first imbalanced closing bracket', function() {
      assert.deepEqual(
        source.rangeOfLongestBalancedString('a[[1]]]', 0, 7),
        { start: 0, end: 6, string: 'a[[1]]' }
      );
    });

    it('returns up to the first imbalanced opening parenthesis', function() {
      assert.deepEqual(
        source.rangeOfLongestBalancedString('a[1, 2, b[3, 4]', 0, 15),
        { start: 0, end: 1, string: 'a' }
      );
    });

    it('returns up to the first imbalanced closing brace', function() {
      assert.deepEqual(
        source.rangeOfLongestBalancedString('a{{1}}}', 0, 7),
        { start: 0, end: 6, string: 'a{{1}}' }
      );
    });

    it('returns up to the first imbalanced opening parenthesis', function() {
      assert.deepEqual(
        source.rangeOfLongestBalancedString('a{1, 2, b{3, 4}', 0, 15),
        { start: 0, end: 1, string: 'a' }
      );
    });

    it('returns up to the first imbalance of any of brace, bracket, or parenthesis', function() {
      assert.deepEqual(
        source.rangeOfLongestBalancedString('{a: b(c, [)}', 0, 12),
        { start: 0, end: 0, string: '' }
      );
    });

    it('will extend beyond the end to close an open token, but no farther', function() {
      assert.deepEqual(
        source.rangeOfLongestBalancedString('a b[c], d', 0, 6),
        { start: 0, end: 6, string: 'a b[c]' }
      );
    });

    it('will contract back to the last balanced character if it could not close an open token after the end', function() {
      assert.deepEqual(
        source.rangeOfLongestBalancedString('a b[c()', 0, 5),
        { start: 0, end: 3, string: 'a b' }
      );
    });
  });
});
