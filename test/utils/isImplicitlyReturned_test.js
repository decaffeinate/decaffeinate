const assert = require('assert');
const withBuiltLibrary = require('../support/withBuiltLibrary');
var isImplicitlyReturned;
var parse;

withBuiltLibrary('utils/isImplicitlyReturned', function(required) {
  isImplicitlyReturned = required;
});

withBuiltLibrary('utils/parse', function(required) {
  parse = required;
});

describe('isImplicitlyReturned', function() {
  it('is false for blocks', function() {
    const node = parse('0').body;
    assert.strictEqual(node.type, 'Block');
    assert.ok(!isImplicitlyReturned(node));
  });

  it('is false for the last expression in a top-level block', function() {
    const node = parse('0').body.statements[0];
    assert.strictEqual(node.type, 'Int');
    assert.ok(!isImplicitlyReturned(node));
  });

  it('is true for the last expression of a function block', function() {
    const node = parse('->\n  0').body.statements[0].body.statements[0];
    assert.strictEqual(node.type, 'Int');
    assert.ok(isImplicitlyReturned(node));
  });

  it('is true for the body of a block-less function', function() {
    const node = parse('-> 0').body.statements[0].body;
    assert.strictEqual(node.type, 'Int');
    assert.ok(isImplicitlyReturned(node));
  });

  it('is true for the body of a block-less bound function', function() {
    const node = parse('=> 0').body.statements[0].body;
    assert.strictEqual(node.type, 'Int');
    assert.ok(isImplicitlyReturned(node));
  });

  it('is false for non-last expressions in a function block', function() {
    const node = parse('=>\n  0\n  a').body.statements[0].body.statements[0];
    assert.strictEqual(node.type, 'Int');
    assert.ok(!isImplicitlyReturned(node));
  });

  it('is false for an explicit return statement', function() {
    const node = parse('->\n  return 1').body.statements[0].body.statements[0];
    assert.strictEqual(node.type, 'Return');
    assert.ok(!isImplicitlyReturned(node));
  });
});
