import { strictEqual } from 'assert';
import parse from '../../src/utils/parse.js';
import requiresParentheses from '../../src/utils/requiresParentheses.js';

describe('requiresParentheses', function() {
  it('is false for identifiers', () => {
    const node = parse('a').body.statements[0];
    strictEqual(requiresParentheses(node), false);
  });

  it('is true for binary plus expressions', () => {
    const node = parse('a + b').body.statements[0];
    strictEqual(requiresParentheses(node), true);
  });

  it('is true for binary minus expressions', () => {
    const node = parse('a - b').body.statements[0];
    strictEqual(requiresParentheses(node), true);
  });

  it('is true for logical `and` expressions', () => {
    const node = parse('a && b').body.statements[0];
    strictEqual(requiresParentheses(node), true);
  });

  it('is true for logical `or` expressions', () => {
    const node = parse('a || b').body.statements[0];
    strictEqual(requiresParentheses(node), true);
  });

  it('is true for binary `and` expressions', () => {
    const node = parse('a & b').body.statements[0];
    strictEqual(requiresParentheses(node), true);
  });

  it('is true for binary `or` expressions', () => {
    const node = parse('a | b').body.statements[0];
    strictEqual(requiresParentheses(node), true);
  });

  it('is true for `xor` expressions', () => {
    const node = parse('a ^ b').body.statements[0];
    strictEqual(requiresParentheses(node), true);
  });

  it('is false for logical not expressions', () => {
    const node = parse('!a').body.statements[0];
    strictEqual(requiresParentheses(node), false);
  });

  it('is false for unary plus expressions', () => {
    const node = parse('+a').body.statements[0];
    strictEqual(requiresParentheses(node), false);
  });

  it('is false for unary minus expressions', () => {
    const node = parse('-a').body.statements[0];
    strictEqual(requiresParentheses(node), false);
  });

  it('is false for call expressions', () => {
    const node = parse('a()').body.statements[0];
    strictEqual(requiresParentheses(node), false);
  });

  it('is true for assignment expressions', () => {
    const node = parse('a = 1').body.statements[0];
    strictEqual(requiresParentheses(node), true);
  });

  it('is true for equality expressions', () => {
    const node = parse('a == 1').body.statements[0];
    strictEqual(requiresParentheses(node), true);
  });

  it('is true for non-equality expressions', () => {
    const node = parse('a != 1').body.statements[0];
    strictEqual(requiresParentheses(node), true);
  });

  it('is true for less-than expressions', () => {
    const node = parse('a < 1').body.statements[0];
    strictEqual(requiresParentheses(node), true);
  });

  it('is true for greater-than expressions', () => {
    const node = parse('a > 1').body.statements[0];
    strictEqual(requiresParentheses(node), true);
  });

  it('is true for less-than-or-equal expressions', () => {
    const node = parse('a <= 1').body.statements[0];
    strictEqual(requiresParentheses(node), true);
  });

  it('is true for greater-than-or-equal expressions', () => {
    const node = parse('a >= 1').body.statements[0];
    strictEqual(requiresParentheses(node), true);
  });
});
