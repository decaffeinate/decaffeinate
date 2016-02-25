import { deepEqual } from 'assert';
import parse from '../../src/utils/parse.js';
import rangeIncludingParentheses from '../../src/utils/rangeIncludingParentheses.js';

describe('rangeIncludingParentheses', () => {
  it('returns the normal node range when not surrounded by parentheses', () => {
    let source = 'a';
    let node = parse(source).body.statements[0];
    deepEqual(node.range, [0, 1]);
    deepEqual(rangeIncludingParentheses(node.range, source), node.range);
  });

  it('returns the range expanded by a single pair of parentheses immediately surrounding the node', () => {
    let source = '(a)()';
    let node = parse(source).body.statements[0].function;
    deepEqual(node.range, [1, 2]);
    deepEqual(rangeIncludingParentheses(node.range, source), [0, 3]);
  });

  it('returns the range expanded by multiple parentheses immediately surrounding the node', () => {
    let source = '(((a)))()';
    let node = parse(source).body.statements[0].function;
    deepEqual(node.range, [3, 4]);
    deepEqual(rangeIncludingParentheses(node.range, source), [0, 7]);
  });

  // FIXME: This test only works because `parse` doesn't shrink past the parens properly in this case.
  it('returns the range expanded by ignoring whitespace until the outermost parentheses', () => {
    let source = '  (  ( (a) \t  ))()';
    let node = parse(source).body.statements[0].function;
    deepEqual(rangeIncludingParentheses(node.range, source), [2, 16]);
  });
});
