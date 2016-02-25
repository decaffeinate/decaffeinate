import { deepEqual } from 'assert';
import parse from '../../src/utils/parse.js';
import trimmedNodeRange from '../../src/utils/trimmedNodeRange.js';

describe('trimmedNodeRange', function() {
  it('discounts trailing whitespace on a function node', () => {
    let source = 'a\n  b: ->\n    c\n\n  d: 1';
    let ast = parse(source);
    let fnNode = ast.body.statements[0].arguments[0].members[0].expression;
    let nodeRange = trimmedNodeRange(fnNode, source);
    deepEqual(nodeRange, [7, 15]);
  });

  it('discounts trailing comments on a function node', () => {
    let source = 'a\n  b: ->\n    c\n\n  # d is one, yo\n  d: 1';
    let ast = parse(source);
    let fnNode = ast.body.statements[0].arguments[0].members[0].expression;
    let nodeRange = trimmedNodeRange(fnNode, source);
    deepEqual(nodeRange, [7, 15]);
  });

  it('does not identify hash marks in strings as comments', () => {
    let source = 'a\n  b: "#{c}"\n  d: e';
    let ast = parse(source);
    let stringNode = ast.body.statements[0].arguments[0].members[0];
    let nodeRange = trimmedNodeRange(stringNode, source);
    deepEqual(nodeRange, [4, 13]);
  });

  it('does not identify hash marks in regular expressions as comments and does not confuse with division operator', () => {
    let source = 'z = y / x\na = /#/';
    let ast = parse(source);
    let regExpNode = ast.body.statements[1].expression;
    let nodeRange = trimmedNodeRange(regExpNode, source);
    deepEqual(nodeRange, [14, 17]);
  });

  it('does not trim an identifier range', () => {
    let source = 'a';
    let ast = parse(source);
    let identifierNode = ast.body.statements[0];
    let nodeRange = trimmedNodeRange(identifierNode, source);
    deepEqual(nodeRange, [0, 1]);
  });

  it('does not count whitespace and comments after a function application containing a function', () => {
    let source = 'a\n  b: ->\n    c\n\n# FOO\n\nd e';
    let ast = parse(source);
    let callNode = ast.body.statements[0];
    let nodeRange = trimmedNodeRange(callNode, source);
    deepEqual(nodeRange, [0, 15]);
  });

  it('does not eat into escaped regexes', () => {
    let source = '"foo".replace(/[a-z\\/]/g, "")';
    let ast = parse(source);
    let regexNode = ast.body.statements[0].arguments[0];
    let nodeRange = trimmedNodeRange(regexNode, source);
    deepEqual(nodeRange, [14, 24]);
  });

  it('does not eat into heregexes', () => {
    let source = '"foo".replace ///\n  foo\n///g, "bar"';
    let ast = parse(source);
    let regeexNode = ast.body.statements[0].arguments[0];
    let nodeRange = trimmedNodeRange(regeexNode, source);
    deepEqual(nodeRange, [14, 28]);
  });
});
