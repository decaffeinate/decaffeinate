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
});
