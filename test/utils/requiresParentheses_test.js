import { strictEqual } from 'assert';
import parse from '../../src/utils/parse';
import requiresParentheses from '../../src/utils/requiresParentheses';

describe('requiresParentheses', function() {
  it('is false for identifiers', () => {
    let node = parse('a').body.statements[0];
    strictEqual(requiresParentheses(node), false);
  });

  it('is true for binary plus expressions', () => {
    let node = parse('a + b').body.statements[0];
    strictEqual(requiresParentheses(node), true);
  });

  it('is true for binary minus expressions', () => {
    let node = parse('a - b').body.statements[0];
    strictEqual(requiresParentheses(node), true);
  });

  it('is true for logical `and` expressions', () => {
    let node = parse('a && b').body.statements[0];
    strictEqual(requiresParentheses(node), true);
  });

  it('is true for logical `or` expressions', () => {
    let node = parse('a || b').body.statements[0];
    strictEqual(requiresParentheses(node), true);
  });

  it('is true for binary `and` expressions', () => {
    let node = parse('a & b').body.statements[0];
    strictEqual(requiresParentheses(node), true);
  });

  it('is true for binary `or` expressions', () => {
    let node = parse('a | b').body.statements[0];
    strictEqual(requiresParentheses(node), true);
  });

  it('is true for `xor` expressions', () => {
    let node = parse('a ^ b').body.statements[0];
    strictEqual(requiresParentheses(node), true);
  });

  it('is false for logical not expressions', () => {
    let node = parse('!a').body.statements[0];
    strictEqual(requiresParentheses(node), false);
  });

  it('is false for unary plus expressions', () => {
    let node = parse('+a').body.statements[0];
    strictEqual(requiresParentheses(node), false);
  });

  it('is false for unary minus expressions', () => {
    let node = parse('-a').body.statements[0];
    strictEqual(requiresParentheses(node), false);
  });

  it('is false for call expressions', () => {
    let node = parse('a()').body.statements[0];
    strictEqual(requiresParentheses(node), false);
  });

  it('is true for assignment expressions', () => {
    let node = parse('a = 1').body.statements[0];
    strictEqual(requiresParentheses(node), true);
  });

  it('is true for equality expressions', () => {
    let node = parse('a == 1').body.statements[0];
    strictEqual(requiresParentheses(node), true);
  });

  it('is true for non-equality expressions', () => {
    let node = parse('a != 1').body.statements[0];
    strictEqual(requiresParentheses(node), true);
  });

  it('is true for less-than expressions', () => {
    let node = parse('a < 1').body.statements[0];
    strictEqual(requiresParentheses(node), true);
  });

  it('is true for greater-than expressions', () => {
    let node = parse('a > 1').body.statements[0];
    strictEqual(requiresParentheses(node), true);
  });

  it('is true for less-than-or-equal expressions', () => {
    let node = parse('a <= 1').body.statements[0];
    strictEqual(requiresParentheses(node), true);
  });

  it('is true for greater-than-or-equal expressions', () => {
    let node = parse('a >= 1').body.statements[0];
    strictEqual(requiresParentheses(node), true);
  });
});
