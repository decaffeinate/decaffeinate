const assert = require('assert');
const withBuiltLibrary = require('../support/withBuiltLibrary');

var trimmedNodeRange;
var parse;

withBuiltLibrary('utils/trimmedNodeRange', function(required) {
  trimmedNodeRange = required;
});

withBuiltLibrary('utils/parse', function(required) {
  parse = required;
});

describe('trimmedNodeRange', function() {
  it('discounts trailing whitespace on a function node', function() {
    const source = 'a\n  b: ->\n    c\n\n  d: 1';
    const ast = parse(source);
    const fnNode = ast.body.statements[0].arguments[0].members[0].expression;
    const nodeRange = trimmedNodeRange(fnNode, source);
    assert.deepEqual(nodeRange, [7, 15]);
  });

  it('discounts trailing comments on a function node', function() {
    const source = 'a\n  b: ->\n    c\n\n  # d is one, yo\n  d: 1';
    const ast = parse(source);
    const fnNode = ast.body.statements[0].arguments[0].members[0].expression;
    const nodeRange = trimmedNodeRange(fnNode, source);
    assert.deepEqual(nodeRange, [7, 15]);
  });

  it('does not identify hash marks in strings as comments', function() {
    const source = 'a\n  b: "#{c}"\n  d: e';
    const ast = parse(source);
    const stringNode = ast.body.statements[0].arguments[0].members[0];
    const nodeRange = trimmedNodeRange(stringNode, source);
    assert.deepEqual(nodeRange, [4, 13]);
  });

  it('does not trim an identifier range', function() {
    const source = 'a';
    const ast = parse(source);
    const identifierNode = ast.body.statements[0];
    const nodeRange = trimmedNodeRange(identifierNode, source);
    assert.deepEqual(nodeRange, [0, 1]);
  });

  it('does not count whitespace and comments after a function application containing a function', function() {
    const source = 'a\n  b: ->\n    c\n\n# FOO\n\nd e';
    const ast = parse(source);
    const callNode = ast.body.statements[0];
    const nodeRange = trimmedNodeRange(callNode, source);
    assert.deepEqual(nodeRange, [0, 15]);
  });
});
